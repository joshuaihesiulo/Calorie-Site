"""LangGraph state machine that resolves dish names to FAO/WAFCT data.

Replaces the old linear/one-pass dish resolution (which dead-ended on any
unresolved dish) with a graph that adds an LLM reclassification branch:

    START -> lookup_fao_node -> (conditional) -> reclassify_node -> END

* ``lookup_fao_node``  — exact, case-insensitive FAO lookup per raw dish.
                        Matches land in ``resolved_dishes`` (match_type
                        ``"exact"``); misses land in ``unresolved_dishes``.
* ``reclassify_node``  — if unresolved dishes exist (and we haven't already
                        retried), an LLM reclassifies each one to the closest
                        valid FAO key using structured output
                        (``with_structured_output``). Reclassified dishes are
                        appended with match_type ``"llm_reclassified"``.

The graph is sync; call ``graph.invoke(state)`` directly or wrap it in a
thread from an async endpoint.
"""

from __future__ import annotations

import logging
from typing import Any, TypedDict

from langchain_core.language_models import BaseLanguageModel
from langgraph.graph import END, START, StateGraph
from pydantic import BaseModel, Field

from app.config import get_settings

logger = logging.getLogger(__name__)

# Maximum number of valid-key candidates offered to the reclassification LLM
# per unresolved dish (in addition to the always-included dish-map keys).
MAX_WAFCT_CANDIDATES_PER_DISH = 20

MATCH_EXACT = "exact"
MATCH_LLM = "llm_reclassified"


# ---------------------------------------------------------------------------
# State
# ---------------------------------------------------------------------------
class FoodPipelineState(TypedDict):
    raw_dishes: list[str]
    resolved_dishes: list[dict[str, Any]]
    unresolved_dishes: list[str]
    retry_count: int


# ---------------------------------------------------------------------------
# Structured output schema for the reclassification LLM
# ---------------------------------------------------------------------------
class ReclassifiedItem(BaseModel):
    original: str = Field(description="The original unresolved dish name.")
    fao_key: str | None = Field(
        default=None,
        description="The closest valid FAO/dish key chosen from the provided candidate list, or null if no good match exists.",
    )


class ReclassifyResult(BaseModel):
    items: list[ReclassifiedItem] = Field(default_factory=list)


# ---------------------------------------------------------------------------
# Node 1: exact FAO lookup
# ---------------------------------------------------------------------------
def lookup_fao_node(state: FoodPipelineState) -> dict[str, Any]:
    from app.services.fao_lookup import fao_lookup

    resolved: list[dict[str, Any]] = []
    unresolved: list[str] = []

    for dish in state.get("raw_dishes", []):
        data = fao_lookup(dish)
        if data is None:
            unresolved.append(dish)
            continue
        nutrients = data if data["source"] == "dish_mapping" else data["matches"][0]
        resolved.append(
            {
                "dish": dish,
                "match_type": MATCH_EXACT,
                "source": data["source"],
                "nutrients": nutrients,
            }
        )

    return {
        "resolved_dishes": resolved,
        "unresolved_dishes": unresolved,
        "retry_count": state.get("retry_count", 0),
    }


# ---------------------------------------------------------------------------
# Candidate key space offered to the reclassification LLM
# ---------------------------------------------------------------------------
def build_valid_keys(
    unresolved: list[str],
    max_per_dish: int = MAX_WAFCT_CANDIDATES_PER_DISH,
) -> list[str]:
    """Return dish-map keys plus the most similar WAFCT food names.

    Feeding all ~9k WAFCT names to the LLM is impractical, so we bound the
    candidate list to the strongest token/substring overlaps per unresolved
    dish. The returned keys are the only values the LLM may emit.
    """
    from app.services.fao_lookup import dish_map, foods

    keys: list[str] = list(dish_map.keys())
    seen = set(keys)

    for item in unresolved:
        item_tokens = set(item.lower().replace("_", " ").split())
        scored: list[tuple[int, str]] = []
        for food in foods:
            name = food["name"]
            name_lower = name.lower()
            score = 0
            if item.lower() in name_lower:
                score += 3
            name_tokens = set(name_lower.replace(",", " ").split())
            score += len(item_tokens & name_tokens)
            if score > 0:
                scored.append((score, name))

        scored.sort(key=lambda pair: (-pair[0], pair[1].lower()))
        added = 0
        for _, name in scored:
            if name in seen:
                continue
            seen.add(name)
            keys.append(name)
            added += 1
            if added >= max_per_dish:
                break

    return keys


# ---------------------------------------------------------------------------
# Node 2: LLM reclassification of unresolved dishes
# ---------------------------------------------------------------------------
def reclassify_node(state: FoodPipelineState, llm: BaseLanguageModel) -> dict[str, Any]:
    from app.services.fao_lookup import fao_lookup

    previous_resolved = list(state.get("resolved_dishes", []))
    unresolved = list(state.get("unresolved_dishes", []))
    retry_count = state.get("retry_count", 0) + 1

    if not unresolved:
        return {
            "resolved_dishes": previous_resolved,
            "unresolved_dishes": [],
            "retry_count": retry_count,
        }

    valid_keys = build_valid_keys(unresolved)
    prompt = (
        "You are mapping Nigerian/West African dish names to the closest official "
        "FAO/WAFCT food key so their nutritional data can be retrieved.\n\n"
        f"VALID KEYS (choose ONLY from this list):\n{valid_keys}\n\n"
        "For each unresolved dish, choose the single closest valid key. If none "
        "is a reasonable match, set fao_key to null. Be conservative — prefer a "
        "null over a wrong match.\n"
        f"Unresolved dishes: {unresolved}"
    )

    items: list[ReclassifiedItem] = []
    try:
        structured = llm.with_structured_output(ReclassifyResult)
        raw_result = structured.invoke(prompt)
        items = list(raw_result.items if hasattr(raw_result, "items") else raw_result.get("items", []))
    except Exception as exc:  # noqa: BLE001 — timeouts / parsing / validation failures
        logger.warning("Reclassification LLM failed (%s); leaving dishes unresolved.", exc)
        items = []

    resolved = list(previous_resolved)
    still_unresolved: list[str] = []
    llm_mapped = {item.original: item.fao_key for item in items}

    for dish in unresolved:
        fao_key = llm_mapped.get(dish)
        if not fao_key or fao_key not in valid_keys:
            still_unresolved.append(dish)
            continue
        data = fao_lookup(fao_key)
        if data is None:
            still_unresolved.append(dish)
            continue
        nutrients = data if data["source"] == "dish_mapping" else data["matches"][0]
        resolved.append(
            {
                "dish": dish,
                "match_type": MATCH_LLM,
                "source": data["source"],
                "reclassified_to": fao_key,
                "nutrients": nutrients,
            }
        )

    return {
        "resolved_dishes": resolved,
        "unresolved_dishes": still_unresolved,
        "retry_count": retry_count,
    }


# ---------------------------------------------------------------------------
# Conditional routing after lookup
# ---------------------------------------------------------------------------
def route_after_lookup(state: FoodPipelineState) -> str:
    """Route to reclassification only once (guard on retry_count)."""
    if state.get("unresolved_dishes") and state.get("retry_count", 0) < 1:
        return "reclassify"
    return END


# ---------------------------------------------------------------------------
# Graph construction
# ---------------------------------------------------------------------------
def build_reclassify_llm() -> BaseLanguageModel:
    """Build the configured reclassification LLM (Google or OpenAI)."""
    settings = get_settings()
    if settings.llm_provider.lower() == "openai":
        from langchain_openai import ChatOpenAI

        return ChatOpenAI(
            model=settings.reclassify_model or "gpt-4o-mini",
            api_key=settings.openai_api_key or None,
        )
    from langchain_google_genai import ChatGoogleGenerativeAI

    return ChatGoogleGenerativeAI(
        model=settings.reclassify_model or settings.gemini_model,
        api_key=settings.gemini_api_key or None,
    )


def build_dish_resolver_graph(llm: BaseLanguageModel | None = None):
    """Compile the dish-resolution graph.

    ``llm`` is injectable for tests; when None it is built from settings.
    """
    resolver_llm = llm or build_reclassify_llm()

    graph = StateGraph(FoodPipelineState)
    graph.add_node("lookup_fao_node", lookup_fao_node)
    graph.add_node(
        "reclassify_node",
        lambda state: reclassify_node(state, resolver_llm),
    )
    graph.add_edge(START, "lookup_fao_node")
    graph.add_conditional_edges(
        "lookup_fao_node",
        route_after_lookup,
        {"reclassify": "reclassify_node", END: END},
    )
    graph.add_edge("reclassify_node", END)
    return graph.compile()


def run_dish_resolution(raw_dishes: list[str]) -> dict[str, Any]:
    """Convenience wrapper: invoke the graph with a fresh state dict."""
    graph = build_dish_resolver_graph()
    return graph.invoke(
        {
            "raw_dishes": raw_dishes,
            "resolved_dishes": [],
            "unresolved_dishes": [],
            "retry_count": 0,
        }
    )
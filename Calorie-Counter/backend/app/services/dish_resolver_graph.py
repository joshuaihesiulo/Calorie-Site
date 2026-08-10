"""LangGraph dish resolution (Phase 3).

Routes each detected dish through up to four resolution checks, then
aggregates plate totals:

    START -> check_fao_match -> fuzzy_match_dish -> ai_reclassify_dish
          -> mark_unresolved -> advance_index (loop) -> aggregate_nutrients -> END

Each dish in ``raw_dishes`` is processed one per loop iteration, advancing
``current_index`` until every dish is done. ``action`` is an internal state
field used only for conditional routing between nodes.
"""

from __future__ import annotations

import logging
from typing import Any, TypedDict

from langgraph.graph import END, START, StateGraph
from rapidfuzz import fuzz, process

from app.services import providers
from app.services.fao_lookup import get_all_known_keys, lookup_direct_fao
from app.services.vision import KNOWN_KEYS

logger = logging.getLogger(__name__)

FUZZY_THRESHOLD = 75

# Cap on FAO names offered to the reclassification LLM per dish (in addition
# to the curated vision keys). Feeding the full ~1k key space blows past Groq
# Free-tier TPM limits (413) and degrades accuracy.
MAX_AI_CANDIDATES = 20

# Canonical keys offered to the fuzzy matcher.
_KNOWN_KEYS = get_all_known_keys()

# Totals key -> per-100g field name on the fao_result dict returned by
# lookup_direct_fao. Iron/calcium/vitamin A only resolve when the source
# dataset provides them (currently absent -> contributes 0).
NUTRIENT_KEYS = {
    "calories": "calories_per_100g",
    "protein": "protein_per_100g",
    "carbs": "carbs_per_100g",
    "fat": "fat_per_100g",
    "fiber": "fiber_per_100g",
    "iron": "iron_per_100g",
    "calcium": "calcium_per_100g",
    "vitamin_a": "vitamin_a_per_100g",
}


class PlateState(TypedDict):
    raw_dishes: list[dict]
    current_index: int
    resolved_dishes: list[dict]
    unresolved_dishes: list[str]
    total_nutrients: dict
    logs: list[str]
    action: str


def _current_dish(state: PlateState) -> dict:
    return state["raw_dishes"][state["current_index"]]


def _fold(text: str) -> str:
    """Case-fold and collapse whitespace for case-insensitive comparisons."""
    return " ".join(text.strip().lower().split())


def _ai_candidate_keys(dish_key: str, max_fao: int = MAX_AI_CANDIDATES) -> list[str]:
    """Bounded candidate keys for the reclassification LLM.

    Returns the curated vision keys plus the strongest token/substring
    overlaps from the FAO space for this dish — the only keys Groq may emit.
    """
    keys: list[str] = list(KNOWN_KEYS)
    seen = set(keys)

    wanted = _fold(dish_key)
    wanted_tokens = set(wanted.replace("_", " ").split())
    scored: list[tuple[int, str]] = []
    for name in get_all_known_keys():
        if name in seen:
            continue
        name_lower = name.lower()
        score = 0
        if wanted in name_lower:
            score += 3
        name_tokens = set(name_lower.replace(",", " ").split())
        score += len(wanted_tokens & name_tokens)
        if score > 0:
            scored.append((score, name))

    scored.sort(key=lambda pair: (-pair[0], pair[1].lower()))
    keys.extend(name for _, name in scored[:max_fao])
    return keys


def _resolved_entry(dish: dict, method: str, fao_result: dict) -> dict:
    return {
        "dishKey": dish["dishKey"],
        "displayName": dish.get("displayName", dish["dishKey"]),
        "estimatedGrams": dish.get("estimatedGrams", 0),
        "resolution_method": method,
        "fao_result": fao_result,
    }


# ---------------------------------------------------------------------------
# Node 1: exact FAO lookup
# ---------------------------------------------------------------------------
def check_fao_match(state: PlateState) -> dict[str, Any]:
    if not state["raw_dishes"] or state["current_index"] >= len(state["raw_dishes"]):
        return {"action": "aggregate_nutrients"}

    dish = _current_dish(state)
    result = lookup_direct_fao(dish["dishKey"])
    if result is None:
        return {"action": "fuzzy_match_dish"}

    return {
        "resolved_dishes": [*state["resolved_dishes"], _resolved_entry(dish, "direct", result)],
        "logs": [*state["logs"], f"[DIRECT] '{dish['dishKey']}' resolved by exact FAO match"],
        "action": "advance_index",
    }


# ---------------------------------------------------------------------------
# Node 2: fuzzy match against the full known key space
# ---------------------------------------------------------------------------
def fuzzy_match_dish(state: PlateState) -> dict[str, Any]:
    dish = _current_dish(state)
    best = process.extractOne(
        dish["dishKey"], _KNOWN_KEYS, scorer=fuzz.token_sort_ratio, score_cutoff=FUZZY_THRESHOLD
    )

    if best is None:
        return {
            "logs": [*state["logs"], f"[FUZZY MISS] '{dish['dishKey']}'"],
            "action": "ai_reclassify_dish",
        }

    matched_key = best[0]
    result = lookup_direct_fao(matched_key)
    if result is None:
        return {
            "logs": [*state["logs"], f"[FUZZY MISS] '{dish['dishKey']}'"],
            "action": "ai_reclassify_dish",
        }

    return {
        "resolved_dishes": [*state["resolved_dishes"], _resolved_entry(dish, "fuzzy", result)],
        "logs": [*state["logs"], f"[FUZZY] '{dish['dishKey']}' -> '{matched_key}'"],
        "action": "advance_index",
    }


# ---------------------------------------------------------------------------
# Node 3: LLM reclassification (Groq Llama 3.3 70B)
# ---------------------------------------------------------------------------
def ai_reclassify_dish(state: PlateState) -> dict[str, Any]:
    dish = _current_dish(state)
    reclassified = providers.ai_reclassify_dish(dish["dishKey"], _ai_candidate_keys(dish["dishKey"]))
    if reclassified is None:
        return {"action": "mark_unresolved"}

    result = lookup_direct_fao(reclassified)
    if result is None:
        return {"action": "mark_unresolved"}

    return {
        "resolved_dishes": [*state["resolved_dishes"], _resolved_entry(dish, "ai_reclassify", result)],
        "logs": [*state["logs"], f"[AI] '{dish['dishKey']}' -> '{reclassified}'"],
        "action": "advance_index",
    }


# ---------------------------------------------------------------------------
# Node 4: mark as unresolved
# ---------------------------------------------------------------------------
def mark_unresolved(state: PlateState) -> dict[str, Any]:
    dish = _current_dish(state)
    return {
        "unresolved_dishes": [*state["unresolved_dishes"], dish["dishKey"]],
        "logs": [*state["logs"], f"[UNRESOLVED] '{dish['dishKey']}'"],
        "action": "advance_index",
    }


# ---------------------------------------------------------------------------
# Loop bookkeeping + routing
# ---------------------------------------------------------------------------
ACTION_EDGES = {
    "fuzzy_match_dish": "fuzzy_match_dish",
    "ai_reclassify_dish": "ai_reclassify_dish",
    "mark_unresolved": "mark_unresolved",
    "advance_index": "advance_index",
    "aggregate_nutrients": "aggregate_nutrients",
}


def route_by_action(state: PlateState) -> str:
    """Follow the action set by the last node; safe default: aggregate."""
    return ACTION_EDGES.get(state.get("action"), "aggregate_nutrients")


def advance_index(state: PlateState) -> dict[str, Any]:
    return {"current_index": state["current_index"] + 1}


def route_after_advance(state: PlateState) -> str:
    if state["current_index"] < len(state["raw_dishes"]):
        return "check_fao_match"
    return "aggregate_nutrients"


# ---------------------------------------------------------------------------
# Node 5: aggregate plate totals, scaled proportionally by estimated grams
# ---------------------------------------------------------------------------
def aggregate_nutrients(state: PlateState) -> dict[str, Any]:
    totals = {key: 0.0 for key in NUTRIENT_KEYS}
    for entry in state["resolved_dishes"]:
        grams = float(entry.get("estimatedGrams") or 0)
        fao_result = entry.get("fao_result") or {}
        factor = grams / 100
        for key, field in NUTRIENT_KEYS.items():
            totals[key] += float(fao_result.get(field) or 0) * factor

    totals = {key: round(value, 2) for key, value in totals.items()}
    return {
        "total_nutrients": totals,
        "logs": [*state["logs"], f"[TOTALS] {totals}"],
    }


# ---------------------------------------------------------------------------
# Graph assembly
# ---------------------------------------------------------------------------
def build_plate_resolution_graph():
    graph = StateGraph(PlateState)
    graph.add_node("check_fao_match", check_fao_match)
    graph.add_node("fuzzy_match_dish", fuzzy_match_dish)
    graph.add_node("ai_reclassify_dish", ai_reclassify_dish)
    graph.add_node("mark_unresolved", mark_unresolved)
    graph.add_node("advance_index", advance_index)
    graph.add_node("aggregate_nutrients", aggregate_nutrients)

    graph.set_entry_point("check_fao_match")
    graph.add_conditional_edges("check_fao_match", route_by_action, ACTION_EDGES)
    graph.add_conditional_edges("fuzzy_match_dish", route_by_action, ACTION_EDGES)
    graph.add_conditional_edges("ai_reclassify_dish", route_by_action, ACTION_EDGES)
    graph.add_edge("mark_unresolved", "advance_index")
    graph.add_conditional_edges(
        "advance_index",
        route_after_advance,
        {"check_fao_match": "check_fao_match", "aggregate_nutrients": "aggregate_nutrients"},
    )
    graph.add_edge("aggregate_nutrients", END)

    return graph.compile()


plate_resolution_graph = build_plate_resolution_graph()


def run_dish_resolution_graph(dishes: list[dict]) -> dict:
    """Run every detected dish through the resolution pipeline.

    Returns the final state: ``resolved_dishes``, ``unresolved_dishes``,
    ``total_nutrients`` and ``logs``.
    """
    state: PlateState = {
        "raw_dishes": dishes,
        "current_index": 0,
        "resolved_dishes": [],
        "unresolved_dishes": [],
        "total_nutrients": {},
        "logs": [],
        "action": "",
    }
    return plate_resolution_graph.invoke(state)
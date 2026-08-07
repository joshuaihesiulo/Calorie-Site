"""Unit tests for the LangGraph dish-resolution pipeline.

All LLM interactions are replaced with a fake to keep tests offline and
deterministic.
"""

from __future__ import annotations

from typing import Any

import pytest
from langgraph.graph import END, START, StateGraph

from app.services.dish_resolver_graph import (
    MATCH_EXACT,
    MATCH_LLM,
    FoodPipelineState,
    ReclassifyResult,
    ReclassifiedItem,
    build_dish_resolver_graph,
    build_valid_keys,
    lookup_fao_node,
    reclassify_node,
    route_after_lookup,
)


class _StructuredStub:
    """Callable wrapper that exposes ``invoke`` (module-level to avoid class-scope closure gotchas)."""

    def __init__(self, fn) -> None:
        self.invoke = fn


class FakeStructuredLLM:
    """Stands in for an LLM configured with ``with_structured_output``."""

    def __init__(self, outcome: Any, raise_on_invoke: bool = False) -> None:
        self.outcome = outcome
        self.raise_on_invoke = raise_on_invoke
        self.invoke_count = 0

    def with_structured_output(self, schema):
        def invoke(prompt: str) -> Any:
            self.invoke_count += 1
            if self.raise_on_invoke:
                raise TimeoutError("simulated LLM timeout")
            if callable(self.outcome):
                return self.outcome(prompt)
            return self.outcome

        return _StructuredStub(invoke)


def make_state(raw_dishes: list[str], **overrides) -> FoodPipelineState:
    state: FoodPipelineState = {
        "raw_dishes": raw_dishes,
        "resolved_dishes": [],
        "unresolved_dishes": [],
        "retry_count": 0,
    }
    state.update(overrides)
    return state


# ---------------------------------------------------------------------------
# lookup_fao_node
# ---------------------------------------------------------------------------
class TestLookupFaoNode:
    def test_exact_matches_resolve(self):
        state = lookup_fao_node(make_state(["amala", "egusi_soup"]))
        assert len(state["resolved_dishes"]) == 2
        assert all(r["match_type"] == MATCH_EXACT for r in state["resolved_dishes"])
        assert state["unresolved_dishes"] == []
        assert all("nutrients" in r for r in state["resolved_dishes"])

    def test_misses_go_to_unresolved(self):
        state = lookup_fao_node(make_state(["amala", "unknown_dish_xyz"]))
        assert [r["dish"] for r in state["resolved_dishes"]] == ["amala"]
        assert state["unresolved_dishes"] == ["unknown_dish_xyz"]

    def test_case_insensitive(self):
        state = lookup_fao_node(make_state(["AMALA", "Pounded_Yam"]))
        assert len(state["resolved_dishes"]) == 2
        assert state["unresolved_dishes"] == []


# ---------------------------------------------------------------------------
# route_after_lookup
# ---------------------------------------------------------------------------
class TestRouting:
    def test_routes_to_reclassify_when_unresolved_and_retry_available(self):
        state = make_state([], unresolved_dishes=["ewedu_soup"], retry_count=0)
        assert route_after_lookup(state) == "reclassify"

    def test_ends_when_nothing_unresolved(self):
        state = make_state([], unresolved_dishes=[], retry_count=0)
        assert route_after_lookup(state) == END

    def test_ends_when_retry_exhausted(self):
        state = make_state([], unresolved_dishes=["ewedu_soup"], retry_count=1)
        assert route_after_lookup(state) == END


# ---------------------------------------------------------------------------
# reclassify_node
# ---------------------------------------------------------------------------
class TestReclassifyNode:
    def test_llm_reclassifies_unresolved_item(self):
        llm = FakeStructuredLLM(
            ReclassifyResult(
                items=[ReclassifiedItem(original="ewedu_soup", fao_key="egusi_soup")]
            )
        )
        state = reclassify_node(
            make_state([], unresolved_dishes=["ewedu_soup"], retry_count=0), llm
        )
        assert llm.invoke_count == 1
        assert len(state["resolved_dishes"]) == 1
        entry = state["resolved_dishes"][0]
        assert entry["match_type"] == MATCH_LLM
        assert entry["dish"] == "ewedu_soup"
        assert entry["reclassified_to"] == "egusi_soup"
        assert state["unresolved_dishes"] == []
        assert state["retry_count"] == 1

    def test_preserves_prior_exact_matches(self):
        previous = [{"dish": "amala", "match_type": MATCH_EXACT, "source": "dish_mapping", "nutrients": {}}]
        llm = FakeStructuredLLM(
            ReclassifyResult(
                items=[ReclassifiedItem(original="okpa", fao_key="moin_moin")]
            )
        )
        state = reclassify_node(
            make_state([], resolved_dishes=previous, unresolved_dishes=["okpa"], retry_count=0),
            llm,
        )
        assert len(state["resolved_dishes"]) == 2
        assert state["resolved_dishes"][0]["match_type"] == MATCH_EXACT

    def test_null_key_stays_unresolved(self):
        llm = FakeStructuredLLM(
            ReclassifyResult(items=[ReclassifiedItem(original="weird_dish", fao_key=None)])
        )
        state = reclassify_node(
            make_state([], unresolved_dishes=["weird_dish"], retry_count=0), llm
        )
        assert state["unresolved_dishes"] == ["weird_dish"]
        assert state["resolved_dishes"] == []

    def test_invalid_key_stays_unresolved(self):
        llm = FakeStructuredLLM(
            ReclassifyResult(
                items=[ReclassifiedItem(original="ewedu_soup", fao_key="not_a_real_key")]
            )
        )
        state = reclassify_node(
            make_state([], unresolved_dishes=["ewedu_soup"], retry_count=0), llm
        )
        assert state["unresolved_dishes"] == ["ewedu_soup"]

    def test_llm_timeout_is_handled(self):
        llm = FakeStructuredLLM(outcome=None, raise_on_invoke=True)
        state = reclassify_node(
            make_state([], unresolved_dishes=["ewedu_soup"], retry_count=0), llm
        )
        assert state["unresolved_dishes"] == ["ewedu_soup"]
        assert state["resolved_dishes"] == []
        assert state["retry_count"] == 1

    def test_malformed_output_is_handled(self):
        llm = FakeStructuredLLM({"items": "this is not a list"})
        state = reclassify_node(
            make_state([], unresolved_dishes=["ewedu_soup"], retry_count=0), llm
        )
        assert state["unresolved_dishes"] == ["ewedu_soup"]


# ---------------------------------------------------------------------------
# build_valid_keys
# ---------------------------------------------------------------------------
class TestValidKeys:
    def test_dish_keys_always_included(self):
        keys = build_valid_keys(["ewedu_soup"])
        assert "amala" in keys
        assert "egusi_soup" in keys
        assert "jollof_rice" in keys

    def test_related_wafct_names_included(self):
        keys = build_valid_keys(["ewedu_soup"])
        assert any("soup" in k.lower() for k in keys)

    def test_output_is_bounded(self):
        keys = build_valid_keys(["ewedu_soup", "jollof_rice"], max_per_dish=3)
        assert len(keys) <= 6 + 6


# ---------------------------------------------------------------------------
# Full graph
# ---------------------------------------------------------------------------
class TestGraph:
    def test_end_to_end_all_exact(self):
        graph = build_dish_resolver_graph(llm=FakeStructuredLLM(ReclassifyResult(items=[])))
        result = graph.invoke(make_state(["amala", "fried_plantain"]))
        assert len(result["resolved_dishes"]) == 2
        assert result["unresolved_dishes"] == []
        assert result["retry_count"] == 0

    def test_end_to_end_with_reclassification_branch(self):
        llm = FakeStructuredLLM(
            ReclassifyResult(
                items=[ReclassifiedItem(original="ewedu_soup", fao_key="egusi_soup")]
            )
        )
        graph = build_dish_resolver_graph(llm=llm)
        result = graph.invoke(make_state(["amala", "ewedu_soup"]))
        assert llm.invoke_count == 1
        match_types = {r["match_type"] for r in result["resolved_dishes"]}
        assert match_types == {MATCH_EXACT, MATCH_LLM}
        assert result["unresolved_dishes"] == []

    def test_reclassify_runs_at_most_once(self):
        llm = FakeStructuredLLM(
            ReclassifyResult(
                items=[ReclassifiedItem(original="ewedu_soup", fao_key="egusi_soup")]
            )
        )
        graph = build_dish_resolver_graph(llm=llm)
        result = graph.invoke(
            make_state(
                ["amala", "ewedu_soup", "also_unknown_xyz"],
                unresolved_dishes=[],
                retry_count=0,
            )
        )
        assert llm.invoke_count <= 1

    def test_retry_exhausted_skips_llm(self):
        llm = FakeStructuredLLM(ReclassifyResult(items=[]))
        graph = build_dish_resolver_graph(llm=llm)
        result = graph.invoke(
            make_state(["amala", "ewedu_soup"], unresolved_dishes=[], retry_count=1)
        )
        assert llm.invoke_count == 0
        assert "ewedu_soup" in result["unresolved_dishes"]

    def test_llm_failure_ends_graph_cleanly(self):
        llm = FakeStructuredLLM(outcome=None, raise_on_invoke=True)
        graph = build_dish_resolver_graph(llm=llm)
        result = graph.invoke(make_state(["amala", "ewedu_soup"]))
        assert "ewedu_soup" in result["unresolved_dishes"]
        assert result["retry_count"] == 1
        assert len(result["resolved_dishes"]) == 1


def test_graph_structure():
    """Sanity check: the graph is wired exactly per the spec."""
    llm = FakeStructuredLLM(ReclassifyResult(items=[]))
    graph = build_dish_resolver_graph(llm=llm)
    node_names = set(graph.get_graph().nodes.keys())
    assert node_names >= {"__start__", "lookup_fao_node", "reclassify_node", "__end__"}
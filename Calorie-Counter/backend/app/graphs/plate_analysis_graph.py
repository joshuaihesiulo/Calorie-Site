"""Stage 4 — LangGraph state machine for plate analysis.

Scaffold. The pipeline (identify -> fao lookup -> aggregate -> report) can be
expressed as a LangGraph graph for observability, retries, and branching.

The graph definition is safe to import without langgraph installed; it is only
built when ``build_plate_analysis_graph()`` is called.
"""

from __future__ import annotations

from typing import Any, TypedDict


class PlateAnalysisState(TypedDict, total=False):
    image_bytes: bytes
    mime_type: str
    detected_dishes: list[dict[str, Any]]
    resolved_dishes: list[dict[str, Any]]
    unresolved_dish_names: list[str]
    report: dict[str, Any]
    error: str | None


def _identify_node(state: PlateAnalysisState) -> PlateAnalysisState:
    raise NotImplementedError("Stage 4: wrap app.services.vision.identify_dishes as a node.")


def _lookup_node(state: PlateAnalysisState) -> PlateAnalysisState:
    raise NotImplementedError("Stage 4: wrap app.services.fao_lookup.fao_lookup as a node.")


def _aggregate_node(state: PlateAnalysisState) -> PlateAnalysisState:
    raise NotImplementedError("Stage 4: port the STEP C aggregation from routers/analyze.py.")


def build_plate_analysis_graph() -> Any:
    """Return a compiled LangGraph. Requires langgraph installed."""
    from langgraph.graph import END, StateGraph  # lazy import

    graph = StateGraph(PlateAnalysisState)
    graph.add_node("identify", _identify_node)
    graph.add_node("lookup", _lookup_node)
    graph.add_node("aggregate", _aggregate_node)
    graph.set_entry_point("identify")
    graph.add_edge("identify", "lookup")
    graph.add_edge("lookup", "aggregate")
    graph.add_edge("aggregate", END)
    return graph.compile()


def main() -> None:
    raise NotImplementedError("Stage 4: invoke via uvicorn-independent script or pytest.")
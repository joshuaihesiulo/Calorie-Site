"""Stage 6 — MCP tool server exposing FAO/WAFCT lookups (optional).

Scaffold only: safe to import without fastmcp installed. When run with
``python -m app.mcp.fao_tool_server``, starts an MCP server whose tools wrap
the core ``fao_lookup`` service so agents/editors can query Nigerian food data.
"""

from __future__ import annotations

from typing import Any


def create_server() -> Any:
    """Build and return a FastMCP server (requires fastmcp installed)."""
    try:
        from fastmcp import FastMCP
    except ImportError as exc:  # pragma: no cover - dependency optional
        raise ImportError(
            "fastmcp is not installed. Add it to requirements.txt to use Stage 6."
        ) from exc

    from app.services.fao_lookup import fao_lookup

    server = FastMCP("fao-tool-server")

    @server.tool()
    def lookup_food(food_query: str) -> dict[str, Any] | None:
        """Look up a Nigerian food/dish in the FAO/WAFCT database."""
        return fao_lookup(food_query)

    return server


def main() -> None:
    server = create_server()
    server.run()


if __name__ == "__main__":
    main()
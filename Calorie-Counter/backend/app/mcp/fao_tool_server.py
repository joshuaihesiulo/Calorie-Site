"""Stage 6 — MCP tool server exposing FAO/WAFCT lookups (optional).

Scaffold: safe to import without fastmcp installed. When run with
``python -m app.mcp.fao_tool_server``, starts an MCP server whose tools wrap
the ``fao_lookup`` service so agents/editors can query Nigerian food data.
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

    from app.services.fao_lookup import get_all_known_keys, lookup_direct_fao

    server = FastMCP("fao-tool-server")

    @server.tool()
    def lookup_food(food_query: str) -> dict[str, Any] | None:
        """Look up a Nigerian food/dish key in the FAO/WAFCT database."""
        return lookup_direct_fao(food_query)

    @server.tool()
    def list_known_keys() -> list[str]:
        """Return every known dish/food key the lookup layer can resolve."""
        return get_all_known_keys()

    return server


def main() -> None:
    server = create_server()
    server.run()


if __name__ == "__main__":
    main()
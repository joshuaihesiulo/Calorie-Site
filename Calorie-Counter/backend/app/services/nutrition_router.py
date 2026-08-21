"""Nutrient resolution chain for a single food item.

Combines the local datasets (WAFCT, curated recipes, curated snacks,
aliases) with the Open Food Facts API for packaged products:

    local (alias -> recipe/snack/food) -> OFF query -> None

Accessed by the LangGraph resolver node ``check_off_match`` and kept tiny so
the off-ramp (live API call) only happens for packaged items the local
datasets could not resolve.
"""

from __future__ import annotations

from app.services import open_food_facts
from app.services.fao_lookup import lookup_direct_fao


def resolve_food_item(
    dish_key: str,
    display_name: str = "",
    is_packaged: bool = False,
    brand_hint: str | None = None,
) -> dict | None:
    """Resolve one item to a per-100g profile, or ``None`` if unknown.

    Local datasets first; then, only for packaged products (or items with a
    brand hint), a live Open Food Facts search using the best query string
    available (brand + display name + dish key).
    """
    local = lookup_direct_fao(dish_key)
    if local is not None:
        return local

    if not (is_packaged or brand_hint):
        return None

    query = " ".join(
        part
        for part in (
            brand_hint,
            display_name,
            dish_key.replace("_", " "),
        )
        if part and str(part).strip()
    )
    if not query.strip():
        return None

    return open_food_facts.fetch_snack_by_query_sync(query.strip())
"""FAO/WAFCT dataset loading and dish lookup.

Two local datasets are bundled with the app:

* ``fao_wafct.json``        — FAO/WAFCT food records with per-100g nutrients.
* ``dish_ingredients.json`` — hand-curated recipes for Nigerian dishes
                              (ingredient names + grams per ingredient).

``lookup_direct_fao`` resolves a dish key to a per-100g nutrient profile:
recipe keys are aggregated from their ingredients, food keys return their
stored profile directly.
"""

from __future__ import annotations

import json
from pathlib import Path

DATA_DIR = Path(__file__).resolve().parent.parent / "data"

_foods: list[dict] = json.loads((DATA_DIR / "fao_wafct.json").read_text(encoding="utf-8"))
_dish_recipes: dict[str, list[dict]] = json.loads(
    (DATA_DIR / "dish_ingredients.json").read_text(encoding="utf-8")
)

NUTRIENT_FIELDS = (
    "calories_per_100g",
    "protein_per_100g",
    "carbs_per_100g",
    "fat_per_100g",
    "fiber_per_100g",
)


def _normalize(text: str) -> str:
    """Case-fold and collapse whitespace for case-insensitive comparisons."""
    return " ".join(text.strip().lower().split())


def _find_food(ingredient_name: str) -> dict | None:
    """Find an FAO/WAFCT record: exact case-insensitive name, then substring."""
    wanted = _normalize(ingredient_name)
    exact = next((f for f in _foods if _normalize(f["name"]) == wanted), None)
    if exact is not None:
        return exact
    return next((f for f in _foods if wanted in _normalize(f["name"])), None)


def get_all_known_keys() -> list[str]:
    """Return a deduplicated list of every lookup key across both datasets.

    Recipe keys come first (``dish_ingredients.json``), then FAO/WAFCT food
    names. Lookups are case-insensitive, so keys are deduplicated case-folded.
    """
    keys: list[str] = []
    seen: set[str] = set()

    for key in [*_dish_recipes.keys(), *(f["name"] for f in _foods)]:
        folded = _normalize(key)
        if folded in seen:
            continue
        seen.add(folded)
        keys.append(key)

    return keys


def _aggregate_recipe(key: str) -> dict | None:
    """Aggregate a dish recipe's ingredients into a per-100g nutrient profile."""
    ingredient_list = _dish_recipes[key]
    total_grams = 0
    totals = {"calories": 0.0, "protein": 0.0, "carbs": 0.0, "fat": 0.0, "fiber": 0.0}
    missing: list[str] = []

    for item in ingredient_list:
        food = _find_food(item["ingredient"])
        if food is None:
            missing.append(item["ingredient"])
            continue
        factor = item["grams"] / 100
        totals["calories"] += food.get("calories_per_100g", 0.0) * factor
        totals["protein"] += food.get("protein_per_100g", 0.0) * factor
        totals["carbs"] += food.get("carbs_per_100g", 0.0) * factor
        totals["fat"] += food.get("fat_per_100g", 0.0) * factor
        totals["fiber"] += food.get("fiber_per_100g", 0.0) * factor
        total_grams += item["grams"]

    if total_grams <= 0:
        return None

    factor = 100 / total_grams
    return {
        "key": key,
        "name": key,
        "source": "dish_ingredients",
        "calories_per_100g": round(totals["calories"] * factor, 2),
        "protein_per_100g": round(totals["protein"] * factor, 2),
        "carbs_per_100g": round(totals["carbs"] * factor, 2),
        "fat_per_100g": round(totals["fat"] * factor, 2),
        "fiber_per_100g": round(totals["fiber"] * factor, 2),
        "missing_ingredients": missing,
    }


def lookup_direct_fao(key: str) -> dict | None:
    """Resolve ``key`` to a per-100g nutrient profile, or ``None`` if unknown.

    Priority: recipe key in ``dish_ingredients.json`` (aggregated from
    ingredients), then a direct record in ``fao_wafct.json`` (exact name,
    then substring match).
    """
    wanted = _normalize(key)

    recipe_key = next((k for k in _dish_recipes if _normalize(k) == wanted), None)
    if recipe_key is not None:
        return _aggregate_recipe(recipe_key)

    food = next((f for f in _foods if _normalize(f["name"]) == wanted), None)
    if food is None:
        food = next((f for f in _foods if wanted in _normalize(f["name"])), None)
    if food is None:
        return None

    return {
        "key": key,
        "name": food["name"],
        "source": "fao_wafct",
        "calories_per_100g": food.get("calories_per_100g"),
        "protein_per_100g": food.get("protein_per_100g"),
        "carbs_per_100g": food.get("carbs_per_100g"),
        "fat_per_100g": food.get("fat_per_100g"),
        "fiber_per_100g": food.get("fiber_per_100g"),
    }

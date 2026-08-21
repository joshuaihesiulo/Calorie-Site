"""FAO/WAFCT dataset loading and dish lookup.

Two local datasets are bundled with the app:

* ``fao_wafct.json``        — FAO/WAFCT food records with per-100g nutrients.
* ``dish_ingredients.json`` — hand-curated recipes for Nigerian dishes
                              (ingredient names + grams per ingredient).
* ``food_aliases.json``     — alias name -> canonical dish/snack key.
* ``snacks.json``           — curated packaged-snack profiles per 100g
                              (sourced from Open Food Facts / package labels).

``lookup_direct_fao`` resolves a dish key to a per-100g nutrient profile:
recipe keys are aggregated from their ingredients, snack keys return their
stored profile, food keys return their stored profile directly.
"""

from __future__ import annotations

import json
from pathlib import Path

DATA_DIR = Path(__file__).resolve().parent.parent / "data"

_foods: list[dict] = []
_dish_recipes: dict[str, list[dict]] = {}
_snacks: dict[str, dict] = {}
_aliases: dict[str, str] = {}
_loaded = False


def _ensure_loaded() -> None:
    """Load JSON datasets on first use instead of at import time."""
    global _foods, _dish_recipes, _snacks, _aliases, _loaded
    if _loaded:
        return
    _foods = json.loads((DATA_DIR / "fao_wafct.json").read_text(encoding="utf-8"))
    _dish_recipes = json.loads(
        (DATA_DIR / "dish_ingredients.json").read_text(encoding="utf-8")
    )
    _snacks = json.loads((DATA_DIR / "snacks.json").read_text(encoding="utf-8"))
    alias_table: dict[str, list[str]] = json.loads(
        (DATA_DIR / "food_aliases.json").read_text(encoding="utf-8")
    )
    _aliases = {}
    for canonical, alias_list in alias_table.items():
        for alias in alias_list:
            _aliases[_normalize(alias)] = canonical
    _loaded = True

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
    """Return a deduplicated list of every lookup key across all datasets.

    Recipe keys come first (``dish_ingredients.json``), then snack keys
    (``snacks.json``), then alias names (``food_aliases.json``), then
    FAO/WAFCT food names. Lookups are case-insensitive, so keys are
    deduplicated case-folded.
    """
    _ensure_loaded()
    keys: list[str] = []
    seen: set[str] = set()

    for key in [
        *_dish_recipes.keys(),
        *_snacks.keys(),
        *_aliases.keys(),
        *(f["name"] for f in _foods),
    ]:
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

    Priority: alias -> canonical key, recipe key in ``dish_ingredients.json``
    (aggregated from ingredients), snack key in ``snacks.json`` (stored
    profile), then a direct record in ``fao_wafct.json`` (exact name, then
    substring match).
    """
    _ensure_loaded()
    wanted = _normalize(key)
    canonical = _aliases.get(wanted)
    if canonical is not None:
        wanted = _normalize(canonical)

    recipe_key = next((k for k in _dish_recipes if _normalize(k) == wanted), None)
    if recipe_key is not None:
        return _aggregate_recipe(recipe_key)

    snack_key = next((k for k in _snacks if _normalize(k) == wanted), None)
    if snack_key is not None:
        snack = _snacks[snack_key]
        return {
            "key": snack_key,
            "name": snack["name"],
            "source": snack.get("source", "package_label"),
            "calories_per_100g": snack.get("calories_per_100g"),
            "protein_per_100g": snack.get("protein_per_100g"),
            "carbs_per_100g": snack.get("carbs_per_100g"),
            "fat_per_100g": snack.get("fat_per_100g"),
            "fiber_per_100g": snack.get("fiber_per_100g"),
            "serving_grams": snack.get("serving_grams"),
            "serving_label": snack.get("serving_label"),
            "brand": snack.get("brand"),
            "verified": snack.get("verified", False),
        }

    food = next((f for f in _foods if _normalize(f["name"]) == wanted), None)
    if food is None:
        food = next((f for f in _foods if wanted in _normalize(f["name"])), None)
    if food is None:
        return None

    return {
        "key": food["name"],
        "name": food["name"],
        "source": "fao_wafct",
        "calories_per_100g": food.get("calories_per_100g"),
        "protein_per_100g": food.get("protein_per_100g"),
        "carbs_per_100g": food.get("carbs_per_100g"),
        "fat_per_100g": food.get("fat_per_100g"),
        "fiber_per_100g": food.get("fiber_per_100g"),
    }

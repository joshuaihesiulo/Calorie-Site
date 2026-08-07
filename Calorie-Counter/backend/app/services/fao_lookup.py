import json
from pathlib import Path

DATA_DIR = Path(__file__).parent.parent / "data"
foods = json.loads((DATA_DIR / "fao_wafct.json").read_text())
dish_map = json.loads((DATA_DIR / "dish_ingredients.json").read_text())


def find_ingredient(search_term: str):
    lower = search_term.lower()
    match = next((f for f in foods if f["name"].lower() == lower), None)
    if not match:
        match = next((f for f in foods if lower in f["name"].lower()), None)
    return match


def sum_nutrients(ingredient_list: list[dict]):
    total_grams = 0
    totals = {"calories": 0, "protein": 0, "carbs": 0, "fat": 0, "fiber": 0}
    missing = []

    for item in ingredient_list:
        match = find_ingredient(item["ingredient"])
        if not match:
            missing.append(item["ingredient"])
            continue
        factor = item["grams"] / 100
        totals["calories"] += match.get("calories_per_100g", 0) * factor
        totals["protein"] += match.get("protein_per_100g", 0) * factor
        totals["carbs"] += match.get("carbs_per_100g", 0) * factor
        totals["fat"] += match.get("fat_per_100g", 0) * factor
        totals["fiber"] += match.get("fiber_per_100g", 0) * factor
        total_grams += item["grams"]

    return totals, total_grams, missing


def fao_lookup(food_query: str):
    key = food_query.lower().strip().replace(" ", "_")

    if key in dish_map:
        totals, total_grams, missing = sum_nutrients(dish_map[key])
        if total_grams == 0:
            return None
        factor = 100 / total_grams
        return {
            "source": "dish_mapping",
            "dish_name": food_query,
            "base_serving_grams": total_grams,
            "calories_per_100g": round(totals["calories"] * factor, 2),
            "protein_per_100g": round(totals["protein"] * factor, 2),
            "carbs_per_100g": round(totals["carbs"] * factor, 2),
            "fat_per_100g": round(totals["fat"] * factor, 2),
            "fiber_per_100g": round(totals["fiber"] * factor, 2),
            "missing_ingredients": missing,
        }

    direct_matches = [f for f in foods if food_query.lower() in f["name"].lower()][:5]
    if not direct_matches:
        return None
    return {"source": "direct_wafct_match", "matches": direct_matches}
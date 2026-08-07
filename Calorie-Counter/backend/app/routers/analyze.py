import asyncio

from fastapi import APIRouter, HTTPException

from app.models.schemas import AnalyzeRequest
from app.services.dish_resolver_graph import build_dish_resolver_graph
from app.services.vision import identify_dishes

router = APIRouter()


@router.post("/analyze-plate")
async def analyze_plate(req: AnalyzeRequest):
    try:
        identified = await identify_dishes(req.image)
        detected = identified.get("dishes", [])
        if not detected:
            raise HTTPException(400, "No dishes could be identified in this image.")

        raw_dishes = [d["dishKey"] for d in detected]

        graph = build_dish_resolver_graph()
        state = await asyncio.to_thread(
            graph.invoke,
            {
                "raw_dishes": raw_dishes,
                "resolved_dishes": [],
                "unresolved_dishes": [],
                "retry_count": 0,
            },
        )

        by_key = {d["dishKey"]: d for d in detected}

        # Attach displayName / grams back from the vision output
        resolved = []
        for entry in state.get("resolved_dishes", []):
            keys = [entry["dish"]] + ([entry["reclassified_to"]] if "reclassified_to" in entry else [])
            vision = next((by_key[k] for k in keys if k in by_key), None)
            resolved.append({
                "displayName": (vision or {}).get("displayName") or entry["dish"],
                "grams": int((vision or {}).get("estimatedGrams") or 200),
                "nutrients": entry["nutrients"],
                "matchType": entry["match_type"],
                "reclassifiedTo": entry.get("reclassified_to"),
            })

        unresolved_keys = state.get("unresolved_dishes", [])
        unresolved = [
            (by_key[k].get("displayName") if k in by_key else k) for k in unresolved_keys
        ]

        if not resolved:
            raise HTTPException(400, f"No FAO data found for: {', '.join(unresolved)}")

        total_grams = sum(d["grams"] for d in resolved)
        totals = {"calories": 0, "protein": 0, "carbs": 0, "fat": 0}
        for d in resolved:
            factor = d["grams"] / 100
            n = d["nutrients"]
            totals["calories"] += n.get("calories_per_100g", 0) * factor
            totals["protein"] += n.get("protein_per_100g", 0) * factor
            totals["carbs"] += n.get("carbs_per_100g", 0) * factor
            totals["fat"] += n.get("fat_per_100g", 0) * factor

        per100g = 100 / total_grams
        combined_name = " & ".join(d["displayName"] for d in resolved)

        return {
            "name": combined_name,
            "detectedDishes": [
                {"name": d["displayName"], "grams": d["grams"], "matchType": d["matchType"]}
                for d in resolved
            ],
            "unresolvedDishNames": unresolved,
            "baseCaloriesPer100g": totals["calories"] * per100g,
            "proteinPer100g": totals["protein"] * per100g,
            "carbsPer100g": totals["carbs"] * per100g,
            "fatPer100g": totals["fat"] * per100g,
            "units": [
                {"key": "standard_plate", "label": "Standard plate portion", "grams": total_grams},
                {"key": "small_portion", "label": "Small portion", "grams": round(total_grams * 0.6)},
                {"key": "large_portion", "label": "Large portion", "grams": round(total_grams * 1.4)},
            ],
            "supportsRawState": False,
            "customPrompts": [],
            "selectedUnitKey": "standard_plate",
            "selectedQuantity": 1,
            "computedGrams": total_grams,
            "computedCalories": round(totals["calories"]),
            "isRawState": False,
            "promptResponses": {},
        }
    except HTTPException:
        raise
    except Exception as err:
        raise HTTPException(500, str(err))
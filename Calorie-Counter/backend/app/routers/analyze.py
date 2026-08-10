"""Plate-analysis router: vision pipeline -> LangGraph engine -> response.

POST /api/analyze-plate accepts a base64 image (data URL or bare base64),
identifies the dishes with Gemini, resolves them through the LangGraph
resolution engine, and returns a structured ``AnalyzeResponse``.
"""

from __future__ import annotations

import asyncio
import re

from fastapi import APIRouter, HTTPException

from app.models.schemas import AnalyzeRequest, AnalyzeResponse, DetectedDish, NutrientSummary
from app.services.dish_resolver_graph import run_dish_resolution_graph
from app.services.vision import identify_dishes

router = APIRouter()

DATA_URL_RE = re.compile(r"^data:image/\w+;base64,")
BASE64_RE = re.compile(r"^[A-Za-z0-9+/=\s]+$")


def _validate_image(image_base64: str) -> None:
    """Reject empty or clearly invalid image payloads with a clean 400."""
    if not image_base64.strip():
        raise HTTPException(status_code=400, detail="image must not be empty.")

    stripped = image_base64.strip()
    if stripped.startswith("data:"):
        if not DATA_URL_RE.match(stripped):
            raise HTTPException(
                status_code=400,
                detail="image must be a base64 data URL (data:image/<type>;base64,...).",
            )
    elif not BASE64_RE.fullmatch(stripped):
        raise HTTPException(status_code=400, detail="image is not valid base64.")


@router.post("/analyze-plate", response_model=AnalyzeResponse)
async def analyze_plate(req: AnalyzeRequest):
    try:
        _validate_image(req.image_base64)

        detected = await identify_dishes(req.image_base64)
        if not detected:
            raise HTTPException(status_code=400, detail="No dishes could be identified in this image.")

        state = await asyncio.to_thread(run_dish_resolution_graph, detected)
        totals = state["total_nutrients"]

        return AnalyzeResponse(
            dishes=[DetectedDish.model_validate(entry) for entry in state["resolved_dishes"]],
            totals=NutrientSummary(
                calories=totals.get("calories", 0.0),
                protein_g=totals.get("protein", 0.0),
                carbs_g=totals.get("carbs", 0.0),
                fat_g=totals.get("fat", 0.0),
                fiber_g=totals.get("fiber", 0.0),
            ),
            unresolved_dishes=state["unresolved_dishes"],
            logs=state["logs"],
        )
    except HTTPException:
        raise
    except Exception as err:  # noqa: BLE001 — surface unexpected failures as a clean 500
        raise HTTPException(status_code=500, detail=f"Analysis failed: {err}")
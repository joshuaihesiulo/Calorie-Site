"""Plate-analysis router: vision pipeline -> LangGraph engine -> response.

POST /api/analyze-plate accepts a base64 image (data URL or bare base64),
identifies the dishes with Gemini, resolves them through the LangGraph
resolution engine, and returns a structured ``AnalyzeResponse``.

POST /api/analyze-plate-stream does the same but streams progress events
via Server-Sent Events (SSE) so the frontend can show real-time steps.
"""

from __future__ import annotations

import asyncio
import json
import re
import time

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse

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


def _sse_event(data: dict) -> str:
    """Format a dict as an SSE data line."""
    return f"data: {json.dumps(data)}\n\n"


def _build_response(state: dict) -> dict:
    """Build the final JSON response dict from the graph state."""
    totals = state["total_nutrients"]
    return {
        "dishes": [DetectedDish.model_validate(entry).model_dump(by_alias=True) for entry in state["resolved_dishes"]],
        "totals": {
            "calories": totals.get("calories", 0.0),
            "proteinG": totals.get("protein", 0.0),
            "carbsG": totals.get("carbs", 0.0),
            "fatG": totals.get("fat", 0.0),
            "fiberG": totals.get("fiber", 0.0),
        },
        "unresolvedDishes": state["unresolved_dishes"],
        "logs": state["logs"],
    }


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


@router.post("/analyze-plate-stream")
async def analyze_plate_stream(req: AnalyzeRequest):
    """Stream scan progress via SSE: step events, then a final done event."""

    async def event_generator():
        steps_log: list[dict] = []

        try:
            # Step 1: Validate
            yield _sse_event({"step": "validating", "message": "Validating image..."})
            _validate_image(req.image_base64)

            # Step 2: Identify dishes with Gemini
            t0 = time.monotonic()
            yield _sse_event({"step": "identifying", "message": "Identifying dishes with Gemini Vision..."})
            detected = await identify_dishes(req.image_base64)
            elapsed = int((time.monotonic() - t0) * 1000)
            steps_log.append({"step": "identifying", "duration_ms": elapsed})

            if not detected:
                yield _sse_event({"step": "error", "message": "No dishes could be identified in this image."})
                return

            dish_count = len(detected)
            dish_names = [d.get("displayName", d.get("dishKey", "dish")) for d in detected]

            # Step 3: Resolve nutrition
            t1 = time.monotonic()
            yield _sse_event({
                "step": "resolving",
                "message": f"Looking up nutrition for {dish_count} item{'s' if dish_count != 1 else ''}: {', '.join(dish_names)}...",
            })
            state = await asyncio.to_thread(run_dish_resolution_graph, detected)
            elapsed2 = int((time.monotonic() - t1) * 1000)
            steps_log.append({"step": "resolving", "duration_ms": elapsed2})

            # Step 4: Done
            yield _sse_event({"step": "done", "message": "Scan complete!"})

            result = _build_response(state)
            result["steps"] = steps_log
            yield _sse_event({"step": "result", "data": result})

        except HTTPException as err:
            yield _sse_event({"step": "error", "message": str(err.detail)})
        except Exception as err:  # noqa: BLE001
            yield _sse_event({"step": "error", "message": f"Analysis failed: {err}"})

    return StreamingResponse(event_generator(), media_type="text/event-stream")
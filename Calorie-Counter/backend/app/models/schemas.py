"""Pydantic request/response schemas mirroring the frontend ``scannedFoodData`` contract.

Python fields are snake_case; camelCase aliases are used on the wire to match
the React frontend (``useBoundStore.js`` posts ``{ image: ... }`` and consumes
camelCase response fields). ``populate_by_name`` allows both casings on input.
"""

from __future__ import annotations

from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field
from pydantic.alias_generators import to_camel


class AnalyzeRequest(BaseModel):
    """POST body for the plate-analysis endpoint."""

    model_config = ConfigDict(populate_by_name=True)

    image_base64: str = Field(
        alias="image",
        description="Base64 data URL of the plate photo, as sent by the frontend.",
    )


class DetectedDish(BaseModel):
    """A single dish identified on the plate, with its FAO resolution details."""

    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    dish_key: str
    display_name: str
    estimated_grams: float
    resolution_method: str
    fao_result: Optional[dict] = None


class NutrientSummary(BaseModel):
    """Macro-nutrient profile, expressed per 100g in grams."""

    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    calories: float
    protein_g: float
    carbs_g: float
    fat_g: float
    fiber_g: float


class AnalyzeResponse(BaseModel):
    """Response body mirroring the frontend ``scannedFoodData`` contract."""

    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    dishes: List[DetectedDish]
    totals: NutrientSummary
    unresolved_dishes: List[str]
    logs: List[str]

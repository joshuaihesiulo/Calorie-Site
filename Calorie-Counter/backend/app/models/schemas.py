from pydantic import BaseModel
from typing import Optional

class AnalyzeRequest(BaseModel):
    image: str  # base64 data URL, same format your frontend already sends

class DetectedDish(BaseModel):
    name: str
    grams: int

class AnalyzeResponse(BaseModel):
    name: str
    detectedDishes: list[DetectedDish]
    unresolvedDishNames: list[str]
    baseCaloriesPer100g: float
    proteinPer100g: float
    carbsPer100g: float
    fatPer100g: float
    units: list[dict]
    supportsRawState: bool
    customPrompts: list
    selectedUnitKey: str
    selectedQuantity: float
    computedGrams: int
    computedCalories: int
    isRawState: bool
    promptResponses: dict
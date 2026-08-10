"""API tests for POST /api/analyze-plate and GET /health.

Gemini vision is stubbed so the suite runs fully offline; the LangGraph
resolution uses only local data (direct matches).
"""

from __future__ import annotations

from fastapi.testclient import TestClient

from app.main import app
from app.services.fao_lookup import lookup_direct_fao

client = TestClient(app)


async def _fake_identify(image_base64: str) -> list[dict]:
    assert image_base64.startswith("data:image/"), "image payload must be a data URL"
    return [
        {"dishKey": "jollof_rice", "displayName": "Jollof Rice", "estimatedGrams": 250},
        {"dishKey": "amala", "displayName": "Amala", "estimatedGrams": 150},
    ]


def _expected_totals() -> dict[str, float]:
    totals = {"calories": 0.0, "protein": 0.0, "carbs": 0.0, "fat": 0.0, "fiber": 0.0}
    for key, grams in (("jollof_rice", 250), ("amala", 150)):
        fao = lookup_direct_fao(key)
        factor = grams / 100
        for nutrient in totals:
            totals[nutrient] += fao[f"{nutrient}_per_100g"] * factor
    return {nutrient: round(value, 2) for nutrient, value in totals.items()}


class TestHealth:
    def test_health_returns_ok(self) -> None:
        resp = client.get("/health")
        assert resp.status_code == 200
        assert resp.json() == {"status": "ok"}


class TestAnalyzePlate:
    def test_returns_expected_analyze_response(self, monkeypatch) -> None:
        monkeypatch.setattr("app.routers.analyze.identify_dishes", _fake_identify)

        resp = client.post(
            "/api/analyze-plate",
            json={"image": "data:image/jpeg;base64,ZmFrZQ=="},
        )
        assert resp.status_code == 200

        data = resp.json()
        assert set(data.keys()) == {"dishes", "totals", "unresolvedDishes", "logs"}

        # DetectedDish (camelCase wire contract)
        assert len(data["dishes"]) == 2
        first = data["dishes"][0]
        assert first["dishKey"] == "jollof_rice"
        assert first["displayName"] == "Jollof Rice"
        assert first["estimatedGrams"] == 250
        assert first["resolutionMethod"] == "direct"
        assert first["faoResult"]["source"] == "dish_ingredients"

        # NutrientSummary
        expected = _expected_totals()
        totals = data["totals"]
        assert totals == {
            "calories": expected["calories"],
            "proteinG": expected["protein"],
            "carbsG": expected["carbs"],
            "fatG": expected["fat"],
            "fiberG": expected["fiber"],
        }

        assert data["unresolvedDishes"] == []
        assert data["logs"] and all(isinstance(line, str) for line in data["logs"])

    def test_404_for_unknown_route_only(self, monkeypatch) -> None:
        monkeypatch.setattr("app.routers.analyze.identify_dishes", _fake_identify)
        assert client.get("/api/nope").status_code == 404

    def test_empty_image_returns_400(self) -> None:
        resp = client.post("/api/analyze-plate", json={"image": ""})
        assert resp.status_code == 400
        assert resp.json()["detail"] == "image must not be empty."

    def test_invalid_base64_returns_400(self) -> None:
        resp = client.post("/api/analyze-plate", json={"image": "not base64!!"})
        assert resp.status_code == 400
        assert resp.json()["detail"] == "image is not valid base64."

    def test_missing_field_returns_422(self) -> None:
        resp = client.post("/api/analyze-plate", json={})
        assert resp.status_code == 422
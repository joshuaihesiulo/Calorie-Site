"""Unit tests for the LangGraph dish-resolution pipeline.

All Groq interactions are stubbed to keep the suite offline and deterministic.
"""

from __future__ import annotations

from rapidfuzz import fuzz

from app.services import providers
from app.services.dish_resolver_graph import (
    FUZZY_THRESHOLD,
    _ai_candidate_keys,
    run_dish_resolution_graph,
)
from app.services.fao_lookup import lookup_direct_fao


def resolve(dish_key: str, grams: int = 200, **overrides) -> dict:
    """Run a single dish through the full graph and return the final state."""
    dish = {
        "dishKey": dish_key,
        "displayName": dish_key.replace("_", " ").title(),
        "estimatedGrams": grams,
    }
    dish.update(overrides)
    return run_dish_resolution_graph([dish])


# ---------------------------------------------------------------------------
# Node 1: direct FAO match
# ---------------------------------------------------------------------------
class TestDirectPath:
    def test_jollof_rice_resolves_direct(self) -> None:
        result = resolve("jollof_rice")
        assert result["unresolved_dishes"] == []
        assert len(result["resolved_dishes"]) == 1

        entry = result["resolved_dishes"][0]
        assert entry["resolution_method"] == "direct"
        assert entry["dishKey"] == "jollof_rice"
        assert entry["fao_result"]["source"] == "dish_ingredients"
        assert any("DIRECT" in log for log in result["logs"])


# ---------------------------------------------------------------------------
# Node 2: fuzzy match (rapidfuzz token_sort_ratio >= 75)
# ---------------------------------------------------------------------------
class TestFuzzyPath:
    def test_threshold_contract(self) -> None:
        # The spec's example pair must clear the threshold.
        score = fuzz.token_sort_ratio("egusi_sp", "egusi_soup")
        assert FUZZY_THRESHOLD == 85
        assert score >= FUZZY_THRESHOLD

    def test_near_miss_resolves_to_egusi_soup(self) -> None:
        result = resolve("egusi_sp")
        assert result["unresolved_dishes"] == []
        assert len(result["resolved_dishes"]) == 1

        entry = result["resolved_dishes"][0]
        assert entry["resolution_method"] == "fuzzy"
        assert entry["fao_result"]["key"] == "egusi_soup"
        assert any("[FUZZY] 'egusi_sp' -> 'egusi_soup'" in log for log in result["logs"])


# ---------------------------------------------------------------------------
# Node 3: AI reclassification (Groq stubbed)
# ---------------------------------------------------------------------------
class TestAiReclassifyPath:
    def test_unknown_key_reclassified(self, monkeypatch) -> None:
        monkeypatch.setattr(providers, "ai_reclassify_dish", lambda key, keys: "moin_moin")

        result = resolve("__invented_dish__")
        assert result["unresolved_dishes"] == []
        assert len(result["resolved_dishes"]) == 1

        entry = result["resolved_dishes"][0]
        assert entry["resolution_method"] == "ai_reclassify"
        assert entry["fao_result"]["key"] == "moin_moin"
        assert any("[AI]" in log for log in result["logs"])

    def test_reclassify_to_unresolvable_key_stays_unresolved(self, monkeypatch) -> None:
        monkeypatch.setattr(providers, "ai_reclassify_dish", lambda key, keys: "__also_fake__")

        result = resolve("__invented_dish__")
        assert result["resolved_dishes"] == []
        assert result["unresolved_dishes"] == ["__invented_dish__"]

    def test_candidate_keys_are_bounded_and_include_curated(self) -> None:
        from app.services.dish_resolver_graph import KNOWN_KEYS, MAX_AI_CANDIDATES
        from app.services.vision import KNOWN_KEYS as VISION_KEYS

        keys = _ai_candidate_keys("ewedu_soup")
        assert len(keys) <= len(VISION_KEYS) + MAX_AI_CANDIDATES
        assert "amala" in keys and "egusi_soup" in keys and "jollof_rice" in keys
        assert "jollof_rice" in KNOWN_KEYS


# ---------------------------------------------------------------------------
# Node 4: unresolved
# ---------------------------------------------------------------------------
class TestUnresolvedPath:
    def test_unrecognized_string_is_marked_unresolved(self, monkeypatch) -> None:
        monkeypatch.setattr(providers, "ai_reclassify_dish", lambda key, keys: None)

        result = resolve("__not_a_real_food___")
        assert result["resolved_dishes"] == []
        assert result["unresolved_dishes"] == ["__not_a_real_food___"]
        assert any("UNRESOLVED" in log for log in result["logs"])
        assert any("FUZZY MISS" in log for log in result["logs"])


# ---------------------------------------------------------------------------
# Node 5: nutrient aggregation scaling
# ---------------------------------------------------------------------------
class TestNutrientScaling:
    def test_doubling_grams_doubles_every_total(self) -> None:
        base = lookup_direct_fao("jollof_rice")
        assert base is not None

        small = resolve("jollof_rice", grams=100)
        large = resolve("jollof_rice", grams=200)

        # 100g of jollof_rice == the per-100g profile itself
        assert small["total_nutrients"]["calories"] == round(base["calories_per_100g"], 2)

        for key in ("calories", "protein", "carbs", "fat", "fiber"):
            assert large["total_nutrients"][key] == round(small["total_nutrients"][key] * 2, 2)

    def test_multiple_dishes_are_summed(self) -> None:
        result = run_dish_resolution_graph(
            [
                {"dishKey": "jollof_rice", "displayName": "Jollof Rice", "estimatedGrams": 250},
                {"dishKey": "amala", "displayName": "Amala", "estimatedGrams": 150},
            ]
        )
        assert len(result["resolved_dishes"]) == 2
        expected = 0.0
        for grams, key in ((250, "jollof_rice"), (150, "amala")):
            expected += lookup_direct_fao(key)["calories_per_100g"] * grams / 100
        assert result["total_nutrients"]["calories"] == round(expected, 2)
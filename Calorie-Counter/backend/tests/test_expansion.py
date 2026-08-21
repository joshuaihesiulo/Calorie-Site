"""Tests for the food-database expansion: WAFCT dishes, aliases, curated
snacks, and the Open Food Facts fallback path (all network calls stubbed)."""

from __future__ import annotations

import pytest

from app.services import open_food_facts, providers
from app.services.dish_resolver_graph import run_dish_resolution_graph
from app.services.fao_lookup import get_all_known_keys, lookup_direct_fao

EXPANDED_DISH_KEYS = [
    "fried_rice",
    "oha_soup",
    "efo_riro",
    "eba",
    "suya",
    "goat_meat_pepper_soup",
    "akara",
    "boli",
    "masa",
    "chin_chin",
    "puff_puff",
    "meat_pie",
    "egg_roll",
    "scotch_egg",
    "potato_chips",
    "plantain_chips",
]

EXPANDED_SNACK_KEYS = [
    "indomie_chicken_noodles",
    "gala_chicken_roll",
    "peak_instant_milk_powder",
    "maltina_malt_drink",
    "beloxxi_cream_crackers",
    "amstel_malta_ultra",
    "cadbury_bournvita",
    "milo_tin_powder",
    "minimie_chin_chin",
    "pure_bliss_milk_cookies",
    "pure_bliss_milk_cream_wafer",
    "superbite_sausage_roll",
    "yale_cabin_biscuits",
    "oxford_coaster_biscuits",
    "hollandia_yoghurt",
    "chivita_orange_juice",
    "lacasera_apple_drink",
    "viju_milk_drink",
    "beloxxi_cream_crackers_26g",
    "beloxxi_cream_crackers_52g",
    "parle_7to7",
    "parle_all_butter_cake",
    "mcvities_digestive_fibre",
    "parle_fab",
    "yatee_grab_and_go",
    "parle_milk_power",
    "yale_spicy_fish_biscuit",
    "parle_top_biscuit",
    "festo_espresso",
    "milk_bread_milk_coffee",
    "seven_up_500ml",
    "american_cola_600ml",
    "beta_malt_330ml",
    "bigi_cola_50cl",
    "bigi_spirite_500ml",
    "bigi_apple_500ml",
    "coca_cola_50cl",
    "fanta_500ml",
    "nutri_milk_500ml",
    "nutri_yo_500ml",
    "pepsi_500ml",
    "razzl_orange_330ml",
    "smoov_chapman_500ml",
    "five_alive_pineapple_330ml",
]


# ---------------------------------------------------------------------------
# WAFCT dish recipes
# ---------------------------------------------------------------------------
class TestNewDishes:
    def test_every_expanded_dish_resolves_without_missing_ingredients(self) -> None:
        for key in EXPANDED_DISH_KEYS:
            profile = lookup_direct_fao(key)
            assert profile is not None, f"{key} did not resolve"
            assert profile["source"] == "dish_ingredients"
            assert not profile.get("missing_ingredients"), (
                f"{key} has unresolved ingredients: {profile.get('missing_ingredients')}"
            )
            assert profile["calories_per_100g"] > 0, f"{key} has no calories"

    def test_expanded_repertoire_in_pipeline(self) -> None:
        result = run_dish_resolution_graph(
            [
                {"dishKey": "fried_rice", "displayName": "Fried Rice", "estimatedGrams": 300},
                {"dishKey": "suya", "displayName": "Suya", "estimatedGrams": 120},
                {"dishKey": "chin_chin", "displayName": "Chin Chin", "estimatedGrams": 80},
            ]
        )
        assert result["unresolved_dishes"] == []
        assert len(result["resolved_dishes"]) == 3


# ---------------------------------------------------------------------------
# Aliases
# ---------------------------------------------------------------------------
class TestAliases:
    def test_alias_resolves_to_canonical_recipe(self) -> None:
        profile = lookup_direct_fao("jollof")
        assert profile is not None and profile["key"] == "jollof_rice"

    def test_snack_alias_resolves_to_curated_snack(self) -> None:
        profile = lookup_direct_fao("gala")
        assert profile is not None and profile["key"] == "gala_chicken_roll"

    def test_aliases_are_in_known_keys(self) -> None:
        known = set(get_all_known_keys())
        assert "gala" in known and "jollof" in known and "suya" in known


# ---------------------------------------------------------------------------
# Curated snacks
# ---------------------------------------------------------------------------
class TestCuratedSnacks:
    def test_snack_profiles_carry_serving_defaults(self) -> None:
        for key in EXPANDED_SNACK_KEYS:
            profile = lookup_direct_fao(key)
            assert profile is not None, f"{key} did not resolve"
            assert profile["source"] in ("manufacturer_label", "package_label", "crowdsourced")
            assert profile["serving_grams"] > 0, f"{key} missing serving_grams"
            assert profile["calories_per_100g"] > 0, f"{key} missing calories"

    def test_snack_key_resolves_direct_in_graph(self) -> None:
        result = run_dish_resolution_graph(
            [
                {
                    "dishKey": "gala_chicken_roll",
                    "displayName": "Gala",
                    "estimatedGrams": 98,
                    "isPackaged": True,
                }
            ]
        )
        entry = result["resolved_dishes"][0]
        assert entry["resolution_method"] == "direct"
        assert entry["fao_result"]["source"] == "manufacturer_label"
        assert entry["fao_result"]["verified"] is True
        assert entry["fao_result"]["key"] == "gala_chicken_roll"

    def test_verified_flag_contract(self) -> None:
        unverified = {
            "five_alive_pineapple_330ml",
            "minimie_chin_chin",
            "pure_bliss_milk_cookies",
            "pure_bliss_milk_cream_wafer",
            "superbite_sausage_roll",
            "yale_cabin_biscuits",
            "oxford_coaster_biscuits",
            "hollandia_yoghurt",
            "chivita_orange_juice",
            "lacasera_apple_drink",
            "viju_milk_drink",
        }
        verified = set(EXPANDED_SNACK_KEYS) - unverified
        for key in EXPANDED_SNACK_KEYS:
            profile = lookup_direct_fao(key)
            assert profile is not None
            assert profile["verified"] == (key in verified), (
                f"{key} verified flag does not match curated list"
            )


# ---------------------------------------------------------------------------
# Open Food Facts service (requests stubbed)
# ---------------------------------------------------------------------------
def _off_product(name: str, kcal: float | None, serving_quantity: str | None = None) -> dict:
    return {
        "product_name": name,
        "brands": "Wonder Foods",
        "serving_size": "98 g" if serving_quantity else "",
        "nutriments": {
            "energy-kcal_100g": kcal,
            "proteins_100g": 8.6,
            "carbohydrates_100g": 48,
            "fat_100g": 24,
            "serving_quantity": serving_quantity,
        },
    }


class TestOpenFoodFacts:
    @pytest.fixture(autouse=True)
    def _clear_cache(self) -> None:
        open_food_facts._cache().clear()

    def test_query_hit_returns_profile(self, monkeypatch) -> None:
        def fake_get(url, params=None, timeout=None, headers=None):
            return {"products": [_off_product("Gala Roll", 450, "98")]}

        monkeypatch.setattr(open_food_facts, "_get_sync", fake_get)
        profile = open_food_facts.fetch_snack_by_query_sync("Gala Chicken Roll")
        assert profile is not None
        assert profile["source"] == "open_food_facts"
        assert profile["calories_per_100g"] == 450
        assert profile["serving_grams"] == 98
        assert profile["brand"] == "Wonder Foods"

    def test_no_calories_on_products_returns_none(self, monkeypatch) -> None:
        def fake_get(url, params=None, timeout=None, headers=None):
            return {"products": [_off_product("Gala Roll", None)]}

        monkeypatch.setattr(open_food_facts, "_get_sync", fake_get)
        assert open_food_facts.fetch_snack_by_query_sync("Gala") is None

    def test_empty_and_failed_searches_return_none(self, monkeypatch) -> None:
        def fake_get(url, params=None, timeout=None, headers=None):
            return {"products": []}

        monkeypatch.setattr(open_food_facts, "_get_sync", fake_get)
        assert open_food_facts.fetch_snack_by_query_sync("zzz_unknown_zzz") is None

    def test_cached_query_skips_network(self, monkeypatch) -> None:
        calls = []

        def fake_get(url, params=None, timeout=None, headers=None):
            calls.append(url)
            return {"products": [_off_product("Maltina", 55, "340")]}

        monkeypatch.setattr(open_food_facts, "_get_sync", fake_get)
        open_food_facts.fetch_snack_by_query_sync("Maltina Malt Drink")
        open_food_facts.fetch_snack_by_query_sync("Maltina Malt Drink")
        assert len(calls) == 1


# ---------------------------------------------------------------------------
# Graph: OFF fallback node
# ---------------------------------------------------------------------------
class TestOffFallbackPath:
    def test_packaged_unresolved_dish_uses_off(self, monkeypatch) -> None:
        monkeypatch.setattr(providers, "ai_reclassify_dish", lambda key, keys: None)

        def fake_get(url, params=None, timeout=None, headers=None):
            return {"products": [_off_product("Mystery Crisps", 520, "40")]}

        monkeypatch.setattr(open_food_facts, "_get_sync", fake_get)

        result = run_dish_resolution_graph(
            [
                {
                    "dishKey": "__mystery_crisps__",
                    "displayName": "Mystery Crisps",
                    "estimatedGrams": 300,
                    "isPackaged": True,
                    "brandHint": "Mystery Brand Crisps",
                }
            ]
        )
        assert result["unresolved_dishes"] == []
        assert len(result["resolved_dishes"]) == 1

        entry = result["resolved_dishes"][0]
        assert entry["resolution_method"] == "off"
        assert entry["fao_result"]["source"] == "open_food_facts"
        # packaged default grams come from the OFF serving_quantity
        assert entry["estimatedGrams"] == 40
        assert any("[OFF]" in log for log in result["logs"])

    def test_non_packaged_unknown_never_hits_off(self, monkeypatch) -> None:
        monkeypatch.setattr(providers, "ai_reclassify_dish", lambda key, keys: None)
        calls = []

        def fake_get(url, params=None, timeout=None, headers=None):
            calls.append(url)
            return {"products": [_off_product("Whatever", 100)]}

        monkeypatch.setattr(open_food_facts, "_get_sync", fake_get)

        result = run_dish_resolution_graph(
            [
                {
                    "dishKey": "__unknown_food__",
                    "displayName": "Unknown Food",
                    "estimatedGrams": 100,
                }
            ]
        )
        assert result["resolved_dishes"] == []
        assert result["unresolved_dishes"] == ["__unknown_food__"]
        assert calls == [], "OFF must not be queried for non-packaged items"
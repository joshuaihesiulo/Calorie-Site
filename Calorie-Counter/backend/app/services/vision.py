"""Gemini closed-vocabulary vision service for dish identification.

``identify_dishes`` sends a plate photo to Gemini along with a bounded
vocabulary of curated dish keys (the recipes in ``dish_ingredients.json``
plus curated packaged snacks in ``snacks.json``).
Gemini may invent lowercase_underscore keys for dishes outside the vocabulary;
those keys are resolved against the full FAO/WAFCT key space later in the
pipeline.
"""

from __future__ import annotations

import asyncio
import base64
import json
import re

from app.config import get_settings
from app.services.fao_lookup import get_all_known_keys

# Curated closed vocabulary — the exactly curated dish + snack keys.
# The full key space (get_all_known_keys(), ~1k entries) is far too large to
# embed in a prompt; these anchors keep Gemini focused and accurate.
KNOWN_KEYS = (
    "jollof_rice",
    "fried_rice",
    "egusi_soup",
    "oha_soup",
    "efo_riro",
    "pounded_yam",
    "amala",
    "eba",
    "fried_plantain",
    "boli",
    "moin_moin",
    "akara",
    "suya",
    "goat_meat_pepper_soup",
    "masa",
    "chin_chin",
    "puff_puff",
    "meat_pie",
    "egg_roll",
    "scotch_egg",
    "potato_chips",
    "plantain_chips",
    "gala_chicken_roll",
    "indomie_chicken_noodles",
    "peak_instant_milk_powder",
    "maltina_malt_drink",
    "beloxxi_cream_crackers",
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
)

MAX_ATTEMPTS = 3  # initial call + 2 retries

IDENTIFY_PROMPT = """Look at this plate of West African/Nigerian food carefully.
List EVERY visually distinct item on the plate or in the photo, with estimated weight in grams.

You MUST try to match each item to one of these exact known keys if plausible:
{known_keys}

Only invent a new lowercase_underscore key if the item clearly does NOT match any above.

For PACKAGED products (chips, biscuits, drinks, noodles, candy, bottled beverages...):
- set isPackaged to true
- brandHint: the product or brand name printed on the package as the user would read it,
  e.g. "Gala Chicken Roll", "Indomie Chicken", "Maltina", "Coca-Cola 50cl"
For cooked/street food, isPackaged must be false and brandHint null.

Return ONLY raw JSON, no markdown, no backticks:
{{
  "dishes": [
    {{ "dishKey": "amala", "displayName": "Amala", "estimatedGrams": 200, "isPackaged": false, "brandHint": null }}
  ]
}}"""


def _fold(text: str) -> str:
    """Case-fold and collapse whitespace for case-insensitive comparisons."""
    return " ".join(text.strip().lower().split())


# Best-effort canonicalization map for whatever casing/spacing Gemini returns.
# Keys are indexed by both underscore and space forms so "jollof_rice" and
# "Jollof Rice" both resolve to the canonical "jollof_rice".
_KNOWN_BY_LOWER: dict[str, str] = {}
for _key in get_all_known_keys():
    _folded = _fold(_key)
    _KNOWN_BY_LOWER[_folded] = _key
    if "_" in _folded:
        _KNOWN_BY_LOWER[_folded.replace("_", " ")] = _key


def _is_retryable(err: Exception) -> bool:
    """Rate-limit / overload signals worth retrying."""
    msg = str(err).lower()
    return any(token in msg for token in ("503", "429", "overloaded", "high demand", "rate limit"))


def _decode_image(image_base64: str) -> tuple[str, bytes]:
    """Split a base64 data URL into (mime_type, image_bytes); bare base64 -> jpeg."""
    match = re.match(r"^data:(image/\w+);base64,(.+)$", image_base64, flags=re.DOTALL)
    if match:
        return match.group(1), base64.b64decode(match.group(2))
    return "image/jpeg", base64.b64decode(image_base64)


async def identify_dishes(image_base64: str) -> list[dict]:
    """Identify every distinct dish on the plate photo.

    Returns a list of dicts shaped like:
    ``{"dishKey": ..., "displayName": ..., "estimatedGrams": ...}``.
    Raises if no Gemini API key is configured or all retry attempts fail.
    """
    settings = get_settings()
    if not settings.gemini_api_key.strip():
        raise ValueError("GEMINI_API_KEY is missing from environment variables.")

    # Lazy import: the Gemini SDK takes several seconds to import, so we only
    # pay that cost on requests that actually need vision (keeps serverless
    # cold starts ~1-2s instead of ~6-8s).
    import google.generativeai as genai

    genai.configure(api_key=settings.gemini_api_key)
    model = genai.GenerativeModel(settings.gemini_vision_model)

    mime_type, image_bytes = _decode_image(image_base64)
    prompt = IDENTIFY_PROMPT.format(known_keys=", ".join(KNOWN_KEYS))
    parts = [prompt, {"mime_type": mime_type, "data": image_bytes}]

    last_error: Exception | None = None
    for attempt in range(MAX_ATTEMPTS):
        try:
            response = await model.generate_content_async(parts)
            break
        except Exception as err:  # noqa: BLE001 — retryable provider errors
            last_error = err
            if not _is_retryable(err) or attempt == MAX_ATTEMPTS - 1:
                raise
            await asyncio.sleep(2**attempt)

    clean_json = re.sub(r"```json|```", "", response.text, flags=re.IGNORECASE).strip()
    parsed = json.loads(clean_json)
    dishes = parsed.get("dishes", [])

    for dish in dishes:
        key = _fold(str(dish.get("dishKey", "")))
        dish["dishKey"] = _KNOWN_BY_LOWER.get(key, key)

    return dishes
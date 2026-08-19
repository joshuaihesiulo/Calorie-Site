"""Open Food Facts lookup for packaged snacks.

Queries the public Open Food Facts ``search.pl`` endpoint (and the barcode
endpoint for future/label use) for packaged products Gemini flagged but the
local datasets could not resolve. Results are cached in-memory (serverless
instance lifetime) to keep repeat scans fast and stay within the 2s timeout.

Extracted fields are normalized to the same per-100g shape used across the
backend (``calories_per_100g`` etc.), plus ``serving_grams`` /
``serving_label`` and ``brand`` when the product provides them.
"""

from __future__ import annotations

import logging
import re
import time

import requests

from app.config import get_settings

logger = logging.getLogger(__name__)

SEARCH_URL = "https://world.openfoodfacts.org/cgi/search.pl"
PRODUCT_URL = "https://world.openfoodfacts.org/api/v2/product/{barcode}.json"
TIMEOUT_SECONDS = 2.0
CACHE_TTL_SECONDS = 15 * 60

# search terms that match local product name-ish data (kcal per 100g is
# expected on OFF products; nothing else is reliable enough to claim).
_REQUIRED_NUTRIENT_KEYS = ("energy-kcal_100g",)


def _cache() -> dict[str, dict]:
    """Module-level in-memory cache: normalized query -> (timestamp, payload)."""
    global _CACHE
    if _CACHE is None:
        _CACHE = {}
    return _CACHE


_CACHE: dict[str, tuple[float, dict | None]] | None = None


def _to_profile(product: dict) -> dict | None:
    """Map an OFF product dict to the backend per-100g profile shape."""
    nutriments = product.get("nutriments") or {}
    if not any(nutriments.get(key) is not None for key in _REQUIRED_NUTRIENT_KEYS):
        return None

    def _num(key: str) -> float | None:
        value = nutriments.get(key)
        try:
            return round(float(value), 2) if value is not None else None
        except (TypeError, ValueError):
            return None

    serving_grams = None
    serving_quantity = nutriments.get("serving_quantity")
    try:
        serving_grams = round(float(serving_quantity), 2) if serving_quantity else None
    except (TypeError, ValueError):
        serving_grams = None

    serving = product.get("serving_size") or ""
    if serving_grams is None:
        match = re.match(
            r"^\s*(\d+(?:\.\d+)?)\s*(?:g|gr|gram|grams)\b", serving or "", flags=re.IGNORECASE
        )
        if match:
            serving_grams = round(float(match.group(1)), 2)
    return {
        "key": (product.get("product_name") or "").strip() or "packaged_snack",
        "name": (product.get("product_name") or "").strip() or "Packaged snack",
        "brand": (product.get("brands") or "").strip() or None,
        "source": "open_food_facts",
        "calories_per_100g": _num("energy-kcal_100g"),
        "protein_per_100g": _num("proteins_100g"),
        "carbs_per_100g": _num("carbohydrates_100g"),
        "fat_per_100g": _num("fat_100g"),
        "fiber_per_100g": _num("fiber_100g"),
        "serving_grams": serving_grams,
        "serving_label": (f"{serving_grams} g" if serving_grams else serving) or None,
        "verified": False,
    }


def _pick_best(products: list[dict], query: str) -> dict | None:
    """Pick the most relevant candidate: brand/name overlap, then kcal-having."""
    query_lower = query.lower()
    tokens = {tok for tok in query_lower.replace("/", " ").split() if len(tok) > 2}

    def score(product: dict) -> int:
        name = ((product.get("product_name") or "") + " " + (product.get("brands") or "")).lower()
        return sum(1 for tok in tokens if tok in name)

    best: dict | None = None
    best_score = -1
    for product in products:
        profile = _to_profile(product)
        if profile is None:
            continue
        s = score(product)
        if s > best_score:
            best_score = s
            best = profile
    return best


HEADERS = {
    "User-Agent": (
        "NaijaCounts/1.0 (calorie tracking web app for Nigerian foods; "
        "https://calorie-site-gray.vercel.app)"
    )
}


def _get(url: str, params: dict | None = None) -> dict | None:
    """GET with the shared 2s timeout; returns JSON dict or None on any failure."""
    try:
        response = requests.get(url, params=params, timeout=TIMEOUT_SECONDS, headers=HEADERS)
        response.raise_for_status()
        return response.json()
    except requests.RequestException as err:
        logger.warning("Open Food Facts request failed: %s", err)
        return None


def fetch_snack_by_query(search_term: str) -> dict | None:
    """Search OFF for a packaged snack, normalized to the backend profile.

    Returns ``None`` when the search fails, finds nothing, or no candidate
    carries per-100g calories. Results are cached per normalized query.
    """
    norm = " ".join(search_term.strip().lower().split())
    if not norm:
        return None

    cache = _cache()
    cached = cache.get(norm)
    if cached is not None and time.monotonic() - cached[0] < CACHE_TTL_SECONDS:
        return cached[1]

    payload = _get(
        SEARCH_URL,
        params={
            "search_terms": norm,
            "search_simple": 1,
            "action": "process",
            "json": 1,
            "page_size": 5,
        },
    )

    result: dict | None = None
    if payload:
        products = payload.get("products") or []
        result = _pick_best(products, norm)

    cache[norm] = (time.monotonic(), result)
    return result


def fetch_snack_by_barcode(barcode: str) -> dict | None:
    """Look up a single product by its barcode (used by package-label flow)."""
    norm = barcode.strip()
    if not norm:
        return None

    cache = _cache()
    cached = cache.get(f"barcode:{norm}")
    if cached is not None and time.monotonic() - cached[0] < CACHE_TTL_SECONDS:
        return cached[1]

    payload = _get(PRODUCT_URL.format(barcode=norm))
    result = None
    if payload and payload.get("status") == 1:
        result = _to_profile(payload.get("product") or {})

    cache[f"barcode:{norm}"] = (time.monotonic(), result)
    return result
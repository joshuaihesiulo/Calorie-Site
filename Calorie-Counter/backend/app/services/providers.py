"""Groq text provider for dish reclassification.

Fallback/reasoning service: when a dish key from the vision step does not
resolve against the FAO/WAFCT lookup, ``ai_reclassify_dish`` asks Groq's Llama
to map it to the closest canonical key from a provided candidate list. The
function degrades gracefully — no configured key, provider failure, or bad
output all yield ``None`` instead of raising.
"""

from __future__ import annotations

import json
import logging

from app.config import get_settings

logger = logging.getLogger(__name__)

RECLASSIFY_MODEL = "llama-3.3-70b-versatile"

_client = None


def _get_client():
    """Lazily build the Groq client; ``None`` when GROQ_API_KEY is unset."""
    global _client
    if _client is not None:
        return _client

    settings = get_settings()
    if not settings.groq_api_key.strip():
        return None

    try:
        from groq import Groq
    except ImportError as exc:  # pragma: no cover - optional dependency
        logger.warning("groq package is not installed; reclassification disabled: %s", exc)
        return None

    _client = Groq(api_key=settings.groq_api_key)
    return _client


def ai_reclassify_dish(unmapped_key: str, known_keys: list[str]) -> str | None:
    """Map ``unmapped_key`` to the closest canonical key in ``known_keys``.

    Returns the best matching key, or ``None`` when there is no reasonable
    single-key match, the provider is not configured, or it fails.
    """
    client = _get_client()
    if client is None:
        logger.warning("Groq client unavailable; leaving %r unmapped", unmapped_key)
        return None

    prompt = (
        "You are a Nigerian/West African food expert. Map a dish name to the "
        "single closest canonical food key from the list below.\n\n"
        f"KNOWN KEYS (choose ONLY from this list):\n{', '.join(sorted(known_keys))}\n\n"
        f"UNMAPPED DISH: {unmapped_key}\n\n"
        "If one key is a reasonable match, return it. If no single key fits "
        "well, decompose the dish into its likely ingredients and return null."
        'Return ONLY raw JSON: {"fao_key": "<matched key or null>"}'
    )

    try:
        response = client.chat.completions.create(
            model=RECLASSIFY_MODEL,
            messages=[{"role": "user", "content": prompt}],
            temperature=0,
            max_tokens=64,
            response_format={"type": "json_object"},
            timeout=10,
        )
    except Exception as exc:  # noqa: BLE001 — provider failures are non-fatal
        logger.warning("Groq reclassification failed for %r: %s", unmapped_key, exc)
        return None

    content = response.choices[0].message.content or ""
    try:
        data = json.loads(content.strip())
    except json.JSONDecodeError:
        logger.warning("Groq returned non-JSON for %r: %r", unmapped_key, content)
        return None

    candidate = (data.get("fao_key") or "").strip()
    if candidate and candidate in known_keys:
        return candidate
    return None
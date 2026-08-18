"""Vercel Python function entrypoint for the NaijaCounts API.

Vercel routes every ``/api/*`` request to this file (``api/index.py``).
It re-exports the FastAPI application from ``backend/app/main.py`` as an
ASGI callable, so ``/api/analyze-plate`` works on Vercel exactly as it
does locally — no CORS, no separate backend host.

The static React build (``dist/``) is served by Vercel itself, so one
deployment gives the whole site a single URL.
"""

from __future__ import annotations

import sys
from pathlib import Path

# Make the ``app`` package importable from the backend/ subdirectory.
sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "backend"))

from app.main import app  # noqa: E402

__all__ = ["app"]
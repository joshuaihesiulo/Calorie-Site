"""Application settings, loaded from environment variables and ``backend/.env``.

Values can be overridden at runtime via real environment variables. A local
``.env`` file is read if present (use ``.env.example`` as a template).
"""

from __future__ import annotations

from functools import lru_cache

from pydantic import AliasChoices, Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # API keys
    gemini_api_key: str = ""
    groq_api_key: str = ""

    # Model identifiers
    # `gemini_model` is accepted as an alias so an existing GEMINI_MODEL env
    # var drives the vision model too (GEMINI_VISION_MODEL wins if both set).
    gemini_vision_model: str = Field(
        default="gemini-3.6-flash",
        validation_alias=AliasChoices("gemini_vision_model", "gemini_model"),
    )
    groq_model: str = "llama-3.2-90b-vision-preview"

    # Logging
    log_level: str = "INFO"

    # Dish-reclassification LLM (LangGraph Stage: reclassify_node)
    llm_provider: str = "google"  # "google" | "openai"
    openai_api_key: str = ""
    reclassify_model: str = ""  # defaults to gemini_model or "gpt-4o-mini"

    # Server
    app_host: str = "0.0.0.0"
    app_port: int = 8000
    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"

    # Optional LangSmith tracing (Stage 4)
    langsmith_api_key: str = ""

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    @property
    def primary_configured(self) -> bool:
        return bool(self.gemini_api_key.strip())

    @property
    def groq_configured(self) -> bool:
        return bool(self.groq_api_key.strip())


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()

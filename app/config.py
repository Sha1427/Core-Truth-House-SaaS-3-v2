from __future__ import annotations

from functools import lru_cache
from pathlib import Path
from typing import Literal

from pydantic import Field, SecretStr, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "Core Truth House API"
    app_version: str = "dev"
    environment: Literal["development", "staging", "production"] = "development"
    debug: bool = False

    api_host: str = "0.0.0.0"
    api_port: int = 8001

    cors_origins: str = Field(default="")
    frontend_build_path: str = "/app/frontend/build"

    anthropic_api_key: SecretStr | None = None
    stripe_api_key: SecretStr | None = None
    stripe_webhook_secret: SecretStr | None = None

    mongo_url: SecretStr | None = None
    mongo_db_name: str = "coretruthhouse"

    clerk_secret_key: SecretStr | None = None
    clerk_publishable_key: str | None = None
    clerk_jwt_issuer: str | None = None

    rate_limited_paths: list[str] = Field(
        default_factory=lambda: [
            "/api/generate",
            "/api/generate-image",
            "/api/generate-video",
            "/api/generators/",
            "/api/audit/perform",
        ]
    )

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
    )

    @field_validator("frontend_build_path")
    @classmethod
    def validate_frontend_build_path(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("frontend_build_path cannot be empty")
        return value

    @field_validator("cors_origins")
    @classmethod
    def normalize_cors_origins(cls, value: str) -> str:
        return value.strip()

    @field_validator("api_port")
    @classmethod
    def validate_api_port(cls, value: int) -> int:
        if not (1 <= value <= 65535):
            raise ValueError("api_port must be between 1 and 65535")
        return value

    @property
    def is_production(self) -> bool:
        return self.environment == "production"

    @property
    def is_development(self) -> bool:
        return self.environment == "development"

    @property
    def resolved_cors_origins(self) -> list[str]:
        raw = [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]
        if raw:
            return raw

        if self.is_development:
            return [
                "http://localhost:3000",
                "http://127.0.0.1:3000",
            ]

        return []

    @property
    def frontend_path(self) -> Path:
        return Path(self.frontend_build_path)

    def require_production_secrets(self) -> None:
        if not self.is_production:
            return

        required_secret_fields = {
            "stripe_api_key": self.stripe_api_key,
            "stripe_webhook_secret": self.stripe_webhook_secret,
            "mongo_url": self.mongo_url,
            "clerk_secret_key": self.clerk_secret_key,
        }

        missing = [name for name, value in required_secret_fields.items() if value is None or not value.get_secret_value().strip()]

        required_string_fields = {
            "clerk_publishable_key": self.clerk_publishable_key,
            "clerk_jwt_issuer": self.clerk_jwt_issuer,
        }

        missing.extend(
            name for name, value in required_string_fields.items() if value is None or not value.strip()
        )

        if missing:
            missing_list = ", ".join(sorted(missing))
            raise ValueError(f"Missing required production settings: {missing_list}")


@lru_cache
def get_settings() -> Settings:
    settings = Settings()
    settings.require_production_secrets()
    return settings

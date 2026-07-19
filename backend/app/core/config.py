"""
Application configuration, loaded from environment variables (.env).

Never hardcode secrets here — this module only defines the shape of the
config and reads values from the environment via pydantic-settings.
"""
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

# Resolve .env relative to the backend/ directory (this file lives at
# backend/app/core/config.py) rather than the process's current working
# directory. A relative "env_file" path silently fails to load whenever
# the app is launched from a different cwd, which causes it to fall back
# to the hardcoded defaults below (e.g. the wrong database).
_ENV_FILE = Path(__file__).resolve().parents[2] / ".env"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=_ENV_FILE, env_file_encoding="utf-8", extra="ignore")

    # App
    APP_NAME: str = "CommuteShare API"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True

    # Database (Postgres + PostGIS)
    DATABASE_URL: str = "postgresql+psycopg2://postgres:postgres@localhost:5432/commuteshare"

    # Auth
    JWT_SECRET_KEY: str = "change-me-in-env"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 1 day

    # AI - Gemini (per project decision, replacing Claude from tech.md)
    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-flash-latest"

    # Maps provider (Ola Maps, replacing Google Maps from tech.md)
    MAPS_API_KEY: str = ""
    MAPS_PROVIDER: str = "ola"

    # Payments (Razorpay Test Mode only - sandbox, never real credentials)
    RAZORPAY_KEY_ID: str = ""
    RAZORPAY_KEY_SECRET: str = ""

    # CORS. May be a single origin or a comma-separated list, e.g.
    # "http://localhost:3000,https://commuteshare.vercel.app".
    FRONTEND_ORIGIN: str = "http://localhost:3000"

    @property
    def cors_origins(self) -> list[str]:
        return [o.strip() for o in self.FRONTEND_ORIGIN.split(",") if o.strip()]


settings = Settings()

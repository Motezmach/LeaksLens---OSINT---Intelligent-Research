"""Application configuration loaded from environment variables."""
from functools import lru_cache
from typing import List

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    APP_NAME: str = "LeakLens"
    ENVIRONMENT: str = "development"
    DEBUG: bool = False
    API_V1_PREFIX: str = "/api/v1"

    # Security
    SECRET_KEY: str = Field(..., min_length=32)
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    ALGORITHM: str = "HS256"
    BCRYPT_ROUNDS: int = 12

    # Registration gate: when set, /register requires a matching invite code.
    # Leave empty to allow open registration (not recommended in production).
    INVITE_CODE: str = ""

    # CORS
    CORS_ORIGINS: str = "http://localhost:3000"

    # Extra hosts accepted by TrustedHostMiddleware (e.g. your VPS IP).
    # Comma-separated. CORS_ORIGINS hosts are always trusted automatically.
    EXTRA_TRUSTED_HOSTS: List[str] = []

    # Database
    POSTGRES_USER: str = "leaklens"
    POSTGRES_PASSWORD: str
    POSTGRES_DB: str = "leaklens"
    POSTGRES_HOST: str = "postgres"
    POSTGRES_PORT: int = 5432

    # Rate limiting (in-memory; single backend instance)
    RATE_LIMIT_PER_MINUTE: int = 60
    AUTH_RATE_LIMIT_PER_MINUTE: int = 5
    SEARCH_RATE_LIMIT_PER_MINUTE: int = 20

    # Outbound HTTP
    HTTP_TIMEOUT: float = 25.0
    HTTP_USER_AGENT: str = "Mozilla/5.0 (compatible; LeakLens/1.0)"

    # ---- Data sources ----
    # Snusbase is the primary leak-data engine (email/username/ip/password/
    # hash/name/domain). The activation code doubles as the API key.
    SNUSBASE_API_KEY: str = ""
    SNUSBASE_API_URL: str = "https://api.snusbase.com"

    # Free, keyless supplements used to enrich thin results.
    EMAILREP_API_KEY: str = ""  # optional; raises EmailRep rate limits
    ENABLE_LEAKCHECK_PUBLIC: bool = True
    ENABLE_EMAILREP: bool = True
    ENABLE_CERTSPOTTER: bool = True

    @field_validator("SECRET_KEY")
    @classmethod
    def validate_secret_key(cls, v: str) -> str:
        weak = {"changeme", "secret", "password", "default"}
        if v.lower() in weak:
            raise ValueError("SECRET_KEY must not be a weak default value")
        return v

    @property
    def cors_origins_list(self) -> List[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]

    @property
    def database_url(self) -> str:
        return (
            f"postgresql+asyncpg://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}"
            f"@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
        )


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()

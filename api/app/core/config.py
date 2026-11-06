from __future__ import annotations

import os
from functools import lru_cache
from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

API_ENV_FILE = Path(__file__).resolve().parents[2] / '.env'
DEFAULT_LEADS_DATABASE_PATH = (
    Path('/tmp/autonyx.db')
    if os.getenv('VERCEL') == '1'
    else Path(__file__).resolve().parents[2] / 'data' / 'autonyx.db'
)


class Settings(BaseSettings):
    app_name: str = Field(default='Autonyx Technologies AI Assistant')
    app_version: str = '1.0.0'
    app_env: str = 'development'
    api_prefix: str = '/api/v1'
    public_backend_url: str = 'http://localhost:8000'
    frontend_url: str = 'http://localhost:3000'
    allowed_origins: str = 'http://localhost:3000,http://127.0.0.1:3000'
    log_level: str = 'INFO'

    # ── Business identity ────────────────────────────────────────────────
    business_name: str = 'Autonyx Technologies'
    business_website_url: str = 'https://autonyxtech.in'
    business_phone: str = '+91 9265679968'

    # ── LLM ──────────────────────────────────────────────────────────────
    llm_provider: str = 'groq'
    llm_model: str = 'openai/gpt-oss-120b'
    llm_api_key: str = ''
    llm_temperature: float = 1.0
    llm_max_output_tokens: int = 1200
    llm_timeout_seconds: int = 45
    llm_max_retries: int = 2
    chat_session_ttl_seconds: int = Field(default=3600, ge=1)
    chat_max_history_messages: int = Field(default=20, ge=2)
    chat_max_context_messages: int = Field(default=12, ge=2)

    # ── Rate limiting ────────────────────────────────────────────────────
    rate_limit_per_minute: int = 20
    rate_limit_per_hour: int = 200
    daily_usage_cap: int = 500

    # ── Lead capture ─────────────────────────────────────────────────────
    lead_capture_after_messages: int = Field(default=3, ge=1)
    admin_password: str = ''
    leads_database_path: str = str(DEFAULT_LEADS_DATABASE_PATH)

    # ── SMTP email ───────────────────────────────────────────────────────
    smtp_host: str = ''
    smtp_port: int = 587
    smtp_username: str = ''
    smtp_password: str = ''
    smtp_enabled: bool = False
    smtp_use_tls: bool = True
    smtp_use_ssl: bool = False
    email_from: str = 'hello@autonyx.tech'
    email_to: str = 'autonyxtech@gmail.com'
    email_timeout_seconds: int = 30

    # ── Database (Neon Postgres — configure via env) ─────────────────────
    database_url: str = ''

    model_config = SettingsConfigDict(
        env_file=API_ENV_FILE,
        env_file_encoding='utf-8',
        case_sensitive=False,
        extra='ignore',
    )

    @property
    def allowed_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.allowed_origins.split(',') if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()

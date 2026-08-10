from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_prefix="AIFOREC_",
        env_file=".env",
        extra="ignore",
    )

    env: str = "dev"
    database_url: str = "sqlite:///./data/aiforec.db"
    checkpointer: str = "memory"  # memory | sqlite
    log_level: str = "INFO"
    history_top_k: int = 5
    state_version: int = 1


@lru_cache
def get_settings() -> Settings:
    return Settings()

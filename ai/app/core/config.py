from functools import lru_cache
from typing import List

from pydantic import Field
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    """Application configuration loaded from environment variables."""

    api_v1_str: str = Field("/api/v1", env="API_V1_STR")
    allowed_origins: str = Field("", env="ALLOWED_ORIGINS")
    max_upload_mb: int = Field(5, env="MAX_UPLOAD_MB")
    easyocr_model_dir: str = Field("/root/.EasyOCR", env="EASYOCR_MODEL_DIR")
    u2net_model_dir: str = Field("/root/.u2net", env="U2NET_MODEL_DIR")

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra="ignore"

    @property
    def allowed_origins_list(self) -> List[str]:
        if not self.allowed_origins:
            return []
        return [origin.strip() for origin in self.allowed_origins.split(",") if origin.strip()]

    @property
    def max_upload_bytes(self) -> int:
        return self.max_upload_mb * 1024 * 1024


@lru_cache()
def get_settings() -> Settings:
    return Settings()

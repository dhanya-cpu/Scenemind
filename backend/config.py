"""Application configuration loaded from environment variables."""

from functools import lru_cache
from typing import List

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = "SceneMind AI"
    app_env: str = "development"
    debug: bool = True
    secret_key: str = "change-me-in-production"

    backend_host: str = "0.0.0.0"
    backend_port: int = 8000
    cors_origins: str = "http://localhost:5173,http://localhost:5177,http://localhost:3000"

    database_url: str = "postgresql+asyncpg://scenemind:scenemind_secret@localhost:5432/scenemind_db"
    redis_url: str = "redis://localhost:6379/0"

    mqtt_broker: str = "localhost"
    mqtt_port: int = 1883
    mqtt_topic_prefix: str = "scenemind"

    ros_domain_id: int = 0
    ros_namespace: str = "/scenemind"

    yolo_model: str = "yolo11n.pt"
    yolo_confidence: float = 0.5
    camera_device: int = 0
    vision_fps: int = 30
    vlm_model: str = "florence-2-base"
    vlm_enabled: bool = False

    ollama_host: str = "http://localhost:11434"
    ollama_model: str = "llama3"
    reasoning_enabled: bool = True

    whisper_model: str = "base"
    piper_voice: str = "en_US-lessac-medium"
    voice_enabled: bool = True
    tts_output_dir: str = "./data/tts"

    slam_enabled: bool = True
    nav2_enabled: bool = True
    map_resolution: float = 0.05

    omniverse_host: str = "localhost"
    omniverse_port: int = 8211
    digital_twin_enabled: bool = False

    isaac_sim_host: str = "localhost"
    isaac_sim_port: int = 8211
    simulation_mode: bool = True

    log_level: str = "INFO"
    log_dir: str = "./logs"

    @property
    def cors_origin_list(self) -> List[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()

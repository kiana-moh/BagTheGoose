from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "BagTheGoose API"
    app_env: str = "development"
    debug: bool = True
    api_v1_prefix: str = "/api/v1"

    database_url: str
    google_client_id: str

    model_config = SettingsConfigDict(env_file=".env")


settings = Settings()
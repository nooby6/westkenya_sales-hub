from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "West Kenya Sales Hub API"
    app_env: str = "development"
    app_host: str = "0.0.0.0"
    app_port: int = 8000

    database_url: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/westkenya_sales"

    jwt_secret_key: str = "change-me"
    jwt_algorithm: str = "HS256"
    jwt_access_token_expire_minutes: int = 60

    redis_url: str = "redis://localhost:6379/0"
    email_from: str = "noreply@example.com"
    sms_provider: str = "mock"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()

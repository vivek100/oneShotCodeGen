from pydantic_settings import BaseSettings
import os

class Settings(BaseSettings):
    openai_api_key: str
    anthropic_api_key: str
    project_output_dir: str = os.path.join(os.getcwd(), "generated_projects")

    class Config:
        env_file = ".env"

settings = Settings() 
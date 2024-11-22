from pydantic_settings import BaseSettings
from typing import Optional
import os

class Settings(BaseSettings):
    openai_api_key: Optional[str] = None
    anthropic_api_key: Optional[str] = None
    project_output_dir: str = os.path.join(os.getcwd(), "generated_projects")

    def validate_api_keys(self):
        if not self.openai_api_key and not self.anthropic_api_key:
            raise ValueError(
                "At least one API key (OpenAI or Anthropic) must be provided in the .env file"
            )
        return True

    class Config:
        env_file = ".env"

settings = Settings()
settings.validate_api_keys() 
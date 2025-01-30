import os
from dotenv import load_dotenv
import outlines
from typing import Dict, Any
from models.base_models import UseCaseModel

load_dotenv()

def generate_use_cases(description: str) -> UseCaseModel:
    """Generate use cases from the application description."""
    model = outlines.models.openai(
        os.getenv("MODEL_NAME"),
        api_key=os.getenv("OPENAI_API_KEY")
    )
    generator = outlines.generate.json(model, UseCaseModel)
    
    prompt = f"""
    Given the following application description, generate the use cases for the application.
    The use cases should cover all major functionality of the application.
    
    App Description: {description}

    Example:
        {{
            "title": "Expense Tracker",
            "description": "Application to track personal and business expenses",
            "use_cases": [
                {{
                    "name": "Track Expenses",
                    "description": "Record and categorize daily expenses"
                }}
            ]
        }}
    """
    
    result = generator(prompt)
    return result 
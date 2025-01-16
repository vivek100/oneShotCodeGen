import os
from dotenv import load_dotenv
import outlines
from typing import Dict, Any

load_dotenv()

def get_ai_response(prompt: str) -> Dict[str, Any]:
    """Get response from OpenAI API using outlines library."""
    try:
        model = outlines.models.openai(
            os.getenv("MODEL_NAME"),
            api_key=os.getenv("OPENAI_API_KEY")
        )
        generator = outlines.generate.json(model)
        
        result = generator(prompt)
        return result
        
    except Exception as e:
        raise Exception(f"Error getting AI response: {str(e)}") 
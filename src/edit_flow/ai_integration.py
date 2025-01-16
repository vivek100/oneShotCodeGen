import os
from dotenv import load_dotenv
import outlines
from typing import Dict, Any
from ..models.edit_flow_models import UpdateStrategy
from .prompts.edit_prompt import EditPrompt

load_dotenv()

class EditFlowAI:
    def __init__(self):
        self.model = outlines.models.openai(
            os.getenv("MODEL_NAME"),
            api_key=os.getenv("OPENAI_API_KEY")
        )

    async def evaluate_changes(self, change_request: Dict[str, Any], 
                             original_context: Dict[str, Any]) -> UpdateStrategy:
        """Evaluate changes and determine strategy"""
        generator = outlines.generate.json(self.model, UpdateStrategy)
        prompt = EditPrompt.get_strategy_prompt(change_request, original_context)
        return generator(prompt)

    def enhance_generator_prompt(self, generator_type: str, original_prompt: str,
                               change_requirements: Dict[str, Any], 
                               existing_model: Dict[str, Any]) -> str:
        """Enhance existing generator prompts with change context"""
        return EditPrompt.enhance_generator_prompt(
            original_prompt,
            change_requirements,
            existing_model
        ) 
import os
from dotenv import load_dotenv
import outlines
from typing import Dict, Any, List
from models.edit_flow_models import UpdateStrategy
from models.base_models import UseCaseModel
from edit_flow.prompts.edit_prompt import EditPrompt

load_dotenv()

class EditFlowAI:
    def __init__(self):
        self.model = outlines.models.openai(
            os.getenv("MODEL_NAME"),
            api_key=os.getenv("OPENAI_API_KEY")
        )

    def evaluate_changes(self, change_request: Dict[str, Any], 
                        original_context: Dict[str, Any]) -> UpdateStrategy:
        """Evaluate changes and determine strategy"""
        generator = outlines.generate.json(self.model, UpdateStrategy)
        prompt = EditPrompt.get_strategy_prompt(change_request, original_context)
        return generator(prompt)

    def generate_updated_use_cases(self, app_info: Dict[str, Any], 
                                 existing_use_cases: List[Dict[str, Any]], 
                                 change_summary: List[str]) -> UseCaseModel:
        """Generate updated use cases incorporating changes"""
        generator = outlines.generate.json(self.model, UseCaseModel)
        prompt = EditPrompt.get_use_case_update_prompt(
            app_info,
            existing_use_cases,
            change_summary
        )
        return generator(prompt)
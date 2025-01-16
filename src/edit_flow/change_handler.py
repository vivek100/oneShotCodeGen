from pathlib import Path
from typing import Dict, Any
from ..models.edit_flow_models import ChangeRequest, ChangeStrategy
from .ai_integration import EditFlowAI
from ..utils.context_loader import ContextLoader

class ChangeHandler:
    def __init__(self, project_dir: Path):
        self.project_dir = project_dir
        self.context_loader = ContextLoader(project_dir)
        self.ai = EditFlowAI()
        self.original_context = self.context_loader.load_context()

    async def evaluate_change(self, change_request: ChangeRequest) -> ChangeStrategy:
        """
        Evaluate changes using AI and determine the appropriate strategy
        """
        try:
            strategy = await self.ai.evaluate_changes(
                change_request.model_dump(),
                self.original_context
            )
            
            # Save the strategy for reference
            self._save_strategy(strategy)
            
            return strategy
            
        except Exception as e:
            raise Exception(f"AI evaluation failed: {str(e)}")
    
    def _save_strategy(self, strategy: ChangeStrategy):
        """Save the strategy for future reference"""
        strategy_file = self.project_dir / ".app-generator" / "edit_strategy.json"
        strategy_file.parent.mkdir(exist_ok=True)
        
        with open(strategy_file, "w") as f:
            f.write(strategy.model_dump_json(indent=2)) 
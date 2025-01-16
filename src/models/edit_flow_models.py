from typing import List, Optional, Union, Literal, Dict, Any
from pydantic import BaseModel, ConfigDict

class ChangeRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    description: str
    affected_components: List[str] = []
    priority: Literal["high", "medium", "low"] = "medium"

class ChangeRequirements(BaseModel):
    model_config = ConfigDict(extra="forbid")
    description: str
    changes_needed: str
    existing_functionality: str

class PartialUpdateStrategy(BaseModel):
    model_config = ConfigDict(extra="forbid")
    strategy_type: Literal["partial_update"]
    reasoning: str
    required_generators: List[Literal["use_case", "entity", "mock_data", "interface"]]
    change_summary: Dict[str, ChangeRequirements]

class UpdateStrategy(BaseModel):
    model_config = ConfigDict(extra="forbid")
    strategy_type: Literal["full_regeneration", "use_case_update", "partial_update"]
    reasoning: str
    required_generators: List[str]
    change_summary: Optional[Dict[str, ChangeRequirements]]
    starter_prompt: Optional[str]  # For full regeneration 
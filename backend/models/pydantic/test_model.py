"""
Sample Pydantic model for testing structured generation
"""

from typing import List, Optional, Literal
from pydantic import BaseModel, ConfigDict, Field
import pydantic

class FeatureItem(BaseModel):
    """
    Item in a feature list
    """
    model_config = ConfigDict(extra="forbid", exclude_none=True)
    
    name: str = Field(..., description="Name of the feature")
    description: str = Field(..., description="Brief description of the feature")
    priority: Literal["high", "medium", "low"] = Field(..., description="Priority level of the feature")


class TestOutputModel(BaseModel):
    """
    Test model for structured generation
    """
    model_config = ConfigDict(extra="forbid", exclude_none=True)
    
    title: str = Field(..., description="Title of the response")
    summary: str = Field(..., description="Summary of the generated content")
    points: List[str] = Field(..., description="List of key points")
    features: List[FeatureItem] = Field(..., description="Detailed features list")
    conclusion: str = Field(..., description="Concluding remarks")
    
    # Optional field without using default=None to avoid OpenAI schema issues
    references: Optional[List[str]] = Field(description="Optional references or sources")


class TestModel(pydantic.BaseModel):
    model_config = ConfigDict(extra="forbid", exclude_none=True)
    required_field: str = Field(..., description="Description of the required field")
    title: str = Field(..., description="Title of the response")
    summary: str = Field(..., description="Summary of the generated content")
    points: List[str] = Field(..., description="List of key points")
    features: List[FeatureItem] = Field(..., description="Detailed features list")
    conclusion: str = Field(..., description="Concluding remarks")
    references: Optional[List[str]] = Field(description="Optional references or sources") 
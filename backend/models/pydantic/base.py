"""
Base utilities for Pydantic model loading and management.
Follows the guidelines for designing Pydantic models compatible with 
OpenAI structured generation.
"""

import os
import importlib.util
import inspect
import sys
import logging
from typing import Dict, Any, Optional, Type, TypeVar, Union
from pydantic import BaseModel

logger = logging.getLogger(__name__)
T = TypeVar('T', bound=BaseModel)

class PydanticModelLoader:
    """
    Utility class for loading and managing Pydantic models from Python files
    """
    
    @staticmethod
    def load_model_class(file_path: str, class_name: str) -> Optional[Type[BaseModel]]:
        """
        Dynamically load a Pydantic model class from a file path and class name
        
        Args:
            file_path: Path to the Python file containing the Pydantic model
            class_name: Name of the class within the file to load
            
        Returns:
            Pydantic model class or None if loading fails
        """
        try:
            # Get absolute path - remove any duplicate 'backend' in the path
            abs_path = os.path.abspath(file_path)
            # Fix path if it contains duplicate backend directories
            if '\\backend\\backend\\' in abs_path:
                abs_path = abs_path.replace('\\backend\\backend\\', '\\backend\\')
            
            # Check if file exists
            if not os.path.exists(abs_path):
                logger.error(f"Pydantic model file not found: {abs_path}")
                return None
            
            # Load the module
            module_name = os.path.basename(file_path).replace(".py", "")
            spec = importlib.util.spec_from_file_location(module_name, abs_path)
            if spec is None or spec.loader is None:
                logger.error(f"Failed to load spec for module: {module_name}")
                return None
            
            module = importlib.util.module_from_spec(spec)
            sys.modules[module_name] = module
            spec.loader.exec_module(module)
            
            # Get the class from the module
            if not hasattr(module, class_name):
                logger.error(f"Class {class_name} not found in {abs_path}")
                return None
            
            model_class = getattr(module, class_name)
            
            # Verify it's a Pydantic BaseModel
            if not inspect.isclass(model_class) or not issubclass(model_class, BaseModel):
                logger.error(f"{class_name} in {abs_path} is not a Pydantic BaseModel")
                return None
            
            return model_class
            
        except Exception as e:
            logger.error(f"Error loading Pydantic model: {e}")
            return None

    @staticmethod
    def load_model(model_name: str):
        """
        Alternative method to load a model by name only, for simpler usage scenarios
        """
        # Keep this method as a utility for future use if needed
        try:
            module = __import__(f'backend.models.pydantic.{model_name}', fromlist=[''])
            return getattr(module, model_name.title() + 'Model')
        except ImportError as e:
            logger.error(f"Pydantic model not found: {model_name}")
            return None
        except Exception as e:
            logger.error(f"Error loading Pydantic model {model_name}: {e}")
            return None
    
    @staticmethod
    def get_json_schema(model_class: Type[BaseModel]) -> Dict[str, Any]:
        """
        Get the JSON schema for a Pydantic model class
        
        Args:
            model_class: Pydantic model class
            
        Returns:
            JSON schema compatible with OpenAI structured generation
        """
        try:
            return model_class.model_json_schema()
        except Exception as e:
            logger.error(f"Error generating JSON schema from Pydantic model: {e}")
            return {} 
import logging
from typing import Dict, Any, Optional, Tuple, Type
import json
import uuid
import os

from db.database import database
from db.models import Prompt, Schema, OneShotExample, PydanticSchema
from models.pydantic.base import PydanticModelLoader
from pydantic import BaseModel

logger = logging.getLogger(__name__)

class PromptSchemaStore:
    """
    Central store for prompt templates, output/input schemas, and one-shot examples.
    Used by Step Executor, Replay Tool, and Flow compiler.
    """
    
    # Cache for loaded Pydantic model classes
    _pydantic_model_cache: Dict[str, Type[BaseModel]] = {}
    
    @staticmethod
    async def get_prompt_by_id(prompt_id: str) -> Optional[Dict[str, Any]]:
        """
        Get a prompt template by ID
        
        Args:
            prompt_id: ID of the prompt template
            
        Returns:
            Prompt template data or None if not found
        """
        query = Prompt.__table__.select().where(Prompt.id == prompt_id)
        result = await database.fetch_one(query)
        if result:
            return dict(result)
        return None
    
    @staticmethod
    async def get_schema_by_id(schema_id: str) -> Optional[Dict[str, Any]]:
        """
        Get an output schema by ID
        
        Args:
            schema_id: ID of the schema
            
        Returns:
            Schema data or None if not found
        """
        query = Schema.__table__.select().where(Schema.id == schema_id)
        result = await database.fetch_one(query)
        if result:
            return dict(result)
        return None
    
    @staticmethod
    async def get_pydantic_schema_by_id(pydantic_schema_id: str) -> Optional[Dict[str, Any]]:
        """
        Get a Pydantic schema by ID
        
        Args:
            pydantic_schema_id: ID of the Pydantic schema
            
        Returns:
            Pydantic schema data or None if not found
        """
        query = PydanticSchema.__table__.select().where(PydanticSchema.id == pydantic_schema_id)
        result = await database.fetch_one(query)
        if result:
            return dict(result)
        return None
    
    @staticmethod
    async def get_one_shot_by_id(one_shot_id: str) -> Optional[Dict[str, Any]]:
        """
        Get a one-shot example by ID
        
        Args:
            one_shot_id: ID of the one-shot example
            
        Returns:
            One-shot example data or None if not found
        """
        query = OneShotExample.__table__.select().where(OneShotExample.id == one_shot_id)
        result = await database.fetch_one(query)
        if result:
            return dict(result)
        return None
    
    @staticmethod
    async def get_step_assets(
        prompt_id: str, 
        schema_id: str, 
        one_shot_id: Optional[str] = None, 
        pydantic_schema_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Get all assets needed for a step execution
        
        Args:
            prompt_id: ID of the prompt template
            schema_id: ID of the output schema
            one_shot_id: Optional ID of the one-shot example
            pydantic_schema_id: Optional ID of the Pydantic schema
            
        Returns:
            Dict containing prompt_template, output_schema, and one_shot_example (if available)
        """
        assets = {}
        
        # Get prompt template
        prompt = await PromptSchemaStore.get_prompt_by_id(prompt_id)
        if prompt:
            assets["prompt_template"] = prompt["template"]
        else:
            raise ValueError(f"Prompt with ID {prompt_id} not found")
        
        # Get output schema (first try pydantic schema if available)
        if pydantic_schema_id:
            pydantic_schema = await PromptSchemaStore.get_pydantic_schema_by_id(pydantic_schema_id)
            if pydantic_schema:
                # Try to load the Pydantic model
                pydantic_model_class = await PromptSchemaStore.load_pydantic_model(
                    pydantic_schema["file_path"],
                    pydantic_schema["model_class_name"],
                    pydantic_schema_id
                )
                
                if pydantic_model_class:
                    # Get the JSON schema and use it
                    assets["output_schema"] = PydanticModelLoader.get_json_schema(pydantic_model_class)
                    assets["pydantic_model_class"] = pydantic_model_class
                else:
                    logger.warning(f"Failed to load Pydantic model, falling back to JSON schema")
        
        # Fallback to regular JSON schema if Pydantic schema wasn't loaded
        if "output_schema" not in assets:
            schema = await PromptSchemaStore.get_schema_by_id(schema_id)
            if schema:
                assets["output_schema"] = schema["schema_json"]
            else:
                raise ValueError(f"Schema with ID {schema_id} not found")
        
        # Get one-shot example if provided
        if one_shot_id:
            one_shot = await PromptSchemaStore.get_one_shot_by_id(one_shot_id)
            if one_shot:
                assets["one_shot_example"] = {
                    "input": one_shot["input_json"],
                    "output": one_shot["output_json"]
                }
        
        return assets
    
    @staticmethod
    async def load_pydantic_model(
        file_path: str, 
        model_class_name: str, 
        cache_key: str
    ) -> Optional[Type[BaseModel]]:
        """
        Load a Pydantic model from file and cache it
        
        Args:
            file_path: Path to the Python file with the model
            model_class_name: Name of the class to load
            cache_key: Key to use for caching
            
        Returns:
            Loaded Pydantic model class or None if loading fails
        """
        # Check cache first
        if cache_key in PromptSchemaStore._pydantic_model_cache:
            return PromptSchemaStore._pydantic_model_cache[cache_key]
        
        # Load the model
        model_class = PydanticModelLoader.load_model_class(file_path, model_class_name)
        
        # Cache it if loaded successfully
        if model_class:
            PromptSchemaStore._pydantic_model_cache[cache_key] = model_class
            
        return model_class
    
    @staticmethod
    async def create_prompt(name: str, template: str) -> str:
        """
        Create a new prompt template
        
        Args:
            name: Name of the prompt template
            template: Outlines/Jinja-style template text
            
        Returns:
            ID of the created prompt
        """
        prompt_id = str(uuid.uuid4())
        query = Prompt.__table__.insert().values(
            id=prompt_id,
            name=name,
            template=template
        )
        await database.execute(query)
        return prompt_id
    
    @staticmethod
    async def create_schema(name: str, schema_json: Dict[str, Any]) -> str:
        """
        Create a new output schema
        
        Args:
            name: Name of the schema
            schema_json: JSON schema definition
            
        Returns:
            ID of the created schema
        """
        schema_id = str(uuid.uuid4())
        query = Schema.__table__.insert().values(
            id=schema_id,
            name=name,
            schema_json=schema_json
        )
        await database.execute(query)
        return schema_id
    
    @staticmethod
    async def create_pydantic_schema(
        name: str, 
        file_path: str, 
        model_class_name: str, 
        description: Optional[str] = None
    ) -> str:
        """
        Create a new Pydantic schema reference
        
        Args:
            name: Name of the schema
            file_path: Path to the Python file
            model_class_name: Class name within the file
            description: Optional description
            
        Returns:
            ID of the created Pydantic schema
        """
        schema_id = str(uuid.uuid4())
        query = PydanticSchema.__table__.insert().values(
            id=schema_id,
            name=name,
            file_path=file_path,
            model_class_name=model_class_name,
            description=description
        )
        await database.execute(query)
        return schema_id
    
    @staticmethod
    async def create_one_shot(name: str, input_json: Dict[str, Any], output_json: Dict[str, Any], linked_step_id: Optional[str] = None) -> str:
        """
        Create a new one-shot example
        
        Args:
            name: Name of the one-shot example
            input_json: Example input data
            output_json: Example output data
            linked_step_id: Optional step this example is linked to
            
        Returns:
            ID of the created one-shot example
        """
        one_shot_id = str(uuid.uuid4())
        query = OneShotExample.__table__.insert().values(
            id=one_shot_id,
            name=name,
            input_json=input_json,
            output_json=output_json,
            linked_step_id=linked_step_id
        )
        await database.execute(query)
        return one_shot_id 
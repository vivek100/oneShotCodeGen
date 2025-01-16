import os
from dotenv import load_dotenv
import outlines
from typing import Dict, Any
from ..models.base_models import MockUserModel, UseCaseModel, EntityModel

load_dotenv()

def generate_mock_users(
    description: str, 
    use_case_model: UseCaseModel, 
    entity_model: EntityModel
) -> MockUserModel:
    """Generate mock users based on the application description, use cases, and entities."""
    model = outlines.models.openai(
        os.getenv("MODEL_NAME"),
        api_key=os.getenv("OPENAI_API_KEY")
    )
    generator = outlines.generate.json(model, MockUserModel)
    
    prompt = f"""
    Given the following application details, generate mock users for testing.
    The mock users should cover different roles and permissions needed for the use cases.
    
    App Description: {description}
    
    Use Cases:
    {use_case_model.model_dump_json(indent=2)}
    
    Entities:
    {entity_model.model_dump_json(indent=2)}

        Example:
        {{
            "mock_users": {{
                "records": {{
                    "headers": ["email", "password", "role"],
                    "rows": [
                        ["admin@example.com", "admin123", "admin"],
                        ["user@example.com", "user123", "user"]
                    ]
                }}
            }}
        }}

    Ensure:
    1. All entities needed for the use cases are created, please do not miss any entity. Ensure entities are correct and dont have multiple primary keys.
        - Following are the column headers for all entities for each column we need details for each of these keys, name is the column name key:
        "headers": ["name", "data_type", "is_primary", "is_nullable", "is_unique","default", "auto_increment", "is_foreign", "foreign_table", "foreign_column", "on_delete", "on_update"]
        - make sure "is_primary" is true for only one column in each entity, we can not have multiple primary keys
        - while defining foregin key relationships, if its a user id(type is uuid) field map it to profiles table id column. In mock data you can pass acutal email as user id, but dont get confused with the user id, we will map the correct user's id while creating the sql files. Just make sure the user with the email is present in mock users data.
        - Do not create emtpy columns in the entities
    2. All relationships between entities are properly defined, do not miss any relationship and make sure to reference the correct columns and column types match with the foreign entities.
    3. Don't add details for following default columns in the entities, later on while creating the tables we add columns to every table:
        "created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP",
        "updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP",
        "created_by UUID DEFAULT auth.uid()",  # Supabase's auth.uid() gets current user's UUID
    4. Mock users include at least one admin and one regular user, dont created mock data for profiles table as we update it while added users in user table
    5. Mock data follows proper foreign key relationships
        - in mock data you can pass acutal email as user id, we will map the correct user's id while creating the sql files. Just make sure the user with the email is present in mock users data.
        - Do not share mock data for profiles entity, we will update it while adding users in user table using mock users data.
    6. Realistic test data that covers various use cases
    7. We are using supabase so the users table is already created in the auth schema. 
    8. We also have the profiles(Do not create this entity) table already created with folowing columns,: id, email, full_name, created_at, updated_at(created_at and updated_at are auto generated columns, you dont need to add them in the mock data)
  
    """
    
    result = generator(prompt)
    return result  # Return the Pydantic model directly, not model_dump() 
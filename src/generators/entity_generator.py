import os
from dotenv import load_dotenv
import outlines
from typing import Dict, Any
from models.base_models import EntityModel, UseCaseModel

load_dotenv()

def generate_entities(description: str, use_case_model: UseCaseModel) -> EntityModel:
    """Generate entities based on the application description and use cases."""
    model = outlines.models.openai(
        os.getenv("MODEL_NAME"),
        api_key=os.getenv("OPENAI_API_KEY")
    )
    generator = outlines.generate.json(model, EntityModel)
    
    prompt = f"""
    Given the following application description and use cases, generate the database entities required.
    Each entity should have appropriate columns, relationships, and constraints.
    
    App Description: {description}
    
    Use Cases:
    {use_case_model.model_dump_json(indent=2)}

    Example:
    {{
        "entities": [
            {{
                "name": "expenses",
                "description": "Stores expense records",
                "columns": {{
                    "headers": ["name", "data_type", "is_primary", "is_nullable", "is_unique","default", "auto_increment", "is_foreign", "foreign_table", "foreign_column", "on_delete", "on_update"],
                    "rows": [
                        ["id", "uuid", true, false, true, "gen_random_uuid()", false, false, null, null, null, null],
                        ["amount", "float", false, false, false, null, false, false, null, null, null, null],
                        ["month", "date", false, false, false, null, false, false, null, null, null, null],
                        ["year", "integer", false, false, false, null, false, false, null, null, null, null],
                        ["category_id", "uuid", false, false, false, null, false, true, "categories", "id", "CASCADE", "CASCADE"],
                        ["user_id", "uuid", false, false, false, null, false, true, "profiles", "id", "CASCADE", "CASCADE"]
                    ]
                }},
                "relationships": {{
                    "headers": ["entity", "type", "description"],
                    "rows": [
                        ["categories", "many-to-one", "Each expense belongs to one category"],
                        ["profiles", "many-to-one", "Each expense belongs to one user"]
                    ]
                }},
                "indexes": {{
                    "headers": ["name", "columns", "is_unique", "is_full_text"],
                    "rows": [
                        ["idx_expense_category", "category_id", false, false],
                        ["idx_expense_user", "user_id", false, false]
                    ]
                }},
                "composite_primary_keys": null,
                "composite_unique_constraints": null,
                "check_constraints": ["amount >= 0", "extract(month from month) >= 1", "extract(month from month) <= 12", "year  >= 2000"],
                "partition_by": null
            }},
            {{
                "name": "categories",
                "description": "Stores expense categories",
                "columns": {{
                    "headers": ["name", "data_type", "is_primary", "is_nullable", "is_unique","default", "auto_increment", "is_foreign", "foreign_table", "foreign_column", "on_delete", "on_update"],
                    "rows": [
                        ["id","uuid",true,false,true,"gen_random_uuid()",false,false,null,null,null,null],
                        ["name","varchar",false,false,true,null,false,false,null,null,null,null],
                        ["description","text",false,true,false,null,false,false,null,null,null,null],
                    ]
                }},
                "relationships": {{
                    "headers": ["entity", "type", "description"],
                    "rows": []
                }},
                "indexes": {{
                    "headers": ["name", "columns", "is_unique", "is_full_text"],
                    "rows": [
                        ["idx_category_name", "name", true, false]
                    ]
                }},
                "composite_primary_keys": null,
                "composite_unique_constraints": null,
                "check_constraints": null,
                "partition_by": null
            }}
        ],
    }}

    Ensure:
    1. All entities needed for the use cases are created, please do not miss any entity. Ensure entities are correct and dont have multiple columns with is_primary as set to true.
        - Following are the column headers for all entities for each column we need details for each of these keys, name is the column name key:
        "headers": ["name", "data_type", "is_primary", "is_nullable", "is_unique","default", "auto_increment", "is_foreign", "foreign_table", "foreign_column", "on_delete", "on_update"]
        - Always add an id column with "is_primary" set to true for each entity, also ensure other columns that are not id should not have "is_primary" set to true instead use is_unique constraint if needed.
        - while defining foregin key relationships, if its a user id(type is uuid) field map it to profiles table id column. In mock data you can pass acutal email as user id, but dont get confused with the user id, we will map the correct user's id while creating the sql files. Just make sure the user with the email is present in mock users data.
        - Do not create emtpy columns in the entities
    2. All relationships between entities are properly defined, do not miss any relationship and make sure to reference the correct columns and column types match with the foreign entities.
    3. We are using supabase so the users table is already created in the auth schema. 
    4. We also have the profiles(Do not create this entity) table already created with folowing columns,: id, email, full_name, created_at, updated_at(created_at and updated_at are auto generated columns, you dont need to add them in the mock data)
    5. Do not create emtpy columns in the entities
    6. For check constraints, make sure column data type is correct and the constraints are correct.
    7. Do not use reserved keywaords in postgres like "limit", "month", "year" etc. as column names add a prefix to them like "budget_limit", "budget_month", "budget_year" etc.
    8. if for a app you feel there is a need to track user details like name, phone number, address, etc. add a "user_details" table and add the columns to the entity. Do not use profiles table, profile table is only for tracking logged in users details.
    """
    
    result = generator(prompt)
    return result 
import os
from dotenv import load_dotenv
import outlines
from typing import Dict, Any
from ..models.base_models import ApplicationDomain

load_dotenv()

def generate_domain(description: str) -> Dict[str, Any]:
    """
    Generate application domain including use cases, data entities, and mock data.
    """
    model = outlines.models.openai(
        os.getenv("MODEL_NAME"),
        api_key=os.getenv("OPENAI_API_KEY")
    )
    generator = outlines.generate.json(model, ApplicationDomain)
    
    prompt = f"""
    You are an expert system architect. Generate the domain model for an application based on the following description.
    Include comprehensive use cases, data entities, and mock data for testing.
    The entities are created to be used in supabase and postgres, so make sure to use the correct data types and constraints. Do not create mutlitple primary keys in a single entity.

    App Description: {description}

    Example:
    {{
        "title": "Expense Tracker",
        "description": "Application to track personal and business expenses",
        "use_cases": [
            {{
                "name": "Track Expenses",
                "description": "Record and categorize daily expenses"
            }}
        ],
        "entities": [
            {{
                "name": "expenses",
                "description": "Stores expense records",
                "columns": {{
                    "headers": [
                        "name", "data_type", "is_primary", "is_nullable", "is_unique",
                        "default", "auto_increment", "is_foreign", "foreign_table",
                        "foreign_column", "on_delete", "on_update"
                    ],
                    "rows": [
                        ["id", "uuid", true, false, true, "gen_random_uuid()", false, false, null, null, null, null],
                        ["amount", "float", false, false, false, null, false, false, null, null, null, null],
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
                "check_constraints": ["amount >= 0"],
                "partition_by": null
            }},
            {{
                "name": "categories",
                "description": "Stores expense categories",
                "columns": {{
                    "headers": [
                        "name", "data_type", "is_primary", "is_nullable", "is_unique",
                        "default", "auto_increment", "is_foreign", "foreign_table",
                        "foreign_column", "on_delete", "on_update"
                    ],
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
        "mock_users": {{
            "records": {{
                "headers": ["email", "password", "role"],
                "rows": [
                    ["admin@example.com", "admin123", "admin"],
                    ["user@example.com", "user123", "user"]
                ]
            }}
        }},
        "mock_data": [
            {{
                "entity_name": "expenses",
                "records": {{
                    "headers": ["id", "amount", "category_id", "user_id"],
                    "rows": [
                        ["uuid-1", 100.50, "cat-1", "user@example.com"],
                        ["uuid-2", 50.25, "cat-2", "admin@example.com"]
                    ]
                }},
                "dependencies": ["categories"]
            }}
        ]
    }}

    Generate a complete domain model for: {description}
    Ensure:
    1. All entities needed for the use cases are created, please do not miss any entity. Ensure entities are correct and dont have multiple primary keys.
        - Following are the column headers for all entities for each column we need details for each of these keys, name is the column name key:
        "headers": ["name", "data_type", "is_primary", "is_nullable", "is_unique","default", "auto_increment", "is_foreign", "foreign_table", "foreign_column", "on_delete", "on_update"]
        - make sure "is_primary" is true for only one column in each entity, we can not have multiple primary keys
        - while defining foregin key relationships, if its a user id(type is uuid) field map it to profiles table id column. In mock data you can pass acutal email as user id, but dont get confused with the user id, we will map the correct user's id while creating the sql files. Just make sure the user with the email is present in mock users data.
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
    return result.model_dump() 
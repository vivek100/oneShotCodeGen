from pathlib import Path
from typing import Dict, Any
import json

class ContextLoader:
    def __init__(self, project_dir: Path):
        self.project_dir = project_dir
    
    def load_context(self) -> Dict[str, Any]:
        """Load all relevant context from the project directory"""
        context = {}
        
        # Load JSON files
        json_files = [
            "use_cases.json",
            "domain_model.json",
            "interface_model.json"
        ]
        
        # Load raw data from JSON files
        raw_data = {}
        for file_name in json_files:
            file_path = self.project_dir / file_name
            if file_path.exists():
                with open(file_path) as f:
                    key = file_name.replace(".json", "")
                    raw_data[key] = json.load(f)

        # Create structured context with explanations
        context["context_description"] = """
        This context represents a complete application specification including its use cases, 
        database structure, interface design, and database views. This information describes 
        an existing application that needs to be modified.
        """

        # Add app information
        if "use_cases" in raw_data:
            context["application"] = {
                "name": raw_data["use_cases"].get("title", ""),
                "description": raw_data["use_cases"].get("description", ""),
            }

        # Add use cases with explanation
        if "use_cases" in raw_data:
            context["use_cases"] = {
                "description": "These use cases define the core functionality and features of the application",
                "items": raw_data["use_cases"].get("use_cases", [])
            }

        # Add entities (database structure) with explanation
        if "domain_model" in raw_data:
            context["database_structure"] = {
                "description": """
                The database structure is defined using the following conventions:
                1. Each entity represents a database table
                2. Columns are defined with their:
                   - name: The column identifier
                   - data_type: PostgreSQL data type (uuid, varchar, text, timestamp, etc.)
                   - constraints: primary key, nullable, unique, etc.
                   - relationships: foreign keys and their references
                3. Relationships follow standard database conventions:
                   - one-to-many: A single record relates to multiple records in another table
                   - many-to-one: Multiple records relate to a single record in another table
                   - one-to-one: A single record relates to exactly one record in another table
                4. Each table includes standard audit fields (created_at, updated_at) by default
                5. Foreign keys use CASCADE for both UPDATE and DELETE operations
                """,
                "entities": raw_data["domain_model"].get("entities", [])
            }

        # Add interface design with explanation
        if "interface_model" in raw_data:
            context["interface_design"] = {
                "description": """
                The interface design follows these patterns:
                1. Pages can be of three types:
                   - dashboard: For overview and analytics
                   - resource: For CRUD operations on database tables
                   - custom: For specialized functionality
                2. Components available:
                   - cards: Display aggregate values
                   - charts: Visualize data (line, bar, pie)
                   - tables: List and manage data
                   - forms: Create and edit data
                3. Data providers:
                   - Direct table access: Uses table name as provider
                   - Views: Uses view name as provider for complex data
                4. Field types:
                   - text: For text input
                   - number: For numeric input
                   - select: For dropdowns (static or dynamic options)
                   - date: For date input
                """,
                "pages": raw_data["interface_model"].get("pages", [])
            }

        # Add database views with explanation
        if "interface_model" in raw_data and "views" in raw_data["interface_model"]:
            context["database_views"] = {
                "description": """
                Database views follow these conventions:
                1. View names use snake_case and are descriptive
                2. Column references always use table aliases
                3. Proper JOIN syntax is used with explicit conditions
                4. Aggregations include proper GROUP BY clauses
                5. Date functions use PostgreSQL standard functions
                6. Views are used when:
                   - Complex aggregations are needed
                   - Data from multiple tables must be combined
                   - Custom calculations are required
                   - Time-based analysis is needed
                """,
                "views": raw_data["interface_model"].get("views", [])
            }

        return context
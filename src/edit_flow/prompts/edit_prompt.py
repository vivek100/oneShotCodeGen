from typing import Dict, Any, List
import json

class EditPrompt:
    @staticmethod
    def get_strategy_prompt(change_request: Dict[str, Any], original_context: Dict[str, Any]) -> str:
        return f"""
        You are tasked with evaluating a change request for an existing application. Your goal is to determine the most appropriate strategy for implementing the requested changes based on the provided context.

        Original Application Context:
        {original_context}

        Change Request:
        {change_request}

        Based on the information provided, you need to decide between the following two strategies:
        1. **Use Case Update**: Choose this option if the requested changes can be seamlessly integrated into the existing application as new use cases, enhancing its functionality without disrupting current features or requiring significant architectural changes.
        2. **Full Regeneration**: Select this option if the requested changes involve substantial modifications that necessitate a complete redesign of the application, including all use cases, entities, and interface components, effectively creating a new application from scratch.

        Example Response for Use Case Update:
        {{
            "strategy_type": "use_case_update",
            "reasoning": "The requested changes can be integrated as new use cases without affecting existing functionality.",
            "change_summary": [
                "Add a new use case for tracking recurring expenses.",
                "Delete the old use case for tracking one-time expenses."
            ]
        }}

        Example Response for Full Regeneration:
        {{
            "strategy_type": "full_regeneration",
            "reasoning": "The requested changes require a complete redesign of the application to accommodate new features and functionalities.",
            "starter_prompt": "Create a comprehensive expense tracking application with advanced features including recurring expenses, budget tracking, and detailed reporting.",
            "change_summary": null
        }}

        When determining the strategy, consider the following:
        1. **Scope of Changes**: Are the changes limited to specific features (indicating a use case update), or do they involve fundamental changes to the application's architecture (indicating a full regeneration)?
        2. **Impact on Existing Functionality**: Will the changes seamlessly integrate with current features without disruption (favoring a use case update), or will they necessitate a complete overhaul of existing functionalities (favoring full regeneration)?
        3. **Dependencies Between Components**: Are there existing interdependencies that could complicate the integration of new features (suggesting a need for full regeneration), or can the new features be added independently (suggesting a use case update)?
        4. **Data Model Modifications**: Will the changes require significant alterations to the existing data model (indicating a full regeneration), or can they be accommodated within the current model (indicating a use case update)?
        """

    @staticmethod
    def get_use_case_update_prompt(app_info: Dict[str, Any], existing_use_cases: List[Dict[str, Any]], 
                                  change_summary: List[str]) -> str:
        """Generate prompt for updating use cases"""
        return f"""
        Given the following existing application and its use cases, enhance it with new functionality.
        Keep all existing use cases and add or modify use cases to support the requested changes.
        
        Existing Application:
        Title: {app_info.get('name')}
        Description: {app_info.get('description')}
        
        Existing Use Cases:
        {json.dumps(existing_use_cases, indent=2)}
        
        Required Changes:
        {json.dumps(change_summary, indent=2)}
        
        Important:
        1. Preserve all existing use cases that are still relevant
        2. Add new use cases to support the requested changes
        3. Modify existing use cases if they need updates
        4. Ensure all use cases are properly described
        5. Maintain consistency in naming and description style
        6. Create mutual exclusivity between use cases
        
        Example:
        {{
            "title": "{app_info.get('name')}",
            "description": "{app_info.get('description')}",
            "use_cases": [
                {{
                    "name": "Track Expenses",
                    "description": "Record and categorize daily expenses"
                }},
                {{
                    "name": "New Feature",
                    "description": "Description of new functionality"
                }}
            ]
        }}
        """ 
from typing import Dict, Any

class EditPrompt:
    @staticmethod
    def get_strategy_prompt(change_request: Dict[str, Any], original_context: Dict[str, Any]) -> str:
        return f"""
        Analyze the following change request and determine the most appropriate update strategy.
        
        Original Application Context:
        {original_context}
        
        Change Request:
        {change_request}
        
        Example Response for Partial Update:
        {{
            "strategy_type": "partial_update",
            "reasoning": "The requested changes affect specific components without requiring full regeneration",
            "required_generators": ["entity", "interface"],
            "change_summary": {{
                "entity": {{
                    "description": "Add receipt storage capability",
                    "changes_needed": "Add receipt_url field to expenses table",
                    "existing_functionality": "Current expenses table tracks basic expense details"
                }},
                "interface": {{
                    "description": "Add file upload interface",
                    "changes_needed": "Add file upload component to expense form",
                    "existing_functionality": "Current form handles basic expense details"
                }}
            }}
        }}

        Example Response for Full Regeneration:
        {{
            "strategy_type": "full_regeneration",
            "reasoning": "Changes require significant architectural modifications",
            "required_generators": ["use_case", "entity", "mock_data", "interface"],
            "starter_prompt": "Create an expense tracking application with...",
            "change_summary": null
        }}

        Determine the most appropriate strategy considering:
        1. Scope of changes
        2. Impact on existing functionality
        3. Dependencies between components
        4. Data model modifications
        """

    @staticmethod
    def enhance_generator_prompt(original_prompt: str, change_requirements: Dict[str, Any], 
                               existing_model: Dict[str, Any]) -> str:
        """Enhance existing generator prompts with change context"""
        return f"""
        Consider the following change requirements while maintaining existing functionality.
        
        Existing Model:
        {existing_model}
        
        Required Changes:
        Description: {change_requirements.get('description')}
        Changes Needed: {change_requirements.get('changes_needed')}
        Existing Functionality: {change_requirements.get('existing_functionality')}
        
        Original Prompt:
        {original_prompt}
        
        Important:
        1. Preserve all existing functionality
        2. Add only the requested changes
        3. Maintain consistency with existing features
        4. Ensure backward compatibility
        """ 
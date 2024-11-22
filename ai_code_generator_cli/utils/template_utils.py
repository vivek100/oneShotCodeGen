def load_template(template_path: str) -> str:
    """Load and process template file by escaping template placeholders."""
    try:
        with open(template_path, 'r') as f:
            template_content = f.read()
            
        # First, escape all single curly braces to double curly braces
        template_content = template_content.replace('{', '{{').replace('}', '}}')
        
        # Then, convert back single curly braces for LangChain variables
        langchain_vars = [
            "functional_requirements",
            "technical_requirements",
            "backend_code",
            "frontend_code",
            "backend_code_templates",
            "frontend_code_templates"
        ]
        
        # Replace double curly braces with single ones for LangChain variables
        for var in langchain_vars:
            template_content = template_content.replace(
                f"{{{{{var}}}}}",  # Matches {{functional_requirements}}
                f"{{{var}}}"       # Replaces with {functional_requirements}
            )
            
        return template_content
    except Exception as e:
        raise ValueError(f"Error loading template from {template_path}: {str(e)}")
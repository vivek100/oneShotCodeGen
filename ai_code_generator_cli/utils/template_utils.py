def load_template(template_path: str) -> str:
    """Load and process template file by escaping template placeholders."""
    try:
        with open(template_path, 'r') as f:
            template_content = f.read()
            
        # Define LangChain variables that should remain as single braces
        langchain_vars = [
            "functional_requirements",
            "technical_requirements",
            "backend_code",
            "frontend_code",
            "backend_code_templates",
            "frontend_code_templates"
        ]
        
        # First, escape any LangChain variables with a special marker
        for var in langchain_vars:
            template_content = template_content.replace(
                f"{{{var}}}",
                f"__LC_VAR__{var}__"
            )
        
        # Now escape all remaining curly braces
        template_content = template_content.replace('{', '{{').replace('}', '}}')
        
        # Finally, restore LangChain variables
        for var in langchain_vars:
            template_content = template_content.replace(
                f"__LC_VAR__{var}__",
                f"{{{var}}}"
            )
            
        return template_content
    except Exception as e:
        raise ValueError(f"Error loading template from {template_path}: {str(e)}")
"""
Simplified Template Rendering Example Script

This script demonstrates Jinja2 template rendering without dependencies on the full app.
"""

import jinja2
import json
from typing import Dict, Any, Optional

class SimpleTemplateRenderer:
    """
    Simple version of the TemplateRenderer class for demonstration purposes.
    """
    
    @staticmethod
    def _json_filter(value):
        """Filter to convert a Python object to a formatted JSON string"""
        return json.dumps(value, indent=2)
    
    @staticmethod
    def render_template(template_text: str, context: Dict[str, Any]) -> str:
        """Render a Jinja2 template with the provided context"""
        # Create Jinja2 environment
        env = jinja2.Environment(
            autoescape=False,
            trim_blocks=True,
            lstrip_blocks=True
        )
        
        # Add custom filters
        env.filters['json'] = SimpleTemplateRenderer._json_filter
        
        # Parse and render the template
        template = env.from_string(template_text)
        return template.render(**context)

def print_separator():
    """Print a separator line for better readability"""
    print("\n" + "-" * 80 + "\n")

def basic_example():
    """Basic template with simple variable substitution"""
    print("Example 1: Basic Variables")
    
    template = """
    You are a helpful assistant named {{ assistant_name }}.
    
    User query: {{ query }}
    
    Please provide a response to the user's query.
    """
    
    context = {
        "assistant_name": "AI ERP Assistant",
        "query": "How do I create a new app configuration?"
    }
    
    rendered = SimpleTemplateRenderer.render_template(template, context)
    print(rendered)

def conditional_example():
    """Template with conditional logic"""
    print("Example 2: Conditionals")
    
    template = """
    You are an app configuration assistant.
    
    {% if request_type == "create" %}
    Instructions for creating a new {{ app_type }} app:
    1. Define core components
    2. Configure user interface
    3. Set up data models
    {% elif request_type == "edit" %}
    Instructions for editing an existing {{ app_type }} app:
    1. Identify components to modify
    2. Make requested changes
    3. Validate modifications
    {% else %}
    Please specify whether you want to create or edit an app.
    {% endif %}
    """
    
    create_context = {
        "request_type": "create",
        "app_type": "web"
    }
    
    print("Create Scenario:")
    rendered_create = SimpleTemplateRenderer.render_template(template, create_context)
    print(rendered_create)

def json_example():
    """Template using the json filter for data formatting"""
    print("Example 3: JSON Formatting")
    
    template = """
    You are tasked with analyzing the following data:
    
    {{ data | json }}
    
    Please explain the structure.
    """
    
    context = {
        "data": {
            "entities": [
                {"id": 1, "name": "User", "attributes": ["name", "email"]},
                {"id": 2, "name": "Product", "attributes": ["title", "price"]}
            ],
            "relationships": [
                {"source": "User", "target": "Product", "type": "purchases"}
            ]
        }
    }
    
    rendered = SimpleTemplateRenderer.render_template(template, context)
    print(rendered)

def loop_example():
    """Template with loops for iterating over lists"""
    print("Example 4: Loops")
    
    template = """
    Process these components:
    
    {% for component in components %}
    Component {{ loop.index }}: {{ component.name }}
    - Type: {{ component.type }}
    - Priority: {{ component.priority }}
    {% endfor %}
    """
    
    context = {
        "components": [
            {
                "name": "Login Form",
                "type": "authentication",
                "priority": "high"
            },
            {
                "name": "Dashboard",
                "type": "visualization",
                "priority": "medium"
            }
        ]
    }
    
    rendered = SimpleTemplateRenderer.render_template(template, context)
    print(rendered)

if __name__ == "__main__":
    print("SIMPLE JINJA2 TEMPLATE EXAMPLES")
    print_separator()
    
    # Run examples
    basic_example()
    print_separator()
    
    conditional_example()
    print_separator()
    
    json_example()
    print_separator()
    
    loop_example()
    print_separator()
    
    print("All examples completed!") 
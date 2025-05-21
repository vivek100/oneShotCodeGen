"""
Template Rendering Example Script

This script demonstrates how to use the TemplateRenderer class to render
different types of Jinja2 templates for prompt generation.
"""

import sys
import os
import json

# Add the parent directory to sys.path to import the core modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from core.template_renderer import TemplateRenderer

def print_separator():
    """Print a separator line for better readability"""
    print("\n" + "-" * 80 + "\n")

def basic_template_example():
    """Basic template with simple variable substitution"""
    print("Example 1: Basic Template")
    
    template = """
    You are a helpful assistant named {{ assistant_name }}.
    
    User query: {{ query }}
    
    Please provide a response to the user's query.
    """
    
    context = {
        "assistant_name": "AI ERP Assistant",
        "query": "How do I create a new app configuration?"
    }
    
    rendered = TemplateRenderer.render_template(template, context)
    print(rendered)

def conditional_template_example():
    """Template with conditional logic"""
    print("Example 2: Conditional Template")
    
    template = """
    You are an app configuration assistant.
    
    User request: {{ request_type }} a {{ app_type }} app
    
    {% if request_type == "create" %}
    Instructions for creating a new {{ app_type }} app:
    1. Define core components
    2. Configure user interface
    3. Set up data models
    4. Add business logic
    {% elif request_type == "edit" %}
    Instructions for editing an existing {{ app_type }} app:
    1. Identify components to modify
    2. Make requested changes
    3. Validate modifications
    4. Update configuration
    {% else %}
    Please specify whether you want to create or edit an app.
    {% endif %}
    """
    
    # Create scenario
    create_context = {
        "request_type": "create",
        "app_type": "web"
    }
    
    rendered_create = TemplateRenderer.render_template(template, create_context)
    print("Create Scenario:")
    print(rendered_create)
    print_separator()
    
    # Edit scenario
    edit_context = {
        "request_type": "edit",
        "app_type": "mobile"
    }
    
    rendered_edit = TemplateRenderer.render_template(template, edit_context)
    print("Edit Scenario:")
    print(rendered_edit)

def loop_template_example():
    """Template with loops and list processing"""
    print("Example 3: Loop Template")
    
    template = """
    You need to analyze the following components:
    
    {% for component in components %}
    Component {{ loop.index }}: {{ component.name }}
    - Type: {{ component.type }}
    - Priority: {{ component.priority }}
    {% if component.description %}
    - Description: {{ component.description }}
    {% endif %}
    {% endfor %}
    
    Please provide recommendations for improving these components.
    """
    
    context = {
        "components": [
            {
                "name": "Login Form",
                "type": "authentication",
                "priority": "high",
                "description": "User authentication form with email and password"
            },
            {
                "name": "Dashboard",
                "type": "visualization",
                "priority": "medium"
            },
            {
                "name": "Settings Panel",
                "type": "configuration",
                "priority": "low",
                "description": "User preferences and app settings"
            }
        ]
    }
    
    rendered = TemplateRenderer.render_template(template, context)
    print(rendered)

def json_filter_example():
    """Template using the json filter for data formatting"""
    print("Example 4: JSON Filter")
    
    template = """
    You are tasked with analyzing the following data structure:
    
    {{ data | json }}
    
    Please explain the relationships between the entities shown.
    """
    
    context = {
        "data": {
            "entities": [
                {"id": 1, "name": "User", "attributes": ["id", "name", "email"]},
                {"id": 2, "name": "Product", "attributes": ["id", "title", "price", "stock"]}
            ],
            "relationships": [
                {"source": "User", "target": "Product", "type": "purchases"}
            ]
        }
    }
    
    rendered = TemplateRenderer.render_template(template, context)
    print(rendered)

def full_prompt_example():
    """Demonstrating the complete prompt building process"""
    print("Example 5: Complete Prompt Building")
    
    template = """
    You are given the following input:
    
    {{ input_data | json }}
    
    Based on this information, please generate a configuration for a {{ input_data.app_type }} application.
    Include all necessary components and settings.
    """
    
    input_data = {
        "app_type": "e-commerce",
        "features": ["product catalog", "shopping cart", "checkout", "user accounts"],
        "theme": "modern",
        "branding": {
            "name": "ShopEasy",
            "colors": {
                "primary": "#3498db",
                "secondary": "#2ecc71"
            }
        }
    }
    
    system_message = "You are an AI ERP configuration assistant that helps users create application configurations."
    
    one_shot_example = {
        "input": {
            "app_type": "blog",
            "features": ["posts", "comments", "categories", "search"],
            "theme": "minimal",
            "branding": {
                "name": "BlogMaster",
                "colors": {
                    "primary": "#9b59b6",
                    "secondary": "#f1c40f"
                }
            }
        },
        "output": {
            "config": {
                "app_name": "BlogMaster",
                "theme": "minimal",
                "components": [
                    {"type": "post_list", "settings": {"show_thumbnails": True}},
                    {"type": "comment_section", "settings": {"moderation": True}},
                    {"type": "category_sidebar", "settings": {"collapsible": True}},
                    {"type": "search_bar", "settings": {"autocomplete": True}}
                ],
                "styling": {
                    "primary_color": "#9b59b6",
                    "secondary_color": "#f1c40f"
                }
            }
        }
    }
    
    full_prompt = TemplateRenderer.build_full_prompt(
        template_text=template,
        input_data=input_data,
        system_message=system_message,
        one_shot_example=one_shot_example
    )
    
    print(full_prompt)

if __name__ == "__main__":
    print("JINJA2 TEMPLATE RENDERER EXAMPLES")
    print_separator()
    
    # Run all examples
    basic_template_example()
    print_separator()
    
    conditional_template_example()
    print_separator()
    
    loop_template_example()
    print_separator()
    
    json_filter_example()
    print_separator()
    
    full_prompt_example()
    print_separator()
    
    print("All examples completed!") 
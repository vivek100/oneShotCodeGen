import unittest
import json
from core.template_renderer import TemplateRenderer

class TestTemplateRenderer(unittest.TestCase):
    """Test cases for the TemplateRenderer class"""
    
    def test_simple_variable_rendering(self):
        """Test rendering a template with simple variables"""
        template = "Hello, {{ name }}! Welcome to {{ app_name }}."
        context = {"name": "User", "app_name": "AI ERP"}
        
        result = TemplateRenderer.render_template(template, context)
        
        self.assertEqual(result, "Hello, User! Welcome to AI ERP.")
    
    def test_json_filter(self):
        """Test the json filter for pretty-printing objects"""
        template = "Data: {{ data | json }}"
        context = {"data": {"key1": "value1", "key2": 123}}
        
        result = TemplateRenderer.render_template(template, context)
        expected = f"Data: {json.dumps(context['data'], indent=2)}"
        
        self.assertEqual(result, expected)
    
    def test_conditional_rendering(self):
        """Test conditional rendering with if/else statements"""
        template = """
        {% if mode == 'create' %}
        Create a new configuration
        {% elif mode == 'update' %}
        Update the existing configuration
        {% else %}
        View the configuration
        {% endif %}
        """
        
        # Test create mode
        context_create = {"mode": "create"}
        result_create = TemplateRenderer.render_template(template, context_create)
        self.assertIn("Create a new configuration", result_create)
        
        # Test update mode
        context_update = {"mode": "update"}
        result_update = TemplateRenderer.render_template(template, context_update)
        self.assertIn("Update the existing configuration", result_update)
        
        # Test default case
        context_default = {"mode": "view"}
        result_default = TemplateRenderer.render_template(template, context_default)
        self.assertIn("View the configuration", result_default)
    
    def test_loop_rendering(self):
        """Test rendering loops with for statements"""
        template = """
        Items:
        {% for item in items %}
        - {{ item.name }}: {{ item.value }}
        {% endfor %}
        """
        
        context = {
            "items": [
                {"name": "Item 1", "value": 100},
                {"name": "Item 2", "value": 200},
                {"name": "Item 3", "value": 300}
            ]
        }
        
        result = TemplateRenderer.render_template(template, context)
        
        self.assertIn("- Item 1: 100", result)
        self.assertIn("- Item 2: 200", result)
        self.assertIn("- Item 3: 300", result)
    
    def test_error_handling(self):
        """Test handling of undefined variables"""
        template = "Hello, {{ undefined_var }}!"
        context = {}
        
        with self.assertRaises(ValueError):
            TemplateRenderer.render_template(template, context)
    
    def test_full_prompt_building(self):
        """Test building a full prompt with system message and one-shot example"""
        template = "Process the following input: {{ input_data | json }}"
        input_data = {"query": "Create a new app", "parameters": {"type": "web"}}
        system_message = "You are an AI assistant."
        one_shot_example = {
            "input": {"query": "Create a mobile app", "parameters": {"type": "mobile"}},
            "output": {"app_type": "mobile", "components": ["screen1", "screen2"]}
        }
        
        result = TemplateRenderer.build_full_prompt(
            template_text=template,
            input_data=input_data,
            system_message=system_message,
            one_shot_example=one_shot_example
        )
        
        # Check that all parts are included
        self.assertIn("You are an AI assistant.", result)
        self.assertIn("Example Input:", result)
        self.assertIn("Example Output:", result)
        self.assertIn("Process the following input:", result)
        self.assertIn('"query": "Create a new app"', result)
    
    def test_fallback_on_template_error(self):
        """Test the fallback mechanism when template rendering fails"""
        # This template has a syntax error (missing closing brace)
        template = "Hello, {{ name! Welcome."
        input_data = {"name": "User"}
        system_message = "You are an AI assistant."
        
        # The build_full_prompt should not raise an exception
        result = TemplateRenderer.build_full_prompt(
            template_text=template,
            input_data=input_data,
            system_message=system_message
        )
        
        # Check that the fallback contains the system message and input data
        self.assertIn("You are an AI assistant.", result)
        self.assertIn('"name": "User"', result)

if __name__ == "__main__":
    unittest.main() 
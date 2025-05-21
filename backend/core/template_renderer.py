import jinja2
import json
import logging
from typing import Dict, Any, Optional, Tuple
from datetime import datetime, date, timezone, UTC

logger = logging.getLogger(__name__)

class DateTimeEncoder(json.JSONEncoder):
    """
    Custom JSON encoder that handles datetime and date objects
    """
    def default(self, obj):
        if isinstance(obj, (datetime, date)):
            return obj.isoformat()
        return super().default(obj)

class TemplateRenderer:
    """
    Renders Jinja2 templates with support for JSON processing.
    Used for prompt templates in the agent workflow system.
    """
    
    @staticmethod
    def _json_filter(value):
        """
        Filter to convert a Python object to a formatted JSON string
        Handles datetime objects by using the custom encoder
        """
        return json.dumps(value, indent=2, cls=DateTimeEncoder)
    
    @staticmethod
    def _pretty_print_filter(value):
        """
        Filter to pretty print a value based on its type
        """
        if isinstance(value, (dict, list)):
            return json.dumps(value, indent=2, cls=DateTimeEncoder)
        elif isinstance(value, (datetime, date)):
            return value.isoformat()
        return str(value)
    
    @staticmethod
    def render_template(template_text: str, context: Dict[str, Any]) -> str:
        """
        Render a Jinja2 template with the provided context
        
        Args:
            template_text: Jinja2 template text
            context: Dictionary of data to render the template with
            
        Returns:
            Rendered template as a string
        """
        # Create Jinja2 environment
        env = jinja2.Environment(
            autoescape=False,
            trim_blocks=True,
            lstrip_blocks=True
        )
        
        # Add custom filters
        env.filters['json'] = TemplateRenderer._json_filter
        env.filters['pretty'] = TemplateRenderer._pretty_print_filter
        
        # Parse and render the template
        try:
            template = env.from_string(template_text)
            rendered = template.render(**context)
            return rendered
        except jinja2.exceptions.TemplateSyntaxError as e:
            error_msg = f"Template syntax error: {str(e)}"
            logger.error(error_msg)
            raise ValueError(error_msg)
        except jinja2.exceptions.UndefinedError as e:
            error_msg = f"Template variable error: {str(e)}"
            logger.error(error_msg)
            raise ValueError(error_msg)
        except Exception as e:
            error_msg = f"Error rendering template: {str(e)}"
            logger.error(error_msg)
            raise ValueError(error_msg)
    
    @staticmethod
    def build_full_prompt(
        template_text: str,
        input_data: Dict[str, Any],
        system_message: str,
        one_shot_example: Optional[Dict[str, Any]] = None
    ) -> Tuple[str, Optional[str]]:
        """
        Build a complete prompt using template, system message, one-shot example, and input data
        
        Returns:
            Tuple containing:
                - Complete rendered prompt as a string
                - Optional error message (None if no error)
        """
        # Start with system message
        full_prompt = f"{system_message}\n\n"

        try:
            rendered_template = TemplateRenderer.render_template(template_text, input_data)
            logger.debug(f"Input data for template: {json.dumps(input_data)}")
            logger.debug(f"Rendered template: {rendered_template}")
            full_prompt += rendered_template

            if one_shot_example:
                full_prompt += f"\n\nOne-Shot Example:\n"
                full_prompt += f"\n{json.dumps(one_shot_example['output'], indent=2)}\n\n"

            return full_prompt, None  # ✅ no error

        except ValueError as e:
            logger.warning(f"Template rendering failed: {str(e)}. Falling back to simple JSON prompt.")
            fallback_prompt = f"{full_prompt}Input:\n{json.dumps(input_data, indent=2)}\n\n"
            return fallback_prompt, str(e)  # ✅ return fallback + error message

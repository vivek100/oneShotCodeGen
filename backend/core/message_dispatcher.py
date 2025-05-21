import logging
from typing import Optional, Dict, List, Literal, Any
from datetime import datetime, date, timezone, UTC
import uuid
import json

from db.database import database
from db.models import Message
from core.websocket_manager import manager
from core.template_renderer import TemplateRenderer, DateTimeEncoder

logger = logging.getLogger(__name__)

# Fallback templates for different message types
FALLBACK_TEMPLATES = {
    "start_step": "Starting step: {{ step_name }}",
    "end_step": "Completed step: {{ step_name }}",
    "start_flow": "Starting flow: {{ flow_name }} (v{{ flow_version }})",
    "end_flow": "Completed flow: {{ flow_name }} (v{{ flow_version }})"
}

def clean_dict(obj):
    """Recursively clean dict/list to be JSON-serializable"""
    if isinstance(obj, dict):
        return {k: clean_dict(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [clean_dict(v) for v in obj]
    elif isinstance(obj, (datetime, date)):
        return obj.isoformat()
    elif isinstance(obj, (str, int, float, bool, type(None))):
        return obj
    else:
        return str(obj)

async def dispatch_message(
    template: Optional[str],
    context: Dict[str, Any],
    fallback_type: Literal["start_step", "end_step", "start_flow", "end_flow"],
    role: Literal["system", "assistant", "error"],
    project_id: str,
    destination: Optional[List[str]] = None
):
    """
    Send user-visible messages during flow and step execution
    
    Args:
        template: Optional Jinja2 template string
        context: Dict of available values (step_name, flow_name, output_data, etc.)
        fallback_type: Message type for fallback template
        role: Message role (system, assistant, error)
        project_id: Project ID to associate message with
        destination: Where to send (log, websocket, db) - default is all
    """
    # Ensure context is JSON-serializable
    safe_context = {}
    for key, value in context.items():
        if isinstance(value, (dict, list)):
            safe_context[key] = clean_dict(value)
        elif isinstance(value, (datetime, date)):
            safe_context[key] = value.isoformat()
        elif isinstance(value, (str, int, float, bool, type(None))):
            safe_context[key] = value
        else:
            safe_context[key] = str(value)

    # Use template if provided, otherwise use fallback
    message_template = template or FALLBACK_TEMPLATES[fallback_type]
    # Render the message with context using Jinja2
    try:
        final_message = TemplateRenderer.render_template(message_template, safe_context)
    except ValueError as e:
        logger.warning(f"Template rendering failed: {e}")
        # Use a very basic fallback if rendering fails
        final_message = f"{fallback_type.replace('_', ' ').title()}"
    
    # Default destinations if not specified
    if destination is None:
        destination = ["log", "websocket", "db"]
    
    # Log the message
    if "log" in destination:
        logger.info(f"[{role.upper()}] {final_message}")
    
    # Send via websocket
    if "websocket" in destination:
        # Handle special flow status messages
        if fallback_type in ["start_flow", "start_step"]:
            # If a flow is starting, set flow status to running
            if fallback_type == "start_flow":
                await manager.set_flow_running(project_id, True)
        elif fallback_type in ["end_flow", "end_step"]:
            # If a flow is ending, set flow status to not running
            if fallback_type == "end_flow":
                await manager.set_flow_running(project_id, False)
                
        # Send the actual message via websocket
        message_id = None
        if "db" in destination:
            # If we're saving to DB, use the same ID
            message_id = str(uuid.uuid4())
            await manager.send_message(project_id, role, final_message, message_id)
        else:
            # Otherwise, generate a new ID
            await manager.send_message(project_id, role, final_message, str(uuid.uuid4()))
    
    # Save to database
    if "db" in destination:
        return await save_message_to_db(project_id, role, final_message)
    
    return final_message

async def save_message_to_db(project_id: str, role: str, content: str):
    """Save a message to the database"""
    try:
        message_id = str(uuid.uuid4())
        query = Message.__table__.insert().values(
            id=message_id,
            project_id=project_id,
            role=role,
            content=content,
            created_at=datetime.now(UTC)
        )
        await database.execute(query)
        return message_id
    except Exception as e:
        logger.error(f"Error saving message to db: {e}")
        # Don't raise - we don't want message saving to break flow execution
        return None 
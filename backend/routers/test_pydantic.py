"""
Test API endpoints for Pydantic model integration.
"""

from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import Dict, Any, Optional
import logging
import uuid
from datetime import datetime

from db.database import database
from db.models import AgentStep, PydanticSchema
from core.flow_runner import FlowRunner
from core.step_executor import StepExecutor
from db.seeds.test_pydantic_model import create_test_pydantic_flow
from db.database import get_db

router = APIRouter(prefix="/test-pydantic", tags=["Test Pydantic"])

logger = logging.getLogger(__name__)

@router.post("/setup")
async def setup_test_flow():
    """
    Create a test flow with a step that uses a Pydantic model for structured generation
    """
    async with get_db() as session:  # Use async with to yield the session
        try:
            flow_id, step_id = await create_test_pydantic_flow(session)
            return {
                "message": "Test flow created successfully",
                "flow_id": flow_id,
                "step_id": step_id
            }
        except Exception as e:
            logger.error(f"Error creating test flow: {e}")
            raise HTTPException(status_code=500, detail=f"Error creating test flow: {str(e)}")

@router.post("/run-step")
async def run_test_step(feature_name: str, step_id: Optional[str] = None):
    """
    Run the test step with the provided feature name
    """
    async with get_db() as session:  # Use async with to yield the session
        try:
            # If no step_id provided, get the most recent one
            if not step_id:
                # Get the most recent step with test_pydantic_step name
                step = session.query(AgentStep).filter(AgentStep.name == "test_pydantic_step").order_by(AgentStep.created_at.desc()).first()
                if not step:
                    # Create a new test flow
                    flow_id, step_id = create_test_pydantic_flow(session)
                    step = session.query(AgentStep).filter(AgentStep.id == step_id).first()
            else:
                step = session.query(AgentStep).filter(AgentStep.id == step_id).first()
            
            if not step:
                raise HTTPException(status_code=404, detail="Test step not found")
            
            # Create a project_id (would normally come from the project)
            project_id = str(uuid.uuid4())
            
            # Create a flow_run_id (would normally be created by flow_runner)
            flow_run_id = str(uuid.uuid4())
            
            # Get step data
            step_data = {
                "id": step.id,
                "name": step.name,
                "step_type": step.step_type,
                "prompt_template_id": step.prompt_template_id,
                "output_schema_id": step.output_schema_id,
                "pydantic_schema_id": step.pydantic_schema_id,
                "one_shot_id": step.one_shot_id,
                "system_message": step.system_message,
                "input_map": step.input_map,
                "start_message": step.start_message,
                "complete_message": step.complete_message
            }
            
            # Create flow state with feature name
            flow_state = {
                "feature_name": feature_name
            }
            
            # Run the step using StepExecutor
            status, output_data = await StepExecutor.execute_step(
                step=step_data,
                flow_run_id=flow_run_id,
                project_id=project_id,
                flow_state=flow_state
            )
            
            # Return the results
            return {
                "status": status,
                "output": output_data,
                "step_id": step.id
            }
        except Exception as e:
            logger.error(f"Error running test step: {e}")
            raise HTTPException(status_code=500, detail=f"Error running test step: {str(e)}") 
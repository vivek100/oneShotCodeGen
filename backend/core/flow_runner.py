import logging
import uuid
from typing import Dict, Any, List, Optional, Tuple
from datetime import datetime

from db.database import database
from db.models import FlowRun, AppVersion, StepRun
from core.flow_registry import FlowRegistry
from core.step_executor import StepExecutor
from core.message_dispatcher import dispatch_message
from core.websocket_manager import manager

logger = logging.getLogger(__name__)

class FlowRunner:
    """
    Controls a full multi-step flow execution by calling step executor
    for each step and tracking flow state.
    """
    
    @staticmethod
    async def start_flow_run(flow_id: str, project_id: str, initial_inputs: Dict[str, Any] = None) -> str:
        """
        Start a new flow run
        
        Args:
            flow_id: ID of the flow to run
            project_id: ID of the project
            initial_inputs: Initial inputs for the flow
            
        Returns:
            ID of the created flow run
        """
        # Get flow details
        flow = await FlowRegistry.get_flow_by_id(flow_id)
        if not flow:
            raise ValueError(f"Flow with ID {flow_id} not found")
        
        flow_name = flow["name"]
        flow_version = flow["version"]
        
        # Create a flow run record
        flow_run_id = str(uuid.uuid4())
        query = FlowRun.__table__.insert().values(
            id=flow_run_id,
            project_id=project_id,
            flow_id=flow_id,
            status="running",
            started_at=datetime.utcnow()
        )
        await database.execute(query)
        
        # Set flow running status to disable chat input
        await manager.set_flow_running(project_id, True)
        
        # Dispatch start message
        await dispatch_message(
            template=flow.get("start_message"),
            context={
                "flow_name": flow_name,
                "flow_version": str(flow_version)
            },
            fallback_type="start_flow",
            role="system",
            project_id=project_id
        )
        
        # Start the flow execution asynchronously
        try:
            # Run the flow steps
            status, output = await FlowRunner.run_flow_steps(
                flow_id=flow_id,
                flow_run_id=flow_run_id,
                project_id=project_id,
                initial_inputs=initial_inputs or {}
            )
            
            # Update flow run with completion
            await FlowRunner.update_flow_run(
                flow_run_id=flow_run_id,
                status=status,
                output=output
            )
            
            # If successful, create an app version with the output
            if status == "complete" and "final_app_config" in output:
                await FlowRunner.create_app_version(
                    project_id=project_id,
                    flow_run_id=flow_run_id,
                    config_json=output["final_app_config"]
                )
            
            # Dispatch complete message
            await dispatch_message(
                template=flow.get("complete_message") if status == "complete" else f"Error running flow {flow_name}: {str(e)}",
                context={
                    "flow_name": flow_name,
                    "flow_version": str(flow_version),
                    "output_data": output,
                    "input_data": initial_inputs
                },
                fallback_type="end_flow",
                role="system" if status == "complete" else "error",
                project_id=project_id
            )
            
        except Exception as e:
            logger.error(f"Error running flow {flow_name}: {e}")
            
            # Update flow run with error
            await FlowRunner.update_flow_run(
                flow_run_id=flow_run_id,
                status="error"
            )
            
            # Dispatch error message
            await dispatch_message(
                template=f"Error running flow {flow_name}: {str(e)}",
                context={},
                fallback_type="end_flow",
                role="error",
                project_id=project_id
            )
        finally:
            # Set flow running status to enable chat input after flow completes
            await manager.set_flow_running(project_id, False)
        
        return flow_run_id
    
    @staticmethod
    async def run_flow_steps(
        flow_id: str,
        flow_run_id: str,
        project_id: str,
        initial_inputs: Dict[str, Any]
    ) -> Tuple[str, Dict[str, Any]]:
        """
        Run all steps in a flow in order
        
        Args:
            flow_id: ID of the flow
            flow_run_id: ID of the flow run
            project_id: ID of the project
            initial_inputs: Initial inputs for the flow
            
        Returns:
            Tuple of (status, final_output)
        """
        # Get all steps for the flow
        steps = await FlowRegistry.get_steps_by_flow_id(flow_id)
        if not steps:
            raise ValueError(f"No steps found for flow {flow_id}")
        
        # Sort steps by order
        steps.sort(key=lambda x: x["order"])
        
        # Initialize flow state with initial inputs
        flow_state = initial_inputs.copy()
        
        # Execute each step in order
        for step in steps:
            step_name = step["name"]
            logger.info(f"Executing step {step_name}")
            
            # Execute the step
            status, output = await StepExecutor.execute_step(
                step=step,
                flow_run_id=flow_run_id,
                project_id=project_id,
                flow_state=flow_state
            )
            
            # If step failed, abort the flow
            if status == "error":
                logger.error(f"Step {step_name} failed")
                return "error", {"error": f"Step {step_name} failed"}
            
            # Update flow state with step output
            flow_state[step_name] = output
        
        # Check if the flow has a step that produces a final output
        # This is typically a tool_call step that aggregates all previous outputs
        final_output = flow_state
        for step in steps:
            if step["tool_name"] == "finalize_config_output" or step["tool_name"] == "merge_config_outputs":
                if step["name"] in flow_state:
                    final_output = flow_state[step["name"]]
                    break
        
        return "complete", final_output
    
    @staticmethod
    async def update_flow_run(flow_run_id: str, status: str, output: Optional[Dict[str, Any]] = None) -> None:
        """Update a flow run record"""
        values = {
            "status": status
        }
        
        if status in ["complete", "error"]:
            values["ended_at"] = datetime.utcnow()
        
        if output is not None:
            # Convert datetime objects to ISO format strings for JSON serialization
            serialized_output = FlowRunner._serialize_for_json(output)
            values["output"] = serialized_output
        
        # Update the flow run
        query = FlowRun.__table__.update().where(
            FlowRun.id == flow_run_id
        ).values(**values)
        
        await database.execute(query)
    
    @staticmethod
    def _serialize_for_json(obj):
        """Convert data structures with datetime objects to JSON serializable format"""
        if isinstance(obj, dict):
            return {k: FlowRunner._serialize_for_json(v) for k, v in obj.items()}
        elif isinstance(obj, list):
            return [FlowRunner._serialize_for_json(item) for item in obj]
        elif isinstance(obj, datetime):
            return obj.isoformat()
        else:
            return obj
    
    @staticmethod
    async def get_flow_run(flow_run_id: str) -> Optional[Dict[str, Any]]:
        """
        Get a flow run by ID
        
        Args:
            flow_run_id: ID of the flow run
            
        Returns:
            Flow run data or None if not found
        """
        query = FlowRun.__table__.select().where(FlowRun.id == flow_run_id)
        result = await database.fetch_one(query)
        if result:
            return dict(result)
        return None
    
    @staticmethod
    async def create_app_version(project_id: str, flow_run_id: str, config_json: Dict[str, Any]) -> str:
        """
        Create a new app version from a successful flow run
        
        Args:
            project_id: ID of the project
            flow_run_id: ID of the flow run that generated the config
            config_json: Full app configuration JSON
            
        Returns:
            ID of the created app version
        """
        # Get the current highest version number for this project
        query = """
        SELECT MAX(version_number) as max_version 
        FROM app_versions 
        WHERE project_id = :project_id
        """
        result = await database.fetch_one(query=query, values={"project_id": project_id})
        version_number = 1
        if result and result["max_version"] is not None:
            version_number = result["max_version"] + 1
        
        # Create the app version
        app_version_id = str(uuid.uuid4())
        query = AppVersion.__table__.insert().values(
            id=app_version_id,
            project_id=project_id,
            flow_run_id=flow_run_id,
            version_number=version_number,
            config_json=config_json,
            created_at=datetime.utcnow()
        )
        await database.execute(query)
        
        return app_version_id 
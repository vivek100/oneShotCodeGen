import logging
from typing import Dict, Any, List, Optional, Tuple
import uuid

from db.database import database
from db.models import AgentFlow, AgentStep

logger = logging.getLogger(__name__)

class FlowRegistry:
    """
    Manages all flow definitions (flow_id, steps, versions).
    Used by Flow Runner, Replay Engine, and Admin UI.
    """
    
    @staticmethod
    async def get_flow_by_id(flow_id: str) -> Optional[Dict[str, Any]]:
        """
        Get a flow by ID
        
        Args:
            flow_id: ID of the flow
            
        Returns:
            Flow data or None if not found
        """
        query = AgentFlow.__table__.select().where(AgentFlow.id == flow_id)
        result = await database.fetch_one(query)
        if result:
            return dict(result)
        return None
    
    @staticmethod
    async def get_flow_by_name(name: str, version: Optional[int] = None) -> Optional[Dict[str, Any]]:
        """
        Get a flow by name and optionally version
        
        Args:
            name: Name of the flow
            version: Optional version number (if not provided, returns latest version)
            
        Returns:
            Flow data or None if not found
        """
        if version is not None:
            query = AgentFlow.__table__.select().where(
                (AgentFlow.name == name) & (AgentFlow.version == version)
            )
            result = await database.fetch_one(query)
            if result:
                return dict(result)
            return None
        
        # Get the latest version
        query = AgentFlow.__table__.select().where(
            AgentFlow.name == name
        ).order_by(AgentFlow.version.desc())
        result = await database.fetch_one(query)
        if result:
            return dict(result)
        return None
    
    @staticmethod
    async def get_steps_by_flow_id(flow_id: str) -> List[Dict[str, Any]]:
        """
        Get all steps for a flow, ordered by their position
        
        Args:
            flow_id: ID of the flow
            
        Returns:
            List of step data
        """
        query = AgentStep.__table__.select().where(
            AgentStep.flow_id == flow_id
        ).order_by(AgentStep.order)
        results = await database.fetch_all(query)
        return [dict(result) for result in results]
    
    @staticmethod
    async def get_flow_with_steps(flow_id: str) -> Tuple[Dict[str, Any], List[Dict[str, Any]]]:
        """
        Get a flow and all its steps
        
        Args:
            flow_id: ID of the flow
            
        Returns:
            Tuple of (flow_data, steps_data)
        """
        flow = await FlowRegistry.get_flow_by_id(flow_id)
        if not flow:
            raise ValueError(f"Flow with ID {flow_id} not found")
        
        steps = await FlowRegistry.get_steps_by_flow_id(flow_id)
        return flow, steps
    
    @staticmethod
    async def create_flow(name: str, description: Optional[str] = None, start_message: Optional[str] = None, complete_message: Optional[str] = None) -> str:
        """
        Create a new flow with an incremented version number
        
        Args:
            name: Name of the flow
            description: Optional description of the flow
            start_message: Optional template message when flow starts
            complete_message: Optional template message when flow completes
            
        Returns:
            ID of the created flow
        """
        # Get the current highest version
        latest_flow = await FlowRegistry.get_flow_by_name(name)
        version = 1
        if latest_flow:
            version = latest_flow["version"] + 1
        
        flow_id = str(uuid.uuid4())
        query = AgentFlow.__table__.insert().values(
            id=flow_id,
            name=name,
            version=version,
            description=description,
            is_active=True,
            start_message=start_message,
            complete_message=complete_message
        )
        await database.execute(query)
        return flow_id
    
    @staticmethod
    async def create_step(
        flow_id: str,
        name: str,
        step_type: str,
        order: int,
        input_map: Dict[str, str],
        system_message: str,
        prompt_template_id: str,
        output_schema_id: str,
        one_shot_id: Optional[str] = None,
        tool_name: Optional[str] = None,
        loop_key: Optional[str] = None,
        start_message: Optional[str] = None,
        complete_message: Optional[str] = None
    ) -> str:
        """
        Create a new step for a flow
        
        Args:
            flow_id: ID of the flow this step belongs to
            name: Unique name within the flow
            step_type: Type of step (ai_single, ai_loop, tool_call)
            order: Order of execution within the flow
            input_map: Maps input fields to their sources
            system_message: System message for AI steps
            prompt_template_id: ID of the prompt template
            output_schema_id: ID of the output schema
            one_shot_id: Optional ID of one-shot example
            tool_name: Optional name of tool to call (if step_type is tool_call)
            loop_key: Optional key to iterate over (for ai_loop)
            start_message: Optional template message when step starts
            complete_message: Optional template message when step completes
            
        Returns:
            ID of the created step
        """
        step_id = str(uuid.uuid4())
        query = AgentStep.__table__.insert().values(
            id=step_id,
            flow_id=flow_id,
            name=name,
            step_type=step_type,
            tool_name=tool_name,
            order=order,
            input_map=input_map,
            loop_key=loop_key,
            system_message=system_message,
            prompt_template_id=prompt_template_id,
            output_schema_id=output_schema_id,
            one_shot_id=one_shot_id,
            start_message=start_message,
            complete_message=complete_message
        )
        await database.execute(query)
        return step_id
    
    @staticmethod
    async def get_all_flows(active_only: bool = False) -> List[Dict[str, Any]]:
        """
        Get all flows, optionally filtered by active status
        
        Args:
            active_only: If True, only return active flows
            
        Returns:
            List of flow data
        """
        if active_only:
            query = AgentFlow.__table__.select().where(AgentFlow.is_active == True)
        else:
            query = AgentFlow.__table__.select()
        
        results = await database.fetch_all(query)
        return [dict(result) for result in results]
    
    @staticmethod
    async def update_step(step_id: str, step_data: Dict[str, Any]) -> bool:
        """
        Update an existing step
        
        Args:
            step_id: ID of the step to update
            step_data: Dictionary of fields to update
            
        Returns:
            True if the step was updated successfully
        """
        try:
            # Filter out None values and any ID field (can't update that)
            update_fields = {k: v for k, v in step_data.items() if v is not None and k != 'id'}
            
            # Handle empty string values (convert to None for optional fields)
            for field in ['tool_name', 'loop_key', 'one_shot_id', 'start_message', 'complete_message']:
                if field in update_fields and update_fields[field] == '':
                    update_fields[field] = None
                    
            query = AgentStep.__table__.update().where(
                AgentStep.id == step_id
            ).values(**update_fields)
            
            await database.execute(query)
            return True
        except Exception as e:
            logger.error(f"Error updating step {step_id}: {e}")
            raise 
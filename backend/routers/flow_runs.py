from fastapi import APIRouter, HTTPException, BackgroundTasks, Depends
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, ConfigDict, Field

from db.database import database
from core.step_executor import StepExecutor
from core.replay_engine import ReplayEngine

router = APIRouter()

class FlowRunResponse(BaseModel):
    model_config = ConfigDict(extra="forbid", exclude_none=True)
    
    id: str = Field(..., description="ID of the flow run")
    project_id: str = Field(..., description="ID of the project")
    flow_id: str = Field(..., description="ID of the flow")
    status: str = Field(..., description="Status of the flow run")
    started_at: str = Field(..., description="Start timestamp")
    ended_at: Optional[str] = Field(None, description="End timestamp")
    created_at: str = Field(..., description="Creation timestamp")
    flow_name: Optional[str] = Field(None, description="Name of the flow")
    duration: Optional[float] = Field(None, description="Duration of the flow run in seconds")

class StepRunResponse(BaseModel):
    model_config = ConfigDict(extra="forbid", exclude_none=True)
    
    id: str = Field(..., description="ID of the step run")
    flow_run_id: str = Field(..., description="ID of the flow run")
    step_id: str = Field(..., description="ID of the step")
    status: str = Field(..., description="Status of the step run")
    started_at: str = Field(..., description="Start timestamp")
    ended_at: Optional[str] = Field(None, description="End timestamp")
    input_data: Dict[str, Any] = Field(..., description="Input data for the step")
    output_data: Optional[Dict[str, Any]] = Field(None, description="Output data from the step")
    error_message: Optional[str] = Field(None, description="Error message if status is error")
    rendered_prompt: Optional[str] = Field(None, description="Rendered prompt used for the step")
    created_at: str = Field(..., description="Creation timestamp")
    step_name: Optional[str] = Field(None, description="Name of the step")
    duration: Optional[float] = Field(None, description="Duration of the step run in seconds")

class StepReplayRequest(BaseModel):
    model_config = ConfigDict(extra="forbid", exclude_none=True)
    
    input_data: Optional[Dict[str, Any]] = Field(None, description="Modified input data for the step")
    prompt_template: Optional[str] = Field(None, description="Modified prompt template to use")
    output_schema: Optional[Dict[str, Any]] = Field(None, description="Modified output schema to use")

class StepReplayResponse(BaseModel):
    model_config = ConfigDict(extra="forbid", exclude_none=True)
    
    status: str = Field(..., description="Status of the replay (success, error)")
    replay_run_id: Optional[str] = Field(None, description="ID of the replay step run record")
    output_data: Optional[Dict[str, Any]] = Field(None, description="Output data from the replay")
    error: Optional[str] = Field(None, description="Error message if status is error")
    rendered_prompt: Optional[str] = Field(None, description="Rendered prompt used for the step")
    duration: float = Field(..., description="Time taken to replay the step (seconds)")

@router.get("/project/{project_id}", response_model=List[FlowRunResponse])
async def get_project_flow_runs(project_id: str):
    """Get all flow runs for a project"""
    try:
        query = """
        SELECT fr.*, af.name as flow_name 
        FROM flow_runs fr
        JOIN agent_flows af ON fr.flow_id = af.id
        WHERE fr.project_id = :project_id
        ORDER BY fr.created_at DESC
        """
        results = await database.fetch_all(query=query, values={"project_id": project_id})
        
        if not results:
            return []
        
        # Calculate duration for each flow run
        formatted_results = []
        for result in results:
            result_dict = dict(result)
            
            # Add duration if available
            if result_dict.get("ended_at") and result_dict.get("started_at"):
                from datetime import datetime
                start_time = datetime.fromisoformat(result_dict["started_at"].replace('Z', '+00:00'))
                end_time = datetime.fromisoformat(result_dict["ended_at"].replace('Z', '+00:00'))
                duration_seconds = (end_time - start_time).total_seconds()
                result_dict["duration"] = round(duration_seconds, 2)
            
            # Filter to only include fields defined in the response model 
            filtered_result = {}
            for k, v in result_dict.items():
                if k in FlowRunResponse.model_fields:
                    filtered_result[k] = v
            
            # Add extra fields if they exist in the schema
            if "flow_name" in FlowRunResponse.model_fields and "flow_name" in result_dict:
                filtered_result["flow_name"] = result_dict["flow_name"]
                
            if "duration" in FlowRunResponse.model_fields and "duration" in result_dict:
                filtered_result["duration"] = result_dict["duration"]
                
            formatted_results.append(filtered_result)
        
        return formatted_results
    except HTTPException as e:
        # Re-raise HTTP exceptions
        raise e
    except Exception as e:
        # For other exceptions, return 500
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{flow_run_id}", response_model=FlowRunResponse)
async def get_flow_run(flow_run_id: str):
    """Get details of a flow run"""
    try:
        query = """
        SELECT * FROM flow_runs
        WHERE id = :flow_run_id
        """
        result = await database.fetch_one(query=query, values={"flow_run_id": flow_run_id})
        
        if not result:
            raise HTTPException(status_code=404, detail="Flow run not found")
        
        result_dict = dict(result)
        # Filter to only include fields defined in the response model
        filtered_result = {
            k: v for k, v in result_dict.items() 
            if k in FlowRunResponse.model_fields
        }
        return filtered_result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{flow_run_id}/steps", response_model=List[StepRunResponse])
async def get_flow_run_steps(flow_run_id: str):
    """Get all steps for a flow run"""
    try:
        # First check if the flow run exists
        flow_query = """
        SELECT * FROM flow_runs
        WHERE id = :flow_run_id
        """
        flow_result = await database.fetch_one(query=flow_query, values={"flow_run_id": flow_run_id})
        
        if not flow_result:
            raise HTTPException(status_code=404, detail="Flow run not found")
            
        # Try to get step runs with joined step names, falling back to basic query if needed
        try:
            query = """
            SELECT sr.*, ast.name as step_name
            FROM step_runs sr
            LEFT JOIN agent_steps ast ON sr.step_id = ast.id
            WHERE sr.flow_run_id = :flow_run_id
            ORDER BY sr.started_at ASC
            """
            results = await database.fetch_all(query=query, values={"flow_run_id": flow_run_id})
        except Exception as e:
            # If the join fails, fall back to just getting step runs without the join
            print(f"Warning: Join with agent_steps failed: {str(e)}. Falling back to basic query.")
            query = """
            SELECT * FROM step_runs
            WHERE flow_run_id = :flow_run_id
            ORDER BY started_at ASC
            """
            results = await database.fetch_all(query=query, values={"flow_run_id": flow_run_id})
        
        if not results:
            return []
        
        # Filter to only include fields defined in the response model plus step_name
        filtered_results = []
        for result in results:
            result_dict = dict(result)
            
            # Process input_data and output_data to ensure they are dictionaries
            for data_field in ['input_data', 'output_data']:
                if data_field in result_dict:
                    if isinstance(result_dict[data_field], str):
                        try:
                            import json
                            result_dict[data_field] = json.loads(result_dict[data_field])
                        except json.JSONDecodeError:
                            print(f"Warning: Failed to parse {data_field} as JSON")
                            # If parsing fails, provide an empty dict to avoid validation errors
                            result_dict[data_field] = {}
                    elif result_dict[data_field] is None:
                        result_dict[data_field] = {}
            
            # Calculate duration if start and end times exist
            if result_dict.get("ended_at") and result_dict.get("started_at"):
                from datetime import datetime
                try:
                    start_time = datetime.fromisoformat(result_dict["started_at"].replace('Z', '+00:00'))
                    end_time = datetime.fromisoformat(result_dict["ended_at"].replace('Z', '+00:00'))
                    duration_seconds = (end_time - start_time).total_seconds()
                    result_dict["duration"] = round(duration_seconds, 2)
                except (ValueError, TypeError) as e:
                    print(f"Warning: Error calculating duration: {str(e)}")
                    # Don't set duration if calculation fails

            # Add rendered prompt if available
            if "rendered_prompt" in result_dict:
                result_dict["rendered_prompt"] = result_dict["rendered_prompt"]

            # Create filtered result with only fields in the schema
            filtered_result = {}
            for k, v in result_dict.items():
                if k in StepRunResponse.model_fields:
                    filtered_result[k] = v
            
            # Add step_name if it exists in the schema and result
            if "step_name" in StepRunResponse.model_fields and "step_name" in result_dict:
                filtered_result["step_name"] = result_dict.get("step_name", "Unknown Step")
                
            # Add duration if it exists in the schema and result
            if "duration" in StepRunResponse.model_fields and "duration" in result_dict:
                filtered_result["duration"] = result_dict["duration"]
                
            filtered_results.append(filtered_result)
            
        return filtered_results
    except HTTPException as e:
        # Re-raise HTTP exceptions
        raise e
    except Exception as e:
        # For other exceptions, return 500
        print(f"Error in get_flow_run_steps: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/step-runs/{step_run_id}", response_model=StepRunResponse)
async def get_step_run(step_run_id: str):
    """Get details of a step run"""
    try:
        # Try to get with join first, fallback to basic query if needed
        try:
            query = """
            SELECT sr.*, ast.name as step_name
            FROM step_runs sr
            LEFT JOIN agent_steps ast ON sr.step_id = ast.id
            WHERE sr.id = :step_run_id
            """
            result = await database.fetch_one(query=query, values={"step_run_id": step_run_id})
        except Exception as e:
            # If the join fails, fall back to just getting the step run
            print(f"Warning: Join with agent_steps failed: {str(e)}. Falling back to basic query.")
            query = """
            SELECT * FROM step_runs
            WHERE id = :step_run_id
            """
            result = await database.fetch_one(query=query, values={"step_run_id": step_run_id})
        
        if not result:
            raise HTTPException(status_code=404, detail="Step run not found")
        
        result_dict = dict(result)
        
        # Process input_data and output_data to ensure they are dictionaries
        for data_field in ['input_data', 'output_data']:
            if data_field in result_dict:
                if isinstance(result_dict[data_field], str):
                    try:
                        import json
                        result_dict[data_field] = json.loads(result_dict[data_field])
                    except json.JSONDecodeError:
                        print(f"Warning: Failed to parse {data_field} as JSON")
                        # If parsing fails, provide an empty dict to avoid validation errors
                        result_dict[data_field] = {}
                elif result_dict[data_field] is None:
                    result_dict[data_field] = {}
        
        # Calculate duration if start and end times exist
        if result_dict.get("ended_at") and result_dict.get("started_at"):
            from datetime import datetime
            try:
                start_time = datetime.fromisoformat(result_dict["started_at"].replace('Z', '+00:00'))
                end_time = datetime.fromisoformat(result_dict["ended_at"].replace('Z', '+00:00'))
                duration_seconds = (end_time - start_time).total_seconds()
                result_dict["duration"] = round(duration_seconds, 2)
            except (ValueError, TypeError) as e:
                print(f"Warning: Error calculating duration: {str(e)}")
                # Don't set duration if calculation fails
        
        # Filter to only include fields defined in the response model
        filtered_result = {}
        for k, v in result_dict.items():
            if k in StepRunResponse.model_fields:
                filtered_result[k] = v
        
        # Add step_name if it exists in the schema and result
        if "step_name" in StepRunResponse.model_fields and "step_name" in result_dict:
            filtered_result["step_name"] = result_dict.get("step_name", "Unknown Step")
            
        # Add duration if it exists in the schema and result
        if "duration" in StepRunResponse.model_fields and "duration" in result_dict:
            filtered_result["duration"] = result_dict["duration"]
        
        return filtered_result
    except HTTPException as e:
        # Re-raise HTTP exceptions
        raise e
    except Exception as e:
        # For other exceptions, return 500
        print(f"Error in get_step_run: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/step-runs/{step_run_id}/replay", response_model=StepReplayResponse)
async def replay_step_run(step_run_id: str, replay_request: StepReplayRequest):
    """
    Replay a step run with original or modified inputs
    
    This creates a new step run record with the replay results.
    You can modify the input data, prompt template, and output schema.
    """
    try:
        try:
            # First verify the step run exists
            check_query = """
            SELECT * FROM step_runs WHERE id = :step_run_id
            """
            check_result = await database.fetch_one(query=check_query, values={"step_run_id": step_run_id})
            if not check_result:
                raise HTTPException(status_code=404, detail="Step run not found")
                
            # Call the ReplayEngine to execute the step again
            result = await ReplayEngine.replay_step(
                step_run_id=step_run_id,
                modified_input=replay_request.input_data,
                modified_prompt=replay_request.prompt_template,
                modified_schema=replay_request.output_schema
            )
            
            # Process output_data to ensure it's a dictionary if it's returned as a string
            if hasattr(result, 'output_data') and isinstance(result.output_data, str):
                try:
                    import json
                    result.output_data = json.loads(result.output_data)
                except json.JSONDecodeError:
                    print(f"Warning: Failed to parse output_data as JSON in replay result")
                    result.output_data = {}
            
            # Ensure we're returning a proper StepReplayResponse
            response_data = {
                "status": result.status if hasattr(result, 'status') else "error",
                "replay_run_id": result.replay_run_id if hasattr(result, 'replay_run_id') else None,
                "output_data": result.output_data if hasattr(result, 'output_data') else {},
                "error": result.error if hasattr(result, 'error') else None,
                "duration": result.duration if hasattr(result, 'duration') else 0.0
            }
            
            # Add rendered prompt if available
            if hasattr(result, 'rendered_prompt') and result.rendered_prompt:
                response_data["rendered_prompt"] = result.rendered_prompt
            
            return response_data
        except Exception as e:
            print(f"Error replaying step: {str(e)}")
            return StepReplayResponse(
                status="error",
                replay_run_id=None,
                output_data={},
                error=str(e),
                duration=0.0
            )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) 
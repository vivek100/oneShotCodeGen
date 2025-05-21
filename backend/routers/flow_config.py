from fastapi import APIRouter, HTTPException, Depends, logger
from typing import List, Optional, Dict, Any, Union
from pydantic import BaseModel, ConfigDict, Field
from datetime import datetime
import uuid

from db.database import database
from core.flow_registry import FlowRegistry
from core.prompt_schema_store import PromptSchemaStore
from db.models import AgentStep

router = APIRouter()

class FlowResponse(BaseModel):
    model_config = ConfigDict(extra="forbid", exclude_none=True)
    
    id: str = Field(..., description="ID of the flow")
    name: str = Field(..., description="Name of the flow")
    version: int = Field(..., description="Version of the flow")
    description: Optional[str] = Field(None, description="Description of the flow")
    is_active: bool = Field(..., description="Whether the flow is active")
    start_message: Optional[str] = Field(None, description="Template message when flow starts")
    complete_message: Optional[str] = Field(None, description="Template message when flow completes")
    created_at: str = Field(..., description="Creation timestamp")
    updated_at: str = Field(..., description="Last update timestamp")

class StepResponse(BaseModel):
    model_config = ConfigDict(extra="forbid", exclude_none=True)
    
    id: str = Field(..., description="ID of the step")
    flow_id: str = Field(..., description="ID of the flow")
    name: str = Field(..., description="Name of the step")
    step_type: str = Field(..., description="Type of step")
    tool_name: Optional[str] = Field(None, description="Name of tool to call")
    order: int = Field(..., description="Order within the flow")
    input_map: Dict[str, str] = Field(..., description="Input mapping")
    loop_key: Optional[str] = Field(None, description="Key to loop over")
    system_message: str = Field(..., description="System message for AI steps")
    prompt_template_id: str = Field(..., description="ID of prompt template")
    output_schema_id: str = Field(..., description="ID of output schema")
    one_shot_id: Optional[str] = Field(None, description="ID of one-shot example")
    start_message: Optional[str] = Field(None, description="Template message when step starts")
    complete_message: Optional[str] = Field(None, description="Template message when step completes")
    created_at: str = Field(..., description="Creation timestamp")
    updated_at: str = Field(..., description="Last update timestamp")
    
    # Extended fields with actual content
    prompt_template: Optional[str] = Field(None, description="The actual prompt template text")
    output_schema: Optional[Dict[str, Any]] = Field(None, description="The actual output schema JSON")
    oneshot_examples: Optional[List[Dict[str, Any]]] = Field(None, description="The list of one-shot examples")
    
    # New Pydantic schema fields
    pydantic_schema_id: Optional[str] = Field(None, description="ID of the linked Pydantic schema")
    pydantic_schema_file_path: Optional[str] = Field(None, description="File path of the Pydantic model")
    pydantic_schema_class_name: Optional[str] = Field(None, description="Class name of the Pydantic model")

class PromptResponse(BaseModel):
    model_config = ConfigDict(extra="forbid", exclude_none=True)
    
    id: str = Field(..., description="ID of the prompt")
    name: str = Field(..., description="Name of the prompt")
    template: str = Field(..., description="Prompt template text")
    created_at: str = Field(..., description="Creation timestamp")
    updated_at: str = Field(..., description="Last update timestamp")

class SchemaResponse(BaseModel):
    model_config = ConfigDict(extra="forbid", exclude_none=True)
    
    id: str = Field(..., description="ID of the schema")
    name: str = Field(..., description="Name of the schema")
    schema_json: Dict[str, Any] = Field(..., description="JSON schema definition")
    created_at: str = Field(..., description="Creation timestamp")
    updated_at: str = Field(..., description="Last update timestamp")

class OneShotResponse(BaseModel):
    model_config = ConfigDict(extra="forbid", exclude_none=True)
    
    id: str = Field(..., description="ID of the one-shot example")
    name: str = Field(..., description="Name of the one-shot example")
    input_json: Dict[str, Any] = Field(..., description="Example input data")
    output_json: Dict[str, Any] = Field(..., description="Example output data")
    linked_step_id: Optional[str] = Field(None, description="ID of linked step")
    created_at: str = Field(..., description="Creation timestamp")
    updated_at: str = Field(..., description="Last update timestamp")

class StepUpdateRequest(BaseModel):
    id: Optional[str] = None
    flow_id: str
    name: str
    step_type: str
    tool_name: Optional[str] = None
    order: int
    input_map: Dict[str, str]
    loop_key: Optional[str] = None
    system_message: str
    prompt_template: Optional[str] = None
    output_schema: Optional[Union[Dict[str, Any], str]] = None
    pydantic_schema_file_path: Optional[str] = None
    pydantic_schema_class_name: Optional[str] = None
    oneshot_examples: Optional[List[Dict[str, Any]]] = None
    start_message: Optional[str] = None
    complete_message: Optional[str] = None

class FlowUpdateRequest(BaseModel):
    model_config = ConfigDict(extra="forbid", exclude_none=True)
    
    name: str = Field(..., description="Name of the flow")
    description: Optional[str] = Field(None, description="Description of the flow")
    is_active: bool = Field(..., description="Whether the flow is active")
    start_message: Optional[str] = Field(None, description="Template message when flow starts")
    complete_message: Optional[str] = Field(None, description="Template message when flow completes")

# Helper function to convert datetime objects to ISO format strings
def convert_datetimes_to_strings(data: Dict) -> Dict:
    """Convert any datetime objects in the dict to ISO format strings"""
    result = {}
    for key, value in data.items():
        if isinstance(value, datetime):
            result[key] = value.isoformat()
        else:
            result[key] = value
    return result

@router.get("/flows", response_model=List[FlowResponse])
async def get_flows(active_only: bool = False):
    """Get all flows"""
    try:
        flows = await FlowRegistry.get_all_flows(active_only=active_only)
        
        # Add logging to help diagnose the issue
        print(f"Number of flows: {len(flows)}")
        
        # Filter and convert datetime fields to strings
        filtered_flows = []
        for flow in flows:
            flow_dict = convert_datetimes_to_strings(flow)
            filtered_flows.append({
                k: v for k, v in flow_dict.items() 
                if k in FlowResponse.model_fields
            })
        
        # Add logging for filtered flows
        print(f"Number of filtered flows: {len(filtered_flows)}")
        
        return filtered_flows
    except Exception as e:
        # Log the full exception details
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/flows/{flow_id}", response_model=FlowResponse)
async def get_flow(flow_id: str):
    """Get a flow by ID"""
    try:
        flow = await FlowRegistry.get_flow_by_id(flow_id)
        if not flow:
            raise HTTPException(status_code=404, detail="Flow not found")
        
        # Convert datetime fields to strings
        flow_dict = convert_datetimes_to_strings(flow)
        
        # Filter to only include fields defined in the response model
        filtered_flow = {
            k: v for k, v in flow_dict.items() 
            if k in FlowResponse.model_fields
        }
        return filtered_flow
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/flows/{flow_id}/steps", response_model=List[StepResponse])
async def get_flow_steps(flow_id: str):
    """Get all steps for a flow with full prompt template, schema, and one-shot details"""
    try:
        # Get basic step information
        steps = await FlowRegistry.get_steps_by_flow_id(flow_id)
        
        # Fetch additional data for each step
        enhanced_steps = []
        for step in steps:
            step_dict = convert_datetimes_to_strings(step)
            
            # Add prompt template content
            if step["prompt_template_id"]:
                prompt_query = """
                SELECT * FROM prompts WHERE id = :prompt_id
                """
                prompt_result = await database.fetch_one(
                    query=prompt_query, 
                    values={"prompt_id": step["prompt_template_id"]}
                )
                if prompt_result:
                    prompt_data = dict(prompt_result)
                    step_dict["prompt_template"] = prompt_data["template"]
            
            # Add output schema content
            if step["output_schema_id"]:
                schema_query = """
                SELECT * FROM schemas WHERE id = :schema_id
                """
                schema_result = await database.fetch_one(
                    query=schema_query, 
                    values={"schema_id": step["output_schema_id"]}
                )
                if schema_result:
                    schema_data = dict(schema_result)
                    # Convert schema_json from string to dict if it's a string
                    if isinstance(schema_data["schema_json"], str):
                        try:
                            import json
                            step_dict["output_schema"] = json.loads(schema_data["schema_json"])
                        except json.JSONDecodeError:
                            print(f"Error decoding schema JSON for step {step['id']}")
                            step_dict["output_schema"] = {}
                    else:
                        step_dict["output_schema"] = schema_data["schema_json"]
            
            # Add one-shot example if available
            if step["one_shot_id"]:
                oneshot_query = """
                SELECT * FROM one_shot_examples WHERE id = :oneshot_id
                """
                oneshot_result = await database.fetch_one(
                    query=oneshot_query, 
                    values={"oneshot_id": step["one_shot_id"]}
                )
                if oneshot_result:
                    oneshot_data = dict(oneshot_result)
                    # Convert input_json and output_json from string to dict if needed
                    input_json = oneshot_data["input_json"]
                    output_json = oneshot_data["output_json"]
                    
                    if isinstance(input_json, str):
                        try:
                            import json
                            input_json = json.loads(input_json)
                        except json.JSONDecodeError:
                            input_json = {}
                            
                    if isinstance(output_json, str):
                        try:
                            import json
                            output_json = json.loads(output_json)
                        except json.JSONDecodeError:
                            output_json = {}
                # if output_json is not a list, make it a list
                if not isinstance(output_json, list):
                    output_json = [output_json]
                step_dict["oneshot_examples"] = output_json
            # add pydantic schema path and class name
            if step["pydantic_schema_id"]:
                pydantic_query = """
                SELECT * FROM pydantic_schemas WHERE id = :pydantic_id
                """
                pydantic_result = await database.fetch_one(query=pydantic_query, values={"pydantic_id": step["pydantic_schema_id"]})

                if pydantic_result:
                    pydantic_data = dict(pydantic_result)
                    step_dict["pydantic_schema_file_path"] = pydantic_data["file_path"]
                    step_dict["pydantic_schema_class_name"] = pydantic_data["model_class_name"]
                
            # Filter to only include fields defined in the response model plus our new fields
            filtered_step = {
                k: v for k, v in step_dict.items() 
                if k in StepResponse.model_fields or k in ["prompt_template", "output_schema", "oneshot_examples"]
            }
            enhanced_steps.append(filtered_step)
            
        return enhanced_steps
    except Exception as e:
        print(f"Error in get_flow_steps: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/prompts", response_model=List[PromptResponse])
async def get_prompts():
    """Get all prompts"""
    try:
        query = """
        SELECT * FROM prompts
        ORDER BY name ASC
        """
        results = await database.fetch_all(query=query)
        
        # Filter and convert datetime fields to strings
        filtered_results = []
        for result in results:
            result_dict = convert_datetimes_to_strings(dict(result))
            filtered_results.append({
                k: v for k, v in result_dict.items() 
                if k in PromptResponse.model_fields
            })
        return filtered_results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/schemas", response_model=List[SchemaResponse])
async def get_schemas():
    """Get all schemas"""
    try:
        query = """
        SELECT * FROM schemas
        ORDER BY name ASC
        """
        results = await database.fetch_all(query=query)
        
        # Filter and convert datetime fields to strings
        filtered_results = []
        for result in results:
            result_dict = convert_datetimes_to_strings(dict(result))
            filtered_results.append({
                k: v for k, v in result_dict.items() 
                if k in SchemaResponse.model_fields
            })
        return filtered_results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/one-shots", response_model=List[OneShotResponse])
async def get_one_shots():
    """Get all one-shot examples"""
    try:
        query = """
        SELECT * FROM one_shot_examples
        ORDER BY name ASC
        """
        results = await database.fetch_all(query=query)
        
        # Filter and convert datetime fields to strings
        filtered_results = []
        for result in results:
            result_dict = convert_datetimes_to_strings(dict(result))
            filtered_results.append({
                k: v for k, v in result_dict.items() 
                if k in OneShotResponse.model_fields
            })
        return filtered_results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/steps/{step_id}", response_model=StepResponse)
async def get_step(step_id: str):
    """Get a step by ID with full prompt template, schema, and one-shot details"""
    try:
        query = """
        SELECT * FROM agent_steps
        WHERE id = :step_id
        """
        result = await database.fetch_one(query=query, values={"step_id": step_id})
        
        if not result:
            raise HTTPException(status_code=404, detail="Step not found")
        
        step_dict = convert_datetimes_to_strings(dict(result))
        
        # Add prompt template content
        if step_dict["prompt_template_id"]:
            prompt_query = """
            SELECT * FROM prompts WHERE id = :prompt_id
            """
            prompt_result = await database.fetch_one(
                query=prompt_query, 
                values={"prompt_id": step_dict["prompt_template_id"]}
            )
            if prompt_result:
                prompt_data = dict(prompt_result)
                step_dict["prompt_template"] = prompt_data["template"]
        
        # Add output schema content
        if step_dict["output_schema_id"]:
            schema_query = """
            SELECT * FROM schemas WHERE id = :schema_id
            """
            schema_result = await database.fetch_one(
                query=schema_query, 
                values={"schema_id": step_dict["output_schema_id"]}
            )
            if schema_result:
                schema_data = dict(schema_result)
                # Convert schema_json from string to dict if it's a string
                schema_json = schema_data["schema_json"]
                if isinstance(schema_json, str):
                    try:
                        import json
                        step_dict["output_schema"] = json.loads(schema_json)
                    except json.JSONDecodeError:
                        print(f"Error decoding schema JSON for step {step_id}")
                        step_dict["output_schema"] = {}
                else:
                    step_dict["output_schema"] = schema_json
        
        # Add one-shot example if available
        if step_dict["one_shot_id"]:
            oneshot_query = """
            SELECT * FROM one_shot_examples WHERE id = :oneshot_id
            """
            oneshot_result = await database.fetch_one(
                query=oneshot_query, 
                values={"oneshot_id": step_dict["one_shot_id"]}
            )
            if oneshot_result:
                oneshot_data = dict(oneshot_result)
                # Convert input_json and output_json from string to dict if needed
                input_json = oneshot_data["input_json"]
                output_json = oneshot_data["output_json"]
                
                if isinstance(input_json, str):
                    try:
                        import json
                        input_json = json.loads(input_json)
                    except json.JSONDecodeError:
                        print(f"Error decoding input JSON for step {step_id}")
                        input_json = {}
                        
                if isinstance(output_json, str):
                    try:
                        import json
                        output_json = json.loads(output_json)
                    except json.JSONDecodeError:
                        print(f"Error decoding output JSON for step {step_id}")
                        output_json = {}
                        
                # if output_json is not a list, make it a list
                if not isinstance(output_json, list):
                    output_json = [output_json]
                step_dict["oneshot_examples"] = output_json
        
        # Make sure input_map is a dictionary
        if isinstance(step_dict["input_map"], str):
            try:
                import json
                step_dict["input_map"] = json.loads(step_dict["input_map"])
            except json.JSONDecodeError:
                print(f"Error decoding input_map JSON for step {step_id}")
                step_dict["input_map"] = {}
        
        # Filter to only include fields defined in the response model plus our new fields
        filtered_step = {
            k: v for k, v in step_dict.items() 
            if k in StepResponse.model_fields or k in ["prompt_template", "output_schema", "oneshot_examples"]
        }
        
        return filtered_step
    except Exception as e:
        print(f"Error in get_step: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/steps", response_model=StepResponse)
async def create_or_update_step(step: StepUpdateRequest):
    """Create a new step or update an existing one with full content"""
    try:
        # Add more detailed logging to diagnose issues
        print(f"Received step data: {step}")
        
        # Get or create prompts, schemas, and oneshots
        prompt_id = None
        schema_id = None
        oneshot_id = None
        pydantic_schema_id = None
        
        # Handle prompt template
        if step.prompt_template:
            # Create a unique name for the prompt based on the step
            prompt_name = f"{step.name}_prompt_{datetime.utcnow().isoformat()}"
            
            # Create new prompt or update existing one
            prompt_id = await PromptSchemaStore.create_prompt(prompt_name, step.prompt_template)
        
        # Handle output schema
        if step.output_schema:
            # Create a unique name for the schema based on the step
            schema_name = f"{step.name}_schema_{datetime.utcnow().isoformat()}"
            
            # Convert output_schema to dict if it's a string
            schema_data = step.output_schema
            if isinstance(schema_data, str):
                try:
                    import json
                    schema_data = json.loads(schema_data)
                except json.JSONDecodeError:
                    print(f"Error decoding output_schema JSON: {schema_data}")
                    schema_data = {}
            
            # Create new schema or update existing one
            schema_id = await PromptSchemaStore.create_schema(schema_name, schema_data)
        
        # Handle Pydantic schema if provided
        if step.pydantic_schema_file_path and step.pydantic_schema_class_name:
            # Create a unique name for the Pydantic schema
            pydantic_name = f"{step.name}_pydantic_{datetime.utcnow().isoformat()}"
            
            # Create Pydantic schema record
            pydantic_schema_id = await PromptSchemaStore.create_pydantic_schema(
                name=pydantic_name,
                file_path=step.pydantic_schema_file_path,
                model_class_name=step.pydantic_schema_class_name,
                description=f"Pydantic schema for step {step.name}"
            )
        
        # Handle one-shot example
        if step.oneshot_examples:
            # Create a unique name for the one-shot based on the step
            oneshot_name = f"{step.name}_oneshot_{datetime.utcnow().isoformat()}"
            
            # Create new one-shot example
            oneshot_id = await PromptSchemaStore.create_one_shot(
                name=oneshot_name,
                input_json=step.oneshot_examples,
                output_json=step.oneshot_examples
            )
        
        # Create or update step
        if step.id:
            # Update existing step
            query = AgentStep.__table__.update().where(AgentStep.id == step.id).values(
                flow_id=step.flow_id,
                name=step.name,
                step_type=step.step_type,
                tool_name=step.tool_name,
                order=step.order,
                input_map=step.input_map,
                loop_key=step.loop_key,
                system_message=step.system_message,
                prompt_template_id=prompt_id or AgentStep.prompt_template_id,
                output_schema_id=schema_id or AgentStep.output_schema_id,
                pydantic_schema_id=pydantic_schema_id,
                one_shot_id=oneshot_id or AgentStep.one_shot_id,
                start_message=step.start_message,
                complete_message=step.complete_message,
                updated_at=datetime.utcnow()
            )
            await database.execute(query)
            step_id = step.id
        else:
            # Create new step
            step_id = str(uuid.uuid4())
            query = AgentStep.__table__.insert().values(
                id=step_id,
                flow_id=step.flow_id,
                name=step.name,
                step_type=step.step_type,
                tool_name=step.tool_name,
                order=step.order,
                input_map=step.input_map,
                loop_key=step.loop_key,
                system_message=step.system_message,
                prompt_template_id=prompt_id,
                output_schema_id=schema_id,
                pydantic_schema_id=pydantic_schema_id,
                one_shot_id=oneshot_id,
                start_message=step.start_message,
                complete_message=step.complete_message,
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            )
            await database.execute(query)
        
        # Get created/updated step
        query = """
        SELECT s.*, p.template as prompt_template, sch.schema_json as output_schema,
               ps.file_path as pydantic_schema_file_path, ps.model_class_name as pydantic_schema_class_name
        FROM agent_steps s
        LEFT JOIN prompts p ON s.prompt_template_id = p.id
        LEFT JOIN schemas sch ON s.output_schema_id = sch.id
        LEFT JOIN pydantic_schemas ps ON s.pydantic_schema_id = ps.id
        WHERE s.id = :step_id
        """
        result = await database.fetch_one(query=query, values={"step_id": step_id})
        
        if not result:
            raise ValueError(f"Step with ID {step_id} not found after creation/update")
            
        # Convert to response model format
        step_data = dict(result)
        
        # Parse JSON fields if needed
        input_map = step_data.get("input_map")
        if isinstance(input_map, str):
            try:
                import json
                input_map = json.loads(input_map)
            except:
                input_map = {}
        
        schema_json = step_data.get("output_schema")
        if isinstance(schema_json, str):
            try:
                import json
                schema_json = json.loads(schema_json)
            except:
                schema_json = {}
        
        # Format datetime fields
        created_at = step_data.get("created_at")
        if isinstance(created_at, datetime):
            created_at = created_at.isoformat()
        
        updated_at = step_data.get("updated_at")
        if isinstance(updated_at, datetime):
            updated_at = updated_at.isoformat()
        
        # Construct a valid response that matches StepResponse
        response = {
            "id": step_data["id"],
            "flow_id": step_data["flow_id"],
            "name": step_data["name"],
            "step_type": step_data["step_type"],
            "tool_name": step_data["tool_name"],
            "order": step_data["order"],
            "input_map": input_map,
            "loop_key": step_data["loop_key"],
            "system_message": step_data["system_message"],
            "prompt_template_id": step_data["prompt_template_id"],
            "output_schema_id": step_data["output_schema_id"],
            "one_shot_id": step_data["one_shot_id"],
            "pydantic_schema_id": step_data.get("pydantic_schema_id"),
            "start_message": step_data["start_message"],
            "complete_message": step_data["complete_message"],
            "created_at": created_at,
            "updated_at": updated_at,
            # Extended fields
            "prompt_template": step_data.get("prompt_template"),
            "output_schema": schema_json,
            "pydantic_schema_file_path": step_data.get("pydantic_schema_file_path"),
            "pydantic_schema_class_name": step_data.get("pydantic_schema_class_name"),
            "oneshot_examples": None  # This is acceptable as it's Optional in the model
        }
        
        return response
    except Exception as e:
        import logging
        logging.error(f"Error creating/updating step: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/flows/{flow_id}", response_model=FlowResponse)
async def update_flow(flow_id: str, flow_data: FlowUpdateRequest):
    """Update an existing flow"""
    try:
        # Check if flow exists
        flow = await FlowRegistry.get_flow_by_id(flow_id)
        if not flow:
            raise HTTPException(status_code=404, detail="Flow not found")
        
        # Prepare update data
        update_data = {
            "name": flow_data.name,
            "description": flow_data.description,
            "is_active": flow_data.is_active,
            "start_message": flow_data.start_message,
            "complete_message": flow_data.complete_message,
        }
        
        # Log the update data
        print(f"Updating flow {flow_id} with data: {update_data}")
        
        # Update flow - using the correct table name "agent_flows" instead of "flows"
        query = """
        UPDATE agent_flows
        SET name = :name,
            description = :description,
            is_active = :is_active,
            start_message = :start_message,
            complete_message = :complete_message,
            updated_at = :updated_at
        WHERE id = :flow_id
        """
        
        await database.execute(
            query=query,
            values={
                **update_data,
                "flow_id": flow_id,
                "updated_at": datetime.utcnow()
            }
        )
        
        # Get updated flow
        updated_flow = await FlowRegistry.get_flow_by_id(flow_id)
        
        # Convert datetime fields to strings
        flow_dict = convert_datetimes_to_strings(updated_flow)
        
        # Filter to only include fields defined in the response model
        filtered_flow = {
            k: v for k, v in flow_dict.items() 
            if k in FlowResponse.model_fields
        }
        
        return filtered_flow
    except Exception as e:
        print(f"Error updating flow: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e)) 
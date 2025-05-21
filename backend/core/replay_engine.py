import logging
import json
import uuid
from typing import Dict, Any, Optional, Tuple, Type
from datetime import datetime

from db.database import database
from db.models import StepRun, AgentStep
from core.step_executor import StepExecutor
from core.prompt_schema_store import PromptSchemaStore
from pydantic import BaseModel

logger = logging.getLogger(__name__)

class ReplayEngine:
    """
    Re-runs a single step with stored or modified inputs.
    Used for debugging, testing prompts, and improving step outputs.
    """
    
    @staticmethod
    async def get_step_run_details(step_run_id: str) -> Dict[str, Any]:
        """
        Get step run details including related step configuration
        
        Args:
            step_run_id: ID of the step run to retrieve
            
        Returns:
            Dict with step run details and associated step configuration
        """
        # Get the step run record
        query = """
        SELECT sr.*, s.name as step_name, s.step_type, s.tool_name, 
               s.prompt_template_id, s.output_schema_id, s.one_shot_id,
               s.pydantic_schema_id, s.system_message
        FROM step_runs sr
        JOIN agent_steps s ON sr.step_id = s.id
        WHERE sr.id = :step_run_id
        """
        result = await database.fetch_one(query=query, values={"step_run_id": step_run_id})
        
        if not result:
            raise ValueError(f"Step run with ID {step_run_id} not found")
        
        # Convert to dict
        step_run = dict(result)
        
        # Get the prompt template, output schema and one-shot example
        if step_run["prompt_template_id"]:
            prompt_query = """
            SELECT * FROM prompts WHERE id = :prompt_id
            """
            prompt_result = await database.fetch_one(
                query=prompt_query, 
                values={"prompt_id": step_run["prompt_template_id"]}
            )
            
            if prompt_result:
                step_run["prompt_template"] = dict(prompt_result)["template"]
        
        if step_run["output_schema_id"]:
            schema_query = """
            SELECT * FROM schemas WHERE id = :schema_id
            """
            schema_result = await database.fetch_one(
                query=schema_query, 
                values={"schema_id": step_run["output_schema_id"]}
            )
            
            if schema_result:
                step_run["output_schema"] = dict(schema_result)["schema_json"]
        
        if step_run.get("pydantic_schema_id"):
            pydantic_query = """
            SELECT * FROM pydantic_schemas WHERE id = :pydantic_schema_id
            """
            pydantic_result = await database.fetch_one(
                query=pydantic_query, 
                values={"pydantic_schema_id": step_run["pydantic_schema_id"]}
            )
            
            if pydantic_result:
                step_run["pydantic_schema"] = dict(pydantic_result)
        
        if step_run.get("one_shot_id"):
            one_shot_query = """
            SELECT * FROM one_shot_examples WHERE id = :one_shot_id
            """
            one_shot_result = await database.fetch_one(
                query=one_shot_query, 
                values={"one_shot_id": step_run["one_shot_id"]}
            )
            
            if one_shot_result:
                one_shot_data = dict(one_shot_result)
                step_run["one_shot_example"] = {
                    "input": one_shot_data["input_json"],
                    "output": one_shot_data["output_json"]
                }
        
        return step_run
    
    @staticmethod
    async def replay_step(
        step_run_id: str, 
        modified_input: Optional[Dict[str, Any]] = None,
        modified_prompt: Optional[str] = None,
        modified_schema: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Replay a step run with original or modified inputs
        
        Args:
            step_run_id: ID of the step run to replay
            modified_input: Optional modified input data
            modified_prompt: Optional modified prompt template
            modified_schema: Optional modified output schema
            
        Returns:
            Dict with replay results including input, output, and performance metrics
        """
        start_time = datetime.utcnow()
        
        try:
            # Get the step run and associated step details
            step_run = await ReplayEngine.get_step_run_details(step_run_id)
            
            # we should fetch these details from the step table instead of step_runs table
            query = """
            SELECT * FROM agent_steps WHERE id = :step_id
            """
            step_result = await database.fetch_one(query=query, values={"step_id": step_run["step_id"]})
            step = dict(step_result)
            
            # Override with modified values if provided
            input_data = modified_input if modified_input is not None else step_run["input_data"]
            
            # Create a new step run record for the replay
            replay_run_id = str(uuid.uuid4())
            insert_query = StepRun.__table__.insert().values(
                id=replay_run_id,
                flow_run_id=step_run["flow_run_id"],
                step_id=step_run["step_id"],
                status="running",
                input_data=input_data,
                started_at=datetime.utcnow()
            )
            await database.execute(insert_query)
            
            # Get associated assets
            assets = await PromptSchemaStore.get_step_assets(
                prompt_id=step["prompt_template_id"],
                schema_id=step["output_schema_id"],
                one_shot_id=step.get("one_shot_id"),
                pydantic_schema_id=step.get("pydantic_schema_id")
            )
            
            # Override with modified values if provided
            if modified_prompt is not None:
                assets["prompt_template"] = modified_prompt
                
            if modified_schema is not None:
                assets["output_schema"] = modified_schema
            
            # Execute based on step type
            rendered_prompt = None
            if step_run["step_type"] == "ai_single":
                status, output = await ReplayEngine._execute_ai_single(
                    step=step_run,
                    input_data=input_data,
                    assets=assets
                )
            elif step_run["step_type"] == "ai_loop":
                status, output = await ReplayEngine._execute_ai_loop(
                    step=step_run,
                    input_data=input_data,
                    assets=assets
                )
            elif step_run["step_type"] == "tool_call":
                # Tool call steps require the full step context and can't be easily replayed
                status = "error"
                output = {"error": "Tool call steps cannot be replayed directly"}
            else:
                status = "error"
                output = {"error": f"Unknown step type: {step_run['step_type']}"}
            
            # Update the replay run record
            end_time = datetime.utcnow()
            duration = (end_time - start_time).total_seconds()
            
            update_values = {
                "status": status,
                "output_data": output,
                "ended_at": end_time
            }
            
            if rendered_prompt:
                update_values["rendered_prompt"] = f'{rendered_prompt[0]}\n\n{rendered_prompt[1]}'
                
            update_query = StepRun.__table__.update().where(
                StepRun.id == replay_run_id
            ).values(**update_values)
            await database.execute(update_query)
            
            # Return the replay results
            return {
                "replay_run_id": replay_run_id,
                "original_run_id": step_run_id,
                "step_id": step_run["step_id"],
                "step_name": step_run["step_name"],
                "status": status,
                "input_data": input_data,
                "output_data": output,
                "duration": duration,
                "rendered_prompt": rendered_prompt
            }
            
            
        except Exception as e:
            logger.error(f"Error replaying step: {e}")
            end_time = datetime.utcnow()
            duration = (end_time - start_time).total_seconds()
            
            return {
                "status": "error",
                "error": str(e),
                "duration": duration
            }
    
    @staticmethod
    async def _execute_ai_single(
        step: Dict[str, Any], 
        input_data: Dict[str, Any],
        assets: Dict[str, Any]
    ) -> Tuple[str, Dict[str, Any]]:
        """
        Execute a single AI step for replay
        Similar to StepExecutor.execute_ai_single but uses provided assets
        """
        # Prepare the prompt
        prompt_template = assets["prompt_template"]
        output_schema = assets["output_schema"]
        system_message = step["system_message"]
        pydantic_model_class = assets.get("pydantic_model_class")
        
        # Build the full prompt with system message and input data
        full_prompt = f"{system_message}\n\n"
        
        # Add one-shot example if available
        if "one_shot_example" in assets:
            one_shot = assets["one_shot_example"]
            full_prompt += f"Example Input:\n{json.dumps(one_shot['input'], indent=2)}\n\n"
            full_prompt += f"Example Output:\n{json.dumps(one_shot['output'], indent=2)}\n\n"
        
        # Add input data
        full_prompt += f"Input:\n{json.dumps(input_data, indent=2)}\n\n"
        
        # Initialize OpenAI model and run structured generation
        openai_model = await StepExecutor.init_openai_model()
        output = await StepExecutor.run_structured_generation(
            openai_model=openai_model,
            prompt=full_prompt,
            schema_json=output_schema,
            pydantic_model_class=pydantic_model_class
        )
        
        return "success", output
    
    @staticmethod
    async def _execute_ai_loop(
        step: Dict[str, Any], 
        input_data: Dict[str, Any],
        assets: Dict[str, Any]
    ) -> Tuple[str, Dict[str, Any]]:
        """
        Execute an AI loop step for replay
        Similar to StepExecutor.execute_ai_loop but uses provided assets
        """
        # Get loop key and items
        loop_key = step.get("loop_key")
        if not loop_key or loop_key not in input_data:
            raise ValueError(f"Loop key '{loop_key}' not found in input data")
        
        loop_items = input_data[loop_key]
        if not isinstance(loop_items, list):
            raise ValueError(f"Loop key '{loop_key}' must point to a list")
        
        # Prepare step data
        prompt_template = assets["prompt_template"]
        output_schema = assets["output_schema"]
        system_message = step["system_message"]
        pydantic_model_class = assets.get("pydantic_model_class")
        
        # Initialize OpenAI model
        openai_model = await StepExecutor.init_openai_model()
        
        # Prepare system message
        system_message = step["system_message"]
        
        # Results will be collected here
        results = []
        
        # Process each item in the loop
        for item in loop_items:
            # Create item-specific input data
            item_input = input_data.copy()
            item_input["current_item"] = item

            # if previous loop runs have created an output_data, add it to the item_input
            item_input["previous_loop_outputs"] = results

            print(f"item_input-previous_loop_outputs: {item_input['previous_loop_outputs']}")
            
            # Build the full prompt
            full_prompt = f"{system_message}\n\n"
            
            # Add one-shot example if available
            if "one_shot_example" in assets:
                one_shot = assets["one_shot_example"]
                full_prompt += f"Example Input:\n{json.dumps(one_shot['input'], indent=2)}\n\n"
                full_prompt += f"Example Output:\n{json.dumps(one_shot['output'], indent=2)}\n\n"
            
            # Add input data
            full_prompt += f"Input:\n{json.dumps(item_input, indent=2)}\n\n"
            
            # Run structured generation
            output = await StepExecutor.run_structured_generation(
                openai_model=openai_model,
                prompt=full_prompt,
                schema_json=assets["output_schema"],
                pydantic_model_class=pydantic_model_class
            )
            
            # Add to results
            results.append(output)
        
        return "success", {"results": results} 
import logging
import json
import asyncio
import uuid
from typing import Dict, Any, List, Optional, Tuple, Type
from datetime import datetime, date, timezone, UTC
from concurrent.futures import ThreadPoolExecutor
import os
import outlines
from outlines.generate import json as generate_json

from db.database import database
from db.models import StepRun
from core.prompt_schema_store import PromptSchemaStore
from core.template_renderer import TemplateRenderer, DateTimeEncoder
from core.tool_call_module import ToolCallModule
from core.message_dispatcher import dispatch_message
from pydantic import BaseModel

logger = logging.getLogger(__name__)

# ThreadPoolExecutor for running Outlines generation in separate threads
executor = ThreadPoolExecutor()

class StepExecutor:
    """
    Executes a single step within a flow, based on its step_type.
    Handles AI-based steps (single or loop) and tool calls.
    """
    
    @staticmethod
    def extract_input_data(step_input_map: Dict[str, str], flow_state: Dict[str, Any]) -> Dict[str, Any]:
        """
        Construct input data for a step based on its input_map and flow state
        
        Args:
            step_input_map: Mapping of step inputs to sources in flow state
            flow_state: Current state of the flow execution
            
        Returns:
            Dictionary of input data for the step
        """
        input_data = {}
        
        for input_key, source_path in step_input_map.items():
            # Check if it's a direct reference to a step output
            if source_path in flow_state:
                input_data[input_key] = StepExecutor._ensure_serializable(flow_state[source_path])
            # Check if it's a nested path (dot notation)
            elif "." in source_path:
                # Split the path and navigate through the flow state
                parts = source_path.split(".")
                current = flow_state
                try:
                    for part in parts:
                        if part in current:
                            current = current[part]
                        else:
                            # Path not found
                            logger.warning(f"Path {source_path} not found in flow state for input {input_key}")
                            current = None
                            break
                    
                    if current is not None:
                        input_data[input_key] = StepExecutor._ensure_serializable(current)
                except (TypeError, KeyError) as e:
                    logger.error(f"Error extracting nested input {source_path}: {e}")
        
        # Verify the entire input_data can be serialized
        try:
            json.dumps(input_data, cls=DateTimeEncoder)
        except (TypeError, ValueError) as e:
            logger.error(f"Input data contains non-serializable objects: {e}")
            # Create a safe copy by converting problematic values to strings
            safe_input = {}
            for k, v in input_data.items():
                safe_input[k] = StepExecutor._ensure_serializable(v)
            return safe_input
            
        return input_data
    
    @staticmethod
    def _ensure_serializable(value):
        """
        Ensure a value is JSON-serializable
        
        Args:
            value: Any Python value
            
        Returns:
            A JSON-serializable version of the value
        """
        if isinstance(value, (str, int, float, bool, type(None))):
            return value
        elif isinstance(value, (datetime, date)):
            return value.isoformat()
        elif isinstance(value, dict):
            return {k: StepExecutor._ensure_serializable(v) for k, v in value.items()}
        elif isinstance(value, (list, tuple)):
            return [StepExecutor._ensure_serializable(item) for item in value]
        else:
            # For any other type, convert to string
            return str(value)
    
    @staticmethod
    async def init_openai_model():
        """Initialize the OpenAI model with API key from environment"""
        OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
        if not OPENAI_API_KEY:
            raise ValueError("OPENAI_API_KEY environment variable is not set")
        
        model_name = os.getenv("OPENAI_MODEL_NAME", "gpt-4.1-nano")
        
        return outlines.models.openai(
            model_name,
            api_key=OPENAI_API_KEY
        )
    
    @staticmethod
    async def run_structured_generation(
        openai_model, 
        prompt: str, 
        schema_json: Dict[str, Any], 
        pydantic_model_class: Optional[Type[BaseModel]] = None
    ):
        """
        Run structured generation using Outlines and OpenAI
        
        Args:
            openai_model: Initialized OpenAI model from Outlines
            prompt: Complete prompt text
            schema_json: JSON schema for structured output
            pydantic_model_class: Optional Pydantic model class for validation and parsing
            
        Returns:
            Structured output from the LLM
        """
        # if pydantic class is provided, pass it to the generator or pass the json schema instead
        if pydantic_model_class:
            generator = generate_json(openai_model, pydantic_model_class)
        else:
            # Pass the schema directly as a dict, not as a string
            schema_str = json.dumps(schema_json, cls=DateTimeEncoder)
            # Create the generator
            generator = generate_json(openai_model, schema_str)
        # Run in a thread pool to avoid blocking the event loop
        loop = asyncio.get_event_loop()
        try:
            result = await loop.run_in_executor(
                executor,
                lambda: generator(prompt)
            )

            # Check if the result is a Pydantic model instance
            if isinstance(result, BaseModel):
                # Convert Pydantic model to dictionary
                result = result.model_dump()
            logger.info(f"result: {result}")
            return result
        except Exception as e:
            logger.error(f"Error in structured generation: {e}")
            raise
    
    @staticmethod
    async def execute_step(
        step: Dict[str, Any],
        flow_run_id: str,
        project_id: str,
        flow_state: Dict[str, Any]
    ) -> Tuple[str, Dict[str, Any]]:
        """
        Execute a single step within a flow
        
        Args:
            step: Step metadata
            flow_run_id: ID of the current flow run
            project_id: ID of the project
            flow_state: Current state of the flow execution
            
        Returns:
            Tuple of (status, output_data)
        """
        step_id = step["id"]
        step_name = step["name"]
        step_type = step["step_type"]
        input_map = step["input_map"]
        
        # Create step run record
        step_run_id = await StepExecutor.create_step_run(flow_run_id, step_id)
        
        # Dispatch start message
        await dispatch_message(
            template=step.get("start_message"),
            context={"step_name": step_name},
            fallback_type="start_step",
            role="system",
            project_id=project_id
        )
        
        try:
            # Extract input data from flow state based on input_map
            input_data = StepExecutor.extract_input_data(input_map, flow_state)
            # Update step run with input data
            await StepExecutor.update_step_run(step_run_id, "running", input_data)

            # Skip the step if its a step from partial edit flow
            # And the edit plan for that step is empty
            # we will have to map the step name to edit plan key '
            # and then not execute the step and send the complete message
            # and update the step run status as skipped

            step_name_to_edit_plan_key = {
                "edit_use_cases": "useCases",
                "merge_use_cases": "useCases",
                "edit_use_case_details_loop": "useCases",
                "merge_use_case_details": "useCases",
                "edit_entities": "entities",
                "merge_entities": "entities",
                "edit_entity_assets_loop": "entities",
                "merge_entity_assets": "entities",
                "edit_page_schema": "pages",
                "merge_page_schema": "pages",
                "edit_page_details_loop": "pages",
                "merge_page_details": "pages"
            }
            logger.info(f"repr(step_name): {repr(step_name)}")
            logger.info(f"keys in step_name_to_edit_plan_key: {list(step_name_to_edit_plan_key.keys())}")

            edit_plan_key = step_name_to_edit_plan_key.get(step_name)
            logger.info(f"flow_state: {flow_state}")
            # Skip partial edit step if the associated list in editPlan is empty
            # but add a check if the editPlan key is not present
            if edit_plan_key and "edit_plan" in flow_state:
                planned_items = flow_state["edit_plan"].get(edit_plan_key, [])
                if not planned_items:
                    logger.info(f"Skipping step '{step_name}' — editPlan key '{edit_plan_key}' is empty.")

                    await StepExecutor.update_step_run(
                        step_run_id, 
                        "skipped",
                        input_data=input_data,
                        output_data={}
                    )

                    await dispatch_message(
                        template="Skipping step {{step_name}} — no changes were planned for this step.",
                        context={
                            "step_name": step_name,
                            "output_data": {},
                            "input_data": input_data
                        },
                        fallback_type="end_step",
                        role="system",
                        project_id=project_id
                    )

                    return "skipped", {}

                
            rendered_prompt = None
            # Execute based on step type
            if step_type == "ai_single":
                status, output_data, rendered_prompt = await StepExecutor.execute_ai_single(step, input_data)
            elif step_type == "ai_loop":
                status, output_data, rendered_prompt = await StepExecutor.execute_ai_loop(step, input_data)
            elif step_type == "tool_call":
                status, output_data = await StepExecutor.execute_tool_call(step, input_data)
            else:
                raise ValueError(f"Unknown step type: {step_type}")
            
            # Update step run with output data and rendered prompt
            await StepExecutor.update_step_run(
                step_run_id, 
                status,
                input_data=input_data,
                output_data=output_data,
                rendered_prompt=rendered_prompt
            )
            
            # Dispatch complete message
            await dispatch_message(
                template=step.get("complete_message"),
                context={"step_name": step_name, "output_data": output_data, "input_data": input_data},
                fallback_type="end_step",
                role="system",
                project_id=project_id
            )
            
            return status, output_data
            
        except Exception as e:
            logger.error(f"Error executing step {step_name}: {e}")
            
            # Update step run with error
            await StepExecutor.update_step_run(
                step_run_id,
                "error",
                input_data=input_data if 'input_data' in locals() else {},
                error_message=str(e)
            )
            
            # Dispatch error message
            await dispatch_message(
                template=f"Error in step {step_name}: {str(e)}",
                context={},
                fallback_type="end_step",
                role="error",
                project_id=project_id
            )
            
            return "error", {"error": str(e)}
    
    @staticmethod
    async def execute_ai_single(step: Dict[str, Any], input_data: Dict[str, Any]) -> Tuple[str, Dict[str, Any], str]:
        """
        Execute a single AI step
        
        Args:
            step: Step metadata
            input_data: Input data for the step
            
        Returns:
            Tuple of (status, output_data, rendered_prompt)
        """
        # Get step assets (prompt, schema, one-shot)
        assets = await PromptSchemaStore.get_step_assets(
            prompt_id=step["prompt_template_id"],
            schema_id=step["output_schema_id"],
            one_shot_id=step.get("one_shot_id"),
            pydantic_schema_id=step.get("pydantic_schema_id")
        )
        
        # Prepare the prompt components
        prompt_template = assets["prompt_template"]
        output_schema = assets["output_schema"]
        system_message = step["system_message"]
        one_shot_example = assets.get("one_shot_example")
        pydantic_model_class = assets.get("pydantic_model_class")
        
        # Build the full prompt with template renderer
        full_prompt = TemplateRenderer.build_full_prompt(
            template_text=prompt_template,
            input_data=input_data,
            system_message=system_message,
            one_shot_example=one_shot_example
        )
        # Initialize OpenAI model
        openai_model = await StepExecutor.init_openai_model()
        
        # Run structured generation
        output = await StepExecutor.run_structured_generation(
            openai_model=openai_model,
            prompt=full_prompt[0],
            schema_json=output_schema,
            pydantic_model_class=pydantic_model_class
        )
        prompt_with_error = f'{full_prompt[0]}\n\n{full_prompt[1]}'
        return "success", output, prompt_with_error
    
    @staticmethod
    async def execute_ai_loop(step: Dict[str, Any], input_data: Dict[str, Any]) -> Tuple[str, Dict[str, Any], str]:
        """
        Execute an AI loop step that iterates over a list in the input
        
        Args:
            step: Step metadata
            input_data: Input data for the step
            
        Returns:
            Tuple of (status, output_data, rendered_prompt)
        """
        
        loop_key = step["loop_key"]
        if not loop_key or loop_key not in input_data:
            raise ValueError(f"Loop key '{loop_key}' not found in input data")
        
        loop_items = input_data[loop_key]
        if not isinstance(loop_items, list):
            raise ValueError(f"Loop key '{loop_key}' must point to a list")
        
        # Get step assets once for all iterations
        assets = await PromptSchemaStore.get_step_assets(
            prompt_id=step["prompt_template_id"],
            schema_id=step["output_schema_id"],
            one_shot_id=step.get("one_shot_id"),
            pydantic_schema_id=step.get("pydantic_schema_id")
        )
        
        # Initialize OpenAI model once
        openai_model = await StepExecutor.init_openai_model()
        
        # Prepare system message and other assets
        system_message = step["system_message"]
        prompt_template = assets["prompt_template"]
        one_shot_example = assets.get("one_shot_example")
        pydantic_model_class = assets.get("pydantic_model_class")
        
        # Results will be collected here
        results = []
        all_prompts = []
        
        # Process each item in the loop
        for item in loop_items:
            # Create item-specific input data
            item_input = input_data.copy()
            item_input["current_item"] = item
            # if previous loop runs have created an output_data, add it to the item_input
            print(f"len(results): {len(results)}")
            if len(results) > 0:
                item_input["previous_loop_outputs"] = results
            
            # Build the full prompt with template renderer
            full_prompt = TemplateRenderer.build_full_prompt(
                template_text=prompt_template,
                input_data=item_input,
                system_message=system_message,
                one_shot_example=one_shot_example
            )
            all_prompts.append(f'{full_prompt[0]}\n\n{full_prompt[1]}')
            
            # Run structured generation
            output = await StepExecutor.run_structured_generation(
                openai_model=openai_model,
                prompt=full_prompt[0],
                schema_json=assets["output_schema"],
                pydantic_model_class=pydantic_model_class
            )
            
            # Add to results
            results.append(output)
        
        # Create a single combined prompt for storage
        combined_prompt = "\n\n=== LOOP ITERATION SEPARATOR ===\n\n".join(all_prompts)
        return "success", {"results": results}, combined_prompt
    
    @staticmethod
    async def execute_tool_call(step: Dict[str, Any], input_data: Dict[str, Any]) -> Tuple[str, Dict[str, Any]]:
        """
        Execute a tool call step
        
        Args:
            step: Step metadata
            input_data: Input data for the step
            
        Returns:
            Tuple of (status, output_data)
        """
        tool_name = step["tool_name"]
        if not tool_name:
            raise ValueError("Tool call step must have a tool_name")
        
        # Get step assets (prompt, schema) if they exist
        # Some tool calls might use prompt templates for input preparation
        if step.get("prompt_template_id") and step.get("output_schema_id"):
            assets = await PromptSchemaStore.get_step_assets(
                prompt_id=step["prompt_template_id"],
                schema_id=step["output_schema_id"],
                one_shot_id=step.get("one_shot_id")
            )
            
            # Render template if available
            if "prompt_template" in assets:
                prompt_template = assets["prompt_template"]
                system_message = step.get("system_message", "")
                one_shot_example = assets.get("one_shot_example")
                
                # Use template renderer to process input if needed
                try:
                    # This will only render the template part, not building a full prompt
                    rendered_input = TemplateRenderer.render_template(prompt_template, input_data)
                    # Parse the rendered input if it's JSON
                    try:
                        processed_input = json.loads(rendered_input)
                        input_data = processed_input
                    except json.JSONDecodeError:
                        # If not valid JSON, keep the original input_data
                        logger.warning("Rendered template is not valid JSON, using original input data")
                except Exception as e:
                    logger.error(f"Error rendering tool input template: {e}")
        
        # Execute the tool with processed input
        output = await ToolCallModule.execute_tool(tool_name, input_data)
        return "success", output
    
    @staticmethod
    async def create_step_run(flow_run_id: str, step_id: str) -> str:
        """Create a new step run record"""
        step_run_id = str(uuid.uuid4())
        query = StepRun.__table__.insert().values(
            id=step_run_id,
            flow_run_id=flow_run_id,
            step_id=step_id,
            status="running",
            input_data={},
            started_at=datetime.now(UTC)
        )
        await database.execute(query)
        return step_run_id
    
    @staticmethod
    async def update_step_run(
        step_run_id: str,
        status: str,
        input_data: Optional[Dict[str, Any]] = None,
        output_data: Optional[Dict[str, Any]] = None,
        error_message: Optional[str] = None,
        rendered_prompt: Optional[str] = None
    ) -> None:
        """Update a step run record"""
        values = {"status": status}
        
        if input_data is not None:
            # Convert input_data to JSON-serializable format
            try:
                # Test if it can be serialized
                json.dumps(input_data, cls=DateTimeEncoder)
                values["input_data"] = input_data
            except (TypeError, ValueError) as e:
                logger.error(f"Error serializing input_data: {e}")
                # Store what we can - convert to string representation
                safe_input = {k: str(v) if not isinstance(v, (dict, list)) else v for k, v in input_data.items()}
                values["input_data"] = safe_input
        
        if output_data is not None:
            # Convert output_data to JSON-serializable format
            try:
                # Check if the output is a Pydantic model instance
                if isinstance(output_data, BaseModel):
                    # Convert Pydantic model to dictionary
                    output_data = output_data.model_dump()

                # Test if it can be serialized
                json.dumps(output_data, cls=DateTimeEncoder)
                values["output_data"] = output_data
            except (TypeError, ValueError) as e:
                logger.error(f"Error serializing output_data: {e}")
                # Try to create a safe copy
                if isinstance(output_data, dict):
                    safe_output = {k: str(v) if not isinstance(v, (dict, list)) else v for k, v in output_data.items()}
                else:
                    safe_output = str(output_data)
                values["output_data"] = safe_output
        
        if error_message is not None:
            values["error_message"] = error_message
            
        if rendered_prompt is not None:
            values["rendered_prompt"] = rendered_prompt
        
        if status in ["success", "error", "skipped"]:
            values["ended_at"] = datetime.now(UTC)
        
        query = StepRun.__table__.update().where(
            StepRun.id == step_run_id
        ).values(**values)
        
        await database.execute(query) 
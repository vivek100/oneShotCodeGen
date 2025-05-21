import logging
import json
import uuid
from typing import Dict, Any, List, Optional, Tuple
from datetime import datetime

from db.database import database
from db.models import Message, Project, FlowRun
from core.flow_registry import FlowRegistry
from core.flow_runner import FlowRunner
from core.step_executor import StepExecutor
from core.prompt_schema_store import PromptSchemaStore
from core.message_dispatcher import dispatch_message

logger = logging.getLogger(__name__)

class AgentRouter:
    """
    Routes user messages to appropriate flows based on the main agent decision.
    """
    
    @staticmethod
    async def handle_message(project_id: str, message_content: str) -> Dict[str, Any]:
        """
        Handle a new user message by routing it to the appropriate flow
        
        Args:
            project_id: ID of the project/chat
            message_content: Content of the user message
            
        Returns:
            Dictionary with the result of message handling
        """
        # Save the user message
        await AgentRouter.save_message(project_id, "user", message_content)
        
        # Get project and message history
        project = await AgentRouter.get_project(project_id)
        if not project:
            raise ValueError(f"Project with ID {project_id} not found")
        
        all_message_history = await AgentRouter.get_message_history(project_id)
        message_history = [message for message in all_message_history if message.get("role") != "system"]
        
        # Run the main agent flow to decide what to do
        decision = await AgentRouter.run_main_agent_flow(project_id, message_content, message_history)
        action = decision.get("main_decision").get("action")
        reason = decision.get("main_decision").get("reason")
        prompt = decision.get("main_decision").get("prompt")
        
        # Check if we need to update project title and description
        project_title = decision.get("main_decision").get("projectTitle")
        project_description = decision.get("main_decision").get("projectDescription")
        
        # Update project title and description if provided
        if (project_title or project_description) and action == "start_create_flow":
            await AgentRouter.update_project_metadata(
                project_id, 
                title=project_title, 
                description=project_description
            )
        
        # Handle the decision
        if action == "start_create_flow":
            # User wants to create a new app
            flow_id = await AgentRouter.get_flow_id_by_name("create_app_flow")
            
            #create project metadata with id,title,description and version
            project_metadata = {
                "projectId": project_id, 
                "appName": project_title, 
                "appDescription": project_description,
                "version": 1
            }

            # Start the flow run
            flow_run_id = await FlowRunner.start_flow_run(
                flow_id=flow_id,
                project_id=project_id,
                initial_inputs={
                    "user_request": message_content,
                    "main_agent_prompt": prompt,
                    "main_agent_reason": reason,
                    "project_metadata": project_metadata
                }
            )
            
            return {
                "action": "create_flow_started",
                "flow_run_id": flow_run_id
            }
            
        elif action == "start_edit_flow":
            # User wants to edit an existing app
            flow_id = await AgentRouter.get_flow_id_by_name("edit_decision_flow")
            
            # Get the latest app version
            latest_app_version = await AgentRouter.get_latest_app_version(project_id)
            json_app_config = json.loads(latest_app_version["config_json"]) if latest_app_version else None
            if not json_app_config:
                # No app version found, respond with error
                await dispatch_message(
                    template="I can't edit an app that hasn't been created yet. Please create an app first.",
                    context={},
                    fallback_type="error",
                    role="assistant",
                    project_id=project_id
                )
                return {
                    "action": "error",
                    "reason": "No app version found to edit"
                }
            else:
                #get the project metadata
                project_metadata = json_app_config.get("app", {})
                #increment the version
                project_metadata["version"] = int(project_metadata["version"]) + 1
            
            # Start the edit decision flow
            flow_run_id = await FlowRunner.start_flow_run(
                flow_id=flow_id,
                project_id=project_id,
                initial_inputs={
                    "user_request": message_content,
                    "main_agent_prompt": prompt,
                    "main_agent_reason": reason,
                    "app_config": json_app_config,
                    "filtered_message_history": message_history,
                    "project_metadata": project_metadata
                }
            )
            # Get the flow run to check status and output
            flow_run = await FlowRunner.get_flow_run(flow_run_id)
            #check the status of the flow run , get the output and call the handle_edit_decision_completion function
            if flow_run and flow_run.get("status") == "complete":
                flow_output = flow_run.get("output", {})
                #call the handle_edit_decision_completion function, which handles the edit decision flow routing
                await AgentRouter.handle_edit_decision_completion(project_id, flow_output,message_content,project_metadata)
                return {
                    "action": "edit_flow_started",
                    "flow_run_id": flow_run_id
                }
            else:
                # Return a basic decision in case of error
                return {
                    "action": "respond_with_info",
                    "reason": "I encountered an error while processing your request. Please try again.",
                    "prompt": "I encountered an error while processing your request. Please try again.",
                }
            
            
        elif action == "ask_for_clarification":
            # Agent needs more information from the user
            await dispatch_message(
                template=prompt,
                context={},
                fallback_type="end_flow",
                role="assistant",
                project_id=project_id
            )
            
            return {
                "action": "asked_for_clarification",
                "message": reason
            }
            
        elif action == "respond_with_info":
            # Agent is providing information
            await dispatch_message(
                template=prompt,
                context={},
                fallback_type="end_flow",
                role="assistant",
                project_id=project_id
            )
            
            return {
                "action": "responded_with_info",
                "message": reason
            }
            
        elif action == "reject":
            # Agent is rejecting the request
            await dispatch_message(
                template=prompt,
                context={},
                fallback_type="end_flow",
                role="assistant",
                project_id=project_id
            )
            
            return {
                "action": "rejected",
                "reason": reason
            }
            
        else:
            # Unknown action
            error_message = f"Unknown action from main agent: {action}"
            await dispatch_message(
                template=prompt,
                context={},
                fallback_type="error",
                role="assistant",
                project_id=project_id
            )
            
            return {
                "action": "error",
                "reason": error_message
            }
    
    @staticmethod
    async def handle_flow_completion(flow_run_id: str, flow_name: str, flow_output: Dict[str, Any]) -> Dict[str, Any]:
        """
        Handle the completion of a flow by routing to the next action
        
        Args:
            flow_run_id: ID of the completed flow run
            flow_name: Name of the completed flow
            flow_output: Output from the flow
            
        Returns:
            Dictionary with the result of flow completion handling
        """
        # Get flow run details
        flow_run = await FlowRunner.get_flow_run(flow_run_id)
        if not flow_run:
            raise ValueError(f"Flow run with ID {flow_run_id} not found")
        
        project_id = flow_run["project_id"]
        
        # Handle based on flow type
        if flow_name == "edit_decision_flow":
            return await AgentRouter.handle_edit_decision_completion(project_id, flow_output)
        
        # Add other flow completion handlers here if needed
        
        # Default response
        return {
            "action": "flow_completed",
            "flow_name": flow_name,
            "flow_run_id": flow_run_id
        }
    
    @staticmethod
    async def handle_edit_decision_completion(project_id: str, edit_decision: Dict[str, Any],message_content: str,project_metadata: Dict[str, Any]) -> Dict[str, Any]:
        """
        Handle the completion of the edit decision flow
        
        Args:
            project_id: ID of the project
            edit_decision: Output from the edit decision flow
            
        Returns:
            Dictionary with the result of handling
        """
        action = edit_decision.get("edit_decision_step").get("action")
        reason = edit_decision.get("edit_decision_step").get("reason")
        edit_plan = edit_decision.get("edit_decision_step").get("editPlan")
        print(f"edit_decision: {edit_decision}")
        
        # Get latest app config
        latest_app_version = await AgentRouter.get_latest_app_version(project_id)
        json_app_config = json.loads(latest_app_version["config_json"]) if latest_app_version else None
        
        if action == "start_create_app_flow":
            # Changes are too large, need to regenerate the app
            await AgentRouter.save_message(
                project_id,
                "assistant",
                f"I'll create a new app from scratch based on your changes. Reason: {reason}"
            )
            
            #@TODO: need to fix the project metadata it should have the new app name and description
            #which should be generated by the edit decision flow and is not done as of now
            #so we are using the old app name and description
            #need to fix this
            
            #increment the version
            project_metadata["version"] = int(project_metadata["version"]) + 1

            # Start create app flow
            create_flow_id = await AgentRouter.get_flow_id_by_name("create_app_flow")
            flow_run_id = await FlowRunner.start_flow_run(
                flow_id=create_flow_id,
                project_id=project_id,
                initial_inputs={
                    "user_request": message_content,
                    "main_agent_prompt": reason,
                    "main_agent_reason" : reason,
                    "project_metadata": project_metadata
                }
            )
            
            return {
                "action": "create_flow_started",
                "flow_run_id": flow_run_id
            }
            
        elif action == "start_partial_edit_flow":
            # Changes can be handled via modular edits
            edit_summary = []
            
            # Generate summary of edit plan
            if edit_plan:
                # Summarize auth config changes
                if "auth_config" in edit_plan and edit_plan["auth_config"]:
                    auth_changes = [f"{item['action']} {item['id']}" for item in edit_plan["auth_config"]]
                    edit_summary.append(f"Auth changes: {', '.join(auth_changes)}")
                
                # Summarize use case changes
                if "use_cases" in edit_plan and edit_plan["use_cases"]:
                    use_case_changes = [f"{item['action']} {item['id']}" for item in edit_plan["use_cases"]]
                    edit_summary.append(f"Use case changes: {', '.join(use_case_changes)}")
                
                # Summarize entity changes
                if "entities" in edit_plan and edit_plan["entities"]:
                    entity_changes = [f"{item['action']} {item['id']}" for item in edit_plan["entities"]]
                    edit_summary.append(f"Entity changes: {', '.join(entity_changes)}")
                
                # Summarize page changes
                if "pages" in edit_plan and edit_plan["pages"]:
                    page_changes = [f"{item['action']} {item['id']}" for item in edit_plan["pages"]]
                    edit_summary.append(f"Page changes: {', '.join(page_changes)}")
            
            # Create summary message
            summary_message = f"I'll make the following changes: {'; '.join(edit_summary)}"
            await dispatch_message(
                template=summary_message,
                context={},
                fallback_type="end_flow",
                role="assistant",
                project_id=project_id
            )
            
            #increment the version
            project_metadata["version"] = int(project_metadata["version"]) + 1

            # Start partial edit flow
            # Note: In a real implementation, you would have this flow defined
            partial_edit_flow_id = await AgentRouter.get_flow_id_by_name("edit_partial_flow")
            if not partial_edit_flow_id:
                # Fallback if partial edit flow doesn't exist
                await dispatch_message(
                    template="I've planned the edits but the partial edit flow is not implemented yet. "
                    "Please check back later for this feature.",
                    context={},
                    fallback_type="error",
                    role="assistant",
                    project_id=project_id
                )
                return {
                    "action": "error",
                    "reason": "Partial edit flow not implemented"
                }
            
            flow_run_id = await FlowRunner.start_flow_run(
                flow_id=partial_edit_flow_id,
                project_id=project_id,
                initial_inputs={
                    "app_config": json_app_config,
                    "edit_plan": edit_plan,
                    "user_request": message_content,
                    "main_agent_prompt": reason,
                    "main_agent_reason" : reason,
                    "project_metadata": project_metadata
                }
            )
            
            return {
                "action": "partial_edit_flow_started",
                "flow_run_id": flow_run_id
            }
            
        elif action == "ask_for_clarification":
            # Need more information from the user
            await dispatch_message(
                template=reason,
                context={},
                fallback_type="end_flow",
                role="assistant",
                project_id=project_id
            )
            
            return {
                "action": "asked_for_clarification",
                "message": reason
            }
            
        elif action == "reject":
            # Rejecting the edit request
            await dispatch_message(
                template=reason,
                context={},
                fallback_type="end_flow",
                role="assistant",
                project_id=project_id
            )
            
            return {
                "action": "rejected",
                "reason": reason
            }
            
        else:
            # Unknown action
            error_message = f"Unknown action from edit decision flow: {action}"
            await AgentRouter.save_message(project_id, "error", error_message)
            
            return {
                "action": "error",
                "reason": error_message
            }
    
    @staticmethod
    async def run_main_agent_flow(project_id: str, message_content: str, message_history: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Run the main agent flow to decide how to handle a user message
        
        Args:
            project_id: ID of the project/chat
            message_content: Content of the user message
            message_history: List of previous messages in the chat
            
        Returns:
            Decision from the main agent flow
        """
        # Get the main agent flow
        flow_id = await AgentRouter.get_flow_id_by_name("main_agent_flow")
        if not flow_id:
            raise ValueError("Main agent flow not found")
        
        # Get the latest app version (if any)
        latest_app_version = await AgentRouter.get_latest_app_version(project_id)
        json_app_config = json.loads(latest_app_version["config_json"]) if latest_app_version else None

        try:
            # Prepare input data for the flow
            initial_inputs = {
                "user_request": message_content,
                "filtered_message_history": message_history,
                "app_config": json_app_config,
                "has_existing_app": json_app_config is not None
            }
            
            # Start the flow using FlowRunner
            flow_run_id = await FlowRunner.start_flow_run(
                flow_id=flow_id,
                project_id=project_id,
                initial_inputs=initial_inputs
            )
            
            # Get the flow run to check status and output
            flow_run = await FlowRunner.get_flow_run(flow_run_id)
            
            if flow_run and flow_run.get("status") == "complete":
                return flow_run.get("output", {})
            else:
                # Return a basic decision in case of error
                return {
                    "action": "respond_with_info",
                    "reason": "I encountered an error while processing your request. Please try again."
                }
            
        except Exception as e:
            logger.error(f"Error running main agent flow: {str(e)}")
            # Return a basic decision in case of error
            return {
                "action": "respond_with_info",
                "reason": f"I encountered an error while processing your request. Please try again."
            }
    
    @staticmethod
    async def get_flow_id_by_name(flow_name: str) -> Optional[str]:
        """Get flow ID by name (latest version)"""
        flow = await FlowRegistry.get_flow_by_name(flow_name)
        if flow:
            return flow["id"]
        return None
    
    @staticmethod
    async def get_project(project_id: str) -> Optional[Dict[str, Any]]:
        """Get project by ID"""
        query = Project.__table__.select().where(Project.id == project_id)
        result = await database.fetch_one(query)
        if result:
            return dict(result)
        return None
    
    @staticmethod
    async def get_message_history(project_id: str, limit: int = 50) -> List[Dict[str, Any]]:
        """Get message history for a project"""
        # Exclude system messages from history
        query = Message.__table__.select().where(
            (Message.project_id == project_id) & 
            (Message.role != "system")
        ).order_by(Message.created_at.desc()).limit(limit)
        
        results = await database.fetch_all(query)
        messages = [dict(result) for result in results]
        
        # Reverse to get chronological order
        messages.reverse()
        
        return messages
    
    @staticmethod
    async def get_latest_app_version(project_id: str) -> Optional[Dict[str, Any]]:
        """Get the latest app version for a project"""
        query = """
        SELECT * FROM app_versions
        WHERE project_id = :project_id
        ORDER BY version_number DESC
        LIMIT 1
        """
        result = await database.fetch_one(query=query, values={"project_id": project_id})
        if result:
            return dict(result)
        return None
    
    @staticmethod
    async def save_message(project_id: str, role: str, content: str) -> str:
        """Save a message to the database"""
        message_id = str(uuid.uuid4())
        query = Message.__table__.insert().values(
            id=message_id,
            project_id=project_id,
            role=role,
            content=content,
            created_at=datetime.utcnow()
        )
        await database.execute(query)
        return message_id
    
    @staticmethod
    async def start_project(title: str, user_id: Optional[str] = None, description: Optional[str] = None) -> str:
        """
        Start a new project/chat session
        
        Args:
            title: Title for the project
            user_id: Optional user ID
            description: Optional project description
            
        Returns:
            ID of the created project
        """
        project_id = str(uuid.uuid4())
        query = Project.__table__.insert().values(
            id=project_id,
            user_id=user_id,
            title=title,
            description=description,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        await database.execute(query)
        
        # Add a welcome message
        await AgentRouter.save_message(
            project_id=project_id,
            role="system",
            content=f"Project '{title}' created. You can now start generating your app configuration."
        )
        
        return project_id 

    @staticmethod
    async def update_project_metadata(project_id: str, title: Optional[str] = None, description: Optional[str] = None) -> None:
        """
        Update project title and description
        
        Args:
            project_id: ID of the project
            title: New title for the project (if provided)
            description: New description for the project (if provided)
        """
        if not (title or description):
            return  # Nothing to update
        
        update_fields = {}
        if title:
            update_fields["title"] = title
        if description:
            update_fields["description"] = description
        
        # Add timestamp for last update
        update_fields["updated_at"] = datetime.utcnow()
        
        # Build the update query
        query = Project.__table__.update().where(Project.id == project_id).values(**update_fields)
        
        # Execute the update
        await database.execute(query) 
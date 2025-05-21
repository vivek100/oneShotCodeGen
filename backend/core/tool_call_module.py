import logging
from typing import Dict, Any, List, Optional
import json
from datetime import datetime, timezone

logger = logging.getLogger(__name__)

class ToolCallModule:
    """
    A centralized utility module that executes all tool_call steps in the flow.
    These are non-AI operations that transform, validate, or finalize data.
    """
    
    @staticmethod
    async def execute_tool(tool_name: str, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Dispatch execution logic based on tool_name
        
        Args:
            tool_name: Name of the tool to execute
            input_data: Input data for the tool
            
        Returns:
            Output data from the tool execution
        """
        # Dispatch to the appropriate tool function
        if tool_name == "reorganize_entities_fk":
            return await ToolCallModule.reorganize_entities_fk(input_data)
        elif tool_name == "validate_and_merge":
            return await ToolCallModule.validate_and_merge(input_data)
        elif tool_name == "finalize_config_output":
            return await ToolCallModule.finalize_config_output(input_data)
        elif tool_name == "merge_use_cases":
            return await ToolCallModule.merge_use_cases(input_data)
        elif tool_name == "merge_use_case_details":
            return await ToolCallModule.merge_use_case_details(input_data)
        elif tool_name == "merge_entities":
            return await ToolCallModule.merge_entities(input_data)
        elif tool_name == "merge_entity_assets":
            return await ToolCallModule.merge_entity_assets(input_data)
        elif tool_name == "merge_page_schema":
            return await ToolCallModule.merge_page_schema(input_data)
        elif tool_name == "merge_page_details":
            return await ToolCallModule.merge_page_details(input_data)
        elif tool_name == "merge_config_outputs":
            return await ToolCallModule.merge_config_outputs(input_data)
        else:
            raise ValueError(f"Unknown tool: {tool_name}")
    
    @staticmethod
    async def reorganize_entities_fk(input_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Reorganize entities to correctly handle foreign key relationships
        
        Args:
            input_data: Must contain 'entities' key with list of entity objects
            
        Returns:
            Dictionary with 'reorganized_entities' key
        """
        entities = input_data.get("entities", [])
        if not entities:
            return {"reorganized_entities": []}
        
        # Logic to identify and organize FKs by dependency order
        # This is a placeholder implementation - actual logic would be more complex
        
        # 1. Build a dependency graph
        dependencies = {}
        for entity in entities:
            entity_name = entity.get("name", "")
            dependencies[entity_name] = []
            
            # Check fields for foreign keys
            for field in entity.get("fields", []):
                if field.get("type", "").startswith("FK"):
                    target_entity = field.get("target_entity")
                    if target_entity:
                        dependencies[entity_name].append(target_entity)
        
        # 2. Topological sort to order entities
        visited = set()
        temp_mark = set()
        ordered = []
        
        def visit(node):
            if node in temp_mark:
                # Circular dependency detected
                logger.warning(f"Circular dependency detected with entity {node}")
                return
            if node not in visited:
                temp_mark.add(node)
                for dep in dependencies.get(node, []):
                    if dep in dependencies:  # Only visit if the dep is a known entity
                        visit(dep)
                temp_mark.remove(node)
                visited.add(node)
                ordered.append(node)
        
        # Visit all nodes
        for entity_name in dependencies:
            if entity_name not in visited:
                visit(entity_name)
        
        # 3. Reorder entities based on sorted order
        name_to_entity = {entity.get("name"): entity for entity in entities}
        reorganized_entities = [name_to_entity[name] for name in ordered if name in name_to_entity]
        
        # 4. Add entities that weren't in the dependency graph (no FKs)
        for entity in entities:
            entity_name = entity.get("name")
            if entity_name not in ordered:
                reorganized_entities.append(entity)
        
        # 5. Annotate entities with FK information for clearer relationships
        for entity in reorganized_entities:
            for field in entity.get("fields", []):
                if field.get("type", "").startswith("FK"):
                    target_entity = field.get("target_entity")
                    target_field = field.get("target_field", "id")
                    field["fk_info"] = {
                        "target_entity": target_entity,
                        "target_field": target_field
                    }
        
        return {"reorganized_entities": reorganized_entities}
    
    @staticmethod
    async def validate_and_merge(input_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Validate and merge old and new values based on an edit plan
        
        Args:
            input_data: Must contain 'old_values', 'new_values', and 'edit_plan' keys
            
        Returns:
            Dictionary with 'merged_values' key and 'validation_errors' if issues found
        """
        old_values = input_data.get("old_values", {})
        new_values = input_data.get("new_values", {})
        edit_plan = input_data.get("edit_plan", {})
        
        # Input validation
        validation_errors = []
        
        if not isinstance(old_values, dict):
            validation_errors.append("old_values must be a dictionary")
            old_values = {}
            
        if not isinstance(new_values, dict):
            validation_errors.append("new_values must be a dictionary")
            new_values = {}
            
        if not isinstance(edit_plan, dict):
            validation_errors.append("edit_plan must be a dictionary")
            edit_plan = {}
        
        # Create a deep copy of the old values to avoid modifying the original
        merged_values = json.loads(json.dumps(old_values))
        
        # Process the edit plan
        for path, action in edit_plan.items():
            try:
                # Support for nested paths using dot notation (e.g., "user.profile.name")
                if "." in path:
                    parts = path.split(".")
                    # For nested operations, we need different approaches based on action type
                    if action == "add" or action == "edit":
                        # Get the new value to add/edit
                        new_value = new_values
                        try:
                            for part in parts:
                                new_value = new_value.get(part, {})
                        except (AttributeError, TypeError):
                            validation_errors.append(f"Cannot find path '{path}' in new_values")
                            continue
                            
                        # Navigate to the parent object in merged_values
                        parent = merged_values
                        for part in parts[:-1]:
                            if part not in parent:
                                parent[part] = {}
                            elif not isinstance(parent[part], dict):
                                parent[part] = {}
                            parent = parent[part]
                            
                        # Set the value
                        parent[parts[-1]] = new_value
                        
                    elif action == "delete":
                        # Navigate to the parent object
                        parent = merged_values
                        for part in parts[:-1]:
                            if part not in parent:
                                break
                            parent = parent[part]
                            
                        # Delete the key if it exists
                        if parts[-1] in parent:
                            del parent[parts[-1]]
                
                # Handle array operations (path format: "users[2]" or "items[*]")
                elif "[" in path and "]" in path:
                    base_path, index_str = path.split("[", 1)
                    index_str = index_str.rstrip("]")
                    
                    # Get the array from merged_values
                    if base_path not in merged_values or not isinstance(merged_values[base_path], list):
                        if action == "add":
                            merged_values[base_path] = []
                        else:
                            validation_errors.append(f"Path '{base_path}' is not an array in old_values")
                            continue
                    
                    # Handle different array operations
                    if index_str == "*":  # Apply to all items
                        if action == "delete":
                            merged_values[base_path] = []
                        elif action in ["add", "edit"]:
                            if base_path in new_values and isinstance(new_values[base_path], list):
                                merged_values[base_path] = new_values[base_path]
                            else:
                                validation_errors.append(f"Cannot find array '{base_path}' in new_values")
                    else:
                        try:
                            index = int(index_str)
                            if action == "delete":
                                if 0 <= index < len(merged_values[base_path]):
                                    merged_values[base_path].pop(index)
                            elif action in ["add", "edit"]:
                                if base_path in new_values and isinstance(new_values[base_path], list):
                                    if action == "add":
                                        merged_values[base_path].append(new_values[base_path][0] if new_values[base_path] else {})
                                    elif 0 <= index < len(merged_values[base_path]) and new_values[base_path]:
                                        if index < len(new_values[base_path]):
                                            merged_values[base_path][index] = new_values[base_path][index]
                                        else:
                                            validation_errors.append(f"Index {index} out of range in new_values['{base_path}']")
                                else:
                                    validation_errors.append(f"Cannot find array '{base_path}' in new_values")
                        except ValueError:
                            validation_errors.append(f"Invalid array index: {index_str}")
                
                # Simple top-level operations
                else:
                    if action == "add":
                        if path in new_values:
                            merged_values[path] = new_values[path]
                        else:
                            validation_errors.append(f"Key '{path}' not found in new_values for 'add' action")
                    elif action == "edit":
                        if path in new_values:
                            if path in merged_values:
                                merged_values[path] = new_values[path]
                            else:
                                validation_errors.append(f"Key '{path}' not found in old_values for 'edit' action")
                        else:
                            validation_errors.append(f"Key '{path}' not found in new_values for 'edit' action")
                    elif action == "delete":
                        if path in merged_values:
                            del merged_values[path]
                        else:
                            validation_errors.append(f"Key '{path}' not found in old_values for 'delete' action")
                    else:
                        validation_errors.append(f"Unknown action: {action} for path '{path}'")
            
            except Exception as e:
                validation_errors.append(f"Error processing path '{path}': {str(e)}")
        
        result = {"merged_values": merged_values}
        if validation_errors:
            result["validation_errors"] = validation_errors
            logger.warning(f"Validation errors during merge: {validation_errors}")
        
        return result
    
    @staticmethod
    async def finalize_config_output(input_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Aggregate all outputs from previous steps into a final structured app configuration.
        Args:
            input_data: Contains outputs from all steps in the flow
        Returns:
            Dictionary with 'final_app_config' key and optional 'validation_warnings'
        """
        validation_warnings = []

        # App metadata
        app_name = input_data.get("metadata", {}).get("appName", "Your first app")
        app_description = input_data.get("metadata", {}).get("appDescription", "We create your first app")
        created_by = input_data.get("metadata", {}).get("createdBy", "system")
        version = input_data.get("metadata", {}).get("version", "1.0.0")

        # Auth configuration
        auth_config = input_data.get("authConfig", {})
        if not auth_config:
            auth_config = {"roles": ["user", "admin"], "default_role": "user"}
            validation_warnings.append("No authConfig provided, using default roles.")

        # Use cases
        use_cases = input_data.get("useCaseDetails", [])

        # Process Entities and EntityAssets into Resources
        entities = input_data.get("entities", [])
        entity_assets = input_data.get("entityAssets", [])
        resources = {}

        entity_asset_map = {ea["entityName"]: ea for ea in entity_assets}

        for entity in entities:
            entity_name = entity["entityName"]
            fields = {field["fieldName"]: ToolCallModule._convert_field(field) for field in entity.get("fields", [])}
            resource = {
                "fields": fields
            }

            if entity_name in entity_asset_map:
                asset = entity_asset_map[entity_name]
                resource["actions"] = asset.get("actions", [])
                resource["permissions"] = {
                    perm["role"]: perm["allowedActions"]
                    for perm in asset.get("permissions", [])
                }
                # Map data rows based on fieldOrder
                field_order = asset.get("fieldOrder", [])
                data_rows = asset.get("dataRows", [])
                resource["data"] = [
                    dict(zip(field_order, row)) for row in data_rows
                ]
            else:
                validation_warnings.append(f"No entityAssets found for entity: {entity_name}")

            resources[entity_name] = resource

        # Process Pages: Merge pageSchema and pageDetails using 'id'
        page_schema = input_data.get("pageSchema", [])
        page_details = input_data.get("pageDetails", [])

        page_detail_map = {detail["id"]: detail for detail in page_details}
        pages = []

        for page in page_schema:
            page_id = page["id"]
            detail = page_detail_map.get(page_id, {})

            # Now transform zones -> components -> move props
            transformed_zones = []
            for zone in detail.get("zones", []):
                transformed_components = []
                for component in zone.get("components", []):
                    new_component = {
                        "type": component["type"],
                        "props": {k: v for k, v in component.items() if k != "type"}
                    }
                    transformed_components.append(new_component)

                transformed_zone = {
                    "name": zone["name"],
                    "components": transformed_components
                }
                transformed_zones.append(transformed_zone)

            page_obj = {
                "id": page_id,
                "title": page["title"],
                "path": page["path"],
                "icon": page["icon"],
                "showInSidebar": page["showInSidebar"],
                "sidebarOrder": page["sidebarOrder"],
                "roleAccess": page["roleAccess"],
                "layoutType": page["layoutType"],
                "zones": transformed_zones
            }

            if not page_obj["zones"]:
                validation_warnings.append(f"No page details (zones) found for page: {page_id}")

            pages.append(page_obj)

        # Final Assembling
        final_app_config = {
            "app": {
                "name": app_name,
                "description": app_description,
                "version": version,
                "createdBy": created_by
            },
            "auth": auth_config,
            "useCases": use_cases,
            "pages": pages,
            "resources": resources,
            "settings": {
                "enableAuth": True,
                "enableLogging": True,
                "persistenceMode": "memory"
            }
        }

        result = {"final_app_config": final_app_config}

        if validation_warnings:
            result["validation_warnings"] = validation_warnings
            logger.warning(f"Validation warnings during finalization: {validation_warnings}")

        return result

    @staticmethod
    def _convert_field(field: Dict[str, Any]) -> Dict[str, Any]:
        """
        Helper to map entity fields to resource fields.
        """
        field_data = {
            "type": field.get("type", "text"),
            "required": field.get("required", False)
        }
        if "reference" in field and field["reference"]:
            field_data["reference"] = field["reference"]
        return field_data

    # --- Edit Flow Merge Operations ---
    
    @staticmethod
    async def merge_use_cases(input_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Merge old and updated use cases based on edit plan
        
        Args:
            input_data: Must contain 'old_use_cases', 'updated_use_cases', and 'edit_plan.use_cases'
            
        Returns:
            Dictionary with 'merged_use_cases' key
        """
        old_use_cases = input_data.get("oldUseCases", [])
        updated_use_cases = input_data.get("updatedUseCases", [])
        edit_plan = input_data.get("editPlanUseCases", [])
        
        # Create lookup maps
        old_map = {uc.get("id"): uc for uc in old_use_cases}
        updated_map = {uc.get("id"): uc for uc in updated_use_cases}
        
        # Apply edits
        merged_use_cases = []
        
        # First include all old use cases that aren't being changed
        for uc in old_use_cases:
            uc_id = uc.get("id")
            if not any(edit.get("id") == uc_id for edit in edit_plan):
                merged_use_cases.append(uc)
        
        # Then apply edits from the plan
        for edit in edit_plan:
            action = edit.get("action")
            uc_id = edit.get("id")
            
            if action == "add" and uc_id in updated_map:
                merged_use_cases.append(updated_map[uc_id])
            elif action == "edit" and uc_id in updated_map:
                merged_use_cases.append(updated_map[uc_id])
            # For delete, we've already skipped it above
        
        return {"merged_use_cases": merged_use_cases}
    
    @staticmethod
    async def merge_use_case_details(input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Similar to merge_use_cases but for use case details"""
        old_details = input_data.get("oldUseCaseDetail", [])
        updated_details = input_data.get("updatedUseCaseDetail", [])
        edit_plan = input_data.get("editPlanUseCases", [])
        
        # Apply similar merge logic as merge_use_cases
        merged_details = []
        
        # First include all old details that aren't being changed
        old_map = {detail.get("id"): detail for detail in old_details}
        updated_map = {detail.get("id"): detail for detail in updated_details}
        
        for detail in old_details:
            use_case_id = detail.get("id")
            if not any(edit.get("id") == use_case_id for edit in edit_plan):
                merged_details.append(detail)
        
        # Then apply edits from the plan
        for edit in edit_plan:
            action = edit.get("action")
            use_case_id = edit.get("id")
            
            if action == "add" and use_case_id in updated_map:
                merged_details.append(updated_map[use_case_id])
            elif action == "edit" and use_case_id in updated_map:
                merged_details.append(updated_map[use_case_id])
        
        return {"merged_use_case_details": merged_details}
    
    @staticmethod
    async def merge_entities(input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Merge entities based on edit plan"""
        old_entities_dict = input_data.get("oldEntities", {})  # dict: id -> transformed entity
        updated_entities = input_data.get("updatedEntities", [])  # list of AI-generated raw entities
        edit_plan = input_data.get("editPlanEntities", [])

        updated_map = {entity["id"]: entity for entity in updated_entities}
        merged_entities = {}

        # Retain unchanged old entities
        for entity_id, entity_data in old_entities_dict.items():
            if not any(edit["id"] == entity_id for edit in edit_plan):
                merged_entities[entity_id] = entity_data

        # Add or edit entities from updated map
        for edit in edit_plan:
            entity_id = edit["id"]
            action = edit["action"]
            if entity_id in updated_map and action in {"add", "edit"}:
                raw_entity = updated_map[entity_id]
                # Convert AI-generated entity back into resource structure
                transformed_entity = ToolCallModule.convert_entity_to_resource(raw_entity)
                merged_entities[entity_id] = transformed_entity

        # Reorganize FK (optional)
        merged_entities = ToolCallModule.reorganize_entities_fk(merged_entities)

        return {"merged_entities": merged_entities}
    
    @staticmethod
    def convert_entity_to_resource(entity: Dict[str, Any]) -> Dict[str, Any]:
        fields = {
            field["fieldName"]: ToolCallModule._convert_field(field)
            for field in entity.get("fields", [])
        }
        return {
            "fields": fields
        }

    @staticmethod
    async def merge_entity_assets(input_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Merge entity assets based on edit plan.

        Args:
            input_data: Should contain:
                - oldEntityAssets (dict): entity_id -> transformed asset structure
                - updatedEntityAssets (list): list of AI-generated raw entity assets
                - editPlanEntities (list): edit plan with {id, action}

        Returns:
            Dict with 'merged_entity_assets': dict keyed by entityId
        """
        old_assets_dict = input_data.get("oldEntityAssets", {})  # Dict[str, Dict]
        updated_assets = input_data.get("updatedEntityAssets", [])  # List[Dict]
        edit_plan = input_data.get("editPlanEntities", [])

        updated_map = {a["id"]: a for a in updated_assets}
        merged_assets = {}

        # Retain assets not being edited or added
        for entity_id, asset_data in old_assets_dict.items():
            if not any(edit["id"] == entity_id for edit in edit_plan):
                merged_assets[entity_id] = asset_data

        # Apply additions/edits
        for edit in edit_plan:
            action = edit.get("action")
            entity_id = edit.get("id")

            if entity_id in updated_map and action in {"add", "edit"}:
                raw_asset = updated_map[entity_id]
                transformed_asset = ToolCallModule.convert_asset_to_internal(raw_asset)
                merged_assets[entity_id] = transformed_asset

        return {"merged_entity_assets": merged_assets}
    
    @staticmethod
    def convert_asset_to_internal(raw_asset: Dict[str, Any]) -> Dict[str, Any]:
        # Permissions conversion: list → dict
        permissions_array = raw_asset.get("permissions", [])
        permissions_map = {
            p["role"]: p["allowedActions"] for p in permissions_array
        }

        # Data conversion: fieldOrder + dataRows → list of dicts
        field_order = raw_asset.get("fieldOrder", [])
        data_rows = raw_asset.get("dataRows", [])
        data_list = [
            dict(zip(field_order, row)) for row in data_rows
        ]

        return {
            "actions": raw_asset.get("actions", []),
            "permissions": permissions_map,
            "data": data_list
        }


    
    @staticmethod
    async def merge_page_schema(input_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Merge page schema based on edit plan
        
        Args:
            input_data: Must contain 'old_page_schema', 'updated_page_schema', and 'edit_plan.pages'
            
        Returns:
            Dictionary with 'merged_page_schema' key
        """
        old_schema = input_data.get("oldPageSchema", [])
        updated_schema = input_data.get("updatedPageSchema", [])
        edit_plan = input_data.get("editPlanPages", [])
        
        # Create lookup maps by page ID
        old_map = {page.get("id"): page for page in old_schema}
        updated_map = {page.get("id"): page for page in updated_schema}
        
        merged_schema = []
        
        # First include all old pages that aren't being changed
        for page in old_schema:
            page_id = page.get("id")
            if not any(edit.get("id") == page_id for edit in edit_plan):
                merged_schema.append(page)
        
        # Then apply edits from the plan
        for edit in edit_plan:
            action = edit.get("action")
            page_id = edit.get("id")
            
            if action == "add" and page_id in updated_map:
                merged_schema.append(updated_map[page_id])
            elif action == "edit" and page_id in updated_map:
                merged_schema.append(updated_map[page_id])
            # For delete, we've already skipped it above
        
        return {"merged_page_schema": merged_schema}
    
    @staticmethod
    async def merge_page_details(input_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Merge page details based on edit plan, transforming updated details into internal format.

        Args:
            input_data: Should include:
                - oldPageDetails (List[Dict]) in final app config format
                - updatedPageDetails (List[Dict]) from AI, with props at top level
                - editPlanPages (List[Dict]) with {id, action}

        Returns:
            Dict with 'merged_page_details' as a list of transformed page details
        """
        old_details = input_data.get("oldPageDetails", [])
        updated_details = input_data.get("updatedPageDetails", [])
        edit_plan = input_data.get("editPlanPages", [])

        updated_map = {detail["id"]: detail for detail in updated_details}
        merged_details = []

        # Retain old pages not edited
        for detail in old_details:
            page_id = detail.get("id")
            if not any(edit["id"] == page_id for edit in edit_plan):
                merged_details.append(detail)

        # Add/edit updated pages with transformed zones/components
        for edit in edit_plan:
            action = edit.get("action")
            page_id = edit.get("id")

            if page_id in updated_map and action in {"add", "edit"}:
                raw_detail = updated_map[page_id]

                # Transform each component to have { type, props }
                transformed_zones = []
                for zone in raw_detail.get("zones", []):
                    transformed_components = []
                    for component in zone.get("components", []):
                        component_type = component.get("type")
                        component_props = {k: v for k, v in component.items() if k != "type"}
                        transformed_components.append({
                            "type": component_type,
                            "props": component_props
                        })

                    transformed_zones.append({
                        "name": zone.get("name"),
                        "components": transformed_components
                    })

                transformed_detail = {
                    "id": page_id,
                    "zones": transformed_zones
                }

                merged_details.append(transformed_detail)

        return {"merged_page_details": merged_details}

    @staticmethod
    async def merge_config_outputs(input_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Assemble the final app configuration based on selectively updated components and an edit plan.

        Args:
            input_data: Contains originalAppConfig, editPlan, metadata, and optionally updated components.

        Returns:
            Dict with 'final_app_config' and optional 'validation_messages'.
        """
        from datetime import datetime, timezone

        original = input_data.get("originalAppConfig", {})
        edit_plan = input_data.get("editPlan", {})
        metadata = input_data.get("metadata", {})
        validation_messages = []

        if not original:
            validation_messages.append("No original app config found; default shell created.")
            original = {
                "app": {"name": "Untitled App", "description": "Generated App", "version": "0.0.1", "createdBy": "system"},
                "auth": {"roles": ["user", "admin"], "default_role": "user"},
                "useCases": [],
                "resources": {},
                "pages": [],
                "settings": {
                    "enableAuth": True,
                    "enableLogging": True,
                    "persistenceMode": "memory"
                }
            }

        # 1. App metadata
        app_name = metadata.get("appName", original.get("app", {}).get("name", "Untitled App"))
        app_description = metadata.get("appDescription", original.get("app", {}).get("description", ""))
        created_by = metadata.get("createdBy", original.get("app", {}).get("createdBy", "system"))
        version = metadata.get("version", original.get("app", {}).get("version", "1.0.0"))

        # 2. Auth config
        if edit_plan.get("authConfig"):
            auth_config = input_data.get("authConfig", {})
        else:
            auth_config = original.get("auth", {})

        # 3. Use cases
        if edit_plan.get("useCases"):
            use_cases = input_data.get("useCaseDetails", [])
        else:
            use_cases = original.get("useCases", [])

        # 4. Resources
        if edit_plan.get("entities"):
            resources = input_data.get("entities", {})
        else:
            resources = original.get("resources", {})

        # 5. Pages
        if edit_plan.get("pages"):
            pages = input_data.get("pageDetails", [])
        else:
            pages = original.get("pages", [])

        # 6. Assemble
        final_app_config = {
            "app": {
                "name": app_name,
                "description": app_description,
                "version": version,
                "createdBy": created_by
            },
            "auth": auth_config,
            "useCases": use_cases,
            "resources": resources,
            "pages": pages,
            "settings": {
                "enableAuth": True,
                "enableLogging": True,
                "persistenceMode": "memory"
            }
        }

        result = {"final_app_config": final_app_config}

        if validation_messages:
            result["validation_messages"] = validation_messages
            logger.warning(f"Validation messages during merge: {validation_messages}")

        return result

from pathlib import Path
import json
import shutil
from typing import Dict, Any
from datetime import datetime
from ..models.edit_flow_models import UpdateStrategy
from .ai_integration import EditFlowAI
from ..utils.context_loader import ContextLoader
from ..generators.use_case_generator import generate_use_cases
from ..generators.entity_generator import generate_entities
from ..generators.interface_generator import generate_interface
from ..generators.mock_data_generator import generate_mock_data
from ..utils.output_handler import (
    create_output_directory,
    save_domain_model,
    save_interface_model,
    save_partial_model
)

class StrategyExecutor:
    def __init__(self, project_dir: Path, strategy: UpdateStrategy):
        self.project_dir = project_dir
        self.strategy = strategy
        self.context_loader = ContextLoader(project_dir)
        self.ai = EditFlowAI()
        self.backup_dir = project_dir / "backups" / self._get_backup_name()
    
    def _get_backup_name(self) -> str:
        """Generate backup directory name"""
        return f"backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
    
    async def execute(self):
        """Execute the chosen strategy"""
        self._create_backup()
        
        try:
            if self.strategy.strategy_type == "full_regeneration":
                await self._execute_full_regeneration()
            elif self.strategy.strategy_type == "partial_update":
                await self._execute_partial_update()
            else:
                await self._execute_use_case_update()
        except Exception as e:
            self._restore_backup()
            raise Exception(f"Strategy execution failed: {str(e)}")

    async def _execute_full_regeneration(self):
        """Execute full regeneration strategy"""
        if not self.strategy.starter_prompt:
            raise ValueError("Starter prompt required for full regeneration")
            
        # Use existing generation pipeline with new starter prompt
        use_case_model = generate_use_cases(self.strategy.starter_prompt)
        entity_model = generate_entities(self.strategy.starter_prompt, use_case_model)
        mock_data_model = generate_mock_data(entity_model)
        interface_model = generate_interface(entity_model)
        
        self._save_models({
            "use_case_model": use_case_model,
            "entity_model": entity_model,
            "mock_data_model": mock_data_model,
            "interface_model": interface_model
        })

    async def _execute_partial_update(self):
        """Execute partial update using required generators"""
        try:
            updated_models = {}
            
            # Get original app description from use cases
            original_use_cases = self._load_model("use_case_model")
            original_app_description = original_use_cases.get("description", "")
            
            # Step 1: Use Cases (if needed)
            if "use_case" in self.strategy.required_generators:
                change_requirements = self.strategy.change_summary["use_case"]
                
                # Create enhanced description that includes app context and changes
                enhanced_description = f"""
                Original Application Description:
                {original_app_description}

                Update the existing use cases with the following changes.
                
                Existing Use Cases:
                {json.dumps(original_use_cases, indent=2)}
                
                Required Changes:
                {change_requirements.changes_needed}
                
                Important:
                1. Preserve all existing use cases unless explicitly modified
                2. Add new use cases as specified
                3. Ensure consistency with existing functionality
                """
                
                updated_models["use_case_model"] = generate_use_cases(enhanced_description)
                save_partial_model(self.project_dir, "use_cases", updated_models["use_case_model"])
            
            # Step 2: Entities (if needed)
            if "entity" in self.strategy.required_generators:
                change_requirements = self.strategy.change_summary["entity"]
                existing_model = self._load_model("entity_model")
                use_case_model = updated_models.get("use_case_model", self._load_model("use_case_model"))
                
                enhanced_description = f"""
                Original Application Description:
                {original_app_description}

                Update the existing entities with the following changes.
                
                Existing Entities:
                {json.dumps(existing_model, indent=2)}
                
                Required Changes:
                {change_requirements.changes_needed}
                
                Important:
                1. Preserve all existing entities and their relationships
                2. Add new entities/fields as specified
                3. Update relationships as needed
                4. Maintain data consistency
                """
                
                updated_models["entity_model"] = generate_entities(enhanced_description, use_case_model)
                save_partial_model(self.project_dir, "entities", updated_models["entity_model"])
            
            # Step 3: Mock Users (if needed)
            if "mock_user" in self.strategy.required_generators:
                change_requirements = self.strategy.change_summary["mock_user"]
                existing_model = self._load_model("mock_user_model")
                use_case_model = updated_models.get("use_case_model", self._load_model("use_case_model"))
                entity_model = updated_models.get("entity_model", self._load_model("entity_model"))
                
                enhanced_description = f"""
                Original Application Description:
                {original_app_description}

                Update the existing mock users with the following changes.
                
                Existing Mock Users:
                {json.dumps(existing_model, indent=2)}
                
                Required Changes:
                {change_requirements.changes_needed}
                
                Important:
                1. Preserve existing mock users unless explicitly modified
                2. Add new users as specified
                3. Ensure proper roles and permissions
                """
                
                updated_models["mock_user_model"] = generate_mock_users(
                    enhanced_description,
                    use_case_model,
                    entity_model
                )
                save_partial_model(self.project_dir, "mock_users", updated_models["mock_user_model"])
            
            # Step 4: Mock Data (if needed)
            if "mock_data" in self.strategy.required_generators:
                change_requirements = self.strategy.change_summary["mock_data"]
                existing_model = self._load_model("mock_data_model")
                use_case_model = updated_models.get("use_case_model", self._load_model("use_case_model"))
                entity_model = updated_models.get("entity_model", self._load_model("entity_model"))
                mock_user_model = updated_models.get("mock_user_model", self._load_model("mock_user_model"))
                
                enhanced_description = f"""
                Original Application Description:
                {original_app_description}

                Update the existing mock data with the following changes.
                
                Existing Mock Data:
                {json.dumps(existing_model, indent=2)}
                
                Required Changes:
                {change_requirements.changes_needed}
                
                Important:
                1. Preserve existing mock data unless explicitly modified
                2. Add new mock data for added entities/fields
                3. Ensure data consistency across related entities
                4. Maintain referential integrity
                """
                
                updated_models["mock_data_model"] = generate_mock_data(
                    enhanced_description,
                    use_case_model,
                    entity_model,
                    mock_user_model
                )
                save_partial_model(self.project_dir, "mock_data", updated_models["mock_data_model"])
            
            # Step 5: Combine Models and Update Interface
            domain_model = self._combine_models(
                updated_models.get("use_case_model", self._load_model("use_case_model")),
                updated_models.get("entity_model", self._load_model("entity_model")),
                updated_models.get("mock_user_model", self._load_model("mock_user_model")),
                updated_models.get("mock_data_model", self._load_model("mock_data_model"))
            )
            
            # Save domain model
            save_domain_model(self.project_dir, domain_model)
            
            # Update interface if needed
            if "interface" in self.strategy.required_generators:
                change_requirements = self.strategy.change_summary["interface"]
                existing_interface = self._load_model("interface_model")
                
                # Include original app description and interface changes in domain model
                domain_model["original_description"] = original_app_description
                domain_model["existing_interface"] = existing_interface
                domain_model["interface_changes"] = change_requirements.changes_needed
                
                interface_model = generate_interface(domain_model)
                save_interface_model(self.project_dir, interface_model, domain_model)
                
        except Exception as e:
            raise Exception(f"Partial update failed: {str(e)}")

    async def _run_generator(self, generator_type: str, prompt: str, 
                           existing_model: Dict[str, Any]) -> Dict[str, Any]:
        """Run specific generator with enhanced prompt"""
        if generator_type == "use_case":
            return generate_use_cases(prompt)
        elif generator_type == "entity":
            use_case_model = self._load_model("use_case_model")
            return generate_entities(prompt, use_case_model)
        elif generator_type == "mock_data":
            entity_model = self._load_model("entity_model")
            return generate_mock_data(entity_model)
        elif generator_type == "interface":
            entity_model = self._load_model("entity_model")
            return generate_interface(entity_model)
        else:
            raise ValueError(f"Unknown generator type: {generator_type}")

    def _get_original_prompt(self, generator_type: str) -> str:
        """Get original prompt template for generator"""
        # These would be loaded from your prompt templates
        prompts = {
            "use_case": "Generate use cases...",
            "entity": "Generate entities...",
            "mock_data": "Generate mock data...",
            "interface": "Generate interface..."
        }
        return prompts.get(generator_type, "")

    def _create_backup(self):
        """Create backup of current project state"""
        self.backup_dir.parent.mkdir(exist_ok=True)
        shutil.copytree(self.project_dir, self.backup_dir, 
                       ignore=shutil.ignore_patterns('backups', '__pycache__', '*.pyc'))
    
    def _restore_backup(self):
        """Restore from backup in case of failure"""
        if self.backup_dir.exists():
            shutil.rmtree(self.project_dir)
            shutil.copytree(self.backup_dir, self.project_dir)
    
    def _save_models(self, models: Dict[str, Any]):
        """Save all generated models"""
        for name, model in models.items():
            self._save_model(name, model)
    
    def _save_model(self, name: str, model: Any):
        """Save individual model"""
        file_path = self.project_dir / f"{name}.json"
        with open(file_path, "w") as f:
            if hasattr(model, "model_dump"):
                json.dump(model.model_dump(), f, indent=2)
            else:
                json.dump(model, f, indent=2)
    
    def _load_model(self, model_name: str) -> Dict[str, Any]:
        """Load existing model from file"""
        model_file = self.project_dir / f"{model_name}.json"
        if model_file.exists():
            with open(model_file) as f:
                return json.load(f)
        return {} 

    async def _update_use_cases(self, change_requirements: Dict[str, Any], existing_model: Dict[str, Any]) -> Dict[str, Any]:
        """Update use cases with changes while preserving existing ones"""
        from ..generators.use_case_generator import generate_use_cases
        
        # Get original prompt template
        with open('prompts/use_case_prompt.txt', 'r') as f:
            original_prompt = f.read()
        
        # Create enhanced prompt
        prompt = f"""
        Given the existing use cases and required changes, generate an updated use case model.
        
        Existing Use Cases:
        {json.dumps(existing_model, indent=2)}
        
        Required Changes:
        {change_requirements.changes_needed}
        
        {original_prompt}
        
        Additional Requirements:
        1. Preserve all existing use cases unless explicitly modified
        2. Add new use cases as specified
        3. Ensure consistency with existing functionality
        4. Maintain relationships with other components
        """
        
        return generate_use_cases(prompt)

    async def _update_entities(self, change_requirements: Dict[str, Any], existing_model: Dict[str, Any], 
                             use_case_model: Dict[str, Any]) -> Dict[str, Any]:
        """Update entities with changes while preserving existing ones"""
        from ..generators.entity_generator import generate_entities
        
        # Get original prompt template
        with open('prompts/entity_prompt.txt', 'r') as f:
            original_prompt = f.read()
        
        # Create enhanced prompt
        prompt = f"""
        Given the existing entities and required changes, generate an updated entity model.
        
        Existing Entities:
        {json.dumps(existing_model, indent=2)}
        
        Required Changes:
        {change_requirements.changes_needed}
        
        {original_prompt}
        
        Additional Requirements:
        1. Preserve all existing entities and their relationships
        2. Add new entities/fields as specified
        3. Update relationships as needed
        4. Maintain data consistency
        """
        
        return generate_entities(prompt, use_case_model)

    async def _update_mock_data(self, change_requirements: Dict[str, Any], existing_model: Dict[str, Any],
                              use_case_model: Dict[str, Any], entity_model: Dict[str, Any],
                              mock_user_model: Dict[str, Any]) -> Dict[str, Any]:
        """Update mock data with changes while preserving existing data"""
        from ..generators.mock_data_generator import generate_mock_data
        
        # Get original prompt template
        with open('prompts/mock_data_prompt.txt', 'r') as f:
            original_prompt = f.read()
        
        # Create enhanced prompt
        prompt = f"""
        Given the existing mock data and required changes, generate updated mock data.
        
        Existing Mock Data:
        {json.dumps(existing_model, indent=2)}
        
        Required Changes:
        {change_requirements.changes_needed}
        
        {original_prompt}
        
        Additional Requirements:
        1. Preserve existing mock data unless explicitly modified
        2. Add new mock data for added entities/fields
        3. Ensure data consistency across related entities
        4. Maintain referential integrity
        """
        
        return generate_mock_data(prompt, use_case_model, entity_model, mock_user_model)

    async def _update_interface(self, change_requirements: Dict[str, Any], domain_model: Dict[str, Any]) -> Dict[str, Any]:
        """Update interface with changes while preserving existing components"""
        from ..generators.interface_generator import generate_interface
        
        # Get original prompt template
        with open('prompts/interface_prompt.txt', 'r') as f:
            original_prompt = f.read()
        
        # Create enhanced prompt
        prompt = f"""
        Given the existing interface and required changes, generate an updated interface model.
        
        Existing Interface:
        {json.dumps(self._load_model("interface_model"), indent=2)}
        
        Required Changes:
        {change_requirements.changes_needed}
        
        {original_prompt}
        
        Additional Requirements:
        1. Preserve existing interface components unless explicitly modified
        2. Add new components as specified
        3. Update component relationships and navigation
        4. Maintain consistent UI/UX patterns
        """
        
        return generate_interface(prompt, domain_model)

    # Similar methods for mock_data and interface updates... 
from pathlib import Path
from datetime import datetime
import shutil
import json
import logging
from rich.console import Console
from typing import Dict, Any
from models.edit_flow_models import UpdateStrategy
from utils.context_loader import ContextLoader
from utils.output_handler import (
    save_partial_model,
    save_domain_model,
    save_interface_model
)
from models.base_models import (
    UseCaseModel, 
    EntityModel, 
    MockUserModel, 
    MockDataModel, 
    ApplicationDomain
)
from generators.use_case_generator import generate_use_cases
from generators.entity_generator import generate_entities
from generators.mock_user_generator import generate_mock_users
from generators.mock_data_generator import generate_mock_data
from generators.interface_generator import generate_interface
from edit_flow.ai_integration import EditFlowAI

def combine_models(
    use_case_model: UseCaseModel,
    entity_model: EntityModel,
    mock_user_model: MockUserModel,
    mock_data_model: MockDataModel
) -> Dict[str, Any]:
    """Combine all partial models into a complete domain model."""
    # Create an ApplicationDomain instance which will handle the serialization
    domain = ApplicationDomain(
        title=use_case_model.title,
        description=use_case_model.description,
        use_cases=use_case_model.use_cases,
        entities=entity_model.entities,
        mock_users=mock_user_model.mock_users,
        mock_data=mock_data_model.mock_data
    )
    
    # Convert to dictionary using Pydantic's model_dump()
    return domain.model_dump()

class StrategyExecutor:
    def __init__(self, project_dir: Path, strategy: UpdateStrategy, use_docker: bool = False, use_nginx: bool = False):
        self.project_dir = project_dir
        self.strategy = strategy
        self.context_loader = ContextLoader(project_dir)
        self.backup_dir = project_dir / "backups" / self._get_backup_name()
        self.console = Console()
        self.logger = logging.getLogger(__name__)
        self.use_docker = use_docker
        self.use_nginx = use_nginx
        self.use_cases = None
    
    def _get_backup_name(self) -> str:
        """Generate backup directory name"""
        return f"backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
    
    def execute(self):
        """Execute the chosen strategy"""
        self._create_backup()
        
        try:
            if self.strategy.strategy_type == "full_regeneration":
                url = self._execute_full_regeneration()
            elif self.strategy.strategy_type == "use_case_update":
                url = self._execute_use_case_update()
            else:
                raise ValueError(f"Unknown strategy type: {self.strategy.strategy_type}")
            
            return {
                "backup_dir": str(self.backup_dir),
                "preview_url": url,
                "use_cases": self.use_cases
            }
        except Exception as e:
            self._restore_backup()
            raise Exception(f"Strategy execution failed: {str(e)}")

    def _execute_full_regeneration(self):
        """Execute full regeneration strategy"""
        try:
            if not self.strategy.starter_prompt:
                raise ValueError("Starter prompt required for full regeneration")
                
            self.logger.info("Starting full regeneration process")
            self.console.print("[bold blue]Starting full regeneration process...[/bold blue]")
            description = self.strategy.starter_prompt
            
            try:
                # Step 1: Use Cases
                self.logger.info("Generating use cases")
                self.console.print("Generating use cases...")
                use_case_model = generate_use_cases(description)
                save_partial_model(self.project_dir, "use_cases", use_case_model)
                self.console.print("[green]✓[/green] Use cases generated")
                self.use_cases = use_case_model

                # Step 2: Entities
                self.logger.info("Generating entities")
                self.console.print("Generating entities...")
                entity_model = generate_entities(description, use_case_model)
                save_partial_model(self.project_dir, "entities", entity_model)
                self.console.print("[green]✓[/green] Entities generated")
                
                # Step 3: Mock Users
                self.logger.info("Generating mock users")
                self.console.print("Generating mock users...")
                mock_user_model = generate_mock_users(
                    description, 
                    use_case_model, 
                    entity_model
                )
                save_partial_model(self.project_dir, "mock_users", mock_user_model)
                self.console.print("[green]✓[/green] Mock users generated")
                
                # Step 4: Mock Data
                self.logger.info("Generating mock data")
                self.console.print("Generating mock data...")
                mock_data_model = generate_mock_data(
                    description,
                    use_case_model,
                    entity_model,
                    mock_user_model
                )
                save_partial_model(self.project_dir, "mock_data", mock_data_model)
                self.console.print("[green]✓[/green] Mock data generated")
                
                # Step 5: Combine Models and generate interface
                self.logger.info("Combining models and generating interface")
                self.console.print("Combining models and generating interface...")
                domain_model = combine_models(
                    use_case_model,
                    entity_model,
                    mock_user_model,
                    mock_data_model
                )
                interface_model = generate_interface(domain_model)
                
                # Save final models
                save_domain_model(self.project_dir, domain_model)
                url = save_interface_model(self.project_dir, interface_model, domain_model, self.use_docker, self.use_nginx)
                self.console.print("[green]✓[/green] Models combined and interface generated")
                
                self.logger.info("Full regeneration completed successfully")
                self.console.print("[bold green]Full regeneration completed successfully![/bold green]")

                return url
                
            except Exception as e:
                error_msg = f"Error during full regeneration: {str(e)}"
                self.logger.error(error_msg, exc_info=True)
                self.console.print(f"[bold red]Error:[/bold red] {error_msg}")
                raise
                
        except Exception as e:
            self.logger.error(f"Full regeneration failed: {str(e)}", exc_info=True)
            self.console.print(f"[bold red]Full regeneration failed:[/bold red] {str(e)}")
            raise

    def _execute_use_case_update(self):
        """Execute use case update strategy"""
        try:
            if not self.strategy.change_summary:
                raise ValueError("Change summary required for use case update")
            
            self.logger.info("Starting use case update process")
            self.console.print("[bold blue]Starting use case update process...[/bold blue]")
            
            try:
                # Load existing context
                self.logger.info("Loading existing context")
                self.console.print("Loading existing context...")
                original_context = self.context_loader.load_context()
                existing_use_cases = original_context.get("use_cases", {}).get("items", [])
                app_info = original_context.get("application", {})
                
                # Generate updated use cases using AI
                self.logger.info("Generating updated use cases")
                self.console.print("Generating updated use cases...")
                ai = EditFlowAI()
                use_case_model = ai.generate_updated_use_cases(
                    app_info,
                    existing_use_cases,
                    self.strategy.change_summary
                )
                save_partial_model(self.project_dir, "use_cases", use_case_model)
                self.console.print("[green]✓[/green] Use cases updated")
                self.use_cases = use_case_model
                # Continue with generation flow...
                # (Same as full regeneration from Step 2 onwards)
                # Step 2: Entities
                self.logger.info("Generating entities")
                self.console.print("Generating entities...")
                entity_model = generate_entities(
                    f"{app_info.get('description')} with updates: {self.strategy.change_summary}", 
                    use_case_model
                )
                save_partial_model(self.project_dir, "entities", entity_model)
                self.console.print("[green]✓[/green] Entities generated")
                
                # Step 3: Mock Users
                self.logger.info("Generating mock users")
                self.console.print("Generating mock users...")
                mock_user_model = generate_mock_users(
                    use_case_model.description, 
                    use_case_model, 
                    entity_model
                )
                save_partial_model(self.project_dir, "mock_users", mock_user_model)
                self.console.print("[green]✓[/green] Mock users generated")
                
                # Step 4: Mock Data
                self.logger.info("Generating mock data")
                self.console.print("Generating mock data...")
                mock_data_model = generate_mock_data(
                    use_case_model.description,
                    use_case_model,
                    entity_model,
                    mock_user_model
                )
                save_partial_model(self.project_dir, "mock_data", mock_data_model)
                self.console.print("[green]✓[/green] Mock data generated")
                
                # Step 5: Combine Models and generate interface
                self.logger.info("Combining models and generating interface")
                self.console.print("Combining models and generating interface...")
                domain_model = combine_models(
                    use_case_model,
                    entity_model,
                    mock_user_model,
                    mock_data_model
                )
                interface_model = generate_interface(domain_model)

                # Save final models
                save_domain_model(self.project_dir, domain_model)
                url = save_interface_model(self.project_dir, interface_model, domain_model, self.use_docker, self.use_nginx)
                self.console.print("[green]✓[/green] Models combined and interface generated")
                
                self.logger.info("Use case update completed successfully")
                self.console.print("[bold green]Use case update completed successfully![/bold green]")

                return url
                
            except Exception as e:
                error_msg = f"Error during use case update: {str(e)}"
                self.logger.error(error_msg, exc_info=True)
                self.console.print(f"[bold red]Error:[/bold red] {error_msg}")
                raise
                
        except Exception as e:
            self.logger.error(f"Use case update failed: {str(e)}", exc_info=True)
            self.console.print(f"[bold red]Use case update failed:[/bold red] {str(e)}")
            raise

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
    
    def _load_model(self, name: str) -> Dict[str, Any]:
        """Load existing model from file"""
        file_path = self.project_dir / f"{name}.json"
        if not file_path.exists():
            raise ValueError(f"Model file not found: {file_path}")
        
        with open(file_path) as f:
            return json.load(f) 
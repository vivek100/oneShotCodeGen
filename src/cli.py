import typer
import uuid
from datetime import datetime
from pathlib import Path
from rich.console import Console
from rich.progress import Progress, SpinnerColumn, TextColumn
from typing import Dict, Any, List
import traceback
import json
import asyncio
import click

from .models.base_models import UseCaseModel, EntityModel, MockUserModel, MockDataModel, ApplicationDomain
from .generators.app_generator import generate_app
from .generators.use_case_generator import generate_use_cases
from .generators.entity_generator import generate_entities
from .generators.mock_user_generator import generate_mock_users
from .generators.mock_data_generator import generate_mock_data
from .generators.interface_generator import generate_interface
from .utils.output_handler import (
    create_output_directory,
    save_domain_model,
    save_interface_model,
    setup_logging,
    save_partial_model
)
from .edit_flow.change_handler import ChangeHandler, ChangeRequest
from .edit_flow.strategy_executor import StrategyExecutor

app = typer.Typer()
console = Console()

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

@app.command()
def create(
    description: str = typer.Argument(..., help="Description of the app to generate"),
    output_dir: str = typer.Option("output", help="Base output directory for generated apps"),
    use_legacy: bool = typer.Option(False, help="Use legacy single-step generation"),
    use_docker: bool = typer.Option(False, "--docker", "-d", help="Deploy using Docker"),
    use_nginx: bool = typer.Option(False, "--nginx", "-n", help="Configure Nginx with Docker")
):
    """Generate a complete application based on the description."""
    with Progress(
        SpinnerColumn(),
        TextColumn("[progress.description]{task.description}"),
        console=console,
    ) as progress:
        try:
            # Create output directory and setup logging
            task_id = progress.add_task("Creating output directory...", total=1)
            project_dir = create_output_directory(output_dir)
            logger = setup_logging(project_dir)
            logger.info("Starting application generation")
            progress.update(task_id, completed=1, description="✓ Output directory created")

            if use_legacy:
                # Use existing app_generator
                task_id = progress.add_task("Generating application model...", total=1)
                domain_model, interface_model = generate_app(description)
                logger.info("Application model generated")
                progress.update(task_id, completed=1)
            else:
                # Step 1: Use Cases
                task_id = progress.add_task("Generating use cases...", total=1)
                use_case_model = generate_use_cases(description)
                save_partial_model(project_dir, "use_cases", use_case_model)
                logger.info("Use cases generated")
                progress.update(task_id, completed=1)
                
                # Step 2: Entities
                task_id = progress.add_task("Generating entities...", total=1)
                entity_model = generate_entities(description, use_case_model)
                save_partial_model(project_dir, "entities", entity_model)
                logger.info("Entities generated")
                progress.update(task_id, completed=1)
                
                # Step 3: Mock Users
                task_id = progress.add_task("Generating mock users...", total=1)
                mock_user_model = generate_mock_users(
                    description, 
                    use_case_model, 
                    entity_model
                )
                save_partial_model(project_dir, "mock_users", mock_user_model)
                logger.info("Mock users generated")
                progress.update(task_id, completed=1)
                
                # Step 4: Mock Data
                task_id = progress.add_task("Generating mock data...", total=1)
                mock_data_model = generate_mock_data(
                    description,
                    use_case_model,
                    entity_model,
                    mock_user_model
                )
                save_partial_model(project_dir, "mock_data", mock_data_model)
                logger.info("Mock data generated")
                progress.update(task_id, completed=1)
                
                # Step 5: Combine Models and generate interface
                task_id = progress.add_task("Combining models...", total=1)
                domain_model = combine_models(
                    use_case_model,
                    entity_model,
                    mock_user_model,
                    mock_data_model
                )
                interface_model = generate_interface(domain_model)
                logger.info("Models combined and interface generated")
                progress.update(task_id, completed=1)

            # Save final models
            save_domain_model(project_dir, domain_model)
            save_interface_model(project_dir, interface_model, domain_model, use_docker, use_nginx)

            # Final success message
            success_message = f"\n Success! Project generated at: {project_dir}"
            console.print(success_message)
            logger.info(success_message)
            
            files_message = "\nGenerated files:"
            console.print(files_message)
            logger.info(files_message)
            
            for file in [
                "  - use_cases.json",
                "  - entities.json",
                "  - mock_users.json",
                "  - mock_data.json",
                "  - domain_model.json",
                "  - interface_model.json",
                "  - generation.log"
            ]:
                console.print(file)
                logger.info(file)

        except Exception as e:
            error_message = f"\nError: {str(e)}"
            full_traceback = traceback.format_exc()
            console.print(f"[red]{error_message}[/red]")
            if 'logger' in locals():
                logger.error(error_message)
                logger.error(f"Full traceback:\n{full_traceback}")
            console.print(f"Additional information: {full_traceback}")
            raise

@app.command()
def edit(
    project_dir: str = typer.Argument(..., help="Project directory to edit"),
    description: str = typer.Option(None, "--description", "-d", help="Description of changes needed"),
    use_docker: bool = typer.Option(False, "--docker", "-d", help="Deploy using Docker"),
    use_nginx: bool = typer.Option(False, "--nginx", "-n", help="Configure Nginx with Docker")
):
    """Edit an existing application"""
    console = Console()
    
    with Progress(
        SpinnerColumn(),
        TextColumn("[progress.description]{task.description}"),
        console=console,
    ) as progress:
        try:
            # Create output directory and setup logging
            task_id = progress.add_task("Setting up...", total=1)
            project_path = Path(project_dir)
            logger = setup_logging(project_path)
            logger.info("Starting application edit")
            progress.update(task_id, completed=1)
            
            # Get change request
            if not description:
                raise typer.BadParameter("Description must be provided")
            
            change_data = {
                "description": description,
                "affected_components": [],  # Default to empty list
                "priority": "medium"  # Default priority
            }
            
            # Create change request
            change_request = ChangeRequest(**change_data)
            
            # Initialize change handler
            handler = ChangeHandler(project_path)
            
            # Evaluate changes
            task_id = progress.add_task("Evaluating changes...", total=1)
            strategy = handler.evaluate_change(change_request)
            progress.update(task_id, completed=1)
            
            # Show strategy details
            console.print(f"\n[bold]Selected Strategy:[/bold] {strategy.strategy_type}")
            console.print(f"[bold]Reasoning:[/bold] {strategy.reasoning}")
            console.print("\n[bold]Required Changes:[/bold]")
            if strategy.strategy_type == "use_case_update":
                console.print(f"\n[bold]Use Case Update:[/bold]")
                for change in strategy.change_summary:
                    console.print(f"- {change}")
            elif strategy.strategy_type == "full_regeneration":
                console.print(f"\n[bold]Full Regeneration prompt:[/bold]")
                console.print(f"- {strategy.starter_prompt}")
            elif strategy.strategy_type == "partial_update":
                console.print(f"\n[bold]Partial Update:[/bold]")
                console.print(f"-  coming soon")
                
            # starting strategy execution
            try:
                executor = StrategyExecutor(project_path, strategy, use_docker, use_nginx)
                executor.execute()
                
                # Show success message
                success_message = "\n[green]Changes applied successfully![/green]"
                console.print(success_message)
                logger.info("Changes applied successfully")
                
                # List updated files
                console.print("\n[bold]Updated files:[/bold]")
                for generator in strategy.required_generators:
                    console.print(f"  - {generator}_model.json")
                console.print("  - domain_model.json")
                console.print("  - sql/")
                console.print("  - src/")
                if "interface" in strategy.required_generators:
                    console.print("  - interface_model.json")
                    
            except Exception as e:
                console.print("\nCode generation failed")
                logger.error("Code generation failed")
            
        except Exception as e:
            error_message = f"\nError: {str(e)}"
            full_traceback = traceback.format_exc()
            console.print(f"[red]{error_message}[/red]")
            logger.error(error_message)
            logger.error(f"Full traceback:\n{full_traceback}")
            raise typer.Exit(1)

if __name__ == "__main__":
    app()
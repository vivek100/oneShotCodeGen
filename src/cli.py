import typer
import uuid
from datetime import datetime
from pathlib import Path
from rich.console import Console
from rich.progress import Progress, SpinnerColumn, TextColumn
from .generators.app_generator import generate_app
from .utils.output_handler import (
    create_output_directory,
    save_domain_model,
    save_interface_model,
    setup_logging
)

app = typer.Typer()
console = Console()

@app.command()
def create(
    description: str = typer.Argument(..., help="Description of the app to generate"),
    output_dir: str = typer.Option("output", help="Base output directory for generated apps"),
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

            # Generate domain model from AI
            task_id = progress.add_task("Getting domain model from AI...", total=1)
            domain_model, interface_model = generate_app(description)
            logger.info("Domain model generated from AI")
            progress.update(task_id, completed=1, description="✓ Domain model generated")

            # Save domain model and generate SQL
            db_task_id = progress.add_task("Setting up database...", total=5)
            
            # Generate SQL files
            logger.info("Generating SQL files")
            progress.update(db_task_id, advance=1, description="Generating SQL files...")
            save_domain_model(project_dir, domain_model)
            progress.update(db_task_id, advance=1, description="✓ SQL files generated")

            # Save interface model and generate frontend
            frontend_task_id = progress.add_task("Setting up frontend...", total=5)
            
            # Generate interface files
            logger.info("Generating interface files")
            progress.update(frontend_task_id, advance=1, description="Generating interface files...")
            save_interface_model(project_dir, interface_model, domain_model)
            
            # Copy template files
            logger.info("Copying template files")
            progress.update(frontend_task_id, advance=1, description="Copying template files...")
            
            # Generate component files
            logger.info("Generating component files")
            progress.update(frontend_task_id, advance=1, description="Generating component files...")
            
            # Generate page files
            logger.info("Generating page files")
            progress.update(frontend_task_id, advance=1, description="Generating page files...")
            
            # Install dependencies
            logger.info("Installing dependencies")
            progress.update(frontend_task_id, advance=1, description="Installing dependencies...")
            
            progress.update(frontend_task_id, completed=5, description="✓ Frontend setup complete")

            # Final success message
            success_message = f"\n✨ Success! Project generated at: {project_dir}"
            console.print(success_message)
            logger.info(success_message)
            
            files_message = "\nGenerated files:"
            console.print(files_message)
            logger.info(files_message)
            
            for file in [
                "  - domain_model.json",
                "  - interface_model.json",
                "  - sql/*.sql",
                "  - src/components/*",
                "  - src/pages/*",
                "  - README.md",
                "  - generation.log"
            ]:
                console.print(file)
                logger.info(file)

        except Exception as e:
            error_message = f"\nError: {str(e)}"
            console.print(f"[red]{error_message}[/red]")
            if 'logger' in locals():
                logger.error(error_message)
            raise

if __name__ == "__main__":
    app()
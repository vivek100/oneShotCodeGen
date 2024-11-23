import click
import asyncio
from enum import Enum
from typing import Optional, Dict
from rich.console import Console
from rich.progress import Progress, SpinnerColumn, TextColumn
from datetime import datetime
import uuid
import os
from ai_code_generator_cli.chains.requirements_chain import create_requirements_chain, ModelProvider
from ai_code_generator_cli.chains.code_generation_chain import create_code_chains
from ai_code_generator_cli.utils.file_utils import process_code_structure
from ai_code_generator_cli.config.settings import settings
import json

console = Console()

class ProcessingMode(str, Enum):
    REQUIREMENTS = "requirements"
    CODE = "code"
    FULL = "full"

class PromptVersion(str, Enum):
    V1 = "v1"
    V2 = "v2"
    V3 = "v3"

class CodeGenerator:
    def __init__(
        self,
        model_provider: ModelProvider,
        func_version: PromptVersion = PromptVersion.V1,
        tech_version: PromptVersion = PromptVersion.V1,
        code_version: PromptVersion = PromptVersion.V1,
        backend_template: str = None,
        frontend_template: str = None
    ):
        self.func_version = func_version
        self.tech_version = tech_version
        self.code_version = code_version
        self.model_provider = model_provider
        self.project_dir = None
        self.backend_template = backend_template
        self.frontend_template = frontend_template
        
        # Initialize chains
        self.requirements_chain = create_requirements_chain(
            model_provider,
            func_version,
            tech_version
        )
        self.code_chains = create_code_chains(
            model_provider,
            code_version,
            backend_template,
            frontend_template
        )

    def create_project_directory(self) -> str:
        """Create project directory structure."""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        unique_id = str(uuid.uuid4())[:8]
        project_name = f"project_{timestamp}_{unique_id}"
        
        project_dir = os.path.join(settings.project_output_dir, project_name)
        os.makedirs(project_dir, exist_ok=True)
        
        # Create standard directory structure
        docs_dir = os.path.join(project_dir, "docs")
        code_output_dir = os.path.join(project_dir, "outputCode")  # For LLM outputs
        generated_code_dir = os.path.join(project_dir, "generatedCode")  # For actual code files
        
        os.makedirs(docs_dir, exist_ok=True)
        os.makedirs(code_output_dir, exist_ok=True)
        os.makedirs(generated_code_dir, exist_ok=True)
        
        return project_dir

    async def generate_code(
        self,
        func_result: str,
        tech_result: str,
        mode: ProcessingMode,
    ) -> Dict[str, str]:
        """Generate code based on version configuration."""
        results = {}
        
        # Define the sequence and dependencies based on version
        if self.code_version == PromptVersion.V1:
            sequence = ["database", "backend", "frontend"]
            dependencies = {
                "backend": ["database"],
                "frontend": ["database", "backend"]
            }
        elif self.code_version == PromptVersion.V2:
            sequence = ["backend", "frontend"]
            dependencies = {
                "frontend": ["backend"]
            }
        else:  # V3
            sequence = ["backend", "frontend"]
            dependencies = {
                "frontend": ["backend"]
            }
        
        previous_outputs = {}
        generated_code_dir = os.path.join(self.project_dir, "generatedCode")
        
        for prompt_type in sequence:
            if prompt_type not in self.code_chains:
                continue
            
            chain = self.code_chains[prompt_type]
            console.print(f"\n[yellow]Generating {prompt_type} code...[/yellow]")
            
            # Prepare base input
            chain_input = {
                "functional_requirements": func_result,
                "technical_requirements": tech_result
            }
            
            # Add context from previous outputs based on dependencies
            if prompt_type in dependencies:
                for dep in dependencies[prompt_type]:
                    if dep in previous_outputs:
                        if prompt_type == "backend" and dep == "database":
                            chain_input["database_structure"] = previous_outputs[dep]
                        elif prompt_type == "frontend":
                            if dep == "database":
                                chain_input["database_structure"] = previous_outputs[dep]
                            elif dep == "backend":
                                chain_input["backend_code"] = previous_outputs[dep]
            
            # Add templates for v3 if available
            if self.code_version == PromptVersion.V3:
                if prompt_type == "backend" and self.backend_template:
                    chain_input["backend_code_templates"] = self.backend_template
                elif prompt_type == "frontend" and self.frontend_template:
                    chain_input["frontend_code_templates"] = self.frontend_template
            
            # Debug info
            console.print(f"[blue]Generating {prompt_type} with inputs:[/blue]")
            for key in chain_input:
                if key in ["functional_requirements", "technical_requirements"]:
                    console.print(f"  - {key}: <requirements>")
                else:
                    console.print(f"  - {key}: <previous output>")
            
            # Run the chain and capture the output
            result = chain.run(**chain_input)
            previous_outputs[prompt_type] = result
            
            # Save the LLM output
            output_dir = os.path.join(self.project_dir, "outputCode", prompt_type)
            os.makedirs(output_dir, exist_ok=True)
            
            # Save raw output
            with open(os.path.join(output_dir, "output.txt"), "w") as f:
                f.write(result)
            console.print(f"[blue]Saved {prompt_type} LLM output to:[/blue] {output_dir}/output.txt")
            
            # Process code structure only in FULL mode
            if mode == ProcessingMode.FULL:
                try:
                    console.print(f"[yellow]Creating {prompt_type} implementation files...[/yellow]")
                    process_code_structure(
                        result, 
                        base_path=generated_code_dir,
                        component_type=prompt_type
                    )
                    console.print(f"[green]✓[/green] Created {prompt_type} implementation files")
                except Exception as e:
                    console.print(f"[red]Error processing code structure: {e}[/red]")
            
            results[prompt_type] = result
            
        return results

    async def process_input(self, user_input: str, mode: ProcessingMode):
        try:
            with Progress(
                SpinnerColumn(),
                TextColumn("[progress.description]{task.description}"),
                console=console
            ) as progress:
                # Create project directory
                self.project_dir = self.create_project_directory()
                progress.add_task("Created project directory", total=None)
                console.print(f"\n[blue]Project directory created at:[/blue] {self.project_dir}")

                # Generate Functional Requirements
                task = progress.add_task("Generating functional requirements...", total=None)
                functional_chain = self.requirements_chain.chains[0]
                func_result = functional_chain.run(user_input=user_input)
                progress.update(task, completed=True)
                console.print("\n[green]✓[/green] Functional Requirements Generated")

                # Save functional requirements
                func_req_path = os.path.join(self.project_dir, "docs", "functional_requirements.md")
                with open(func_req_path, 'w', encoding='utf-8') as f:
                    f.write("# Functional Requirements\n\n")
                    f.write(func_result)
                console.print(f"[blue]Saved functional requirements to:[/blue] {func_req_path}")

                # Generate Technical Requirements
                task = progress.add_task("Generating technical requirements...", total=None)
                technical_chain = self.requirements_chain.chains[1]
                tech_result = technical_chain.run(functional_requirements=func_result)
                progress.update(task, completed=True)
                console.print("\n[green]✓[/green] Technical Requirements Generated")

                # Save technical requirements
                tech_req_path = os.path.join(self.project_dir, "docs", "technical_requirements.md")
                with open(tech_req_path, 'w', encoding='utf-8') as f:
                    f.write("# Technical Requirements\n\n")
                    f.write(tech_result)
                console.print(f"[blue]Saved technical requirements to:[/blue] {tech_req_path}")

                if mode in [ProcessingMode.CODE, ProcessingMode.FULL]:
                    # Generate and save code
                    code_results = await self.generate_code(
                        func_result, 
                        tech_result,
                        mode  # Pass the mode to generate_code
                    )

                # Save project summary
                summary_path = os.path.join(self.project_dir, "project_summary.md")
                with open(summary_path, 'w', encoding='utf-8') as f:
                    f.write("# Project Summary\n\n")
                    f.write(f"User Input: {user_input}\n\n")
                    f.write(f"Mode: {mode}\n")
                    f.write(f"Versions Used:\n")
                    f.write(f"- Functional Requirements: {self.func_version}\n")
                    f.write(f"- Technical Requirements: {self.tech_version}\n")
                    f.write(f"- Code Generation: {self.code_version}\n")
                    f.write(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n")

                console.print(f"\n[green]✓[/green] Project files saved at: {self.project_dir}")

        except Exception as e:
            console.print(f"\n[red]Error:[/red] {str(e)}")
            raise

@click.command()
@click.argument('user_input', type=str)
@click.option(
    '--mode',
    type=click.Choice(['requirements', 'code', 'full']),
    default='requirements',
    help='Processing mode: requirements, code, or full project generation'
)
@click.option(
    '--func-version',
    type=click.Choice(['v1', 'v2', 'v3']),
    default='v1',
    help='Version of functional requirements prompt'
)
@click.option(
    '--tech-version',
    type=click.Choice(['v1', 'v2', 'v3']),
    default='v1',
    help='Version of technical requirements prompt'
)
@click.option(
    '--code-version',
    type=click.Choice(['v1', 'v2', 'v3']),
    default='v1',
    help='Version of code generation prompts'
)
@click.option(
    '--model',
    type=click.Choice(['openai', 'anthropic']),
    default='openai',
    help='Choose the AI model provider'
)
@click.option(
    '--backend-template',
    type=click.Path(exists=True, dir_okay=False),
    help='Path to backend code template file (for v3 only)'
)
@click.option(
    '--frontend-template',
    type=click.Path(exists=True, dir_okay=False),
    help='Path to frontend code template file (for v3 only)'
)
def main(
    user_input: str,
    mode: str,
    func_version: str,
    tech_version: str,
    code_version: str,
    model: str,
    backend_template: str,
    frontend_template: str
):
    """Generate code from natural language description."""
    model_provider = ModelProvider.OPENAI if model == 'openai' else ModelProvider.ANTHROPIC
    
    # Read templates if provided and code_version is v3
    backend_template_content = None
    frontend_template_content = None
    if code_version == 'v3':
        if backend_template:
            with open(backend_template, 'r') as f:
                backend_template_content = f.read()
        if frontend_template:
            with open(frontend_template, 'r') as f:
                frontend_template_content = f.read()
    
    generator = CodeGenerator(
        model_provider=model_provider,
        func_version=PromptVersion(func_version),
        tech_version=PromptVersion(tech_version),
        code_version=PromptVersion(code_version),
        backend_template=backend_template_content,
        frontend_template=frontend_template_content
    )
    
    console.print(f"[bold blue]Starting AI Code Generator[/bold blue]")
    console.print(f"Mode: {mode}")
    console.print(f"Model: {model}")
    console.print(f"Versions: func={func_version}, tech={tech_version}, code={code_version}\n")
    
    asyncio.run(generator.process_input(user_input, ProcessingMode(mode)))

if __name__ == '__main__':
    main() 
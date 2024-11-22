import json
import os
import subprocess
from rich.console import Console
import re

console = Console()

def clean_json_string(json_str: str) -> str:
    """Clean and format JSON string for parsing."""
    # Remove any trailing commas before closing braces/brackets
    json_str = re.sub(r',(\s*[}\]])', r'\1', json_str)
    # Remove any comments
    json_str = re.sub(r'//.*?\n|/\*.*?\*/', '', json_str, flags=re.S)
    return json_str

def create_folder_structure(folders: list, base_path: str) -> None:
    """Create folder structure from list of folder paths."""
    try:
        console.print(f"[yellow]Creating folders in base path:[/yellow] {base_path}")
        for folder in folders:
            folder_path = os.path.join(base_path, folder)
            console.print(f"[yellow]Attempting to create folder:[/yellow] {folder_path}")
            os.makedirs(folder_path, exist_ok=True)
            console.print(f"[green]Created folder:[/green] {folder_path}")
    except Exception as e:
        console.print(f"[red]Error creating folders:[/red] {str(e)}")
        raise

def write_files(files: dict, base_path: str) -> None:
    """Write files from dictionary of file paths and content."""
    try:
        console.print(f"[yellow]Writing files in base path:[/yellow] {base_path}")
        for file_path, content in files.items():
            full_path = os.path.join(base_path, file_path)
            console.print(f"[yellow]Attempting to write file:[/yellow] {full_path}")
            
            # Debug directory creation
            dir_path = os.path.dirname(full_path)
            console.print(f"[yellow]Ensuring directory exists:[/yellow] {dir_path}")
            os.makedirs(dir_path, exist_ok=True)
            
            # Write the file
            with open(full_path, 'w', encoding='utf-8') as f:
                f.write(content)
            console.print(f"[green]Created file:[/green] {full_path}")
    except Exception as e:
        console.print(f"[red]Error writing files:[/red] {str(e)}")
        raise

def run_commands(commands: list, base_path: str) -> None:
    """Run shell commands in the base directory."""
    try:
        original_dir = os.getcwd()
        console.print(f"[yellow]Current directory:[/yellow] {original_dir}")
        console.print(f"[yellow]Changing to base path:[/yellow] {base_path}")
        os.chdir(base_path)
        
        for command in commands:
            try:
                console.print(f"[yellow]Running command:[/yellow] {command}")
                console.print(f"[yellow]Current working directory:[/yellow] {os.getcwd()}")
                
                # Run the command as-is, letting the command handle its own directory changes
                result = subprocess.run(
                    command,
                    shell=True,
                    check=True,
                    capture_output=True,
                    text=True
                )
                if result.stdout:
                    console.print(f"[blue]Command output:[/blue] {result.stdout}")
                
            except subprocess.CalledProcessError as e:
                console.print(f"[red]Command failed:[/red] {str(e)}")
                if e.output:
                    console.print(f"[red]Error output:[/red] {e.output}")
                raise
            except Exception as e:
                console.print(f"[red]Error during command execution:[/red] {str(e)}")
                console.print(f"[red]Current directory:[/red] {os.getcwd()}")
                raise
            
    finally:
        console.print(f"[yellow]Returning to original directory:[/yellow] {original_dir}")
        os.chdir(original_dir)

def process_code_structure(
    code_structure: str, 
    base_path: str = ".", 
    component_type: str = None
) -> None:
    """Process the code structure JSON and create files/folders."""
    try:
        console.print(f"\n[yellow]Processing code structure for component:[/yellow] {component_type}")
        console.print(f"[yellow]Base path:[/yellow] {base_path}")
        
        # Extract and parse JSON
        json_str = ""
        if "```json" in code_structure:
            start_idx = code_structure.find("```json") + 7
            end_idx = code_structure.find("```", start_idx)
            json_str = code_structure[start_idx:end_idx].strip()
        else:
            start_idx = code_structure.find("{")
            end_idx = code_structure.rfind("}") + 1
            if start_idx != -1 and end_idx != 0:
                json_str = code_structure[start_idx:end_idx]
        
        if not json_str:
            raise ValueError("No valid JSON structure found in the response")
        
        console.print(f"[yellow]Extracted JSON:[/yellow] {json_str[:200]}...")
            
        # Parse the JSON
        try:
            structure = json.loads(json_str)
            console.print("[green]Successfully parsed JSON structure[/green]")
        except json.JSONDecodeError:
            console.print("[yellow]Initial JSON parse failed, attempting to clean JSON string[/yellow]")
            cleaned_json = clean_json_string(json_str)
            structure = json.loads(cleaned_json)
            console.print("[green]Successfully parsed cleaned JSON structure[/green]")
        
        # Debug structure content
        console.print(f"[yellow]Structure contains:[/yellow]")
        console.print(f"- Commands: {len(structure.get('commands', []))} items")
        console.print(f"- Files: {len(structure.get('files', {}))} items")
        
        # Process commands first (they might create initial directories)
        commands = structure.get("commands", [])
        if commands:
            console.print(f"\n[yellow]Processing {len(commands)} commands[/yellow]")
            run_commands(commands, base_path)
        
        # Process files (directories will be created automatically)
        files = structure.get("files", {})
        if files:
            console.print(f"\n[yellow]Processing {len(files)} files[/yellow]")
            write_files(files, base_path)
        
    except Exception as e:
        console.print(f"[red]Error processing code structure:[/red] {str(e)}")
        console.print(f"[red]Current working directory:[/red] {os.getcwd()}")
        raise 
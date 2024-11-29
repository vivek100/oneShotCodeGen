import json
import os
import subprocess
import signal
from rich.console import Console
import re
from datetime import datetime
import threading
from .logging_utils import setup_logger, log_and_print

console = Console()
logger = setup_logger()

class CommandTimeoutError(Exception):
    """Exception raised when a command execution times out."""
    pass

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
        log_and_print(logger, f"Creating folders in base path: {base_path}", console_style="yellow")
        for folder in folders:
            folder_path = os.path.join(base_path, folder)
            log_and_print(logger, f"Attempting to create folder: {folder_path}", console_style="yellow")
            os.makedirs(folder_path, exist_ok=True)
            log_and_print(logger, f"Created folder: {folder_path}", console_style="green")
    except Exception as e:
        log_and_print(logger, f"Error creating folders: {str(e)}", level='error', console_style="red")
        raise

def write_files(files: dict, base_path: str) -> None:
    """Write files from dictionary of file paths and content."""
    try:
        log_and_print(logger, f"Writing files in base path: {base_path}", console_style="yellow")
        for file_path, content in files.items():
            full_path = os.path.join(base_path, file_path)
            log_and_print(logger, f"Attempting to write file: {full_path}", console_style="yellow")
            
            # Debug directory creation
            dir_path = os.path.dirname(full_path)
            log_and_print(logger, f"Ensuring directory exists: {dir_path}", console_style="yellow")
            os.makedirs(dir_path, exist_ok=True)
            
            # Write the file
            with open(full_path, 'w', encoding='utf-8') as f:
                f.write(content)
            log_and_print(logger, f"Created file: {full_path}", console_style="green")
    except Exception as e:
        log_and_print(logger, f"Error writing files: {str(e)}", level='error', console_style="red")
        raise

def run_command_with_timeout(command, timeout=180):
    """Run a command with timeout."""
    try:
        # On Windows, we need to create a new process group
        if os.name == 'nt':
            startupinfo = subprocess.STARTUPINFO()
            startupinfo.dwFlags |= subprocess.STARTF_USESHOWWINDOW
            process = subprocess.Popen(
                command,
                shell=True,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
                creationflags=subprocess.CREATE_NEW_PROCESS_GROUP,
                startupinfo=startupinfo
            )
        else:
            process = subprocess.Popen(
                command,
                shell=True,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True
            )
        
        try:
            stdout, stderr = process.communicate(timeout=timeout)
            if process.returncode == 0:
                return stdout
            else:
                raise subprocess.CalledProcessError(process.returncode, command, stdout, stderr)
        except subprocess.TimeoutExpired:
            # On Windows, we need to forcefully terminate the entire process tree
            if os.name == 'nt':
                with open(os.devnull, 'w') as devnull:
                    # First try CTRL+C
                    try:
                        process.send_signal(signal.CTRL_C_EVENT)
                        try:
                            process.wait(timeout=5)  # Give it 5 seconds to respond to CTRL+C
                        except subprocess.TimeoutExpired:
                            pass
                    except Exception:
                        pass
                    
                    # If still running, use taskkill
                    if process.poll() is None:
                        subprocess.run(
                            f'taskkill /F /T /PID {process.pid}',
                            shell=True,
                            stdout=devnull,
                            stderr=devnull
                        )
            else:
                # On Unix, terminate process group
                os.killpg(os.getpgid(process.pid), signal.SIGTERM)
                try:
                    process.wait(timeout=5)
                except subprocess.TimeoutExpired:
                    os.killpg(os.getpgid(process.pid), signal.SIGKILL)
            
            # Clean up any remaining output
            try:
                stdout, stderr = process.communicate(timeout=1)
            except subprocess.TimeoutExpired:
                process.kill()
                stdout, stderr = process.communicate()
            
            raise CommandTimeoutError(f"Command timed out after {timeout} seconds: {command}")
            
    except Exception as e:
        if not isinstance(e, CommandTimeoutError):
            raise Exception(f"Error running command: {str(e)}")
        raise

def run_commands(commands: list, base_path: str) -> None:
    """Run shell commands in the base directory."""
    try:
        original_dir = os.getcwd()
        log_and_print(logger, f"Current directory: {original_dir}", console_style="yellow")
        log_and_print(logger, f"Changing to base path: {base_path}", console_style="yellow")
        os.chdir(base_path)
        
        failed_commands = []
        for command in commands:
            try:
                log_and_print(logger, f"Running command: {command}", console_style="yellow")
                log_and_print(logger, f"Current working directory: {os.getcwd()}", console_style="yellow")
                
                try:
                    output = run_command_with_timeout(command)
                    if output:
                        log_and_print(logger, f"Command output: {output}", console_style="blue")
                    log_and_print(logger, f"[OK] Command completed successfully: {command}", console_style="green")
                
                except subprocess.TimeoutExpired:
                    error_msg = f"Command timed out after 180 seconds: {command}"
                    log_and_print(logger, error_msg, level='error', console_style="red")
                    failed_commands.append({"command": command, "error": "timeout"})
                    continue
                    
                except subprocess.CalledProcessError as e:
                    error_msg = f"Command failed: {str(e)}"
                    if e.output:
                        error_msg += f"\nError output: {e.output}"
                    log_and_print(logger, error_msg, level='error', console_style="red")
                    failed_commands.append({"command": command, "error": str(e)})
                    continue
                    
            except Exception as e:
                error_msg = f"Error during command execution: {str(e)}"
                log_and_print(logger, error_msg, level='error', console_style="red")
                failed_commands.append({"command": command, "error": str(e)})
                continue
            
    finally:
        log_and_print(logger, f"Returning to original directory: {original_dir}", console_style="yellow")
        os.chdir(original_dir)
        
        if failed_commands:
            log_and_print(logger, "\nFailed commands summary:", console_style="red")
            for fc in failed_commands:
                log_and_print(logger, f"Command: {fc['command']}", console_style="red")
                log_and_print(logger, f"Error: {fc['error']}\n", console_style="red")

def process_code_structure(
    code_structure: str, 
    base_path: str = ".", 
    component_type: str = None,
    project_id: str = None
) -> None:
    """Process the code structure JSON and create files/folders."""
    if project_id:
        global logger
        logger = setup_logger(project_id)
        
    try:
        log_and_print(logger, f"\nProcessing code structure for component: {component_type}", console_style="yellow")
        log_and_print(logger, f"Base path: {base_path}", console_style="yellow")
        
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
            error_msg = "No valid JSON structure found in the response"
            log_and_print(logger, error_msg, level='error', console_style="red")
            raise ValueError(error_msg)
        
        log_and_print(logger, f"Extracted JSON: {json_str[:200]}...", console_style="yellow")
            
        # Parse the JSON
        try:
            structure = json.loads(json_str)
            log_and_print(logger, "Successfully parsed JSON structure", console_style="green")
        except json.JSONDecodeError:
            log_and_print(logger, "Initial JSON parse failed, attempting to clean JSON string", console_style="yellow")
            cleaned_json = clean_json_string(json_str)
            structure = json.loads(cleaned_json)
            log_and_print(logger, "Successfully parsed cleaned JSON structure", console_style="green")
        
        # Debug structure content
        log_and_print(logger, "Structure contains:", console_style="yellow")
        log_and_print(logger, f"- Commands: {len(structure.get('commands', []))} items", console_style="yellow")
        log_and_print(logger, f"- Files: {len(structure.get('files', {}))} items", console_style="yellow")
        log_and_print(logger, f"- Post-creation commands: {len(structure.get('post_creation_commands', []))} items", console_style="yellow")
        
        # Process commands first (they might create initial directories)
        commands = structure.get("commands", [])
        if commands:
            log_and_print(logger, f"\nProcessing {len(commands)} initial commands", console_style="yellow")
            run_commands(commands, base_path)
        
        # Process files (directories will be created automatically)
        files = structure.get("files", {})
        if files:
            log_and_print(logger, f"\nProcessing {len(files)} files", console_style="yellow")
            write_files(files, base_path)
            
        # Process post-creation commands
        post_commands = structure.get("post_creation_commands", [])
        if post_commands:
            log_and_print(logger, f"\nProcessing {len(post_commands)} post-creation commands", console_style="yellow")
            run_commands(post_commands, base_path)
        
    except Exception as e:
        error_msg = f"Error processing code structure: {str(e)}"
        log_and_print(logger, error_msg, level='error', console_style="red")
        log_and_print(logger, f"Current working directory: {os.getcwd()}", level='error', console_style="red")
        raise
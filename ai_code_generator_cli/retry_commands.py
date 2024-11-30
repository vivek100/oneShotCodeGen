import click
import os
import json
from .utils.file_utils import run_commands, init_logger
from .utils.logging_utils import setup_logger, log_and_print

@click.command()
@click.argument('project_dir', type=click.Path(exists=True))
@click.option('--component', type=str, help='Component type (frontend/backend)')
def retry_failed_commands(project_dir: str, component: str):
    """Retry failed commands from a previous run."""
    try:
        # Initialize logger with project directory
        logger = init_logger(project_dir)
        
        # Find the most recent log file from the project's logs directory
        logs_dir = os.path.join(project_dir, 'logs')
        if not os.path.exists(logs_dir):
            click.echo("No logs directory found in the project.")
            return
            
        log_files = [f for f in os.listdir(logs_dir) if f.endswith('.log')]
        if not log_files:
            click.echo("No log files found.")
            return
            
        latest_log = max(log_files, key=lambda x: os.path.getctime(os.path.join(logs_dir, x)))
        log_path = os.path.join(logs_dir, latest_log)
        click.echo(f"Reading log file: {log_path}")
        
        # Extract failed commands from log
        failed_commands = []
        with open(log_path, 'r', encoding='utf-8') as f:
            lines = f.readlines()
            for i, line in enumerate(lines):
                # Check for various failure patterns
                if any(pattern in line for pattern in [
                    "Command failed:",
                    "Command timed out",
                    "Error executing command",
                    "error:",
                    "Error:",
                    "failed with exit code"
                ]):
                    # Look for the actual command in surrounding lines
                    for j in range(max(0, i-3), min(len(lines), i+1)):
                        if "Running command:" in lines[j]:
                            cmd = lines[j].split("Running command:", 1)[1].strip()
                            if cmd and cmd not in failed_commands:
                                failed_commands.append(cmd)
                                click.echo(f"Found failed command: {cmd}")

        if not failed_commands:
            click.echo("No failed commands found in the logs.")
            return

        # Determine the base path based on component
        if component:
            base_path = os.path.join(project_dir, 'outputCode', component)
        else:
            base_path = project_dir

        # Show commands and confirm
        click.echo("\nFailed commands found:")
        for i, cmd in enumerate(failed_commands, 1):
            click.echo(f"{i}. {cmd}")
            
        if click.confirm("\nDo you want to retry these commands?"):
            run_commands(failed_commands, base_path)
            click.echo("\nRetry completed. Check the logs for details.")

    except Exception as e:
        click.echo(f"Error: {str(e)}")
        raise

if __name__ == '__main__':
    retry_failed_commands()

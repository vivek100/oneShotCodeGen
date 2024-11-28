import click
import os
import json
from utils.file_utils import run_commands
from utils.logging_utils import setup_logger, log_and_print

logger = setup_logger()

@click.command()
@click.argument('project_dir', type=click.Path(exists=True))
@click.option('--component', type=str, help='Component type (frontend/backend)')
def retry_failed_commands(project_dir: str, component: str):
    """Retry failed commands from a previous run."""
    try:
        # Find the most recent log file
        logs_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'Logs')
        log_files = [f for f in os.listdir(logs_dir) if f.endswith('.log')]
        if not log_files:
            click.echo("No log files found.")
            return
            
        latest_log = max(log_files, key=lambda x: os.path.getctime(os.path.join(logs_dir, x)))
        log_path = os.path.join(logs_dir, latest_log)
        
        # Extract failed commands from log
        failed_commands = []
        current_command = None
        with open(log_path, 'r') as f:
            for line in f:
                if "Command failed:" in line or "Command timed out" in line:
                    # Extract the command from the previous line
                    current_command = line.split(": ", 1)[1].strip()
                    if current_command:
                        failed_commands.append(current_command)

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

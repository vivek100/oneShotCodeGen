import logging
import os
from datetime import datetime
from rich.console import Console

console = Console()

def setup_logger(project_id=None):
    """Setup logger with file and console handlers."""
    # Create logs directory if it doesn't exist
    logs_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'Logs')
    os.makedirs(logs_dir, exist_ok=True)

    # Create logger
    logger = logging.getLogger('code_generator')
    logger.setLevel(logging.DEBUG)

    # Remove existing handlers to avoid duplicates
    logger.handlers.clear()

    # Create formatters
    file_formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
    console_formatter = logging.Formatter('%(message)s')

    # File handler
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    log_filename = f"codegen_{timestamp}.log" if not project_id else f"codegen_{project_id}.log"
    file_handler = logging.FileHandler(os.path.join(logs_dir, log_filename))
    file_handler.setLevel(logging.DEBUG)
    file_handler.setFormatter(file_formatter)
    logger.addHandler(file_handler)

    # Console handler
    console_handler = logging.StreamHandler()
    console_handler.setLevel(logging.INFO)
    console_handler.setFormatter(console_formatter)
    logger.addHandler(console_handler)

    return logger

def log_and_print(logger, message, level='info', console_style=None):
    """Log message to file and print to console with optional styling."""
    log_func = getattr(logger, level.lower())
    log_func(message)
    
    if console_style:
        console.print(message, style=console_style)
    else:
        console.print(message)

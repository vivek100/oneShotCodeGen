from pathlib import Path
from typing import Dict, Any
import json

class ContextLoader:
    def __init__(self, project_dir: Path):
        self.project_dir = project_dir
    
    def load_context(self) -> Dict[str, Any]:
        """Load all relevant context from the project directory"""
        context = {}
        
        # Load JSON files
        json_files = [
            "use_cases.json",
            "domain_model.json",
            "interface_model.json",
            "app_specification.json"
        ]
        
        for file_name in json_files:
            file_path = self.project_dir / file_name
            if file_path.exists():
                with open(file_path) as f:
                    key = file_name.replace(".json", "")
                    context[key] = json.load(f)
        
        # Load additional context if needed
        context["project_structure"] = self._get_project_structure()
        
        return context
    
    def _get_project_structure(self) -> Dict[str, Any]:
        """Get the current project structure"""
        structure = {}
        
        # Scan directories
        for item in self.project_dir.rglob("*"):
            if item.is_file() and not any(p.startswith(".") for p in item.parts):
                rel_path = str(item.relative_to(self.project_dir))
                structure[rel_path] = {
                    "type": "file",
                    "size": item.stat().st_size,
                    "modified": item.stat().st_mtime
                }
        
        return structure 
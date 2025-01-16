import json
import sys
from pathlib import Path

# Add the project root to Python path
project_root = Path(__file__).parent.parent.parent
sys.path.append(str(project_root))

# Now use absolute imports
from src.utils.output_handler import CodeGenerator
import shutil

def test_code_generation():
    """Test function to generate code from interface model JSON file"""
    try:
        # Load interface model from JSON file
        interface_model_path = Path("interface_model.json")  # Place this file in the utils directory
        with open(interface_model_path) as f:
            interface_model = json.load(f)
        
        # Debug: Print pages and their types
        print("\nPages in interface model:")
        for page in interface_model.get("pages", []):
            print(f"Page: {page.get('name')}, Type: {page.get('type')}")
        
        # Create test output directory
        output_dir = Path("test_output")
        if output_dir.exists():
            shutil.rmtree(output_dir)
        output_dir.mkdir(parents=True)
        
        # Create required subdirectories
        (output_dir / "frontend/src/components").mkdir(parents=True)
        (output_dir / "frontend/src/pages").mkdir(parents=True)
        
        # Initialize CodeGenerator
        generator = CodeGenerator(output_dir)
        
        print(f"\nStarting code generation with model from: {interface_model_path}")
        print(f"Output directory: {output_dir}")
        
        # Generate code with additional debugging
        for page in interface_model["pages"]:
            page_type = page.get("type", "unknown")
            page_name = page.get("name", "unnamed").replace(" ", "")
            print(f"\nProcessing page: {page_name} (type: {page_type})")
            
            if page_type == "dashboard":
                print(f"Generating dashboard page: {page_name}")
                try:
                    generator.render_template(
                        "dashboard_or_custom.jinja2",
                        {"page": page},
                        output_dir / "frontend/src/pages" / f"{page_name}.jsx"
                    )
                    print(f"Successfully generated dashboard page: {page_name}")
                except Exception as e:
                    print(f"Error generating dashboard page {page_name}: {str(e)}")
                    raise
        
        # Continue with normal code generation
        generator.generate_code(interface_model)
        
        print("\nGenerated files:")
        for file in output_dir.rglob("*"):
            if file.is_file():
                print(f"- {file.relative_to(output_dir)}")
        
        print("\nCode generation completed successfully!")
        
    except Exception as e:
        print(f"\nError during code generation: {str(e)}")
        raise

if __name__ == "__main__":
    test_code_generation()
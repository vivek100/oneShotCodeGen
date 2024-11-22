# AI Code Generator CLI v2

A command-line tool that generates complete web applications from natural language descriptions using AI. This version supports multiple prompt versions and flexible code generation strategies.

## Purpose

The purpose of this repository is to provide a seamless way to create fully functional full-stack web applications in one go. By dividing the user prompt into multiple steps, the tool can generate all necessary components, including:

- **Functional Requirements**: Captures what the application should do.
- **Technical Requirements**: Defines how the application will be built.
- **Backend Code**: Generates the server-side logic and database interactions.
- **Frontend Code**: Creates the user interface and client-side logic.

This structured approach allows users to specify their needs in a natural language format, and the tool translates these requirements into a complete application setup.

## Features

- Multiple prompt versions for requirements and code generation
- Support for both OpenAI and Anthropic models
- Flexible code generation strategies:
  - Combined API (DB + Backend) and Frontend (v1)
  - Separate Database, Backend, and Frontend (v2)
  - Custom combinations (v3)
- Rich console output with progress tracking
- Organized project structure with documentation

## Version Approaches

### Functional Requirements

The following table summarizes how each version generates functional requirements using different prompt versions:

| Version | Description | Functional Requirements Output |
|---------|-------------|-------------------------------|
| **v1**  | Separate DB, Backend, and Frontend | Detailed list of functionalities, user roles, and data entities. |
| **v2**  | Combined API (DB + Backend) and Frontend | Integrated functional requirements that align with both backend and frontend needs. |
| **v3**  | Custom combinations with templates | Flexible output based on user-defined templates, allowing for specific functional requirements. |

### Technical Requirements

The following table summarizes how each version generates technical requirements:

| Version | Description | Technical Requirements Output |
|---------|-------------|-------------------------------|
| **v1**  | Separate DB, Backend, and Frontend | Comprehensive technical specifications for each component, including architecture and data models. |
| **v2**  | Combined API (DB + Backend) and Frontend | Cohesive technical specifications that cover the entire application stack. |
| **v3**  | Custom combinations with templates | Tailored technical specifications based on user-defined templates, ensuring relevant details are captured. |

### Code Generation

The following table summarizes how each version generates code:

| Version | Description | Code Generation Output |
|---------|-------------|------------------------|
| **v1**  | Separate DB, Backend, and Frontend | Distinct code sections for each component, allowing for independent customization. |
| **v2**  | Combined API (DB + Backend) and Frontend | Integrated code output that ensures alignment between backend and frontend components. |
| **v3**  | Custom combinations with templates | Template-based code generation that follows user-defined structures, enhancing accuracy and consistency. |

### Explanation of Versions

- **v1**: This version separates the generation of the database, backend, and frontend components. It allows for detailed control over each part of the application, making it suitable for users who want to customize each section independently. The output is structured in a JSON format with distinct sections for each component, which can enhance clarity but may require more user input to ensure accuracy.

- **v2**: This version combines the database and backend generation into a cohesive API, along with the frontend. It streamlines the process for users who want a more integrated approach to building their applications. The output is a cohesive JSON structure that integrates both the database and API, which can improve the accuracy of the final output by ensuring that all components are aligned.

- **v3**: This version allows for custom combinations using predefined templates. It provides flexibility for users who have specific requirements and want to leverage existing code patterns. The output follows a template-based JSON structure, which can enhance accuracy by adhering to established patterns but may require careful template design to ensure all necessary details are captured.

## Installation

1. Clone the repository: 
   ```bash
   git clone https://github.com/yourusername/ai-code-generator-cli-v2.git
   cd ai-code-generator-cli-v2
   ```

2. Create a virtual environment:
   ```bash
   python -m venv venv
   ```

3. Activate the virtual environment:
   - **Windows**:
     ```bash
     venv\Scripts\activate
     ```
   - **Unix/MacOS**:
     ```bash
     source venv/bin/activate
     ```

4. Install the required packages:
   ```bash
   pip install -r requirements.txt
   pip install -e .
   ```

## Configuration

Create a `.env` file in the root directory with your API keys:
env
OPENAI_API_KEY=your_openai_key
ANTHROPIC_API_KEY=your_anthropic_key



## Usage

The tool provides various options for customization:

- Basic usage with default versions:
  ```bash
  python -m ai_code_generator_cli.cli "Create a todo app"
  ```

- Specify versions for each component:
  ```bash
  python -m ai_code_generator_cli.cli "Create a todo app" \
  --mode full \
  --func-version v2 \
  --tech-version v1 \
  --code-version v3 \
  --backend-template templates/backend.txt \
  --frontend-template templates/frontend.txt
  ```

- Use Anthropic's Claude instead of GPT-4:
  ```bash
  python -m ai_code_generator_cli.cli "Create a todo app" --model anthropic
  ```

- Generate only requirements and code:
  ```bash
  python -m ai_code_generator_cli.cli "Create a todo app" --mode code --func-version v1 --tech-version v1 --code-version v1 
  ```

### Options

- `--mode`: Processing mode
  - `requirements`: Generate only requirements documents
  - `code`: Generate requirements and code (without creating files)
  - `full`: Generate requirements, code, and create project files
- `--func-version`: Version of functional requirements prompt (v1/v2/v3)
- `--tech-version`: Version of technical requirements prompt (v1/v2/v3)
- `--code-version`: Version of code generation prompts (v1/v2/v3)
- `--model`: AI model provider (openai/anthropic)
- `--backend-template`: Path to backend code template file (for v3 only)
- `--frontend-template`: Path to frontend code template file (for v3 only)

## Project Structure

Generated projects follow a consistent structure:

generated_projects/
└── project_YYYYMMDD_HHMMSS_uniqueid/
├── docs/
│ ├── functional_requirements.md
│ └── technical_requirements.md
├── generatedCode/
│ ├── backend/
│ │ └── output.txt
│ └── frontend/
│ └── output.txt
└── project_summary.md


## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Note

Make sure to include a `.gitignore` file to prevent sensitive information and unnecessary files from being uploaded to GitHub.
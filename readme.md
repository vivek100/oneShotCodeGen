# App Generator CLI

A command-line interface tool for generating full-stack applications with React Admin frontend and Supabase backend.

## Updates
- 2025-01-27 (Docusign + Web Version):
    - Added Docusign integration
    - Added Web Version hosted on Vercel with code here: https://github.com/vivek100/webverion1
    - Added Vercel Functions for backend for openai calls and docusign integration
- 2024-01-24 (Docker & Nginx Integration):
    - Added Docker and Nginx deployment options for both create and edit flows
    - Support for containerized deployment with optional Nginx reverse proxy
    - Automatic port management and container configuration
    - Simplified deployment process with single command setup

- 2024-01-16 (Edit Flow):
    - Introduced intelligent update strategies for modifying existing applications
    - Added versioning support for application updates
    - Supports two main update approaches:
        - Full Regeneration: Complete rebuild while preserving core functionality
        - Use Case Update: Targeted modifications to specific components
    - Smart backup system that creates timestamped backups before changes
    - Version tracking for multiple iterations of the same application

- 2024-01-10 (Optimized AI Generation Pipeline):
    - Restructured AI generation from 2 calls to 4 specialized calls:
        1. Use Case Generation: Focused on business logic and user workflows
        2. Entity Model Generation: Database schema and relationships
        3. Mock Data Generation: Test data and user scenarios
        4. Interface Model Generation: UI components and layouts
    - Benefits:
        - Improved accuracy through specialized prompts
        - Better error handling and validation between steps
        - Reduced token usage per call
        - Enhanced ability to maintain context
    - Original 2-call approach moved to legacy mode for backwards compatibility


- 2024-12-20(reduced token usage by 70% and accuracy by 80%):
    - Integrated with outlines to generate the structured output, this uses a method where logits are assigned low or zero probability to the tokens that are not part of the output, this is done right before the token is generated. This enables the tool to get higher accuracy output with smaller models
    - The structured output is then used to generate the frontend and backend code which sort of like configuration files, this helps in generating the code with less tokens
        - The DB output is a json of entities and their relationships, this is used to generate the SQL queries via python code and run the sql to create tables and views on supabase
        - The frontend structured output is structured around react admin and the components, this is used to generate the frontend code using jinja2 templates
        - Backend is simulated using supabase js client via dataproviders
    - Together this enables the tool to generate the frontend and backend code with less tokens, higher accuracy and with a smaller model like gpt-4o-mini

## Features

- Generates complete React applications with Material-UI components
- Integrates with Supabase for backend services
- Includes authentication and authorization
- Generates CRUD operations for entities
- Supports custom domain models
- Includes pre-built components (Tables, Forms, Charts, etc.)

## Prerequisites

- Python 3.8 or higher
- Node.js and npm
- Supabase account
- Docker (optional, for containerized deployment)
- Nginx (optional, for reverse proxy)

## Docker & Nginx Setup (optional)

1. Install Docker:
```bash
# For Ubuntu
sudo apt-get update
sudo apt-get install docker.io
sudo systemctl start docker
sudo systemctl enable docker

# For macOS/Windows
Download and install Docker Desktop from https://www.docker.com/products/docker-desktop
```

2. Build Base Image:
```bash
# Navigate to the project root directory
cd oneShotCodeGen

# Build the base image
docker build -t base-image -f base.Dockerfile .

# Verify the image was created
docker images | grep base-image
```

3. Install Nginx:
```bash
# For Ubuntu
sudo apt-get install nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# For macOS
brew install nginx

# For Windows
Download and install Nginx from http://nginx.org/en/download.html
```

4. Configure Nginx user permissions (Linux/macOS):
```bash
# Add your user to nginx group
sudo usermod -aG nginx $USER
# Ensure nginx config directory is writable
sudo chown -R $USER:$USER /etc/nginx/conf.d
```

Note: The base image needs to be built only once, unless you make changes to the Dockerfile. This base image contains all the necessary dependencies and configurations that will be used as a foundation for all generated applications.

## Installation

1. Clone the repository
2. Install the package: `pip install -r requirements.txt`


## Usage

1. Set up your environment variables in `.env`:
``` bash
OPENAI_API_KEY=your_openai_api_key
SUPABASE_PROJECT_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_DB_PASSWORD=your_db_password
```
Make sure following permissions are set for frontend to run aggregate queries:
``` sql
ALTER ROLE authenticator SET pgrst.db_aggregates_enabled = 'true';
NOTIFY pgrst, 'reload config';
```

2. Generate an application with Docker:
```bash
a. Latest version
# Just code generation
python -m src.cli create "Create an expense tracker app"

# With Docker only
python -m src.cli create "Create an expense tracker app" --docker

# With Docker and Nginx
python -m src.cli create "Create an expense tracker app" --docker --nginx
```
b. Using legacy mode (2-call approach):
``` bash
python -m src.cli create "Create an expense tracker app" --use-legacy
```
c. Adding custom output directory:
``` bash
python -m src.cli create "Create an expense tracker app" --output-dir "path/to/
outputfolder"
```
3. Edit an existing application with Docker:
```bash
# Just code generation
python -m src.cli edit <project_dir> --description "Add a dashboard for expense 
analytics"
# With Docker only
python -m src.cli edit <project_dir> --description "Add a dashboard" --docker

# With Docker and Nginx
python -m src.cli edit <project_dir> --description "Add a dashboard" --docker --nginx
```

3. Running the application:

a. Local Development (Default):
```bash
cd output/{output_folder_name}/frontend
npm install
npm run dev
```

b. Docker Deployment:
- Application will be available at `http://localhost:<port>`
- Port is automatically assigned and displayed after deployment

c. Docker with Nginx:
- Application will be available at `http://localhost/{app_name}`
- Nginx handles routing and load balancing

## Deployment Options

1. **Local Development**
   - Direct npm-based development server
   - Best for development and testing
   - Hot-reloading enabled

2. **Docker Deployment**
   - Containerized application
   - Isolated environment
   - Automatic port management
   - Suitable for production

3. **Docker with Nginx**
   - Reverse proxy configuration
   - Path-based routing
   - Load balancing capability
   - Enhanced production setup

## Version Control

- Applications now include version tracking
- Version format: v0, v1, v2, etc.
- Version number increments based on backup history
- Helps track multiple iterations of the same application

## Project Structure
``` bash
app-generator-cli/
├── src/ # Source code for the CLI
├── output/ # Generated applications
│ └── [timestamp]/ # Timestamp-based output directory
│   ├── frontend/ # React frontend application
│   ├── use_cases.json # Use case definitions
│   ├── entities.json # Entity model
│   ├── mock_users.json # Mock user data
│   ├── mock_data.json # Generated test data
│   ├── domain_model.json # Combined application model
│   ├── interface_model.json # UI/UX specifications
│   ├── sql/ # Generated SQL migrations
│   ├── src/ # Generated application source
│   └── generation.log # Generation process log
└── .env # Environment variables
```

## Edit Flow

The Edit Flow system allows you to modify existing applications while maintaining consistency and safety. Here's how to use it:

1. Update an existing application:
```bash
python -m src.cli update "Add a dashboard for expense analytics"
```

2. The system will:
   - Analyze your change request
   - Choose an appropriate update strategy
   - Create a backup of your current application
   - Apply the changes while maintaining data consistency

### Update Strategies

1. **Full Regeneration**
   - Used for major architectural changes
   - Preserves existing functionality while rebuilding the application
   - Maintains data consistency with existing models

2. **Partial Update**
   - For targeted changes to specific components
   - Updates only affected parts of the application
   - Supports modular updates to:
     - Use cases and workflows
     - Entity models and relationships
     - Mock data and test users
     - Interface components

### Backup System

- Automatic backups created before any changes
- Timestamped backup directories: `backups/backup_YYYYMMDD_HHMMSS/`
- Easy rollback if needed

## Generated Application Structure

The tool generates a React application with the following structure:
``` bash
frontend/
├── src/
│ ├── components/ # Reusable UI components
│ │ ├── Button.jsx
│ │ ├── Card.jsx
│ │ ├── Chart.jsx
│ │ ├── Form.jsx
│ │ ├── Modal.jsx
│ │ └── Table.jsx
│ ├── pages/ # Application pages
│ ├── providers/ # Data and auth providers
│ └── App.js # Main application component
└── package.json # Project dependencies
```


## Dependencies

### CLI Dependencies
- typer[all]==0.9.0
- pydantic==2.6.1
- numpy
- outlines
- rich==13.7.0
- python-dotenv==1.0.0
- jinja2==3.1.3
- supabase==2.3.4
- asyncio==3.4.3
- aiohttp==3.9.3
- rich-click==1.7.3
- inquirer==3.2.4
- colorama==0.4.6
- openai

### Generated Frontend Dependencies
- React 19.0.0
- Material-UI 6.1.10
- React Admin 5.4.1
- Recharts 2.14.1
- Supabase JS Client 2.47.2

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
# AI ERP App Configuration Agent Backend

This is the backend server for the AI ERP App Configuration Agent, a system that generates app configurations through a series of AI and tool-based steps organized in flows.

## Architecture

The system is built around the following key components:

1. **Agent Router**: Routes user messages to appropriate flows based on the main agent decision.
2. **Flow Registry**: Manages flow definitions and their steps.
3. **Flow Runner**: Orchestrates flow execution by running steps in sequence.
4. **Step Executor**: Executes individual steps (AI or tool calls).
5. **Tool Call Module**: Executes non-AI operations like entity reorganization, merging, etc.
6. **Prompt & Schema Store**: Manages prompt templates, schemas, and examples.
7. **Message Dispatcher**: Handles system messages during flow execution.

## Setup

### Prerequisites

- Python 3.8+
- pip

### Installation

1. Clone the repository
2. Navigate to the backend directory:
   ```
   cd backend
   ```
3. Install dependencies:
   ```
   pip install -r requirements.txt
   ```
4. Create a `.env` file based on `sample.env`:
   ```
   cp sample.env .env
   ```
5. Edit the `.env` file to add your OpenAI API key and other settings

### Running the Server

```
python main.py
```

The server will be available at `http://localhost:8000`.

## API Endpoints

### Project & Chat Manager

- `POST /projects/start` - Start a new project
- `GET /projects` - List all projects
- `GET /projects/{id}` - Get project details
- `GET /projects/{id}/messages` - Get all messages for a project
- `POST /projects/{id}/messages` - Add a message to a project

### App Version & Preview

- `GET /app-version/latest?project_id=...` - Get latest app config
- `GET /app-version/{version_id}` - Get specific app version

### Flow Run & Replay

- `GET /flow-runs/{id}` - Get flow run details
- `GET /flow-runs/{id}/steps` - Get all steps for a flow run
- `GET /step-runs/{id}` - Get step run details
- `POST /step-runs/{id}/replay` - Replay a step run

### Flow Configuration

- `GET /flows` - List all flows
- `GET /flows/{id}` - Get flow details
- `GET /flows/{id}/steps` - Get all steps for a flow
- `GET /prompts` - List all prompt templates
- `GET /schemas` - List all schemas
- `GET /one-shots` - List all one-shot examples

## Flow Types

### Main Agent Flow

Decides what to do with user input:
- Start create flow
- Start edit flow
- Ask for clarification
- Respond with info
- Reject request

### Create App Flow

Generates a complete app configuration with:
- Auth config
- Use cases
- Use case details
- Entities
- Entity assets
- Page schema
- Page details

### Edit Decision Flow

Decides how to handle edit requests:
- Too complex → full regeneration
- Modular → partial edit flow
- Ambiguous → ask for clarification
- Invalid → reject

### Partial Edit Flow

Updates specific parts of an app configuration based on an edit plan.

## Database Seeding

The system includes a comprehensive seeding mechanism to populate the database with initial data for flows, steps, prompts, schemas, and one-shot examples.

### Seeding Structure

The seeding system is organized into the following components:

1. **Flows**: Core workflows for app configuration
2. **Steps**: Individual actions within each flow
3. **Prompts**: Templates for AI interactions
4. **Schemas**: Validation structures for data
5. **One-shot Examples**: Sample inputs and outputs for AI steps

### Seeding Process

To seed the database:

1. Ensure the database is running and accessible
2. Run the seeding script:

```powershell
python -m backend.db.seeds.seed_all
```

This will execute the following steps:

1. Clear existing seed data (optional)
2. Seed all flows in the correct order:
   - Main Agent Flow
   - Edit Decision Flow
   - Create App Flow
   - Edit Partial Flow
3. Seed all steps for each flow
4. Seed associated prompts, schemas, and one-shot examples

### Flow Seeding Details

Each flow is seeded with:

- Flow metadata (name, version, description)
- Ordered steps with:
  - Step type (AI or tool call)
  - Input mappings
  - System messages
  - Prompt templates (for AI steps)
  - Output schemas
  - One-shot examples (for AI steps)
  - Start/complete messages

### Customizing Seeds

To modify or add seeds:

1. Create new seed files in the appropriate directory
2. Use the `seed_utils` module for common operations
3. Add your new seed function to `seed_all.py`
4. Run the seeding script to apply changes

### Seed Verification

After seeding, you can verify the data using:

```powershell
python -m backend.db.seeds.verify_seeds
```

This will check that all required data is present and valid.

## Code Generation

The system now supports generating downloadable code for applications. This feature allows users to download a complete React application based on their app configuration.

### How it works

1. When a user clicks the "Download Code" button in the UI, a request is sent to the backend
2. The backend generates a static version of the app with:
   - A static configuration file (no dynamic loading)
   - Individual component files for each page in the app
   - Modified routing and context providers
3. The code is packaged as a ZIP file and returned to the user

### API Endpoint

```
GET /api/projects/{project_id}/generate-code
```

This endpoint returns a ZIP file containing the generated application code.

### Generated App Structure

The generated application maintains the same core functionality as the preview app but with a static configuration:

- Uses a pre-built configuration file instead of loading dynamically
- Creates individual component files for each page
- Includes a comprehensive README with setup instructions
- Can be run independently with `npm install` and `npm run dev`

## Cloud Mode vs Open Source Mode

This project can run in two different modes:

### Open Source Mode (Default)
- No authentication required
- All features accessible without login
- Flow editor accessible for modifications
- Ideal for local development and self-hosting

### Cloud Mode
- Requires authentication for certain actions:
  - Creating new projects
  - Sending messages
  - Downloading generated code
  - Creating/updating flows
- Flow editor disabled in cloud mode
- Uses Supabase for authentication

## Setting Up Cloud Mode

1. Create a Supabase account and project at [supabase.com](https://supabase.com)
2. Enable authentication with GitHub and Google sign-in options
3. Set the following environment variables:

**Backend (.env file)**:
```
CLOUD_MODE=true
SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
```

**Frontend (.env.local file)**:
```
NEXT_PUBLIC_CLOUD_MODE=true
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### Authentication Flow

In cloud mode, users can still:
- Visit the application
- Create new projects
- Generate applications

But to download code or modify flows, they will need to sign in. 
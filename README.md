# oneShotCodeGen - AI Retool/ERP App Generation

A modular agent-based system for generating and editing app configurations through AI-driven steps organized in flows.

## Overview

This project provides an advanced AI-powered platform for automatically generating and editing enterprise application configurations through a series of intelligent agent flows. Built with a modular architecture, it leverages OpenAI's APIs and structured generation to produce consistent, high-quality app specifications.

**Repository: [https://github.com/vivek100/oneShotCodeGen](https://github.com/vivek100/oneShotCodeGen)**

## Project Structure

- **backend/**: Modular FastAPI backend with agent flow system
- **frontend/**: React-based frontend interface with real-time updates

## Quick Start

### Backend Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/vivek100/oneShotCodeGen.git
   cd oneShotCodeGen
   ```

2. Set up Python environment:
   ```bash
   cd backend
   python -m venv venv
   # On Windows
   venv\Scripts\activate
   # On macOS/Linux
   source venv/bin/activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Create environment file:
   ```bash
   cp sample.env .env
   ```

5. Configure your environment variables in `.env`:
   ```
   # API Configuration
   HOST=0.0.0.0
   PORT=8000

   # Database Configuration
   DB_URL=sqlite:///./agent.db

   # OpenAI API Configuration
   OPENAI_API_KEY=your_openai_api_key_here
   OPENAI_MODEL_NAME=gpt-4.1-nano

   # Frontend Configuration (for CORS)
   FRONTEND_ORIGIN=http://localhost:3000
   ```

6. Start the backend server:
   ```bash
   # Development mode with auto-reload
   python main.py
   # Or using uvicorn directly
   uvicorn main:app --host 0.0.0.0 --port 8000 --reload
   ```

The backend API will be available at `http://localhost:8000`.

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install Node.js dependencies:
   ```bash
   npm install
   ```

3. Create environment file:
   ```bash
   cp .env.example .env.local
   ```

4. Configure your environment variables in `.env.local`:
   ```
   NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

The frontend will be available at `http://localhost:3000`.

## Backend Architecture

The backend is built with a modular architecture focused on managing agent flows and step execution:

### Core Modules

1. **Agent Router**: Routes user messages to appropriate flows based on the main agent decision.
2. **Flow Registry**: Manages flow definitions and their steps.
3. **Flow Runner**: Orchestrates flow execution by running steps in sequence.
4. **Step Executor**: Executes individual steps (AI or tool calls).
5. **Tool Call Module**: Executes non-AI operations like entity reorganization, merging, etc.
6. **Prompt & Schema Store**: Manages prompt templates, schemas, and examples.
7. **Message Dispatcher**: Handles system messages during flow execution.
8. **Replay Engine**: Re-runs steps with original or modified inputs for testing and debugging.
9. **WebSocket Manager**: Provides real-time communication for chat messages and flow status updates.

### Flow Types

- **Main Agent Flow**: Decides what to do with user input
- **Create App Flow**: Generates a complete app configuration
- **Edit Decision Flow**: Decides how to handle edit requests
- **Partial Edit Flow**: Updates specific parts of an app configuration

### Database Structure

The system uses SQLite with the following key tables:

- **Projects**: Stores project metadata
- **Messages**: Stores chat messages for each project
- **AppVersions**: Stores app configuration versions
- **Flows**: Stores flow definitions
- **Steps**: Stores step definitions within flows
- **FlowRuns**: Tracks executions of flows
- **StepRuns**: Tracks executions of individual steps
- **Prompts**: Stores prompt templates
- **Schemas**: Stores JSON schemas for validation
- **OneShots**: Stores example inputs/outputs for steps
- **PydanticSchemas**: Stores Pydantic model references

## Frontend Architecture

The frontend is built with React and Next.js, providing a modern and responsive user interface:

### Key Features

1. **Project Management**: Create, view, and manage application configuration projects
2. **Real-time Chat**: Interact with the AI agent through a WebSocket-powered chat interface
3. **Configuration Preview**: View and explore generated app configurations
4. **Flow Visualization**: Explore the agent flows and steps
5. **Step Replay**: Debug and experiment with individual AI steps
6. **Application Preview**: Preview the generated application (work in progress)

### Technology Stack

- **React & Next.js**: Core frontend framework
- **Tailwind CSS**: Utility-first CSS framework
- **ShadcnUI**: Component library based on Radix UI
- **React Query**: Data fetching and caching
- **Zustand**: State management
- **WebSockets**: Real-time communication

## How It Works

The AI ERP App Configuration Generator works through a series of interconnected agent flows:

1. **User Interaction**: Users interact with the system through a chat interface, describing the application they want to build or the changes they want to make.

2. **Main Agent Decision**: The main agent analyzes the user's message and decides which specialized flow to execute (create new app, edit existing app, etc.).

3. **Flow Execution**: The selected flow runs through a series of steps, combining AI reasoning with specialized tool calls.

4. **AI Steps**: These steps use large language models (via OpenAI's API) to:
   - Generate use cases from requirements
   - Design entity models and relationships
   - Create interface specifications
   - Plan data model implementations

5. **Tool Call Steps**: Non-AI steps perform operations like:
   - Reorganizing entities to handle foreign key relationships
   - Merging changes into existing configurations
   - Validating configuration integrity
   - Generating final output structures

6. **Structured Generation**: The system uses both JSON schema validation and Pydantic models to ensure consistent, well-structured outputs from the AI.

7. **Real-time Updates**: WebSockets provide real-time chat messages and status updates to the frontend.

## Pydantic Structured Generation

The system leverages Pydantic models for structured LLM generation, providing robust type validation:

```python
from typing import List, Optional, Literal
from pydantic import BaseModel, ConfigDict, Field

class Entity(BaseModel):
    model_config = ConfigDict(extra="forbid", exclude_none=True)
    
    name: str = Field(..., description="Entity name")
    description: str = Field(..., description="Entity description")
    fields: List["Field"] = Field(..., description="Entity fields")

class Field(BaseModel):
    model_config = ConfigDict(extra="forbid", exclude_none=True)
    
    name: str = Field(..., description="Field name")
    type: str = Field(..., description="Field type")
    description: str = Field(..., description="Field description")
    required: bool = Field(..., description="Whether field is required")
```

## Template Rendering with Jinja2

The system uses Jinja2 for flexible prompt templates:

```jinja
You are designing an entity model for a business application.

# Requirements
{{ requirements | json }}

# Guidelines
- Create entities based on the business domain
- Consider relationships between entities
- Follow naming conventions

# Expected Output
{{ schema | json }}
```

## Deployment Options

### Local Development

Run both the frontend and backend in development mode as described in the Quick Start section.

### Production Deployment

1. **Backend**:
   - Build a Docker container for the FastAPI backend
   - Deploy to a cloud service like AWS, GCP, or Azure
   - Set up appropriate environment variables

2. **Frontend**:
   - Build the Next.js application: `npm run build`
   - Deploy to Vercel, Netlify, or another hosting service
   - Configure environment variables to point to your deployed backend

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- This project uses OpenAI's API for large language model capabilities
- Inspired by the potential of AI-assisted software engineering
- Built with a focus on modular, maintainable architecture

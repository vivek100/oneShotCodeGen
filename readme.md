# App Generator CLI

A command-line interface tool for generating full-stack applications with React Admin frontend and Supabase backend.

## Updates

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

## Installation

1. Clone the repository
2. Install the package: `pip install .`


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

2. Generate an application:

``` bash
python -m src.cli "Create an expense tracker app"
```
Once generated, you can run the frontend by running `npm start` in the frontend directory:
``` bash
cd output/{output_folder_name}/frontend
npm start
```

## Project Structure
``` bash
app-generator-cli/
├── src/ # Source code for the CLI
├── output/ # Generated applications
│ └── [timestamp]/ # Timestamp-based output directory
│ ├── frontend/ # React frontend application
│ └── domain_model.json # Application domain model
└── .env # Environment variables
```


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
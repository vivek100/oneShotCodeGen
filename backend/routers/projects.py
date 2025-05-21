from fastapi import APIRouter, HTTPException, BackgroundTasks, Depends, Response
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, ConfigDict, Field
import uuid
import os
import tempfile
import zipfile
import shutil
import json
from io import BytesIO
from sqlalchemy.orm import Session

from core.agent_router import AgentRouter
from db.database import database
from db.database import get_db

router = APIRouter()

class ProjectCreate(BaseModel):
    model_config = ConfigDict(extra="forbid", exclude_none=True)
    
    title: str = Field(..., description="Title of the project")
    description: Optional[str] = Field(None, description="Description of the project")
    user_id: Optional[str] = Field(None, description="ID of the user")

class MessageCreate(BaseModel):
    model_config = ConfigDict(extra="forbid", exclude_none=True)
    
    content: str = Field(..., description="Content of the message")

class ProjectResponse(BaseModel):
    model_config = ConfigDict(extra="forbid", exclude_none=True)
    
    id: str = Field(..., description="ID of the project")
    title: str = Field(..., description="Title of the project")
    description: Optional[str] = Field(None, description="Description of the project")
    created_at: str = Field(..., description="Creation timestamp")
    updated_at: str = Field(..., description="Last update timestamp")
    user_id: Optional[str] = Field(None, description="ID of the user")

class MessageResponse(BaseModel):
    model_config = ConfigDict(extra="forbid", exclude_none=True)
    
    id: str = Field(..., description="ID of the message")
    project_id: str = Field(..., description="ID of the project")
    role: str = Field(..., description="Role of the message sender")
    content: str = Field(..., description="Content of the message")
    created_at: str = Field(..., description="Creation timestamp")

class ProjectStartWithMessage(BaseModel):
    model_config = ConfigDict(extra="forbid", exclude_none=True)
    
    title: str = Field(..., description="Title of the project")
    description: Optional[str] = Field(None, description="Description of the project")
    user_id: Optional[str] = Field(None, description="ID of the user")
    message: str = Field(..., description="First message to process")

class GenerateCodeResponse(BaseModel):
    model_config = ConfigDict(extra="forbid", exclude_none=True)
    message: str = Field(..., description="Status message")
    project_id: str = Field(..., description="Project ID for which code was generated")

@router.post("/start", response_model=ProjectResponse)
async def start_project(project: ProjectCreate):
    """Start a new project and create initial chat session"""
    try:
        project_id = await AgentRouter.start_project(
            title=project.title,
            user_id=project.user_id,
            description=project.description
        )
        
        # Get the created project
        query = """
        SELECT * FROM projects WHERE id = :project_id
        """
        result = await database.fetch_one(query=query, values={"project_id": project_id})
        
        if not result:
            raise HTTPException(status_code=500, detail="Project creation failed")
        
        result_dict = dict(result)
        # Filter to only include fields defined in the response model
        filtered_result = {
            k: v for k, v in result_dict.items() 
            if k in ProjectResponse.model_fields
        }
        return filtered_result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("", response_model=List[ProjectResponse])
async def list_projects():
    """Get a list of all projects"""
    try:
        query = """
        SELECT * FROM projects ORDER BY created_at DESC
        """
        results = await database.fetch_all(query=query)
        # Filter to only include fields defined in the response model
        filtered_results = []
        for result in results:
            result_dict = dict(result)
            filtered_results.append({
                k: v for k, v in result_dict.items() 
                if k in ProjectResponse.model_fields
            })
        return filtered_results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{project_id}", response_model=ProjectResponse)
async def get_project(project_id: str):
    """Get project details by ID"""
    try:
        query = """
        SELECT * FROM projects WHERE id = :project_id
        """
        result = await database.fetch_one(query=query, values={"project_id": project_id})
        
        if not result:
            raise HTTPException(status_code=404, detail="Project not found")
        
        result_dict = dict(result)
        # Filter to only include fields defined in the response model
        filtered_result = {
            k: v for k, v in result_dict.items() 
            if k in ProjectResponse.model_fields
        }
        return filtered_result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{project_id}/messages", response_model=List[MessageResponse])
async def get_project_messages(project_id: str):
    """Get all messages for a project"""
    try:
        query = """
        SELECT * FROM messages 
        WHERE project_id = :project_id
        ORDER BY created_at ASC
        """
        results = await database.fetch_all(query=query, values={"project_id": project_id})
        # Filter to only include fields defined in the response model
        filtered_results = []
        for result in results:
            result_dict = dict(result)
            filtered_results.append({
                k: v for k, v in result_dict.items() 
                if k in MessageResponse.model_fields
            })
        return filtered_results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{project_id}/messages", response_model=Dict[str, Any])
async def create_message(project_id: str, message: MessageCreate, background_tasks: BackgroundTasks):
    """
    Add a new message to the project and trigger the agent flow
    
    This is an asynchronous operation - the response will be immediate,
    but the agent processing will happen in the background.
    """
    try:
        # Process the message in the background
        # This allows the API to respond immediately while processing continues
        background_tasks.add_task(
            AgentRouter.handle_message,
            project_id=project_id,
            message_content=message.content
        )
        
        return {
            "status": "processing",
            "message": "Message received and being processed"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/start-with-message", response_model=Dict[str, Any])
async def start_project_with_message(project_data: ProjectStartWithMessage, background_tasks: BackgroundTasks):
    """Start a new project and process the first message"""
    try:
        # Create the project
        project_id = await AgentRouter.start_project(
            title=project_data.title,
            user_id=project_data.user_id,
            description=project_data.description
        )
        
        # Process the message in the background
        background_tasks.add_task(
            AgentRouter.handle_message,
            project_id=project_id,
            message_content=project_data.message
        )
        
        # Get the created project
        query = """
        SELECT * FROM projects WHERE id = :project_id
        """
        result = await database.fetch_one(query=query, values={"project_id": project_id})
        
        if not result:
            raise HTTPException(status_code=500, detail="Project creation failed")
        
        result_dict = dict(result)
        # Filter to only include fields defined in the response model
        filtered_result = {
            k: v for k, v in result_dict.items() 
            if k in ProjectResponse.model_fields
        }
        
        return {
            "project": filtered_result,
            "status": "processing",
            "message": "Project created and message is being processed"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{project_id}/generate-code", response_class=Response)
async def generate_code(project_id: str):
    """
    Generate and return a zip file of the application code based on the project's app config.
    """
    
    # Get the app config from app versions table
    query = """
        SELECT * FROM app_versions
        WHERE project_id = :project_id
        ORDER BY version_number DESC
        LIMIT 1
    """
    app_version_result = await database.fetch_one(query=query, values={"project_id": project_id})
    if not app_version_result:
        raise HTTPException(status_code=404, detail="App version not found")
    
    app_config_data = app_version_result.config_json
    if not app_config_data:
        raise HTTPException(status_code=400, detail="Project has no app configuration")
    
    app_config = json.loads(app_config_data)  # Parse JSON string to dict
    
    # Create a temporary directory to build the project
    with tempfile.TemporaryDirectory() as temp_dir:
        try:
            # Copy the base app template (excluding node_modules)
            base_app_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "baseApp")
            
            for item in os.listdir(base_app_path):
                if item != "node_modules" and item != ".git" and item != "dist":
                    src_path = os.path.join(base_app_path, item)
                    dst_path = os.path.join(temp_dir, item)
                    
                    if os.path.isdir(src_path):
                        shutil.copytree(src_path, dst_path)
                    else:
                        shutil.copy2(src_path, dst_path)
            
            # Generate the application pages based on the config
            await generate_app_pages(temp_dir, app_config)
            
            # Create a zip file in memory
            memory_file = BytesIO()
            
            with zipfile.ZipFile(memory_file, 'w', zipfile.ZIP_DEFLATED) as zf:
                for root, dirs, files in os.walk(temp_dir):
                    for file in files:
                        file_path = os.path.join(root, file)
                        arc_name = os.path.relpath(file_path, temp_dir)
                        zf.write(file_path, arc_name)
            
            # Reset file position
            memory_file.seek(0)
            
            # Return the zip file
            return Response(
                content=memory_file.getvalue(),
                media_type="application/zip",
                headers={"Content-Disposition": f"attachment; filename={project_id.replace(' ', '_')}_code.zip"}
            )
            
        except Exception as e:
            print(f"Error generating code: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Error generating code: {str(e)}")

async def generate_app_pages(temp_dir: str, app_config: dict):
    """
    Generate the application pages based on the configuration.
    """
    # Create a pages directory if it doesn't exist
    pages_dir = os.path.join(temp_dir, "src", "pages")
    os.makedirs(pages_dir, exist_ok=True)
    
    # Save the config as a static file
    config_path = os.path.join(temp_dir, "src", "config.json")
    with open(config_path, "w") as f:
        json.dump(app_config, f, indent=2)
    
    # Generate static AppContext.tsx without dynamic loading
    app_context_path = os.path.join(temp_dir, "src", "context", "StaticAppContext.tsx")
    app_context_content = generate_static_app_context()
    
    os.makedirs(os.path.dirname(app_context_path), exist_ok=True)
    with open(app_context_path, "w") as f:
        f.write(app_context_content)
    
    # Override the main AppContext to use StaticAppContext
    with open(os.path.join(temp_dir, "src", "context", "AppContext.tsx"), "w") as f:
        f.write(app_context_content)
    
    # Process top-level pages array if it exists
    top_level_pages = app_config.get("pages", [])
    for page in top_level_pages:
        page_id = page.get("id", "").capitalize()
        page_title = page.get("title", page_id)
        path = page.get("path", f"/{page_id.lower()}")
        
        # Generate the page component based on zones/components
        page_content = generate_page_component_from_zones(page_id, page_title, page.get("zones", []))
        
        page_path = os.path.join(pages_dir, f"{page_id}.tsx")
        with open(page_path, "w") as f:
            f.write(page_content)
    
    # Also process resource-specific pages if they exist
    resources = app_config.get("resources", {})
    for resource_key, resource in resources.items():
        if "pages" in resource:
            for page_key, page in resource["pages"].items():
                # Generate the page component
                page_name = f"{resource_key.capitalize()}{page_key.capitalize()}"
                page_content = generate_page_component(page_name, page, resource_key)
                
                page_path = os.path.join(pages_dir, f"{page_name}.tsx")
                with open(page_path, "w") as f:
                    f.write(page_content)
    
    # Generate routes file
    routes_path = os.path.join(temp_dir, "src", "routes.tsx")
    routes_content = generate_routes(resources, top_level_pages)
    with open(routes_path, "w") as f:
        f.write(routes_content)
    
    # Generate README with information about the generated app
    readme_path = os.path.join(temp_dir, "README.md")
    readme_content = generate_readme(app_config)
    with open(readme_path, "w") as f:
        f.write(readme_content)

def generate_static_app_context():
    """
    Generate a static version of AppContext.tsx that loads the config from a local file
    """
    return '''import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { useNavigate, useLocation, useSearchParams } from "react-router-dom"
import config from "../config.json"
import { initMockApi } from "../lib/mockApi"
import type { AppConfig } from "../types/config"

type AppContextType = {
  config: AppConfig | null
  loading: boolean
  error: string | null
  currentUser: any | null
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
  register: (name: string, email: string, password: string, role: string) => Promise<boolean>
}

const AppContext = createContext<AppContextType>({
  config: null,
  loading: true,
  error: null,
  currentUser: null,
  login: async () => false,
  logout: () => {},
  register: async () => false,
})

export const useApp = () => useContext(AppContext)

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentUser, setCurrentUser] = useState<any | null>(null)
  const [initialized, setInitialized] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  /* Initialize the app */
  useEffect(() => {
    const init = async () => {
      if (initialized) return

      try {
        /* Initialize the mock API with the configuration */
        initMockApi(config)

        /* Check if there's a stored session */
        if (typeof window !== "undefined") {
          const storedUser = localStorage.getItem("currentUser")
          if (storedUser) {
            setCurrentUser(JSON.parse(storedUser))
          }
        }

        setInitialized(true)
      } catch (err) {
        console.error("Failed to initialize app:", err)
        setError("Failed to load application configuration")
      } finally {
        setLoading(false)
      }
    }

    init()
  }, [initialized])

  /* Handle automatic redirects based on auth state */
  useEffect(() => {
    if (loading || !initialized) return

    const isAuthPage = location.pathname.startsWith("/auth/")

    /* Don't redirect if we're already on an auth page or the root page */
    if (isAuthPage || location.pathname === "/") return

    /* If no user and not on an auth page, redirect to login */
    if (!currentUser && !isAuthPage) {
      navigate("/auth/login")
    }
  }, [currentUser, loading, location.pathname, navigate, initialized])

  const register = async (name: string, email: string, password: string, role: string): Promise<boolean> => {
    if (!config) return false

    /* Check if email already exists */
    const userExists = config.auth.users.some((u) => u.email === email)
    if (userExists) {
      return false
    }

    /* Create a new user */
    const newUser = {
      id: `${Date.now()}`,
      name,
      email,
      password,
      role,
    }

    /* Add the user to the config */
    config.auth.users.push(newUser)

    /* Create a simplified user object without the password */
    const loggedInUser = {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
    }

    setCurrentUser(loggedInUser)
    localStorage.setItem("currentUser", JSON.stringify(loggedInUser))
    return true
  }

  const login = async (email: string, password: string): Promise<boolean> => {
    if (!config) return false

    /* Find the user in the config */
    const user = config.auth.users.find((u) => u.email === email && u.password === password)

    if (user) {
      /* Create a simplified user object without the password */
      const loggedInUser = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      }

      setCurrentUser(loggedInUser)
      localStorage.setItem("currentUser", JSON.stringify(loggedInUser))
      return true
    }

    return false
  }

  const logout = () => {
    setCurrentUser(null)
    localStorage.removeItem("currentUser")
    navigate("/auth/login")
  }

  return (
    <AppContext.Provider
      value={{
        config,
        loading,
        error,
        currentUser,
        login,
        logout,
        register,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}
'''  # Regular string instead of f-string

def generate_page_component(page_name, page_config, resource_key):
    """
    Generate a page component based on the page configuration
    """
    components = page_config.get("components", [])
    component_imports = []
    component_jsx = []

    for component in components:
        component_type = component.get("type")
        component_imports.append(f"import {component_type} from '../components/{component_type}'")
        
        props = component.get("props", {})
        props_str = json.dumps(props, indent=2)
        
        # Use regular string + format instead of f-string for JSX with curly braces
        component_jsx.append('<{0} {{...{1}}} />'.format(component_type, props_str))

    # Use string concatenation and format method instead of f-strings
    return '''import React from 'react'
import {{ useApp }} from '../context/AppContext'
{0}

export default function {1}() {{
  const {{ config, currentUser }} = useApp()
  
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">{1}</h1>
      <div className="space-y-4">
        {2}
      </div>
    </div>
  )
}}
'''.format('\n'.join(component_imports), page_name, '\n'.join(component_jsx))

def generate_page_component_from_zones(page_id, page_title, zones):
    """
    Generate a page component from zones structure in the top-level pages
    """
    component_imports = set()
    zones_jsx = []
    
    for zone in zones:
        zone_name = zone.get("name", "content")
        components = zone.get("components", [])
        
        component_jsx = []
        for component in components:
            component_type = component.get("type")
            component_imports.add(f"import {component_type} from '../components/{component_type}'")
            
            props = component.get("props", {})
            props_str = json.dumps(props, indent=2)
            
            # Use regular string + format instead of f-string for JSX with curly braces
            component_jsx.append('<{0} {{...{1}}} />'.format(component_type, props_str))
        
        if component_jsx:
            # Use regular string + format instead of f-string for JSX with curly braces
            zones_jsx.append('''
      <div className="zone-{0}">
        <h2 className="text-xl font-semibold mb-3">{0}</h2>
        <div className="space-y-4">
          {1}
        </div>
      </div>
            '''.strip().format(zone_name, '\n          '.join(component_jsx)))
    
    # Use string concatenation and format method instead of f-strings
    return '''import React from 'react'
import {{ useApp }} from '../context/AppContext'
{0}

export default function {1}() {{
  const {{ config, currentUser }} = useApp()
  
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">{2}</h1>
      {3}
    </div>
  )
}}
'''.format('\n'.join(component_imports), page_id, page_title, '\n'.join(zones_jsx))

def generate_routes(resources, top_level_pages=None):
    """
    Generate the routes.tsx file including both top-level pages and resource pages
    """
    route_imports = []
    route_entries = []
    
    # Process top-level pages
    if top_level_pages:
        for page in top_level_pages:
            page_id = page.get("id", "").capitalize()
            path = page.get("path", f"/{page_id.lower()}")
            
            route_imports.append(f"import {page_id} from './pages/{page_id}'")
            # Use regular string + format instead of f-string for JSX with curly braces
            route_entries.append('{{ path: "{0}", element: <{1} /> }}'.format(path, page_id))
    
    # Process resource pages
    for resource_key, resource in resources.items():
        if "pages" in resource:
            for page_key, page in resource["pages"].items():
                page_name = f"{resource_key.capitalize()}{page_key.capitalize()}"
                route_imports.append(f"import {page_name} from './pages/{page_name}'")
                
                path = page.get("path", f"/{resource_key}/{page_key}")
                # Use regular string + format instead of f-string for JSX with curly braces
                route_entries.append('{{ path: "{0}", element: <{1} /> }}'.format(path, page_name))
    
    # Use string concatenation and format method instead of f-strings
    return '''import React from 'react'
import {{ BrowserRouter, Routes, Route, Navigate }} from 'react-router-dom'
import {{ AppProvider }} from './context/AppContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
{0}

export default function AppRoutes() {{
  return (
    <BrowserRouter>
      <AppProvider>
        <Routes>
          <Route path="/auth/login" element={{<Login />}} />
          <Route path="/auth/register" element={{<Register />}} />
          
          <Route path="/" element={{<Layout />}}>
            <Route index element={{<Dashboard />}} />
            {1}
          </Route>
          
          <Route path="*" element={{<Navigate to="/" replace />}} />
        </Routes>
      </AppProvider>
    </BrowserRouter>
  )
}}
'''.format('\n'.join(route_imports), '\n            '.join(route_entries))

def generate_readme(app_config):
    """
    Generate a README file for the generated application
    """
    app_name = app_config.get("app", {}).get("name", "Generated App")
    
    # Use string format method instead of f-string
    return '''# {0}

This application was generated by AI ERP Generator.

## Getting Started

1. Install dependencies:

```bash
npm install
```

2. Start the development server:

```bash
npm run dev
```

3. Open your browser and navigate to:

```
http://localhost:5173/
```

## Project Structure

- `src/` - Source code
  - `components/` - Reusable components
  - `pages/` - Page components
  - `context/` - React Context providers
  - `lib/` - Utility functions
  - `types/` - TypeScript types
  - `config.json` - Application configuration

## Features

- Authentication (Login/Register)
- Dashboard
- Dynamic forms and tables
- Mock API for data operations

## Customization

You can modify any file to customize the application. The main configuration is stored in `src/config.json`.
'''.format(app_name) 
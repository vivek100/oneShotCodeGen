from fastapi import FastAPI, BackgroundTasks, WebSocket, WebSocketDisconnect, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, HTMLResponse
import os
from dotenv import load_dotenv
import logging
import uvicorn
from contextlib import asynccontextmanager

# Import routers once created
from routers import projects, app_versions, flow_runs, flow_config, websockets, test_pydantic

# Import database initialization
from db.database import init_db

# Import migrations
#from db.migrations.add_rendered_prompt_to_step_runs import run_migration
#from db.migrations.add_pydantic_schema import upgrade as add_pydantic_schema_migration
#from db.migrations.add_pydantic_schema_id_to_agent_steps import run_migration as add_pydantic_schema_id_to_agent_steps_migration

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

# Check for cloud mode
CLOUD_MODE = os.getenv("CLOUD_MODE", "false").lower() == "true"
if CLOUD_MODE:
    logger.info("Running in CLOUD MODE - authentication will be required for protected endpoints")
else:
    logger.info("Running in OPEN SOURCE MODE - authentication is bypassed")

# Lifespan context manager for database initialization
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database connections
    await init_db()
    logger.info("Database initialized")
    
    # Run migrations
    #try:
    #    await run_migration()
    #    logger.info("Rendered prompt migration completed")
    #    # Run Pydantic schema ID migration
    #    await add_pydantic_schema_id_to_agent_steps_migration()
    #    logger.info("Pydantic schema ID migration completed")
    #except Exception as e:
    #    logger.error(f"Error running database migrations: {e}")
    
    yield
    # Cleanup resources if needed
    logger.info("Shutting down application")


app = FastAPI(title="AI ERP App Config Agent", lifespan=lifespan)
#print frontend origin
print(os.getenv("FRONTEND_ORIGIN", "*"))

# Support multiple origins
frontend_origins = os.getenv("FRONTEND_ORIGIN", "*").split(",")
print("frontend_origins", frontend_origins)
# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in frontend_origins],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files for preview app
app.mount("/preview/assets", StaticFiles(directory="previewApp/assets"), name="preview_assets")

# Include routers
app.include_router(projects.router, prefix="/projects", tags=["projects"])
app.include_router(app_versions.router, prefix="/app-version", tags=["app_versions"])
app.include_router(flow_runs.router, prefix="/flow-runs", tags=["flow_runs"])
app.include_router(flow_config.router, prefix="/flow-config", tags=["flow_config"])
app.include_router(websockets.router, prefix="/ws", tags=["websockets"])
app.include_router(test_pydantic.router, tags=["test_pydantic"])

@app.get("/")
async def root():
    return {
        "message": "AI ERP App Configuration Agent",
        "mode": "cloud" if CLOUD_MODE else "open_source"
    }

@app.get("/api/preview", response_class=HTMLResponse)
async def preview_app(id: str = ""):
    # Return the static HTML file with the project ID as a query parameter
    # The frontend JS will handle extracting and using the ID
    with open("previewApp/index.html", "r") as f:
        html_content = f.read()
    
    # Inject the project ID as a global variable
    script_tag = f'<script>window.PROJECT_ID = "{id}";</script>'
    html_content = html_content.replace('</head>', f'{script_tag}</head>')
    
    return HTMLResponse(content=html_content)

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host=os.getenv("HOST", "0.0.0.0"),
        port=int(os.getenv("PORT", "8000")),
        reload=True,
    ) 
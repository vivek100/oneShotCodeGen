from fastapi import APIRouter, HTTPException, Depends, Query
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, ConfigDict, Field, Json
from db.database import database

router = APIRouter()

class AppVersionResponse(BaseModel):
    model_config = ConfigDict(extra="forbid", exclude_none=True)
    
    id: str = Field(..., description="ID of the app version")
    project_id: str = Field(..., description="ID of the project")
    flow_run_id: str = Field(..., description="ID of the flow run that generated this version")
    version_number: int = Field(..., description="Version number")
    config_json: Json[Any] = Field(..., description="Full app configuration")
    created_at: str = Field(..., description="Creation timestamp")

@router.get("/latest", response_model=AppVersionResponse)
async def get_latest_app_version(project_id: str = Query(..., description="ID of the project")):
    """Get the latest app version for a project"""
    try:
        query = """
        SELECT * FROM app_versions
        WHERE project_id = :project_id
        ORDER BY version_number DESC
        LIMIT 1
        """
        result = await database.fetch_one(query=query, values={"project_id": project_id})
        
        if not result:
            raise HTTPException(status_code=404, detail="No app versions found for this project")
        
        result_dict = dict(result)
        # Filter to only include fields defined in the response model
        filtered_result = {
            k: v for k, v in result_dict.items() 
            if k in AppVersionResponse.model_fields
        }
        return filtered_result
    except HTTPException as e:
        # Re-raise HTTP exceptions (like 404) as is
        raise e
    except Exception as e:
        # For other exceptions, return 500
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{version_id}", response_model=AppVersionResponse)
async def get_app_version(version_id: str):
    """Get an app version by ID"""
    try:
        query = """
        SELECT * FROM app_versions
        WHERE id = :version_id
        """
        result = await database.fetch_one(query=query, values={"version_id": version_id})
        
        if not result:
            raise HTTPException(status_code=404, detail="App version not found")
        
        result_dict = dict(result)
        # Filter to only include fields defined in the response model
        filtered_result = {
            k: v for k, v in result_dict.items() 
            if k in AppVersionResponse.model_fields
        }
        return filtered_result
    except HTTPException as e:
        # Re-raise HTTP exceptions
        raise e
    except Exception as e:
        # For other exceptions, return 500
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/project/{project_id}", response_model=List[AppVersionResponse])
async def get_project_versions(project_id: str):
    """Get all app versions for a project"""
    try:
        query = """
        SELECT * FROM app_versions
        WHERE project_id = :project_id
        ORDER BY version_number DESC
        """
        results = await database.fetch_all(query=query, values={"project_id": project_id})
        
        if not results:
            return []
        
        filtered_results = []
        for result in results:
            result_dict = dict(result)
            # Filter to only include fields defined in the response model
            filtered_result = {
                k: v for k, v in result_dict.items() 
                if k in AppVersionResponse.model_fields
            }
            filtered_results.append(filtered_result)
        
        return filtered_results
    except HTTPException as e:
        # Re-raise HTTP exceptions
        raise e
    except Exception as e:
        # For other exceptions, return 500
        raise HTTPException(status_code=500, detail=str(e)) 
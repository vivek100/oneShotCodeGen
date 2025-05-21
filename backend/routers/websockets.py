from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import logging

from core.websocket_manager import manager

logger = logging.getLogger(__name__)

router = APIRouter()

@router.websocket("/projects/{project_id}")
async def websocket_endpoint(websocket: WebSocket, project_id: str):
    """
    WebSocket endpoint for real-time message updates for a specific project
    """
    await manager.connect(websocket, project_id)
    try:
        # Keep the connection open, handling ping/pong automatically
        while True:
            # Wait for messages from the client, although we don't need them
            # This just keeps the connection alive
            data = await websocket.receive_text()
            logger.debug(f"Received message from client: {data}")
    except WebSocketDisconnect:
        logger.info(f"Client disconnected from project {project_id}")
        manager.disconnect(websocket, project_id)
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        manager.disconnect(websocket, project_id) 
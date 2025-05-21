import logging
from typing import Dict, List, Optional, Any
from fastapi import WebSocket, WebSocketDisconnect
import json

logger = logging.getLogger(__name__)

class ConnectionManager:
    """
    Manages WebSocket connections for real-time message updates
    """
    def __init__(self):
        # Map of project_id -> list of connected websockets
        self.active_connections: Dict[str, List[WebSocket]] = {}
        # Map of project_id -> flow running status
        self.flow_running_status: Dict[str, bool] = {}
        
    async def connect(self, websocket: WebSocket, project_id: str):
        """
        Connect a client to a specific project's updates
        """
        await websocket.accept()
        if project_id not in self.active_connections:
            self.active_connections[project_id] = []
        self.active_connections[project_id].append(websocket)
        
        # If there's already a flow running for this project, notify the client
        if project_id in self.flow_running_status and self.flow_running_status[project_id]:
            await self.send_status_update(project_id, True)
        
        logger.info(f"Client connected to project {project_id}, total connections: {len(self.active_connections[project_id])}")
        
    def disconnect(self, websocket: WebSocket, project_id: str):
        """
        Disconnect a client from a project's updates
        """
        if project_id in self.active_connections:
            if websocket in self.active_connections[project_id]:
                self.active_connections[project_id].remove(websocket)
                logger.info(f"Client disconnected from project {project_id}, remaining connections: {len(self.active_connections[project_id])}")
            
            # Clean up if no more connections
            if not self.active_connections[project_id]:
                del self.active_connections[project_id]
                if project_id in self.flow_running_status:
                    del self.flow_running_status[project_id]
        
    async def send_personal_message(self, message: str, websocket: WebSocket):
        """
        Send a message to a specific client
        """
        await websocket.send_text(message)
        
    async def broadcast(self, project_id: str, message: Dict[str, Any]):
        """
        Broadcast a message to all connected clients for a project
        """
        if project_id in self.active_connections:
            disconnected = []
            
            for websocket in self.active_connections[project_id]:
                try:
                    await websocket.send_json(message)
                except Exception as e:
                    logger.error(f"Error broadcasting to client: {e}")
                    disconnected.append(websocket)
            
            # Clean up any disconnected clients
            for websocket in disconnected:
                self.disconnect(websocket, project_id)
                
    async def send_message(self, project_id: str, role: str, content: str, message_id: str):
        """
        Send a chat message update to all clients connected to a project
        """
        message = {
            "type": "message",
            "data": {
                "id": message_id,
                "role": role,
                "content": content
            }
        }
        await self.broadcast(project_id, message)
        
    async def set_flow_running(self, project_id: str, is_running: bool):
        """
        Set the flow running status for a project and notify all clients
        """
        self.flow_running_status[project_id] = is_running
        await self.send_status_update(project_id, is_running)
        
    async def send_status_update(self, project_id: str, is_running: bool):
        """
        Send flow status update to all clients
        """
        status_update = {
            "type": "flow_status",
            "data": {
                "isRunning": is_running
            }
        }
        await self.broadcast(project_id, status_update)

# Global instance for application-wide use
manager = ConnectionManager() 
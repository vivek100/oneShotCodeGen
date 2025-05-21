// WebSocket client for connecting to backend
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const WS_BASE_URL = API_BASE_URL.replace(/^http/, 'ws');

type MessageListener = (message: any) => void;
type StatusListener = (isRunning: boolean) => void;
type ConnectionListener = (isConnected: boolean) => void;

class WebSocketClient {
  private socket: WebSocket | null = null;
  private projectId: string | null = null;
  private messageListeners: MessageListener[] = [];
  private statusListeners: StatusListener[] = [];
  private connectionListeners: ConnectionListener[] = [];
  private reconnectTimer: NodeJS.Timeout | null = null;
  private reconnectInterval = 3000; // 3 seconds
  private isConnected = false;

  constructor() {
    // Initialize but don't connect until explicitly told to
  }

  connect(projectId: string) {
    // Only connect if we're not already connected to this project
    if (this.socket && this.projectId === projectId && this.isConnected) {
      console.log(`Already connected to project ${projectId}`);
      return;
    }

    // Disconnect from any existing connection
    this.disconnect();

    this.projectId = projectId;
    const url = `${WS_BASE_URL}/ws/projects/${projectId}`;
    
    try {
      this.socket = new WebSocket(url);
      
      this.socket.onopen = () => {
        console.log(`WebSocket connected to project ${projectId}`);
        this.isConnected = true;
        this.notifyConnectionListeners(true);
        
        // Clear any reconnect timer
        if (this.reconnectTimer) {
          clearTimeout(this.reconnectTimer);
          this.reconnectTimer = null;
        }
        
        // Send a ping to keep the connection alive
        this.startPingTimer();
      };
      
      this.socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('WebSocket message received:', data);
          
          if (data.type === 'message') {
            // Handle chat message
            this.notifyMessageListeners(data.data);
          } else if (data.type === 'flow_status') {
            // Handle flow status update
            this.notifyStatusListeners(data.data.isRunning);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };
      
      this.socket.onclose = () => {
        console.log(`WebSocket disconnected from project ${projectId}`);
        this.isConnected = false;
        this.notifyConnectionListeners(false);
        
        // Try to reconnect
        this.scheduleReconnect();
      };
      
      this.socket.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.isConnected = false;
        this.notifyConnectionListeners(false);
      };
    } catch (error) {
      console.error('Error creating WebSocket:', error);
      this.scheduleReconnect();
    }
  }

  disconnect() {
    if (this.socket) {
      // Stop ping timer
      if (this.pingTimer) {
        clearInterval(this.pingTimer);
        this.pingTimer = null;
      }
      
      // Stop reconnect timer
      if (this.reconnectTimer) {
        clearTimeout(this.reconnectTimer);
        this.reconnectTimer = null;
      }
      
      // Close the socket
      try {
        this.socket.close();
      } catch (error) {
        console.error('Error closing WebSocket:', error);
      }
      
      this.socket = null;
      this.isConnected = false;
      this.notifyConnectionListeners(false);
    }
  }

  private pingTimer: NodeJS.Timeout | null = null;
  private startPingTimer() {
    // Send a ping every 30 seconds to keep the connection alive
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
    }
    
    this.pingTimer = setInterval(() => {
      if (this.socket && this.isConnected) {
        try {
          this.socket.send(JSON.stringify({ type: 'ping' }));
        } catch (error) {
          console.error('Error sending ping:', error);
        }
      }
    }, 30000);
  }

  private scheduleReconnect() {
    if (!this.reconnectTimer && this.projectId) {
      const projectId = this.projectId;
      
      this.reconnectTimer = setTimeout(() => {
        console.log(`Attempting to reconnect to project ${projectId}...`);
        this.connect(projectId);
        this.reconnectTimer = null;
      }, this.reconnectInterval);
    }
  }

  // Add a listener for new messages
  onMessage(listener: MessageListener) {
    this.messageListeners.push(listener);
    return () => {
      this.messageListeners = this.messageListeners.filter(l => l !== listener);
    };
  }

  // Add a listener for flow status updates
  onFlowStatusChange(listener: StatusListener) {
    this.statusListeners.push(listener);
    return () => {
      this.statusListeners = this.statusListeners.filter(l => l !== listener);
    };
  }

  // Add a listener for connection status changes
  onConnectionChange(listener: ConnectionListener) {
    this.connectionListeners.push(listener);
    return () => {
      this.connectionListeners = this.connectionListeners.filter(l => l !== listener);
    };
  }

  private notifyMessageListeners(message: any) {
    this.messageListeners.forEach(listener => {
      try {
        listener(message);
      } catch (error) {
        console.error('Error in message listener:', error);
      }
    });
  }

  private notifyStatusListeners(isRunning: boolean) {
    this.statusListeners.forEach(listener => {
      try {
        listener(isRunning);
      } catch (error) {
        console.error('Error in status listener:', error);
      }
    });
  }

  private notifyConnectionListeners(isConnected: boolean) {
    this.connectionListeners.forEach(listener => {
      try {
        listener(isConnected);
      } catch (error) {
        console.error('Error in connection listener:', error);
      }
    });
  }
}

// Export a singleton instance
export const wsClient = new WebSocketClient();

// React hook for WebSocket connection
import { useEffect } from 'react';

// React hook for WebSocket connection
export function useWebSocketConnection(projectId: string | null) {
  useEffect(() => {
    if (typeof window !== 'undefined' && projectId) {
      wsClient.connect(projectId);
    }
    
    return () => {
      // No need to disconnect on unmount as we want to keep the connection alive
      // Only disconnect would happen when connecting to a different project
    };
  }, [projectId]);
  
  return wsClient;
} 
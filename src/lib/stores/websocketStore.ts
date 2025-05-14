// src/lib/stores/websocketStore.ts
import { create } from "zustand";

// Define WebSocket state types
interface WebSocketState {
  socket: WebSocket | null;
  connected: boolean;
  token: string | null;
  reconnectAttempts: number;

  // Actions
  initialize: (token: string) => void;
  close: () => void;
  sendMessage: (
    conversationId: string,
    recipientId: string,
    content: string,
    images?: string[]
  ) => boolean;
  sendTyping: (
    conversationId: string,
    recipientId: string,
    isTyping: boolean
  ) => boolean;

  // Event handlers
  onMessage: (callback: (message: any) => void) => () => void;
  onTyping: (callback: (data: any) => void) => () => void;
  onConnectionChange: (callback: (connected: boolean) => void) => () => void;
}

// Callback storage
const messageCallbacks: ((message: any) => void)[] = [];
const typingCallbacks: ((data: any) => void)[] = [];
const connectionCallbacks: ((connected: boolean) => void)[] = [];

// Constants
const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_DELAY = 2000; // 2 seconds
const PING_INTERVAL = 15000; // 15 seconds
const WEBSOCKET_URL = "ws://localhost:3001"; // Update with your server address

// Create Zustand store
export const useWebSocketStore = create<WebSocketState>((set, get) => ({
  socket: null,
  connected: false,
  token: null,
  reconnectAttempts: 0,

  // Initialize WebSocket connection
  initialize: (token: string) => {
    const { socket, close } = get();

    // Close existing connection if any
    if (socket) {
      close();
    }

    set({ token, reconnectAttempts: 0 });
    connectWebSocket(set, get);
  },

  // Close WebSocket connection
  close: () => {
    const { socket } = get();
    if (socket) {
      // Set a flag on the socket to prevent reconnection attempts
      (socket as any)._intentionallyClosed = true;
      socket.close();

      // Clear any ping intervals
      if (pingInterval) {
        clearInterval(pingInterval);
        pingInterval = null;
      }

      set({
        socket: null,
        connected: false,
        token: null,
        reconnectAttempts: 0,
      });
    }
  },

  // Send chat message
  sendMessage: (
    conversationId: string,
    recipientId: string,
    content: string,
    images: string[] = []
  ) => {
    const { socket } = get();
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(
        JSON.stringify({
          type: "chat_message",
          conversationId,
          recipientId,
          content,
          images,
        })
      );
      return true;
    }
    return false;
  },

  // Send typing indicator
  sendTyping: (
    conversationId: string,
    recipientId: string,
    isTyping: boolean
  ) => {
    const { socket } = get();
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(
        JSON.stringify({
          type: "typing",
          conversationId,
          recipientId,
          isTyping,
        })
      );
      return true;
    }
    return false;
  },

  // Register callback for new messages
  onMessage: (callback: (message: any) => void) => {
    messageCallbacks.push(callback);
    return () => {
      const index = messageCallbacks.indexOf(callback);
      if (index !== -1) {
        messageCallbacks.splice(index, 1);
      }
    };
  },

  // Register callback for typing indicators
  onTyping: (callback: (data: any) => void) => {
    typingCallbacks.push(callback);
    return () => {
      const index = typingCallbacks.indexOf(callback);
      if (index !== -1) {
        typingCallbacks.splice(index, 1);
      }
    };
  },

  // Register callback for connection status changes
  onConnectionChange: (callback: (connected: boolean) => void) => {
    connectionCallbacks.push(callback);
    return () => {
      const index = connectionCallbacks.indexOf(callback);
      if (index !== -1) {
        connectionCallbacks.splice(index, 1);
      }
    };
  },
}));

// Set up pinging to keep connection alive
let pingInterval: NodeJS.Timeout | null = null;

// Helper function to establish WebSocket connection
function connectWebSocket(
  set: (state: Partial<WebSocketState>) => void,
  get: () => WebSocketState
) {
  const { token, reconnectAttempts } = get();

  if (!token) {
    console.error("No token provided for WebSocket connection");
    return;
  }

  console.log(`WebSocket connecting... (attempt ${reconnectAttempts + 1})`);

  // Create WebSocket connection
  const socket = new WebSocket(WEBSOCKET_URL);
  set({ socket });

  // Connection established
  socket.onopen = () => {
    console.log("WebSocket connection opened successfully");

    // Send authentication message
    const authMessage = JSON.stringify({
      type: "auth",
      token,
    });
    console.log("Sending auth message");
    socket.send(authMessage);

    // Set up ping interval to keep connection alive
    if (pingInterval) clearInterval(pingInterval);

    pingInterval = setInterval(() => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: "ping" }));
      }
    }, PING_INTERVAL);
  };

  // Message received
  socket.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);

      // Handle different message types
      switch (data.type) {
        case "auth_success":
          console.log("WebSocket authentication successful");
          set({ connected: true, reconnectAttempts: 0 });
          connectionCallbacks.forEach((callback) => callback(true));
          break;

        case "auth_error":
          console.error("WebSocket authentication failed:", data.message);
          socket.close();
          break;

        case "new_message":
          messageCallbacks.forEach((callback) => callback(data.message));
          break;

        case "typing_indicator":
          typingCallbacks.forEach((callback) => callback(data));
          break;

        case "pong":
        case "info":
          // Ignore pong and info messages
          break;

        case "error":
          console.error("WebSocket error from server:", data.message);
          break;

        default:
          console.log("Unknown message type:", data.type);
          break;
      }
    } catch (error) {
      console.error("Error parsing WebSocket message:", error);
    }
  };

  // Error handling
  socket.onerror = (error) => {
    console.error("WebSocket error:", error);
  };

  // Connection closed
  // Then update the socket.onclose handler
  socket.onclose = (event) => {
    console.log(
      `WebSocket disconnected: ${event.code} - ${
        event.reason || "No reason provided"
      }`
    );

    // Clear ping interval
    if (pingInterval) {
      clearInterval(pingInterval);
      pingInterval = null;
    }

    set({ connected: false });

    // Notify about disconnection
    connectionCallbacks.forEach((callback) => callback(false));

    // Only attempt reconnection if not intentionally closed
    if (
      !(socket as any)._intentionallyClosed &&
      reconnectAttempts < MAX_RECONNECT_ATTEMPTS
    ) {
      const newReconnectAttempts = reconnectAttempts + 1;
      set({ reconnectAttempts: newReconnectAttempts });

      const delay = Math.min(1000 * 2 ** newReconnectAttempts, 30000);
      console.log(
        `Reconnecting in ${delay}ms... Attempt ${newReconnectAttempts}`
      );

      setTimeout(() => connectWebSocket(set, get), delay);
    } else {
      console.log(
        (socket as any)._intentionallyClosed
          ? "Connection was intentionally closed, not reconnecting."
          : "Max reconnect attempts reached."
      );
    }
  };
}

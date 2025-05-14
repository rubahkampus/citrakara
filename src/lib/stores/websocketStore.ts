// src/lib/stores/websocketStore.ts
import { create } from "zustand";

type MessageCallback = (message: any) => void;
type TypingCallback = (data: any) => void;
type ConnectionCallback = (connected: boolean) => void;

interface WebSocketState {
  socket: WebSocket | null;
  connected: boolean;
  initialized: boolean;
  messageCallbacks: MessageCallback[];
  typingCallbacks: TypingCallback[];
  connectionCallbacks: ConnectionCallback[];

  // Methods
  initialize: (token: string) => void;
  close: () => void;
  onMessage: (callback: MessageCallback) => () => void;
  onTyping: (callback: TypingCallback) => () => void;
  onConnectionChange: (callback: ConnectionCallback) => () => void;
  sendTyping: (
    conversationId: string,
    recipientId: string,
    isTyping: boolean
  ) => void;
  reconnect: () => void;
}

export const useWebSocketStore = create<WebSocketState>((set, get) => {
  // Keep track of retry attempts and backoff time
  let retryCount = 0;
  let retryTimeout: NodeJS.Timeout | null = null;
  let token: string | null = null;
  let reconnecting = false;

  // Calculate exponential backoff time
  const getRetryDelay = () => {
    const baseDelay = 1000; // Start with 1 second
    const maxDelay = 30000; // Max 30 seconds
    const delay = Math.min(maxDelay, baseDelay * Math.pow(2, retryCount));

    // Add some randomness to prevent all clients retrying at the same time
    return delay + Math.random() * 1000;
  };

  // Create websocket with all event handlers
  const createWebSocket = (authToken: string) => {
    // Store token for potential reconnects
    token = authToken;

    // Get the websocket server URL from environment or use default
    // The server URL should be configurable based on environment
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:3001";

    // Create new WebSocket
    const socket = new WebSocket(wsUrl);

    // Setup event handlers
    socket.onopen = () => {
      console.log("WebSocket connection established");

      // Send authentication token immediately upon connection
      socket.send(
        JSON.stringify({
          type: "auth",
          token: authToken,
        })
      );

      // Reset retry count on successful connection
      retryCount = 0;
      reconnecting = false;

      // Update state
      set({
        socket,
        connected: true,
        initialized: true,
      });

      // Notify connection listeners
      get().connectionCallbacks.forEach((callback) => callback(true));
    };

    socket.onclose = (event) => {
      console.log(`WebSocket connection closed: ${event.code} ${event.reason}`);

      // Update state
      set((state) => ({
        ...state,
        connected: false,
      }));

      // Notify connection listeners
      get().connectionCallbacks.forEach((callback) => callback(false));

      // Only attempt to reconnect if not intentionally closed and we have a token
      if (!event.wasClean && token && !reconnecting) {
        reconnecting = true;
        retryCount++;

        // Attempt reconnection with exponential backoff
        const delay = getRetryDelay();
        console.log(
          `Attempting to reconnect in ${delay}ms (attempt ${retryCount})`
        );

        if (retryTimeout) {
          clearTimeout(retryTimeout);
        }

        retryTimeout = setTimeout(() => {
          // Only reconnect if we're still in a disconnected state
          if (!get().connected && token) {
            console.log("Attempting to reconnect...");
            createWebSocket(token);
          }
        }, delay);
      }
    };

    socket.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        // Handle different message types
        switch (data.type) {
          case "auth_success":
            console.log("Authentication successful");
            break;

          case "auth_error":
            console.error("Authentication failed:", data.message);
            socket.close(1000, "Authentication failed");
            break;

          case "chat_message":
            // Notify message listeners
            get().messageCallbacks.forEach((callback) => callback(data));
            break;

          case "typing":
            // Notify typing listeners
            get().typingCallbacks.forEach((callback) => callback(data));
            break;

          default:
            // Handle other message types or unknown types
            console.log("Received WebSocket message:", data);
        }
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
      }
    };

    // Setup ping to keep the connection alive
    const pingInterval = setInterval(() => {
      if (socket.readyState === WebSocket.OPEN) {
        // Send a simple ping message to keep the connection alive
        socket.send(JSON.stringify({ type: "ping" }));
      } else {
        clearInterval(pingInterval);
      }
    }, 20000); // Ping every 20 seconds

    return socket;
  };

  return {
    socket: null,
    connected: false,
    initialized: false,
    messageCallbacks: [],
    typingCallbacks: [],
    connectionCallbacks: [],

    initialize: (newToken: string) => {
      const { socket } = get();

      // If already initialized with an active socket, close it first
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.close(1000, "Reinitializing");
      }

      // Create new socket
      const newSocket = createWebSocket(newToken);

      // Update state
      set({
        socket: newSocket,
      });
    },

    close: () => {
      const { socket } = get();

      // Clear reconnection timeout if active
      if (retryTimeout) {
        clearTimeout(retryTimeout);
        retryTimeout = null;
      }

      // Reset token to prevent auto-reconnect
      token = null;

      // Close socket if open
      if (socket) {
        // Use code 1000 (normal closure) with reason
        socket.close(1000, "Closing connection");
      }

      // Reset state
      set({
        socket: null,
        connected: false,
        initialized: false,
      });
    },

    onMessage: (callback: MessageCallback) => {
      // Add callback to the list
      set((state) => ({
        messageCallbacks: [...state.messageCallbacks, callback],
      }));

      // Return unsubscribe function
      return () => {
        set((state) => ({
          messageCallbacks: state.messageCallbacks.filter(
            (cb) => cb !== callback
          ),
        }));
      };
    },

    onTyping: (callback: TypingCallback) => {
      // Add callback to the list
      set((state) => ({
        typingCallbacks: [...state.typingCallbacks, callback],
      }));

      // Return unsubscribe function
      return () => {
        set((state) => ({
          typingCallbacks: state.typingCallbacks.filter(
            (cb) => cb !== callback
          ),
        }));
      };
    },

    onConnectionChange: (callback: ConnectionCallback) => {
      // Add callback to the list
      set((state) => ({
        connectionCallbacks: [...state.connectionCallbacks, callback],
      }));

      // Execute callback immediately with current state
      callback(get().connected);

      // Return unsubscribe function
      return () => {
        set((state) => ({
          connectionCallbacks: state.connectionCallbacks.filter(
            (cb) => cb !== callback
          ),
        }));
      };
    },

    sendTyping: (
      conversationId: string,
      recipientId: string,
      isTyping: boolean
    ) => {
      const { socket, connected } = get();

      // Only send if socket is connected
      if (socket && connected) {
        socket.send(
          JSON.stringify({
            type: "typing",
            conversationId,
            recipientId,
            isTyping,
          })
        );
      }
    },

    reconnect: () => {
      const currentToken = token;

      // Only attempt reconnection if we have a token
      if (currentToken) {
        // Force reconnection
        console.log("Forcing reconnection...");
        get().close(); // Close existing connection

        // Small delay before reconnecting
        setTimeout(() => {
          get().initialize(currentToken);
        }, 500);
      }
    },
  };
});

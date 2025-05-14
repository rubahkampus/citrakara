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
  lastConnectionState: boolean; // Track last connection state to prevent duplicate notifications

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
  let pingInterval: NodeJS.Timeout | null = null;

  // Calculate exponential backoff time
  const getRetryDelay = () => {
    const baseDelay = 1000; // Start with 1 second
    const maxDelay = 30000; // Max 30 seconds
    const delay = Math.min(maxDelay, baseDelay * Math.pow(2, retryCount));

    // Add some randomness to prevent all clients retrying at the same time
    return delay + Math.random() * 1000;
  };

  // Helper to update connection state with safeguards against excessive renders
  const updateConnectionState = (connected: boolean) => {
    const state = get();

    // Only update state if it's actually changing
    if (
      state.connected !== connected ||
      state.lastConnectionState !== connected
    ) {
      set({
        connected,
        lastConnectionState: connected,
      });

      // Notify connection listeners
      // Use a stable reference to callbacks to prevent closure issues
      const currentCallbacks = [...state.connectionCallbacks];

      // Use setTimeout to break potential state update cycles
      setTimeout(() => {
        currentCallbacks.forEach((callback) => {
          try {
            callback(connected);
          } catch (err) {
            console.error("Error in connection callback:", err);
          }
        });
      }, 0);
    }
  };

  // Create websocket with all event handlers
  const createWebSocket = (authToken: string) => {
    // Clean up any existing resources
    if (pingInterval) {
      clearInterval(pingInterval);
      pingInterval = null;
    }

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
        initialized: true,
      });

      // Update connection state (this will notify listeners if needed)
      updateConnectionState(true);

      // Setup ping to keep the connection alive
      if (pingInterval) {
        clearInterval(pingInterval);
      }

      pingInterval = setInterval(() => {
        if (socket.readyState === WebSocket.OPEN) {
          // Send a simple ping message to keep the connection alive
          try {
            socket.send(JSON.stringify({ type: "ping" }));
          } catch (err) {
            console.error("Error sending ping:", err);
          }
        } else {
          if (pingInterval) {
            clearInterval(pingInterval);
            pingInterval = null;
          }
        }
      }, 20000); // Ping every 20 seconds
    };

    socket.onclose = (event) => {
      console.log(`WebSocket connection closed: ${event.code} ${event.reason}`);

      // Clean up ping interval
      if (pingInterval) {
        clearInterval(pingInterval);
        pingInterval = null;
      }

      // Update connection state (this will notify listeners if needed)
      updateConnectionState(false);

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
            get().messageCallbacks.forEach((callback) => {
              try {
                callback(data);
              } catch (err) {
                console.error("Error in message callback:", err);
              }
            });
            break;

          case "typing":
            // Notify typing listeners
            get().typingCallbacks.forEach((callback) => {
              try {
                callback(data);
              } catch (err) {
                console.error("Error in typing callback:", err);
              }
            });
            break;

          case "pong":
            // Ping response received, connection is alive
            break;

          default:
            // Handle other message types or unknown types
            console.log("Received WebSocket message:", data);
        }
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
      }
    };

    return socket;
  };

  return {
    socket: null,
    connected: false,
    initialized: false,
    messageCallbacks: [],
    typingCallbacks: [],
    connectionCallbacks: [],
    lastConnectionState: false,

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

      // Clear ping interval if active
      if (pingInterval) {
        clearInterval(pingInterval);
        pingInterval = null;
      }

      // Reset token to prevent auto-reconnect
      token = null;

      // Close socket if open
      if (socket) {
        // Use code 1000 (normal closure) with reason
        try {
          socket.close(1000, "Closing connection");
        } catch (err) {
          console.error("Error closing WebSocket:", err);
        }
      }

      // Reset state
      set({
        socket: null,
        connected: false,
        initialized: false,
        lastConnectionState: false,
      });
    },

    onMessage: (callback: MessageCallback) => {
      // Add callback to the list
      set((state) => {
        // Check if callback already exists to prevent duplicates
        if (state.messageCallbacks.includes(callback)) {
          return state;
        }

        return {
          messageCallbacks: [...state.messageCallbacks, callback],
        };
      });

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
      set((state) => {
        // Check if callback already exists to prevent duplicates
        if (state.typingCallbacks.includes(callback)) {
          return state;
        }

        return {
          typingCallbacks: [...state.typingCallbacks, callback],
        };
      });

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
      set((state) => {
        // Check if callback already exists to prevent duplicates
        if (state.connectionCallbacks.includes(callback)) {
          return state;
        }

        return {
          connectionCallbacks: [...state.connectionCallbacks, callback],
        };
      });

      // Execute callback immediately with current state
      // Use setTimeout to prevent potential React render loop issues
      const currentState = get().connected;
      setTimeout(() => {
        try {
          callback(currentState);
        } catch (err) {
          console.error("Error in initial connection callback:", err);
        }
      }, 0);

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
        try {
          socket.send(
            JSON.stringify({
              type: "typing",
              conversationId,
              recipientId,
              isTyping,
            })
          );
        } catch (err) {
          console.error("Error sending typing indicator:", err);
        }
      }
    },

    reconnect: () => {
      const currentToken = token;

      // Only attempt reconnection if we have a token
      if (currentToken) {
        // Force reconnection
        console.log("Forcing reconnection...");

        const { socket } = get();
        if (socket) {
          try {
            // Close existing connection
            socket.close(1000, "Manual reconnection");
          } catch (err) {
            console.error("Error closing socket for reconnection:", err);
          }
        }

        // Small delay before reconnecting
        setTimeout(() => {
          // Create new connection
          const newSocket = createWebSocket(currentToken);

          // Update state
          set({
            socket: newSocket,
          });
        }, 500);
      }
    },
  };
});

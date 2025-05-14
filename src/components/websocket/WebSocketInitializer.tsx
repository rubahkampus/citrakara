"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useWebSocketStore } from "@/lib/stores/websocketStore";
import { axiosClient } from "@/lib/utils/axiosClient";

interface WebSocketInitializerProps {
  onMessage?: (message: any) => void;
  onTyping?: (data: any) => void;
  onConnectionChange?: (connected: boolean) => void;
}

export default function WebSocketInitializer({
  onMessage,
  onTyping,
  onConnectionChange,
}: WebSocketInitializerProps) {
  // Prevent multiple initializations
  const isInitialized = useRef(false);
  const [fetchingToken, setFetchingToken] = useState(false);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const tokenRef = useRef<string | null>(null);

  // Store callback references to prevent re-registrations
  const onMessageRef = useRef(onMessage);
  const onTypingRef = useRef(onTyping);
  const onConnectionChangeRef = useRef(onConnectionChange);

  // Update refs when props change
  useEffect(() => {
    onMessageRef.current = onMessage;
    onTypingRef.current = onTyping;
    onConnectionChangeRef.current = onConnectionChange;
  }, [onMessage, onTyping, onConnectionChange]);

  const {
    initialize,
    close,
    onMessage: registerMessageCallback,
    onTyping: registerTypingCallback,
    onConnectionChange: registerConnectionCallback,
    connected,
    reconnect,
  } = useWebSocketStore();

  // Use useCallback to stabilize function references
  const fetchTokenAndConnect = useCallback(
    async (force = false) => {
      // Prevent multiple fetches
      if (fetchingToken || (isInitialized.current && !force)) return;

      try {
        setFetchingToken(true);
        console.log("Fetching WebSocket token...");

        const response = await axiosClient.get("/api/auth/websocket-token");
        const { token } = response.data;

        if (token) {
          // Store token for reconnects
          tokenRef.current = token;

          // Set initialization flag
          isInitialized.current = true;

          console.log("WebSocket token received, connecting...");
          initialize(token);
        } else {
          console.error("No token returned from API");

          // Schedule retry
          scheduleRetry();
        }
      } catch (error) {
        console.error("Failed to get WebSocket token:", error);

        // Schedule retry
        scheduleRetry();
      } finally {
        setFetchingToken(false);
      }
    },
    [fetchingToken, initialize]
  );

  // Schedule a retry to fetch token
  const scheduleRetry = useCallback(() => {
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
    }

    retryTimeoutRef.current = setTimeout(() => {
      console.log("Retrying WebSocket connection...");
      fetchTokenAndConnect(true);
    }, 5000); // Retry after 5 seconds
  }, [fetchTokenAndConnect]);

  // Initialize WebSocket on component mount - ONCE only
  useEffect(() => {
    // Only register callbacks once
    let messageUnsubscribe: (() => void) | null = null;
    let typingUnsubscribe: (() => void) | null = null;
    let connectionUnsubscribe: (() => void) | null = null;

    // Setup wrapped callbacks that use the ref values
    const messageCallback = (data: any) => {
      if (onMessageRef.current) {
        onMessageRef.current(data);
      }
    };

    const typingCallback = (data: any) => {
      if (onTypingRef.current) {
        onTypingRef.current(data);
      }
    };

    const connectionCallback = (status: boolean) => {
      if (onConnectionChangeRef.current) {
        onConnectionChangeRef.current(status);
      }
    };

    // Register callbacks only once
    if (onMessageRef.current) {
      messageUnsubscribe = registerMessageCallback(messageCallback);
    }

    if (onTypingRef.current) {
      typingUnsubscribe = registerTypingCallback(typingCallback);
    }

    if (onConnectionChangeRef.current) {
      connectionUnsubscribe = registerConnectionCallback(connectionCallback);
    }

    // Initial connection
    if (!isInitialized.current) {
      fetchTokenAndConnect();
    }

    // Set up automatic reconnection when connection is lost
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        console.log("Page became visible, checking connection...");

        // If not connected, force reconnection
        if (!connected && !fetchingToken) {
          console.log("Connection lost, reconnecting...");

          // Use existing token if available
          if (tokenRef.current) {
            reconnect();
          } else {
            // Otherwise fetch new token
            fetchTokenAndConnect(true);
          }
        }
      }
    };

    // Check connection status when network comes back online
    const handleOnline = () => {
      console.log("Network connection restored");

      if (!connected && !fetchingToken) {
        console.log("Reconnecting after network restored...");

        // Use existing token if available
        if (tokenRef.current) {
          reconnect();
        } else {
          // Otherwise fetch new token
          fetchTokenAndConnect(true);
        }
      }
    };

    // Listen for visibility changes and network status
    window.addEventListener("online", handleOnline);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Clean up on unmount
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }

      window.removeEventListener("online", handleOnline);
      document.removeEventListener("visibilitychange", handleVisibilityChange);

      // Unsubscribe from all callbacks
      if (messageUnsubscribe) messageUnsubscribe();
      if (typingUnsubscribe) typingUnsubscribe();
      if (connectionUnsubscribe) connectionUnsubscribe();

      close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run ONCE on mount, no dependencies

  // This component doesn't render anything
  return null;
}

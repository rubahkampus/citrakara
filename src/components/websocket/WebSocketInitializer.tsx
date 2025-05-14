// src/components/websocket/WebSocketInitializer.tsx
"use client";

import { useEffect, useState, useRef } from "react";
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
  const initialized = useRef(false);
  const [fetchingToken, setFetchingToken] = useState(false);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const {
    initialize,
    close,
    onMessage: registerMessageCallback,
    onTyping: registerTypingCallback,
    onConnectionChange: registerConnectionCallback,
    connected,
  } = useWebSocketStore();

  // Fetch token and initialize WebSocket
  const fetchTokenAndConnect = async () => {
    // Prevent multiple fetches
    if (fetchingToken || initialized.current) return;

    try {
      setFetchingToken(true);
      console.log("Initializing WebSocket connection...");

      const response = await axiosClient.get("/api/auth/websocket-token");
      const { token } = response.data;

      if (token) {
        // Set initialization flag
        initialized.current = true;
        console.log("WebSocket token received, connecting...");
        initialize(token);
      } else {
        console.error("No token returned from API");
      }
    } catch (error) {
      console.error("Failed to get WebSocket token:", error);
    } finally {
      setFetchingToken(false);
    }
  };

  // Initialize WebSocket on component mount - ONCE only
  useEffect(() => {
    // Only initialize if not already done
    if (!initialized.current) {
      fetchTokenAndConnect();
    }

    // Set up automatic reconnection when connection is lost
    const handleVisibilityChange = () => {
      if (
        document.visibilityState === "visible" &&
        !connected &&
        !fetchingToken
      ) {
        console.log(
          "Page became visible and connection is lost, reconnecting..."
        );
        // Reset initialized flag to allow reconnection
        initialized.current = false;
        fetchTokenAndConnect();
      }
    };

    // Listen for visibility changes to reconnect when tab becomes active
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Clean up on unmount
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      close();
    };
  }, [close, connected, fetchingToken]);

  // Register event handlers
  useEffect(() => {
    const messageUnsubscribe = onMessage
      ? registerMessageCallback(onMessage)
      : null;

    const typingUnsubscribe = onTyping
      ? registerTypingCallback(onTyping)
      : null;

    const connectionUnsubscribe = onConnectionChange
      ? registerConnectionCallback(onConnectionChange)
      : null;

    return () => {
      if (messageUnsubscribe) messageUnsubscribe();
      if (typingUnsubscribe) typingUnsubscribe();
      if (connectionUnsubscribe) connectionUnsubscribe();
    };
  }, [
    onMessage,
    onTyping,
    onConnectionChange,
    registerMessageCallback,
    registerTypingCallback,
    registerConnectionCallback,
  ]);

  // This component doesn't render anything
  return null;
}

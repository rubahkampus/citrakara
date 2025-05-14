"use client";

import { useState, useEffect } from "react";
import { Paper, Box, Typography, CircularProgress } from "@mui/material";
import ChatSidebar from "./ChatSidebar";
import ChatWindow from "./ChatWindow";
import { useWebSocketStore } from "@/lib/stores/websocketStore";
import WebSocketInitializer from "@/components/websocket/WebSocketInitializer";
import { getCookie } from "@/lib/utils/cookies";
import { axiosClient } from "@/lib/utils/axiosClient";
import { useSearchParams } from "next/navigation";

interface ChatDashboardProps {
  profile: any;
  userId: string;
}

export default function ChatDashboard({ profile, userId }: ChatDashboardProps) {
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedConversation, setSelectedConversation] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const { connected } = useWebSocketStore();

  const searchParams = useSearchParams();
  const conversationIdFromUrl = searchParams.get("conversation");

  // Add this effect
  useEffect(() => {
    // When reconnected, refresh conversation data
    if (connected && selectedConversation) {
      const refreshCurrentConversation = async () => {
        try {
          const response = await axiosClient.get(
            `/api/chats/${selectedConversation._id}`
          );
          setSelectedConversation(response.data.conversation);
        } catch (err) {
          console.error("Failed to refresh conversation:", err);
        }
      };

      refreshCurrentConversation();
    }
  }, [connected, selectedConversation?._id]);

  // Fetch conversations on component mount
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        setLoading(true);
        const response = await axiosClient.get("/api/chats");
        const fetchedConversations = response.data.conversations || [];
        setConversations(fetchedConversations);

        // If there's a conversation ID in the URL, select that conversation
        if (conversationIdFromUrl && fetchedConversations.length > 0) {
          const conversationToSelect = fetchedConversations.find(
            (conv: any) => conv._id === conversationIdFromUrl
          );

          if (conversationToSelect) {
            handleSelectConversation(conversationToSelect);
          } else {
            // If conversation not found in the list, fetch it directly
            try {
              const convResponse = await axiosClient.get(
                `/api/chats/${conversationIdFromUrl}`
              );
              setSelectedConversation(convResponse.data.conversation);

              // Also add it to conversations list if not already there
              setConversations((prev) => {
                const exists = prev.some(
                  (c) => c._id === conversationIdFromUrl
                );
                if (!exists && convResponse.data.conversation) {
                  // Create a simple entry for the sidebar
                  const otherUser =
                    convResponse.data.conversation.participants.find(
                      (p: any) => p._id !== userId
                    );

                  return [
                    {
                      _id: conversationIdFromUrl,
                      otherUser: otherUser,
                      latestMessage:
                        convResponse.data.conversation.messages[
                          convResponse.data.conversation.messages.length - 1
                        ],
                      unreadCount: 0,
                      lastActivity: convResponse.data.conversation.lastActivity,
                    },
                    ...prev,
                  ];
                }
                return prev;
              });

              // Mark as read
              markAsRead(conversationIdFromUrl);
            } catch (err) {
              console.error("Failed to fetch conversation:", err);
            }
          }
        } else if (fetchedConversations.length > 0) {
          // Original behavior - select first conversation if none specified
          setSelectedConversation(fetchedConversations[0]);
        }
      } catch (err) {
        console.error("Failed to fetch conversations:", err);
        setError("Failed to load conversations");
      } finally {
        setLoading(false);
      }
    };

    fetchConversations();
  }, [conversationIdFromUrl]);

  // Handle new message reception
  const handleNewMessage = (message: any) => {
    if (!message) return;

    // Update conversations list if the message belongs to a visible conversation
    setConversations((prevConversations) => {
      return prevConversations.map((conv) => {
        if (conv._id === message.conversationId) {
          return {
            ...conv,
            latestMessage: {
              content: message.content,
              createdAt: message.createdAt,
              sender: message.sender,
            },
            lastActivity: message.createdAt,
            // Add unread count if the sender is not the current user
            unreadCount:
              message.sender !== userId
                ? (conv.unreadCount || 0) + 1
                : conv.unreadCount,
          };
        }
        return conv;
      });
    });

    // Update selected conversation if this message belongs to it
    if (selectedConversation?._id === message.conversationId) {
      // Mark as read if it's the current conversation
      markAsRead(message.conversationId);
    }
  };

  // Handle selecting a conversation
  const handleSelectConversation = async (conversation: any) => {
    if (conversation._id === selectedConversation?._id) return;

    try {
      // Fetch full conversation data
      const response = await axiosClient.get(`/api/chats/${conversation._id}`);
      setSelectedConversation(response.data.conversation);

      // Mark conversation as read
      markAsRead(conversation._id);

      // Update unread count in conversations list
      setConversations((prevConversations) =>
        prevConversations.map((conv) =>
          conv._id === conversation._id ? { ...conv, unreadCount: 0 } : conv
        )
      );
    } catch (err) {
      console.error("Failed to fetch conversation:", err);
      setError("Failed to load conversation");
    }
  };

  // Mark conversation as read
  const markAsRead = async (conversationId: string) => {
    try {
      await axiosClient.post(`/api/chats/${conversationId}/read`);

      // Update conversations list to reflect read status
      setConversations((prevConversations) =>
        prevConversations.map((conv) =>
          conv._id === conversationId ? { ...conv, unreadCount: 0 } : conv
        )
      );
    } catch (err) {
      console.error("Failed to mark conversation as read:", err);
    }
  };

  // Start a new conversation
  const startNewConversation = async (username: string) => {
    if (!username) return;

    try {
      const response = await axiosClient.post("/api/chats/new", { username });
      const { conversation } = response.data;

      // Add new conversation to list if it doesn't exist
      const exists = conversations.find(
        (conv) => conv._id === conversation.conversationId
      );

      if (!exists) {
        const newConversation = {
          _id: conversation.conversationId,
          otherUser: conversation.targetUser,
          latestMessage: null,
          unreadCount: 0,
          lastActivity: new Date().toISOString(),
        };

        setConversations((prev) => [newConversation, ...prev]);
      }

      // Select the conversation
      handleSelectConversation({
        _id: conversation.conversationId,
      });
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to start conversation");
    }
  };

  // Send a message
  const sendMessage = async (content: string, images: File[] = []) => {
    if (!selectedConversation || !content.trim()) return false;

    const formData = new FormData();
    formData.append("content", content);

    // Add images if any
    images.forEach((image, index) => {
      formData.append(`images[${index}]`, image);
    });

    try {
      const response = await axiosClient.post(
        `/api/chats/${selectedConversation._id}/messages`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      // Add message to selected conversation
      setSelectedConversation((prev: any) => {
        if (!prev) return null;

        return {
          ...prev,
          messages: [...prev.messages, response.data.message],
        };
      });

      // Update conversation list to show latest message
      setConversations((prevConversations) => {
        return prevConversations.map((conv) => {
          if (conv._id === selectedConversation._id) {
            return {
              ...conv,
              latestMessage: {
                content,
                createdAt: new Date().toISOString(),
                sender: userId,
              },
              lastActivity: new Date().toISOString(),
            };
          }
          return conv;
        });
      });

      return true;
    } catch (err) {
      console.error("Failed to send message:", err);
      return false as boolean;
    }
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: 0,
        borderRadius: 2,
        border: "1px solid",
        borderColor: "divider",
        height: { xs: "calc(100vh - 250px)", md: "700px" },
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <WebSocketInitializer onMessage={handleNewMessage} />

      {/* Connection status indicator */}
      {!connected && (
        <Box
          sx={{
            bgcolor: "warning.light",
            color: "warning.contrastText",
            p: 0.5,
            textAlign: "center",
            fontSize: "0.75rem",
          }}
        >
          Connection to chat server lost. Reconnecting...
        </Box>
      )}

      <Box sx={{ display: "flex", height: "100%" }}>
        {/* Chat sidebar */}
        <ChatSidebar
          conversations={conversations}
          loading={loading}
          selectedConversationId={selectedConversation?._id}
          onSelect={handleSelectConversation}
          onNewChat={startNewConversation}
          currentUserId={userId}
        />

        {/* Chat window */}
        {loading ? (
          <Box
            sx={{
              flex: 1,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <CircularProgress size={40} />
          </Box>
        ) : !selectedConversation ? (
          <Box
            sx={{
              flex: 1,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              flexDirection: "column",
              p: 3,
            }}
          >
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No conversation selected
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              textAlign="center"
            >
              Select a conversation from the sidebar or start a new one.
            </Typography>
          </Box>
        ) : (
          <ChatWindow
            conversation={selectedConversation}
            currentUserId={userId}
            onSendMessage={sendMessage}
          />
        )}
      </Box>
    </Paper>
  );
}

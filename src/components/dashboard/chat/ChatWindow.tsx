"use client";

import { useState, useRef, useEffect } from "react";
import {
  Box,
  Avatar,
  Typography,
  TextField,
  IconButton,
  Paper,
  Divider,
  Badge,
  CircularProgress,
  ImageList,
  ImageListItem,
} from "@mui/material";
import {
  Send as SendIcon,
  AttachFile as AttachFileIcon,
  Image as ImageIcon,
  Close as CloseIcon,
} from "@mui/icons-material";
import { formatDistanceToNow, format } from "date-fns";
import { useWebSocketStore } from "@/lib/stores/websocketStore";

interface ChatWindowProps {
  conversation: any;
  currentUserId: string;
  onSendMessage: (content: string, images?: File[]) => Promise<boolean>;
}

export default function ChatWindow({
  conversation,
  currentUserId,
  onSendMessage,
}: ChatWindowProps) {
  const [message, setMessage] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [sending, setSending] = useState(false);
  const [typingStatus, setTypingStatus] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when conversation changes
  useEffect(() => {
    if (conversation?._id) {
      // Small delay to ensure the component is fully rendered
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [conversation?._id]);

  const { sendTyping } = useWebSocketStore();

  // Get the other user from the conversation
  const otherUser = conversation.participants?.find(
    (p: any) => p._id !== currentUserId
  );

  // Scroll to bottom whenever messages change
  useEffect(() => {
    scrollToBottom();
  }, [conversation.messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Handle typing indicator
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value);

    // Find recipient ID
    const recipientId = otherUser?._id;
    if (recipientId) {
      sendTyping(conversation._id, recipientId, e.target.value.length > 0);
    }
  };

  // Handle sending message
  const handleSendMessage = async () => {
    if (message.trim() === "" && images.length === 0) return;

    setSending(true);
    const success = await onSendMessage(message, images);

    if (success) {
      setMessage("");
      setImages([]);
    }

    setSending(false);
  };

  // Handle file input change
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newImages = Array.from(e.target.files).filter((file) =>
        file.type.startsWith("image/")
      );

      setImages((prev) => [...prev, ...newImages]);
    }
  };

  // Open file input
  const handleAttachClick = () => {
    fileInputRef.current?.click();
  };

  // Remove image from selected images
  const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  // Group messages by date
  const groupedMessages: { [key: string]: any[] } = {};

  conversation.messages?.forEach((msg: any) => {
    const date = new Date(msg.createdAt).toDateString();
    if (!groupedMessages[date]) {
      groupedMessages[date] = [];
    }
    groupedMessages[date].push(msg);
  });

  // Get image preview URLs
  const imagePreviewUrls = images.map((file) => URL.createObjectURL(file));

  return (
    <Box
      sx={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        height: "100%",
      }}
    >
      {/* Chat header */}
      <Box
        sx={{
          p: 2,
          borderBottom: "1px solid",
          borderColor: "divider",
          display: "flex",
          alignItems: "center",
        }}
      >
        <Avatar
          src={otherUser?.profilePicture}
          alt={otherUser?.displayName || otherUser?.username}
          sx={{ mr: 2 }}
        />
        <Box>
          <Typography variant="body1" fontWeight="bold">
            {otherUser?.displayName || otherUser?.username}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {otherUser?.roles?.includes("admin") ? "Admin" : "User"}
          </Typography>
        </Box>
      </Box>

      {/* Messages area */}
      <Box
        sx={{
          flex: 1,
          overflow: "auto",
          p: 2,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {Object.keys(groupedMessages).map((date) => (
          <Box key={date}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                mb: 2,
                mt: 2,
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  bgcolor: "background.paper",
                  px: 2,
                  py: 0.5,
                  borderRadius: 4,
                  border: "1px solid",
                  borderColor: "divider",
                }}
              >
                {date === new Date().toDateString()
                  ? "Today"
                  : format(new Date(date), "MMMM d, yyyy")}
              </Typography>
            </Box>

            {groupedMessages[date].map((msg: any, index: number) => {
              const isCurrentUser = msg.sender === currentUserId;
              const hasImages = msg.images && msg.images.length > 0;

              return (
                <Box
                  key={index}
                  sx={{
                    display: "flex",
                    flexDirection: isCurrentUser ? "row-reverse" : "row",
                    mb: 2,
                  }}
                >
                  {!isCurrentUser && (
                    <Avatar
                      src={otherUser?.profilePicture}
                      alt={otherUser?.displayName || otherUser?.username}
                      sx={{ mr: 1, mt: 0.5, width: 32, height: 32 }}
                    />
                  )}

                  <Box
                    sx={{
                      maxWidth: "70%",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: isCurrentUser ? "flex-end" : "flex-start",
                    }}
                  >
                    <Paper
                      elevation={0}
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        bgcolor: isCurrentUser
                          ? "primary.lighter"
                          : "background.paper",
                        border: "1px solid",
                        borderColor: "divider",
                      }}
                    >
                      {msg.content && (
                        <Typography variant="body2">{msg.content}</Typography>
                      )}

                      {hasImages && (
                        <Box sx={{ mt: msg.content ? 1 : 0 }}>
                          <ImageList
                            cols={msg.images.length > 1 ? 2 : 1}
                            gap={8}
                            sx={{ maxWidth: 300 }}
                          >
                            {msg.images.map((image: string, i: number) => (
                              <ImageListItem key={i}>
                                <img
                                  src={image}
                                  alt={`Attachment ${i + 1}`}
                                  style={{
                                    borderRadius: 8,
                                    maxHeight: 200,
                                    objectFit: "contain",
                                  }}
                                  loading="lazy"
                                />
                              </ImageListItem>
                            ))}
                          </ImageList>
                        </Box>
                      )}
                    </Paper>

                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ mt: 0.5 }}
                    >
                      {format(new Date(msg.createdAt), "h:mm a")}
                    </Typography>
                  </Box>
                </Box>
              );
            })}
          </Box>
        ))}

        {/* Show typing indicator */}
        {typingStatus && (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              mb: 1,
            }}
          >
            <Avatar
              src={otherUser?.profilePicture}
              alt={otherUser?.displayName || otherUser?.username}
              sx={{ width: 24, height: 24, mr: 1 }}
            />
            <Typography variant="caption" color="text.secondary">
              typing...
            </Typography>
          </Box>
        )}

        {/* Empty div for scroll reference */}
        <div ref={messagesEndRef} />
      </Box>

      {/* Image previews */}
      {images.length > 0 && (
        <Box sx={{ p: 2, borderTop: "1px solid", borderColor: "divider" }}>
          <ImageList cols={4} gap={8} sx={{ maxHeight: 100 }}>
            {imagePreviewUrls.map((url, index) => (
              <ImageListItem key={index} sx={{ position: "relative" }}>
                <img
                  src={url}
                  alt={`Upload preview ${index + 1}`}
                  style={{
                    height: 80,
                    objectFit: "cover",
                    borderRadius: 4,
                  }}
                />
                <IconButton
                  size="small"
                  sx={{
                    position: "absolute",
                    top: -8,
                    right: -8,
                    bgcolor: "background.paper",
                    border: "1px solid",
                    borderColor: "divider",
                    "&:hover": {
                      bgcolor: "error.lighter",
                    },
                    width: 20,
                    height: 20,
                  }}
                  onClick={() => handleRemoveImage(index)}
                >
                  <CloseIcon fontSize="small" sx={{ fontSize: 14 }} />
                </IconButton>
              </ImageListItem>
            ))}
          </ImageList>
        </Box>
      )}

      {/* Input area */}
      <Box
        sx={{
          p: 2,
          borderTop: "1px solid",
          borderColor: "divider",
          display: "flex",
          alignItems: "center",
        }}
      >
        <input
          type="file"
          accept="image/*"
          multiple
          style={{ display: "none" }}
          ref={fileInputRef}
          onChange={handleFileInputChange}
        />
        <IconButton onClick={handleAttachClick} disabled={sending}>
          <ImageIcon />
        </IconButton>

        <TextField
          fullWidth
          placeholder="Type a message..."
          variant="outlined"
          size="small"
          value={message}
          onChange={handleInputChange}
          disabled={sending}
          inputRef={inputRef}
          onKeyPress={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSendMessage();
            }
          }}
          sx={{ mx: 1 }}
        />

        <IconButton
          color="primary"
          onClick={handleSendMessage}
          disabled={sending || (message.trim() === "" && images.length === 0)}
          sx={{
            bgcolor: "primary.main",
            color: "white",
            "&:hover": {
              bgcolor: "primary.dark",
            },
            "&.Mui-disabled": {
              bgcolor: "action.disabledBackground",
              color: "action.disabled",
            },
          }}
        >
          {sending ? (
            <CircularProgress size={24} color="inherit" />
          ) : (
            <SendIcon />
          )}
        </IconButton>
      </Box>
    </Box>
  );
}

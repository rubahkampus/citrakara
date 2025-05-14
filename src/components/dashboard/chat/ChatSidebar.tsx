"use client";

import {
  Box,
  List,
  ListItemButton,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Typography,
  Divider,
  TextField,
  IconButton,
  InputAdornment,
  Badge,
  Skeleton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from "@mui/material";
import {
  Search as SearchIcon,
  Add as AddIcon,
  Close as CloseIcon,
} from "@mui/icons-material";
import { useState } from "react";
import { formatDistanceToNow } from "date-fns";

interface ChatSidebarProps {
  conversations: any[];
  loading: boolean;
  selectedConversationId: string | null;
  onSelect: (conversation: any) => void;
  onNewChat: (username: string) => void;
  currentUserId: string;
}

export default function ChatSidebar({
  conversations,
  loading,
  selectedConversationId,
  onSelect,
  onNewChat,
  currentUserId,
}: ChatSidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [newChatDialogOpen, setNewChatDialogOpen] = useState(false);
  const [newChatUsername, setNewChatUsername] = useState("");
  const [error, setError] = useState("");

  // Filter conversations based on search query
  const filteredConversations = conversations.filter((conv) => {
    const otherUser = conv.otherUser;
    if (!otherUser) return false;

    const displayName = otherUser.displayName || otherUser.username || "";
    const username = otherUser.username || "";

    const searchLower = searchQuery.toLowerCase();
    return (
      displayName.toLowerCase().includes(searchLower) ||
      username.toLowerCase().includes(searchLower)
    );
  });

  // Handle new chat dialog
  const handleOpenNewChatDialog = () => {
    setNewChatDialogOpen(true);
    setNewChatUsername("");
    setError("");
  };

  const handleCloseNewChatDialog = () => {
    setNewChatDialogOpen(false);
  };

  const handleStartNewChat = () => {
    if (!newChatUsername.trim()) {
      setError("Username is required");
      return;
    }

    onNewChat(newChatUsername.trim());
    handleCloseNewChatDialog();
  };

  return (
    <Box
      sx={{
        width: { xs: "100%", md: 280 },
        borderRight: "1px solid",
        borderColor: "divider",
        display: { xs: selectedConversationId ? "none" : "flex", md: "flex" },
        flexDirection: "column",
        height: "100%",
      }}
    >
      {/* Header with search */}
      <Box sx={{ p: 2, borderBottom: "1px solid", borderColor: "divider" }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 2,
          }}
        >
          <Typography variant="h6" fontWeight="bold">
            Chat
          </Typography>
          <IconButton
            size="small"
            color="primary"
            onClick={handleOpenNewChatDialog}
            sx={{ bgcolor: "primary.lighter" }}
          >
            <AddIcon />
          </IconButton>
        </Box>
        <TextField
          fullWidth
          placeholder="Search conversations..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          variant="outlined"
          size="small"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
            endAdornment: searchQuery ? (
              <InputAdornment position="end">
                <IconButton
                  size="small"
                  onClick={() => setSearchQuery("")}
                  edge="end"
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              </InputAdornment>
            ) : null,
          }}
          sx={{ bgcolor: "background.paper" }}
        />
      </Box>

      {/* Conversations list */}
      <Box sx={{ flex: 1, overflow: "auto" }}>
        {loading ? (
          <Box sx={{ p: 2 }}>
            {[1, 2, 3].map((i) => (
              <Box key={i} sx={{ mb: 2 }}>
                <Skeleton variant="rectangular" height={60} />
              </Box>
            ))}
          </Box>
        ) : filteredConversations.length === 0 ? (
          <Box sx={{ p: 3, textAlign: "center" }}>
            <Typography color="text.secondary">
              {searchQuery
                ? "No conversations found"
                : "Start a new conversation"}
            </Typography>
          </Box>
        ) : (
          <List disablePadding>
            {filteredConversations.map((conversation) => {
              const otherUser = conversation.otherUser;
              const isSelected = selectedConversationId === conversation._id;

              return (
                <ListItemButton
                  key={conversation._id}
                  selected={isSelected}
                  onClick={() => onSelect(conversation)}
                  sx={{
                    py: 1.5,
                    borderBottom: "1px solid",
                    borderColor: "divider",
                    "&.Mui-selected": {
                      bgcolor: "primary.lighter",
                    },
                  }}
                >
                  <ListItemAvatar>
                    <Badge
                      color="primary"
                      badgeContent={conversation.unreadCount || 0}
                      invisible={!conversation.unreadCount}
                    >
                      <Avatar
                        src={otherUser?.profilePicture}
                        alt={otherUser?.displayName || otherUser?.username}
                      />
                    </Badge>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Typography
                        variant="body1"
                        fontWeight={conversation.unreadCount ? 600 : 400}
                        noWrap
                      >
                        {otherUser?.displayName || otherUser?.username}
                      </Typography>
                    }
                    secondary={
                      <>
                        <Box
                          component="span"
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <Typography
                            component="span"
                            variant="body2"
                            color="text.secondary"
                            noWrap
                            sx={{
                              maxWidth: "120px",
                              fontWeight: conversation.unreadCount ? 600 : 400,
                            }}
                          >
                            {conversation.latestMessage?.content ||
                              "New conversation"}
                          </Typography>
                          <Typography
                            component="span"
                            variant="caption"
                            color="text.secondary"
                            sx={{ minWidth: "60px", textAlign: "right" }}
                          >
                            {conversation.lastActivity
                              ? formatDistanceToNow(
                                  new Date(conversation.lastActivity),
                                  {
                                    addSuffix: false,
                                  }
                                )
                              : ""}
                          </Typography>
                        </Box>
                      </>
                    }
                  />
                </ListItemButton>
              );
            })}
          </List>
        )}
      </Box>

      {/* New chat dialog */}
      <Dialog
        open={newChatDialogOpen}
        onClose={handleCloseNewChatDialog}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Start New Conversation</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Username"
            fullWidth
            variant="outlined"
            value={newChatUsername}
            onChange={(e) => setNewChatUsername(e.target.value)}
            error={!!error}
            helperText={error}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseNewChatDialog}>Cancel</Button>
          <Button
            onClick={handleStartNewChat}
            variant="contained"
            color="primary"
          >
            Start Chat
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

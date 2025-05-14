// src/components/common/StartChatButton.tsx
"use client";

import { Button, IconButton, Tooltip, CircularProgress } from "@mui/material";
import { Chat as ChatIcon } from "@mui/icons-material";
import { useStartConversation } from "@/hooks/useStartConversation";
import { getAuthSession, Session } from "@/lib/utils/session";

interface StartChatButtonProps {
  targetUsername: string;
  variant?: "button" | "icon";
  buttonText?: string;
  className?: string;
}

export default function StartChatButton({
  targetUsername,
  variant = "button",
  buttonText = "Chat",
  className,
}: StartChatButtonProps) {
  const { startConversation, loading, error } = useStartConversation();
  const handleClick = async () => {
    const session = await getAuthSession(); // Or get your current user info here

    if (!(session as Session)?.username) {
      // Handle not logged in case
      // Maybe redirect to login
      return;
    }

    await startConversation(targetUsername, (session as Session).username);
  };

  if (variant === "icon") {
    return (
      <Tooltip title={error || "Start chat"}>
        <span>
          <IconButton
            onClick={handleClick}
            disabled={loading}
            className={className}
            color="primary"
          >
            {loading ? <CircularProgress size={24} /> : <ChatIcon />}
          </IconButton>
        </span>
      </Tooltip>
    );
  }

  return (
    <Button
      variant="outlined"
      startIcon={loading ? <CircularProgress size={20} /> : <ChatIcon />}
      onClick={handleClick}
      disabled={loading}
      className={className}
    >
      {buttonText}
    </Button>
  );
}

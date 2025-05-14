// src/hooks/useStartConversation.ts
import { useState } from "react";
import { axiosClient } from "@/lib/utils/axiosClient";
import { useRouter } from "next/navigation";

export function useStartConversation() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const startConversation = async (
    username: string,
    currentUsername: string
  ) => {
    try {
      setLoading(true);
      setError(null);

      // Call the API to start a conversation
      const response = await axiosClient.post("/api/chats/new", { username });
      const { conversation } = response.data;

      // Navigate to the chat dashboard with the conversation ID
      router.push(
        `/${currentUsername}/dashboard/chat?conversation=${conversation.conversationId}`
      );

      return conversation;
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to start conversation");
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { startConversation, loading, error };
}

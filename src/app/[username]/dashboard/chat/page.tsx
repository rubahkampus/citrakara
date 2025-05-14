import { Suspense } from "react";
import { Paper, Box, Typography, Skeleton } from "@mui/material";
import { getUserPublicProfile } from "@/lib/services/user.service";
import { getAuthSession, isUserOwner, Session } from "@/lib/utils/session";
import { notFound } from "next/navigation";
import ChatDashboard from "@/components/dashboard/chat/ChatDashboard";

// Loading state component
function ChatDashboardLoading() {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        borderRadius: 2,
        border: "1px solid",
        borderColor: "divider",
        height: "600px",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Box sx={{ display: "flex", height: "100%" }}>
        {/* Chat list loading */}
        <Box
          sx={{
            width: 280,
            borderRight: "1px solid",
            borderColor: "divider",
            display: { xs: "none", md: "block" },
          }}
        >
          <Skeleton variant="text" sx={{ mb: 2 }} height={40} />
          <Skeleton variant="rectangular" height={70} sx={{ mb: 1 }} />
          <Skeleton variant="rectangular" height={70} sx={{ mb: 1 }} />
          <Skeleton variant="rectangular" height={70} sx={{ mb: 1 }} />
        </Box>

        {/* Chat area loading */}
        <Box sx={{ flex: 1, p: 2, display: "flex", flexDirection: "column" }}>
          <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
            <Skeleton
              variant="circular"
              width={40}
              height={40}
              sx={{ mr: 2 }}
            />
            <Skeleton variant="text" width={120} />
          </Box>
          <Box sx={{ flex: 1, mb: 2 }}>
            <Skeleton variant="rectangular" height={400} />
          </Box>
          <Skeleton variant="rectangular" height={50} />
        </Box>
      </Box>
    </Paper>
  );
}

interface Props {
  params: { username: string };
}

export default async function ChatPage({ params }: Props) {
  const { username } = params;
  const session = await getAuthSession();

  // Check if the current user is the owner of this profile
  const isOwner = isUserOwner(session as Session, username);

  if (!isOwner) {
    return notFound();
  }

  const profile = await getUserPublicProfile(username);

  if (!profile) {
    return (
      <Paper sx={{ p: 4, borderRadius: 2, textAlign: "center" }}>
        <Typography variant="h5" color="error">
          Profile not found
        </Typography>
      </Paper>
    );
  }

  // Serialize the profile for the client component
  const serializedProfile = JSON.parse(JSON.stringify(profile));

  return (
    <Suspense fallback={<ChatDashboardLoading />}>
      <ChatDashboard profile={serializedProfile} userId={(session as Session).id} />
    </Suspense>
  );
}

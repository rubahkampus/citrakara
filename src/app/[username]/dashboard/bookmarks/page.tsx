// src/app/[username]/dashboard/bookmarks/page.tsx
import { Suspense } from "react";
import { Box, CircularProgress, Alert } from "@mui/material";
import BookmarkPage from "@/components/dashboard/bookmarks/BookmarkPage";
import { getAuthSession } from "@/lib/utils/session";

interface BookmarksPageProps {
  params: { username: string };
}

export default async function BookmarksPage({ params }: BookmarksPageProps) {
  const param = await params;
  const username = param.username;
  // Get the current session
  const session = await getAuthSession();

  // This is a protected route, verified in middleware,
  // but we'll do a double-check here
  if (
    !session ||
    typeof session === "string" ||
    session.username !== username
  ) {
    return <Alert severity="error">You do not have access to this page</Alert>;
  }

  return (
    <Suspense
      fallback={
        <Box display="flex" justifyContent="center" py={4}>
          <CircularProgress />
        </Box>
      }
    >
      <BookmarkPage username={username} session={session} />
    </Suspense>
  );
}

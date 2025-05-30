// src/app/page.tsx
import { Suspense } from "react";
import { Box, CircularProgress } from "@mui/material";
import HomePage from "@/components/home/HomePage";
import { getAuthSession, Session } from "@/lib/utils/session";
import {
  getUserBookmarkedArtists,
  getUserBookmarkedCommissions,
} from "@/lib/services/user.service";

export default async function Home() {
  const session = await getAuthSession();

  return (
    <Suspense
      fallback={
        <Box display="flex" justifyContent="center" py={4}>
          <CircularProgress />
        </Box>
      }
    >
      <HomePage session={session} />
    </Suspense>
  );
}

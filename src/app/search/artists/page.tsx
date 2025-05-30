// src/app/search/artists/page.tsx
import { Suspense } from "react";
import { Box, CircularProgress } from "@mui/material";
import SearchArtistPage from "@/components/search/SearchArtistPage";
import { getAuthSession, Session } from "@/lib/utils/session";
import { getUserBookmarkedArtists, searchArtistsService } from "@/lib/services/user.service";

interface SearchArtistsPageProps {
  searchParams?: {
    q?: string;
    tags?: string;
    open?: string;
  };
}

export default async function SearchArtistsPage({
  searchParams = {},
}: SearchArtistsPageProps) {
  const session = await getAuthSession();

  // Parse search parameters
  const searchParam = await searchParams
  const { q, tags, open } = searchParam;

  // Fetch initial results
  let initialResults = null;

  try {
    initialResults = await searchArtistsService({
      query: q,
      tags: tags?.split(","),
      limit: 12,
      skip: 0,
    });
  } catch (error) {
    console.error("Error fetching initial artist search results:", error);
  }

  return (
    <Suspense
      fallback={
        <Box display="flex" justifyContent="center" py={4}>
          <CircularProgress />
        </Box>
      }
    >
      <SearchArtistPage initialResults={JSON.stringify(initialResults)} session={session} />
    </Suspense>
  );
}

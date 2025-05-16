// src/app/search/commissions/page.tsx
import { Suspense } from "react";
import { Box, CircularProgress } from "@mui/material";
import SearchCommissionListingPage from "@/components/search/SearchCommissionListingPage ";
import { getAuthSession, Session } from "@/lib/utils/session";
import { searchCommissionListings } from "@/lib/services/commissionListing.service";
import { getUserBookmarkedCommissions } from "@/lib/services/user.service";

interface SearchCommissionsPageProps {
  searchParams?: {
    q?: string;
    tags?: string;
    type?: string;
    flow?: string;
    minPrice?: string;
    maxPrice?: string;
  };
}

export default async function SearchCommissionsPage({
  searchParams = {},
}: SearchCommissionsPageProps) {
  const session = await getAuthSession();

  // Parse search parameters
  const searchParam = await searchParams;
  const { q, tags, type, flow, minPrice, maxPrice } = searchParam;

  // Fetch initial results
  let initialResults = null;

  const bookmarkedCommission = getUserBookmarkedCommissions(
    (session as Session).id
  );

  try {
    initialResults = await searchCommissionListings({
      label: q,
      tags: tags?.split(","),
      type: type as "template" | "custom" | undefined,
      flow: flow as "standard" | "milestone" | undefined,
      priceRange:
        minPrice || maxPrice
          ? {
              min: minPrice ? parseInt(minPrice) : undefined,
              max: maxPrice ? parseInt(maxPrice) : undefined,
            }
          : undefined,
      limit: 12,
      skip: 0,
    });
  } catch (error) {
    console.error("Error fetching initial commission search results:", error);
  }

  return (
    <Suspense
      fallback={
        <Box display="flex" justifyContent="center" py={4}>
          <CircularProgress />
        </Box>
      }
    >
      <SearchCommissionListingPage
        initialResults={JSON.stringify(initialResults)}
        session={session}
      />
    </Suspense>
  );
}

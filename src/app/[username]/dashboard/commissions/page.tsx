// src/app/[username]/dashboard/commissions/page.tsx
import { Suspense } from "react";
import { Box, Typography, CircularProgress, Alert } from "@mui/material";
import { getAuthSession } from "@/lib/utils/session";
import { getArtistListings } from "@/lib/services/commissionListing.service";
import CommissionListingPage from "@/components/dashboard/commissions/CommissionListingPage";
import CommissionListingSkeleton from "@/components/dashboard/commissions/CommissionListingSkeleton";
import { ICommissionListing } from "@/lib/db/models/commissionListing.model";

interface CommissionsPageProps {
  params: { username: string };
}

export default async function CommissionsPage({
  params,
}: CommissionsPageProps) {
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

  // Fetch the user's commission listings
  let listings: ICommissionListing[] = [];
  let error: string | null = null;

  try {
    const result = await getArtistListings(session.id);
    listings = result as unknown as ICommissionListing[];
  } catch (err) {
    console.error("Error fetching listings:", err);
    error = "Failed to load your commission listings";
  }

  // Serialize the data for client components
  const serializedListings = JSON.parse(JSON.stringify(listings));

  return (
    <Box>
      <Suspense fallback={<CommissionListingSkeleton />}>
        <CommissionListingPage
          username={username}
          listings={serializedListings}
          error={error}
        />
      </Suspense>
    </Box>
  );
}

// src/app/[username]/dashboard/commissions/page.tsx
import { Suspense } from "react";
import { Box, Typography, CircularProgress, Alert } from "@mui/material";
import { getAuthSession } from "@/lib/utils/session";
import { getArtistListings } from "@/lib/services/commissionListing.service";
import CommissionListingPage from "@/components/dashboard/commissions/CommissionListingPage";
import CommissionListingSkeleton from "@/components/dashboard/commissions/CommissionListingSkeleton";

// Define an interface for the simplified listing objects we'll receive
interface CommissionListingData {
  _id: string;
  artistId: string;
  title: string;
  description: Array<{ title: string; detail: string }>;
  tags: string[];
  thumbnail: string;
  isActive: boolean;
  isDeleted: boolean;
  slots: number;
  slotsUsed: number;
  type: "template" | "custom";
  flow: "standard" | "milestone";
  basePrice: number;
  price: { min: number; max: number };
  currency: string;
  [key: string]: any; // Allow for other properties that might be needed
}

interface CommissionsPageProps {
  params: { username: string };
}

export default async function CommissionsPage({
  params: { username },
}: CommissionsPageProps) {
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
  let listings: CommissionListingData[] = [];
  let error: string | null = null;

  try {
    const result = await getArtistListings(session.id);
    listings = result as unknown as CommissionListingData[];
  } catch (err) {
    console.error("Error fetching listings:", err);
    error = "Failed to load your commission listings";
  }

  // Serialize the data for client components
  const serializedListings = JSON.parse(JSON.stringify(listings));

  return (
    <Box>
      <Typography variant="h5" fontWeight="bold" sx={{ mb: 3 }}>
        My Commission Listings
      </Typography>

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

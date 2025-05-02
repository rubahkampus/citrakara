// src/app/[username]/dashboard/commissions/[listingId]/page.tsx
import { Box, Typography, Alert, CircularProgress } from "@mui/material";
import { getAuthSession } from "@/lib/utils/session";
import { findCommissionListingById } from "@/lib/db/repositories/commissionListing.repository";
import CommissionFormPage from "@/components/dashboard/commissions/CommissionFormPage";
import { notFound } from "next/navigation";

interface EditCommissionPageProps {
  params: { username: string; listingId: string };
}

export default async function EditCommissionPage({
  params: { username, listingId },
}: EditCommissionPageProps) {
  // Get the current session and validate access
  const session = await getAuthSession();

  if (
    !session ||
    typeof session === "string" ||
    session.username !== username
  ) {
    return (
      <Box>
        <Typography color="error">Access denied</Typography>
      </Box>
    );
  }

  // Fetch the commission listing
  try {
    const listing = await findCommissionListingById(listingId);

    if (!listing) {
      notFound();
    }

    // Verify ownership
    if (listing.artistId.toString() !== session.id) {
      return (
        <Alert severity="error">
          You do not have permission to edit this commission
        </Alert>
      );
    }

    // Serialize the data for client components
    const serializedListing = JSON.parse(JSON.stringify(listing));

    return (
      <Box>
        <Typography variant="h5" fontWeight="bold" sx={{ mb: 3 }}>
          Edit Commission
        </Typography>

        <CommissionFormPage
          username={username}
          mode="edit"
          initialData={serializedListing}
        />
      </Box>
    );
  } catch (error) {
    console.error("Error fetching commission:", error);
    return <Alert severity="error">Failed to load commission details</Alert>;
  }
}

// src/app/[username]/dashboard/proposals/new/page.tsx
import { Box, Typography, Alert } from "@mui/material";
import { getAuthSession } from "@/lib/utils/session";
import ProposalFormPage from "@/components/dashboard/proposals/ProposalFormPage";
import { findCommissionListingById } from "@/lib/db/repositories/commissionListing.repository";
import { notFound } from "next/navigation";

interface NewProposalPageProps {
  params: { username: string };
  searchParams: { listingId?: string };
}

export default async function NewProposalPage({
  params: { username },
  searchParams,
}: NewProposalPageProps) {
  // 1. Auth guard
  const session = await getAuthSession();
  if (
    !session ||
    typeof session === "string" ||
    session.username !== username
  ) {
    return <Alert severity="error">Access denied</Alert>;
  }

  // 2. Must have listingId
  const listingId = searchParams.listingId;
  if (!listingId) {
    return <Alert severity="error">Missing listingId parameter</Alert>;
  }

  // 3. Fetch and validate listing once
  let listingObj;
  try {
    listingObj = await findCommissionListingById(listingId);
    if (!listingObj) {
      notFound();
    }
  } catch (err) {
    console.error("Error fetching listing for proposal:", err);
    return <Alert severity="error">Failed to load listing</Alert>;
  }

  // 4. Pass it into the form as a JSON string
  return (
    <Box>
      <Typography variant="h5" fontWeight="bold" sx={{ mb: 3 }}>
        Create New Proposal
      </Typography>

      <ProposalFormPage
        username={username}
        mode="create"
        listing={JSON.stringify(listingObj)}
      />
    </Box>
  );
}

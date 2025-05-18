// src/app/[username]/dashboard/proposals/[proposalId]/edit/page.tsx
import { Box, Typography, Alert } from "@mui/material";
import { getAuthSession } from "@/lib/utils/session";
import { notFound } from "next/navigation";
import ProposalFormPage from "@/components/dashboard/proposals/ProposalFormPage";
import { fetchProposalById } from "@/lib/services/proposal.service";

interface EditProposalPageProps {
  params: { username: string; proposalId: string };
}

export default async function EditProposalPage({
  params,
}: EditProposalPageProps) {
  const param = await params;
  const username = param.username;
  const proposalId = param.proposalId;

  const session = await getAuthSession();
  if (
    !session ||
    typeof session === "string" ||
    session.username !== username
  ) {
    return <Alert severity="error">Access denied</Alert>;
  }

  try {
    const proposal = await fetchProposalById(proposalId, session.id);
    if (!proposal) notFound();

    // console.log(proposal.status)

    // Only the client who created it can edit, and only when pendingArtist
    if (
      proposal.clientId.toString() !== session.id ||
      ["rejectedArtist", "expired", "accepted", "paid"].includes(
        proposal.status
      )
      // proposal.status !== "pendingArtist"
    ) {
      return (
        <Alert severity="error">
          You do not have permission to edit this proposal
        </Alert>
      );
    }

    // console.log(proposal)

    // Format proposal for UI and serialize both the proposal data and listing snapshot
    const serializedProposal = JSON.parse(JSON.stringify(proposal));
    const listingSnapshot = JSON.parse(
      JSON.stringify(proposal.listingSnapshot)
    );

    return (
      <Box>
        <ProposalFormPage
          username={username}
          mode="edit"
          initialData={serializedProposal}
          listing={JSON.stringify(listingSnapshot)}
        />
      </Box>
    );
  } catch (err) {
    console.error("Error loading proposal:", err);
    return <Alert severity="error">Failed to load proposal details</Alert>;
  }
}

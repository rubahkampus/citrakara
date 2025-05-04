// src/app/[username]/dashboard/proposals/[proposalId]/respond/page.tsx
import { Box, Typography, Alert } from "@mui/material";
import { getAuthSession } from "@/lib/utils/session";
import { notFound } from "next/navigation";
import RespondFormPage from "@/components/dashboard/proposals/RespondFormPage";
import {
  fetchProposalById,
  formatProposalForUI,
} from "@/lib/services/proposal.service";

interface RespondProposalPageProps {
  params: { username: string; proposalId: string };
}

export default async function RespondProposalPage({
  params: { username, proposalId },
}: RespondProposalPageProps) {
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

    const isClient = proposal.clientId.toString() === session.id;
    const isArtist = proposal.artistId.toString() === session.id;

    if (!isClient && !isArtist) {
      return (
        <Alert severity="error">You do not have permission to respond</Alert>
      );
    }

    const role = isClient ? "client" : "artist";
    const formattedProposal = formatProposalForUI(proposal);
    const serializedProposal = JSON.parse(JSON.stringify(formattedProposal));

    return (
      <Box>
        <Typography variant="h5" fontWeight="bold" sx={{ mb: 3 }}>
          Respond to Proposal
        </Typography>

        <RespondFormPage
          username={username}
          role={role}
          proposal={serializedProposal}
        />
      </Box>
    );
  } catch (err) {
    console.error("Error loading proposal for response:", err);
    return <Alert severity="error">Failed to load proposal details</Alert>;
  }
}

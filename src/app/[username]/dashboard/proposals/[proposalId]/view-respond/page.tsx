import { Box, Typography, Alert } from "@mui/material";
import { getAuthSession } from "@/lib/utils/session";
import { notFound } from "next/navigation";
import ViewRespondFormPage from "@/components/dashboard/proposals/ViewRespondFormPage";
import { fetchProposalById } from "@/lib/services/proposal.service";

interface ViewRespondProposalPageProps {
  params: { username: string; proposalId: string };
}

export default async function ViewRespondProposalPage({
  params: { username, proposalId },
}: ViewRespondProposalPageProps) {
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
        <Alert severity="error">
          You do not have permission to view or respond
        </Alert>
      );
    }

    const role = isClient ? "client" : "artist";
    const serializedProposal = JSON.parse(JSON.stringify(proposal));

    return (
      <Box>
        <Typography variant="h5" fontWeight="bold" sx={{ mb: 3 }}>
          Proposal: {proposal.listingSnapshot.title}
        </Typography>

        <ViewRespondFormPage
          username={username}
          role={role}
          proposal={serializedProposal}
        />
      </Box>
    );
  } catch (err) {
    console.error("Error loading proposal for viewing/response:", err);
    return <Alert severity="error">Failed to load proposal details</Alert>;
  }
}

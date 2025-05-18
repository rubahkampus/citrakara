// src/app/[username]/dashboard/proposals/[proposalId]/view/page.tsx
import { Box, Typography, Alert } from "@mui/material";
import { getAuthSession } from "@/lib/utils/session";
import { notFound } from "next/navigation";
import ProposalDetailsPage from "@/components/dashboard/proposals/ProposalDetailsPage";
import { fetchProposalById } from "@/lib/services/proposal.service";

interface ViewRespondProposalPageProps {
  params: { username: string; proposalId: string };
}

export default async function viewProposalPage({
  params,
}: ViewRespondProposalPageProps) {
  const param = await params
  const username = param.username
  const proposalId = param.proposalId

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
        <ProposalDetailsPage
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

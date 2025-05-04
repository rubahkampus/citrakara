import { Box, Typography, Alert } from "@mui/material";
import { getAuthSession } from "@/lib/utils/session";
import { notFound } from "next/navigation";
import ProposalFormPage from "@/components/dashboard/proposals/ProposalFormPage";
import { fetchProposalById } from "@/lib/services/proposal.service";

interface EditProposalPageProps {
  params: { username: string; proposalId: string };
}

export default async function EditProposalPage({
  params: { username, proposalId },
}: EditProposalPageProps) {
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

    // Only the client who created it can edit, and only when pendingArtist
    if (
      proposal.clientId.toString() !== session.id ||
      proposal.status !== "pendingArtist"
    ) {
      return (
        <Alert severity="error">
          You do not have permission to edit this proposal
        </Alert>
      );
    }

    const serialized = JSON.parse(JSON.stringify(proposal));
    return (
      <Box>
        <Typography variant="h5" fontWeight="bold" sx={{ mb: 3 }}>
          Edit Proposal
        </Typography>

        <ProposalFormPage
          username={username}
          mode="edit"
          initialData={serialized}
        />
      </Box>
    );
  } catch (err) {
    console.error("Error loading proposal:", err);
    return <Alert severity="error">Failed to load proposal details</Alert>;
  }
}

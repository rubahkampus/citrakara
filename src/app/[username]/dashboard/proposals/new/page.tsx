import { Box, Typography, Alert } from "@mui/material";
import { getAuthSession } from "@/lib/utils/session";
import ProposalFormPage from "@/components/dashboard/proposals/ProposalFormPage";

interface NewProposalPageProps {
  params: { username: string };
}

export default async function NewProposalPage({
  params: { username },
}: NewProposalPageProps) {
  const session = await getAuthSession();
  if (
    !session ||
    typeof session === "string" ||
    session.username !== username
  ) {
    return <Alert severity="error">Access denied</Alert>;
  }

  return (
    <Box>
      <Typography variant="h5" fontWeight="bold" sx={{ mb: 3 }}>
        Create New Proposal
      </Typography>

      <ProposalFormPage username={username} mode="create" />
    </Box>
  );
}

// src/app/[username]/dashboard/proposals/page.tsx
import { Suspense } from "react";
import { Box, Typography, Alert } from "@mui/material";
import ProposalListingPage from "@/components/dashboard/proposals/ProposalListingPage";
import ProposalListingSkeleton from "@/components/dashboard/proposals/ProposalListingSkeleton";
import { getAuthSession } from "@/lib/utils/session";
import { getDashboardData } from "@/lib/services/proposal.service";

interface ProposalsPageProps {
  params: { username: string };
}

export default async function ProposalsPage({ params }: ProposalsPageProps) {
  const param = await params;
  const username = param.username;
  const session = await getAuthSession();
  if (
    !session ||
    typeof session === "string" ||
    session.username !== username
  ) {
    return <Alert severity="error">You do not have access to this page</Alert>;
  }

  let data,
    error: string | null = null;
  try {
    data = await getDashboardData(session.id);
  } catch (err) {
    console.error("Error fetching proposals:", err);
    error = "Failed to load your proposals";
  }

  const incoming = data?.incoming ?? [];
  const outgoing = data?.outgoing ?? [];

  // Serialize for client components
  const serializedIncoming = JSON.parse(JSON.stringify(incoming));
  const serializedOutgoing = JSON.parse(JSON.stringify(outgoing));

  console.log("serializedOutgoing:", JSON.stringify(outgoing[outgoing.length-1]));

  return (
    <Box>
      <Typography variant="h5" fontWeight="bold" sx={{ mb: 3 }}>
        My Proposals
      </Typography>

      <Suspense fallback={<ProposalListingSkeleton />}>
        <ProposalListingPage
          username={username}
          incoming={serializedIncoming}
          outgoing={serializedOutgoing}
          error={error ?? undefined}
        />
      </Suspense>
    </Box>
  );
}

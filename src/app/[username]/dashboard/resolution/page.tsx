// src/app/[username]/dashboard/resolution/page.tsx
import { Suspense } from "react";
import { Box, Typography, Alert } from "@mui/material";
import { getAuthSession, isUserOwner, Session } from "@/lib/utils/session";
import { getResolutionTicketsByUser } from "@/lib/services/ticket.service";
import DashboardLoadingSkeleton from "@/components/dashboard/DashboardLoadingSkeleton";

// This component would be created in src/components/dashboard/resolution/
import ResolutionListPage from "@/components/dashboard/resolution/ResolutionListPage";

interface ResolutionPageProps {
  params: { username: string };
}

export default async function ResolutionPage({ params }: ResolutionPageProps) {
  const param = await params;
  const { username } = param;
  const session = await getAuthSession();

  if (!session || !isUserOwner(session as Session, username)) {
    return <Alert severity="error">You do not have access to this page</Alert>;
  }

  let resolutionTickets;
  try {
    resolutionTickets = await getResolutionTicketsByUser(
      (session as Session).id,
      "both"
    );
  } catch (err) {
    console.error("Error fetching resolution tickets:", err);
    return <Alert severity="error">Failed to load resolution data</Alert>;
  }

  const serializedTickets = JSON.parse(JSON.stringify(resolutionTickets));

  return (
    <Box>
      <Typography variant="h5" fontWeight="bold" sx={{ mb: 3 }}>
        Dispute Resolution
      </Typography>

      <Suspense fallback={<DashboardLoadingSkeleton />}>
        {/* This component would be implemented separately */}
        <ResolutionListPage
          username={username}
          tickets={serializedTickets}
          userId={(session as Session).id}
        />
        <Box>
          <Typography variant="h6">Your Resolution Tickets</Typography>
          {resolutionTickets.length === 0 ? (
            <Typography>No resolution tickets found</Typography>
          ) : (
            <Typography>
              Found {resolutionTickets.length} resolution tickets
            </Typography>
          )}
        </Box>
      </Suspense>
    </Box>
  );
}

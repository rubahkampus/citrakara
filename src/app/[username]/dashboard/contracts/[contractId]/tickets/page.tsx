// src/app/[username]/dashboard/contracts/[contractId]/tickets/page.tsx
import { Suspense } from "react";
import { Box, Typography, Alert } from "@mui/material";
import { getAuthSession, isUserOwner, Session } from "@/lib/utils/session";
import { getContractById } from "@/lib/services/contract.service";
import DashboardLoadingSkeleton from "@/components/dashboard/DashboardLoadingSkeleton";

// This component would be created in src/components/dashboard/contracts/
// import TicketsListPage from "@/components/dashboard/contracts/TicketsListPage";

interface TicketsListPageProps {
  params: {
    username: string;
    contractId: string;
  };
}

export default async function TicketsListPage({
  params,
}: TicketsListPageProps) {
  const { username, contractId } = params;
  const session = await getAuthSession();

  if (!session || !isUserOwner(session as Session, username)) {
    return <Alert severity="error">You do not have access to this page</Alert>;
  }

  let contract;
  try {
    contract = await getContractById(contractId, (session as Session).id);
  } catch (err) {
    console.error("Error fetching contract:", err);
    return <Alert severity="error">Failed to load contract tickets</Alert>;
  }

  // Serialize for client components
  const cancelTickets = contract.cancelTickets || [];
  const revisionTickets = contract.revisionTickets || [];
  const changeTickets = contract.changeTickets || [];
  const resolutionTickets = contract.resolutionTickets || [];

  const serializedTickets = {
    cancel: JSON.parse(JSON.stringify(cancelTickets)),
    revision: JSON.parse(JSON.stringify(revisionTickets)),
    change: JSON.parse(JSON.stringify(changeTickets)),
    resolution: JSON.parse(JSON.stringify(resolutionTickets)),
  };

  const isArtist = contract.artistId.toString() === (session as Session).id;
  const isClient = contract.clientId.toString() === (session as Session).id;

  return (
    <Box>
      <Typography variant="h5" fontWeight="bold" sx={{ mb: 3 }}>
        Contract Tickets
      </Typography>

      <Suspense fallback={<DashboardLoadingSkeleton />}>
        {/* This component would be implemented separately */}
        {/* <TicketsListPage
          username={username}
          contractId={contractId}
          tickets={serializedTickets}
          isArtist={isArtist}
          isClient={isClient}
          contractStatus={contract.status}
        /> */}
        <Box>
          Ticket listings for contract {contractId} would be displayed here.
          There are {cancelTickets.length} cancel tickets,
          {revisionTickets.length} revision tickets,
          {changeTickets.length} change tickets, and
          {resolutionTickets.length} resolution tickets.
        </Box>
      </Suspense>
    </Box>
  );
}

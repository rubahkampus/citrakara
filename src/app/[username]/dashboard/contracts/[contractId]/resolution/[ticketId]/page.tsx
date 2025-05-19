// src/app/[username]/dashboard/contracts/[contractId]/resolution/[ticketId]/page.tsx
import { Box, Alert, Typography } from "@mui/material";
import { getAuthSession, isUserOwner, Session } from "@/lib/utils/session";
import { getContractById } from "@/lib/services/contract.service";
import { findResolutionTicketById } from "@/lib/db/repositories/ticket.repository";
import ResolutionTicketDetails from "@/components/dashboard/contracts/tickets/ResolutionTicketDetails";

interface ResolutionTicketPageProps {
  params: {
    username: string;
    contractId: string;
    ticketId: string;
  };
}

export default async function ResolutionTicketPage({
  params,
}: ResolutionTicketPageProps) {
  const { username, contractId, ticketId } = params;
  const session = await getAuthSession();

  // Check for valid session and ownership
  if (!session || !isUserOwner(session as Session, username)) {
    return <Alert severity="error">You do not have access to this page</Alert>;
  }

  // Fetch the contract
  let contract;
  try {
    contract = await getContractById(contractId, (session as Session).id);
  } catch (err) {
    console.error("Error fetching contract:", err);
    return <Alert severity="error">Failed to load contract data</Alert>;
  }

  // Determine user roles
  const isArtist = contract.artistId.toString() === (session as Session).id;
  const isClient = contract.clientId.toString() === (session as Session).id;

  // Get the resolution ticket
  let ticket;
  try {
    ticket = await findResolutionTicketById(ticketId);

    if (!ticket) {
      return <Alert severity="error">Resolution ticket not found</Alert>;
    }

    // Security check: make sure ticket belongs to this contract
    if (ticket.contractId.toString() !== contractId) {
      return (
        <Alert severity="error">
          This resolution ticket does not belong to this contract
        </Alert>
      );
    }
  } catch (err) {
    console.error("Error fetching resolution ticket:", err);
    return (
      <Alert severity="error">Failed to load resolution ticket data</Alert>
    );
  }

  // Serialize for client component
  const serializedTicket = JSON.parse(JSON.stringify(ticket));

  return (
    <Box>
      <ResolutionTicketDetails
        ticket={serializedTicket}
        userId={(session as Session).id}
        contractId={contractId}
        isArtist={isArtist}
        isClient={isClient}
      />
    </Box>
  );
}

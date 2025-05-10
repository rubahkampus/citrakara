// src/app/[username]/dashboard/resolution/[ticketId]/page.tsx
import { Box, Alert, Typography } from "@mui/material";
import { getAuthSession, isUserOwner, Session } from "@/lib/utils/session";
import { findResolutionTicketById } from "@/lib/db/repositories/ticket.repository";
import { getContractById } from "@/lib/services/contract.service";

// These components would be created in src/components/dashboard/resolution/
// import ResolutionTicketDetails from "@/components/dashboard/resolution/ResolutionTicketDetails";

interface ResolutionDetailPageProps {
  params: {
    username: string;
    ticketId: string;
  };
}

export default async function ResolutionDetailPage({
  params,
}: ResolutionDetailPageProps) {
  const { username, ticketId } = params;
  const session = await getAuthSession();

  if (!session || !isUserOwner(session as Session, username)) {
    return <Alert severity="error">You do not have access to this page</Alert>;
  }

  let ticket;
  try {
    ticket = await findResolutionTicketById(ticketId);
    if (!ticket) {
      return <Alert severity="error">Resolution ticket not found</Alert>;
    }
  } catch (err) {
    console.error("Error fetching resolution ticket:", err);
    return <Alert severity="error">Failed to load resolution ticket</Alert>;
  }

  // Check if user is part of this resolution
  const isSubmitter =
    ticket.submittedById.toString() === (session as Session).id;
  const isCounterparty =
    ticket.counterparty ===
    (ticket.submittedBy === "client" ? "artist" : "client");

  if (!isSubmitter && !isCounterparty) {
    return (
      <Alert severity="error">
        You are not authorized to view this resolution
      </Alert>
    );
  }

  // Get the related contract for context
  let contract;
  try {
    contract = await getContractById(
      ticket.contractId,
      (session as Session).id
    );
  } catch (err) {
    console.error("Error fetching contract:", err);
    // Continue without contract data
  }

  // Check if counterproof can be submitted
  const canSubmitCounterproof =
    ticket.status === "open" &&
    ticket.counterparty ===
      (ticket.submittedBy === "client" ? "artist" : "client") &&
    !ticket.counterDescription &&
    new Date(ticket.counterExpiresAt) > new Date();

  // Serialize for client components
  const serializedTicket = JSON.parse(JSON.stringify(ticket));
  const serializedContract = contract
    ? JSON.parse(JSON.stringify(contract))
    : null;

  return (
    <Box>
      <Typography variant="h5" fontWeight="bold" sx={{ mb: 3 }}>
        Resolution Details
      </Typography>

      {/* This component would be implemented separately */}
      {/* <ResolutionTicketDetails
        ticket={serializedTicket}
        contract={serializedContract}
        userId={session.id}
        canSubmitCounterproof={canSubmitCounterproof}
      /> */}

      <Box>
        <Typography variant="h6">Resolution Ticket #{ticketId}</Typography>
        <Typography>Status: {ticket.status}</Typography>
        <Typography>Submitted by: {ticket.submittedBy}</Typography>
        <Typography>Target type: {ticket.targetType}</Typography>
        <Typography>Description: {ticket.description}</Typography>

        {canSubmitCounterproof && (
          <Alert severity="info" sx={{ mt: 2 }}>
            You can submit counterproof for this resolution until{" "}
            {new Date(ticket.counterExpiresAt).toLocaleString()}
          </Alert>
        )}

        {ticket.counterDescription && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="h6">Counterparty Response</Typography>
            <Typography>{ticket.counterDescription}</Typography>
          </Box>
        )}

        {ticket.status === "resolved" && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="h6">Resolution Outcome</Typography>
            <Typography>Decision: {ticket.decision}</Typography>
            <Typography>Note: {ticket.resolutionNote}</Typography>
            <Typography>
              Resolved on:{" "}
              {ticket.resolvedAt
                ? new Date(ticket.resolvedAt).toLocaleString()
                : "N/A"}
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
}

// src/app/[username]/dashboard/contracts/[contractId]/tickets/[ticketType]/[ticketId]/page.tsx
import { Box, Alert, Typography } from "@mui/material";
import { getAuthSession, isUserOwner, Session } from "@/lib/utils/session";
import { getContractById } from "@/lib/services/contract.service";
import { findCancelTicketById } from "@/lib/db/repositories/ticket.repository";
import { findRevisionTicketById } from "@/lib/db/repositories/ticket.repository";
import { findChangeTicketById } from "@/lib/db/repositories/ticket.repository";
import { findResolutionTicketById } from "@/lib/db/repositories/ticket.repository";

// These components would be created in src/components/dashboard/contracts/tickets/
// import CancelTicketDetails from "@/components/dashboard/contracts/tickets/CancelTicketDetails";
// import RevisionTicketDetails from "@/components/dashboard/contracts/tickets/RevisionTicketDetails";
// import ChangeTicketDetails from "@/components/dashboard/contracts/tickets/ChangeTicketDetails";
// import ResolutionTicketDetails from "@/components/dashboard/contracts/tickets/ResolutionTicketDetails";

interface TicketDetailsPageProps {
  params: { 
    username: string;
    contractId: string;
    ticketType: "cancel" | "revision" | "change" | "resolution";
    ticketId: string;
  };
}

export default async function TicketDetailsPage({ params }: TicketDetailsPageProps) {
  const { username, contractId, ticketType, ticketId } = params;
  const session = await getAuthSession();
  
  if (!session || !isUserOwner(session as Session, username)) {
    return <Alert severity="error">You do not have access to this page</Alert>;
  }

  let contract;
  try {
    contract = await getContractById(contractId, (session as Session).id);
  } catch (err) {
    console.error("Error fetching contract:", err);
    return <Alert severity="error">Failed to load contract data</Alert>;
  }

  const isArtist = contract.artistId.toString() === (session as Session).id;
  const isClient = contract.clientId.toString() === (session as Session).id;

  // Get the specific ticket
  let ticket;
  try {
    switch (ticketType) {
      case "cancel":
        ticket = await findCancelTicketById(ticketId);
        break;
      case "revision":
        ticket = await findRevisionTicketById(ticketId);
        break;
      case "change":
        ticket = await findChangeTicketById(ticketId);
        break;
      case "resolution":
        ticket = await findResolutionTicketById(ticketId);
        break;
      default:
        return <Alert severity="error">Invalid ticket type</Alert>;
    }

    if (!ticket) {
      return <Alert severity="error">Ticket not found</Alert>;
    }
  } catch (err) {
    console.error(`Error fetching ${ticketType} ticket:`, err);
    return <Alert severity="error">Failed to load ticket data</Alert>;
  }

  // Serialize for client components
  const serializedContract = JSON.parse(JSON.stringify(contract));
  const serializedTicket = JSON.parse(JSON.stringify(ticket));

  return (
    <Box>
      <Typography variant="h5" fontWeight="bold" sx={{ mb: 3 }}>
        {ticketType === "cancel" && "Cancellation Request"}
        {ticketType === "revision" && "Revision Request"}
        {ticketType === "change" && "Contract Change Request"}
        {ticketType === "resolution" && "Resolution Request"}
      </Typography>

      {/* These would be implemented separately */}
      {ticketType === "cancel" && (
        <Box>Cancel ticket details would be displayed here</Box>
        // <CancelTicketDetails 
        //   contract={serializedContract} 
        //   ticket={serializedTicket} 
        //   userId={session.id} 
        //   isArtist={isArtist} 
        //   isClient={isClient} 
        // />
      )}

      {ticketType === "revision" && (
        <Box>Revision ticket details would be displayed here</Box>
        // <RevisionTicketDetails 
        //   contract={serializedContract} 
        //   ticket={serializedTicket} 
        //   userId={session.id} 
        //   isArtist={isArtist} 
        //   isClient={isClient} 
        // />
      )}

      {ticketType === "change" && (
        <Box>Change ticket details would be displayed here</Box>
        // <ChangeTicketDetails 
        //   contract={serializedContract} 
        //   ticket={serializedTicket} 
        //   userId={session.id} 
        //   isArtist={isArtist} 
        //   isClient={isClient} 
        // />
      )}

      {ticketType === "resolution" && (
        <Box>Resolution ticket details would be displayed here</Box>
        // <ResolutionTicketDetails 
        //   contract={serializedContract} 
        //   ticket={serializedTicket} 
        //   userId={session.id} 
        //   isArtist={isArtist} 
        //   isClient={isClient} 
        // />
      )}
    </Box>
  );
}
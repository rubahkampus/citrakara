// src/app/[username]/dashboard/contracts/[contractId]/tickets/[ticketType]/new/page.tsx
import { Box, Alert, Typography } from "@mui/material";
import { getAuthSession, isUserOwner, Session } from "@/lib/utils/session";
import { getContractById } from "@/lib/services/contract.service";

// These components would be created in src/components/dashboard/contracts/tickets/
// import CancelTicketForm from "@/components/dashboard/contracts/tickets/CancelTicketForm";
// import RevisionTicketForm from "@/components/dashboard/contracts/tickets/RevisionTicketForm";
// import ChangeTicketForm from "@/components/dashboard/contracts/tickets/ChangeTicketForm";
// import ResolutionTicketForm from "@/components/dashboard/contracts/tickets/ResolutionTicketForm";

interface CreateTicketPageProps {
  params: { 
    username: string;
    contractId: string;
    ticketType: "cancel" | "revision" | "change" | "resolution";
  };
}

export default async function CreateTicketPage({ params }: CreateTicketPageProps) {
  const { username, contractId, ticketType } = params;
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

  // Verify user has permission to create this ticket type
  const isArtist = contract.artistId.toString() === (session as Session).id;
  const isClient = contract.clientId.toString() === (session as Session).id;

  // Check if user can create this ticket type
  if (ticketType === "revision" && !isClient) {
    return <Alert severity="error">Only clients can create revision tickets</Alert>;
  }

  if (ticketType === "change" && !isClient) {
    return <Alert severity="error">Only clients can create change tickets</Alert>;
  }

  // Check if contract allows this ticket type
  if (ticketType === "revision" && contract.proposalSnapshot.listingSnapshot.revisions?.type === "none") {
    return <Alert severity="error">This contract does not allow revisions</Alert>;
  }

  if (ticketType === "change" && !contract.proposalSnapshot.listingSnapshot) {
    return <Alert severity="error">This contract does not allow changes</Alert>;
  }

  // Serialize for client components
  const serializedContract = JSON.parse(JSON.stringify(contract));

  return (
    <Box>
      <Typography variant="h5" fontWeight="bold" sx={{ mb: 3 }}>
        {ticketType === "cancel" && "Request Cancellation"}
        {ticketType === "revision" && "Request Revision"}
        {ticketType === "change" && "Request Contract Change"}
        {ticketType === "resolution" && "Request Resolution"}
      </Typography>

      {/* This would be implemented separately */}
      {ticketType === "cancel" && (
        <Box>Cancel ticket form would be displayed here</Box>
        // <CancelTicketForm 
        //   contract={serializedContract} 
        //   userId={session.id} 
        //   isArtist={isArtist} 
        //   isClient={isClient} 
        // />
      )}

      {ticketType === "revision" && (
        <Box>Revision ticket form would be displayed here</Box>
        // <RevisionTicketForm 
        //   contract={serializedContract} 
        //   userId={session.id} 
        //   isClient={isClient} 
        // />
      )}

      {ticketType === "change" && (
        <Box>Change ticket form would be displayed here</Box>
        // <ChangeTicketForm 
        //   contract={serializedContract} 
        //   userId={session.id} 
        //   isClient={isClient} 
        // />
      )}

      {ticketType === "resolution" && (
        <Box>Resolution ticket form would be displayed here</Box>
        // <ResolutionTicketForm 
        //   contract={serializedContract} 
        //   userId={session.id} 
        //   isArtist={isArtist} 
        //   isClient={isClient} 
        // />
      )}
    </Box>
  );
}
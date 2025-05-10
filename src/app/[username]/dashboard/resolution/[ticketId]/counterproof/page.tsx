// src/app/[username]/dashboard/resolution/[ticketId]/counterproof/page.tsx
import { Box, Alert, Typography } from "@mui/material";
import { getAuthSession, isUserOwner, Session } from "@/lib/utils/session";
import { findResolutionTicketById } from "@/lib/db/repositories/ticket.repository";

// This component would be created in src/components/dashboard/resolution/
// import CounterproofForm from "@/components/dashboard/resolution/CounterproofForm";

interface CounterproofPageProps {
  params: {
    username: string;
    ticketId: string;
  };
}

export default async function CounterproofPage({
  params,
}: CounterproofPageProps) {
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

  // Check if user is the counterparty
  const isCounterparty =
    (ticket.submittedBy === "client" && ticket.counterparty === "artist") ||
    (ticket.submittedBy === "artist" && ticket.counterparty === "client");

  if (!isCounterparty) {
    return (
      <Alert severity="error">
        Only the counterparty can submit counterproof
      </Alert>
    );
  }

  // Check if ticket is still open for counterproof
  if (ticket.status !== "open") {
    return (
      <Alert severity="error">
        This resolution is no longer accepting counterproof
      </Alert>
    );
  }

  // Check if deadline has passed
  if (new Date(ticket.counterExpiresAt) < new Date()) {
    return (
      <Alert severity="error">
        The deadline for submitting counterproof has passed
      </Alert>
    );
  }

  // Check if counterproof already submitted
  if (ticket.counterDescription) {
    return (
      <Alert severity="error">You have already submitted counterproof</Alert>
    );
  }

  // Serialize for client components
  const serializedTicket = JSON.parse(JSON.stringify(ticket));

  return (
    <Box>
      <Typography variant="h5" fontWeight="bold" sx={{ mb: 3 }}>
        Submit Counterproof
      </Typography>

      <Alert severity="info" sx={{ mb: 3 }}>
        You have until {new Date(ticket.counterExpiresAt).toLocaleString()} to
        submit your counterproof.
      </Alert>

      {/* This component would be implemented separately */}
      {/* <CounterproofForm
        ticket={serializedTicket}
        userId={session.id}
      /> */}

      <Box>
        <Typography variant="h6">Original Claim</Typography>
        <Typography>{ticket.description}</Typography>

        {ticket.proofImages && ticket.proofImages.length > 0 && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle1">Proof Images</Typography>
            <Typography>
              {ticket.proofImages.length} image(s) attached
            </Typography>
          </Box>
        )}

        <Box sx={{ mt: 3 }}>
          <Typography variant="h6">Your Counterproof</Typography>
          <Typography>Counterproof form would be displayed here</Typography>
        </Box>
      </Box>
    </Box>
  );
}

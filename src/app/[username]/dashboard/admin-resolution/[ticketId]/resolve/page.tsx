// src/app/[username]/dashboard/admin-resolution/[ticketId]/resolve/page.tsx
import { Box, Alert, Typography } from "@mui/material";
import { getAuthSession, isUserOwner, Session } from "@/lib/utils/session";
import { isUserAdminById } from "@/lib/services/user.service";
import { findResolutionTicketById } from "@/lib/db/repositories/ticket.repository";

// This component would be created in src/components/dashboard/admin/
// import AdminResolutionDecisionForm from "@/components/dashboard/admin/AdminResolutionDecisionForm";

interface AdminResolutionDecidePageProps {
  params: {
    username: string;
    ticketId: string;
  };
}

export default async function AdminResolutionDecidePage({
  params,
}: AdminResolutionDecidePageProps) {
  const { username, ticketId } = params;
  const session = await getAuthSession();

  if (!session || !isUserOwner(session as Session, username)) {
    return <Alert severity="error">You do not have access to this page</Alert>;
  }

  // Check if user is an admin
  const isAdmin = await isUserAdminById((session as Session).id);
  if (!isAdmin) {
    return <Alert severity="error">You do not have admin privileges</Alert>;
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

  // Check if ticket is ready for admin resolution
  if (ticket.status !== "awaitingReview") {
    return (
      <Alert severity="error">
        This ticket is not ready for resolution or has already been resolved
      </Alert>
    );
  }

  // Serialize for client components
  const serializedTicket = JSON.parse(JSON.stringify(ticket));

  return (
    <Box>
      <Typography variant="h5" fontWeight="bold" sx={{ mb: 3 }}>
        Make Resolution Decision
      </Typography>

      <Box sx={{ mb: 3 }}>
        <Typography variant="h6">Resolution Ticket #{ticketId}</Typography>
        <Typography>Submitted by: {ticket.submittedBy}</Typography>
        <Typography>Target type: {ticket.targetType}</Typography>
        <Typography>Target ID: {ticket.targetId.toString()}</Typography>
      </Box>

      {/* This component would be implemented separately */}
      {/* <AdminResolutionDecisionForm
        ticket={serializedTicket}
        userId={session.id}
      /> */}

      <Box>
        <Typography variant="h6">Decision Form</Typography>
        <Typography>
          Form with options to favor client or artist and resolution note would
          be here
        </Typography>
        <Typography sx={{ mt: 2 }}>Required actions:</Typography>
        <Typography>1. Choose who to favor (client or artist)</Typography>
        <Typography>2. Provide detailed reasoning for the decision</Typography>
        <Typography>3. Submit the decision</Typography>
      </Box>

      <Alert severity="warning" sx={{ mt: 3 }}>
        This action cannot be undone. Once you submit a decision, it will be
        immediately applied to the contract.
      </Alert>
    </Box>
  );
}

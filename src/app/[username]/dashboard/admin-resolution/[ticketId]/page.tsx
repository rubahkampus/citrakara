// src/app/[username]/dashboard/admin-resolution/[ticketId]/page.tsx
import { Box, Alert, Typography } from "@mui/material";
import { getAuthSession, isUserOwner, Session } from "@/lib/utils/session";
import { isUserAdminById } from "@/lib/services/user.service";
import { findResolutionTicketById } from "@/lib/db/repositories/ticket.repository";
import { getContractById } from "@/lib/services/contract.service";

// This component would be created in src/components/dashboard/admin/
// import AdminResolutionDetailPage from "@/components/dashboard/admin/AdminResolutionDetailPage";

interface AdminResolutionDetailPageProps {
  params: {
    username: string;
    ticketId: string;
  };
}

export default async function AdminResolutionDetailPage({
  params,
}: AdminResolutionDetailPageProps) {
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

  // Get the related contract for context
  let contract;
  try {
    contract = await getContractById(
      ticket.contractId,
      (session as Session).id
    );
  } catch (err) {
    console.error("Error fetching contract:", err);
    return <Alert severity="error">Failed to load contract data</Alert>;
  }

  // Check if ticket is ready for admin resolution
  const canResolve = ticket.status === "awaitingReview";

  // Serialize for client components
  const serializedTicket = JSON.parse(JSON.stringify(ticket));
  const serializedContract = JSON.parse(JSON.stringify(contract));

  return (
    <Box>
      <Typography variant="h5" fontWeight="bold" sx={{ mb: 3 }}>
        Admin Resolution: Ticket #{ticketId}
      </Typography>

      {!canResolve && (
        <Alert severity="info" sx={{ mb: 3 }}>
          This ticket is not yet ready for admin resolution or has already been
          resolved.
        </Alert>
      )}

      {/* This component would be implemented separately */}
      {/* <AdminResolutionDetailPage
        ticket={serializedTicket}
        contract={serializedContract}
        userId={session.id}
        canResolve={canResolve}
      /> */}

      <Box>
        <Typography variant="h6">Resolution Details</Typography>
        <Typography>Status: {ticket.status}</Typography>
        <Typography>Submitted by: {ticket.submittedBy}</Typography>
        <Typography>Target type: {ticket.targetType}</Typography>
        <Typography>Target ID: {ticket.targetId.toString()}</Typography>
        <Typography>
          Created: {new Date(ticket.createdAt).toLocaleString()}
        </Typography>

        <Box sx={{ mt: 3 }}>
          <Typography variant="h6">Submitter's Claim</Typography>
          <Typography>{ticket.description}</Typography>

          {ticket.proofImages && ticket.proofImages.length > 0 && (
            <Typography sx={{ mt: 1 }}>
              {ticket.proofImages.length} proof image(s) attached
            </Typography>
          )}
        </Box>

        <Box sx={{ mt: 3 }}>
          <Typography variant="h6">Counterparty's Response</Typography>
          {ticket.counterDescription ? (
            <>
              <Typography>{ticket.counterDescription}</Typography>

              {ticket.counterProofImages &&
                ticket.counterProofImages.length > 0 && (
                  <Typography sx={{ mt: 1 }}>
                    {ticket.counterProofImages.length} counterproof image(s)
                    attached
                  </Typography>
                )}
            </>
          ) : (
            <Typography>No counterproof submitted</Typography>
          )}
        </Box>

        {canResolve && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="h6">Admin Decision</Typography>
            <Typography>
              Admin resolution form would be displayed here
            </Typography>
          </Box>
        )}

        {ticket.status === "resolved" && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="h6">Resolution Outcome</Typography>
            <Typography>Decision: {ticket.decision}</Typography>
            <Typography>Resolution note: {ticket.resolutionNote}</Typography>
            <Typography>
              Resolved by: {ticket.resolvedBy?.toString()}
            </Typography>
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

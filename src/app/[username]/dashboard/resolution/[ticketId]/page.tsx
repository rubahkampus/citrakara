// src/app/[username]/dashboard/resolution/[ticketId]/page.tsx
import { Box, Alert, Typography, Button } from "@mui/material";
import { getAuthSession, isUserOwner, Session } from "@/lib/utils/session";
import { findResolutionTicketById } from "@/lib/db/repositories/ticket.repository";
import { getContractById } from "@/lib/services/contract.service";

// This component would be created in src/components/dashboard/resolution/
// import ResolutionTicketDetails from "@/components/dashboard/resolution/ResolutionTicketDetails";
// import CounterproofForm from "@/components/dashboard/resolution/CounterproofForm";

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
    (ticket.submittedBy === "client" && ticket.counterparty === "artist") ||
    (ticket.submittedBy === "artist" && ticket.counterparty === "client");

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
    isCounterparty &&
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

      {/* Ticket Info Section */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6">Resolution Ticket #{ticketId}</Typography>
        <Typography>Status: {ticket.status}</Typography>
        <Typography>Submitted by: {ticket.submittedBy}</Typography>
        <Typography>Target type: {ticket.targetType}</Typography>
        <Typography>
          Created on: {new Date(ticket.createdAt).toLocaleString()}
        </Typography>
      </Box>

      {/* Submitter's Claim Section */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6">
          {isSubmitter ? "Your Claim" : "Submitted Claim"}
        </Typography>
        <Typography sx={{ mt: 1 }}>{ticket.description}</Typography>

        {ticket.proofImages && ticket.proofImages.length > 0 && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle1">Evidence Images</Typography>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 1 }}>
              {ticket.proofImages.map((image, index) => (
                <Box
                  key={index}
                  component="img"
                  src={image}
                  alt={`Proof ${index + 1}`}
                  sx={{ width: 100, height: 100, objectFit: "cover" }}
                />
              ))}
            </Box>
          </Box>
        )}
      </Box>

      {/* Counterparty Response Section */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6">
          {isCounterparty ? "Your Response" : "Counterparty Response"}
        </Typography>

        {ticket.counterDescription ? (
          <>
            <Typography sx={{ mt: 1 }}>{ticket.counterDescription}</Typography>

            {ticket.counterProofImages &&
              ticket.counterProofImages.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle1">Response Evidence</Typography>
                  <Box
                    sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 1 }}
                  >
                    {ticket.counterProofImages.map((image, index) => (
                      <Box
                        key={index}
                        component="img"
                        src={image}
                        alt={`Counterproof ${index + 1}`}
                        sx={{ width: 100, height: 100, objectFit: "cover" }}
                      />
                    ))}
                  </Box>
                </Box>
              )}
          </>
        ) : (
          <>
            {canSubmitCounterproof ? (
              <>
                <Alert severity="info" sx={{ mt: 1, mb: 2 }}>
                  You can submit your response until{" "}
                  {new Date(ticket.counterExpiresAt).toLocaleString()}
                </Alert>

                {/* This component would be implemented separately */}
                {/* <CounterproofForm
                  ticket={serializedTicket}
                  userId={session.id}
                /> */}

                <Box sx={{ mt: 2 }}>
                  <Typography>
                    Counterproof form would be displayed here
                  </Typography>
                  <Typography variant="subtitle2" sx={{ mt: 1 }}>
                    Form fields:
                  </Typography>
                  <Typography>- Response description (required)</Typography>
                  <Typography>- Evidence images (optional)</Typography>
                  <Button variant="contained" color="primary" sx={{ mt: 2 }}>
                    Submit Response
                  </Button>
                </Box>
              </>
            ) : (
              <Typography sx={{ mt: 1, fontStyle: "italic" }}>
                {isCounterparty
                  ? "You did not submit a response before the deadline."
                  : "No response has been submitted yet."}
                {ticket.status === "open" &&
                  ` Response deadline: ${new Date(
                    ticket.counterExpiresAt
                  ).toLocaleString()}`}
              </Typography>
            )}
          </>
        )}
      </Box>

      {/* Resolution Outcome Section */}
      {ticket.status === "resolved" && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6">Resolution Outcome</Typography>
          <Alert
            severity={ticket.decision === "favorClient" ? "info" : "warning"}
            sx={{ mt: 1, mb: 1 }}
          >
            Decision:{" "}
            {ticket.decision === "favorClient"
              ? "In favor of the client"
              : "In favor of the artist"}
          </Alert>
          <Typography variant="subtitle1">Admin Note:</Typography>
          <Typography>{ticket.resolutionNote}</Typography>
          <Typography sx={{ mt: 1, fontSize: "0.9rem" }}>
            Resolved on:{" "}
            {ticket.resolvedAt
              ? new Date(ticket.resolvedAt).toLocaleString()
              : "N/A"}
          </Typography>
        </Box>
      )}

      {/* Status-specific Messages */}
      {ticket.status === "awaitingReview" && (
        <Alert severity="info" sx={{ mt: 2 }}>
          This resolution has been submitted for review by an administrator. You
          will be notified when a decision is made.
        </Alert>
      )}

      {ticket.status === "cancelled" && (
        <Alert severity="warning" sx={{ mt: 2 }}>
          This resolution was cancelled. The original issue may have been
          resolved through other means.
        </Alert>
      )}
    </Box>
  );
}

// src/app/[username]/dashboard/contracts/[contractId]/tickets/[ticketType]/new/page.tsx
import { Box, Alert, Typography, Paper } from "@mui/material";
import { getAuthSession, isUserOwner, Session } from "@/lib/utils/session";
import { getContractById } from "@/lib/services/contract.service";
import {
  getUnresolvedCancelTickets,
  getUnresolvedChangeTickets,
  getUnresolvedResolutionTickets,
  getUnresolvedRevisionTickets,
  getUnfinishedRevisionTickets,
  getUnfinishedCancelTickets,
} from "@/lib/services/ticket.service";
import {
  getUnfinishedRevisionUploads,
  getUnfinishedFinalUploads,
  getUnfinishedFinalMilestoneUploads,
} from "@/lib/services/upload.service";

// These components would be created in src/components/dashboard/contracts/tickets/
import CancelTicketForm from "@/components/dashboard/contracts/tickets/CancelTicketForm";
import RevisionTicketForm from "@/components/dashboard/contracts/tickets/RevisionTicketForm";
import ChangeTicketForm from "@/components/dashboard/contracts/tickets/ChangeTicketForm";
import ResolutionTicketForm from "@/components/dashboard/contracts/tickets/ResolutionTicketForm";

interface CreateTicketPageProps {
  params: {
    username: string;
    contractId: string;
    ticketType: "cancel" | "revision" | "change";
  };
}

export default async function CreateTicketPage({
  params,
}: CreateTicketPageProps) {
  const param = await params;
  const { username, contractId, ticketType } = param;
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
    return (
      <Alert severity="error">Only clients can create revision tickets</Alert>
    );
  }

  if (ticketType === "change" && !isClient) {
    return (
      <Alert severity="error">Only clients can create change tickets</Alert>
    );
  }

  // Check if contract allows this ticket type
  if (
    ticketType === "revision" &&
    contract.proposalSnapshot.listingSnapshot.revisions?.type === "none"
  ) {
    return (
      <Alert severity="error">This contract does not allow revisions</Alert>
    );
  }

  if (
    ticketType === "change" &&
    !contract.proposalSnapshot.listingSnapshot.allowContractChange
  ) {
    return <Alert severity="error">This contract does not allow changes</Alert>;
  }

  // Check for active tickets and uploads
  const [
    unresolvedCancelTickets,
    unresolvedChangeTickets,
    unresolvedResolutionTickets,
    unresolvedRevisionTickets,
    unfinishedRevisionTickets,
    unfinishedCancelTickets,
    unfinishedRevisionUploads,
    unfinishedFinalUploads,
    unfinishedFinalMilestoneUploads,
  ] = await Promise.all([
    getUnresolvedCancelTickets(contractId),
    getUnresolvedChangeTickets(contractId),
    getUnresolvedResolutionTickets(contractId),
    getUnresolvedRevisionTickets(contractId),
    getUnfinishedRevisionTickets(contractId),
    getUnfinishedCancelTickets(contractId),
    getUnfinishedRevisionUploads(contractId),
    getUnfinishedFinalUploads(contractId),
    getUnfinishedFinalMilestoneUploads(contractId),
  ]);

  // Collect warnings based on active tickets and uploads
  const warnings = [];

  // Only check for conflicts with the current ticket type
  // For cancel tickets
  if (ticketType === "cancel" && unresolvedCancelTickets.length > 0) {
    warnings.push({
      type: "error",
      message:
        "There is already an active cancellation request for this contract. Please wait for it to be resolved before creating a new one.",
    });
  }

  // For revision tickets
  if (ticketType === "revision" && unresolvedRevisionTickets.length > 0) {
    warnings.push({
      type: "error",
      message:
        "There are already active revision requests for this contract. Please wait for them to be resolved before creating a new one.",
    });
  }

  // For change tickets
  if (ticketType === "change" && unresolvedChangeTickets.length > 0) {
    warnings.push({
      type: "error",
      message:
        "There is already an active change request for this contract. Please wait for it to be resolved before creating a new one.",
    });
  }

  // Add warnings for unfinished uploads (always informational)
  if (isArtist && unfinishedRevisionTickets.length > 0) {
    warnings.push({
      type: "info",
      message: "You have revision tickets that need uploads.",
    });
  }

  if (isArtist && unfinishedCancelTickets.length > 0) {
    warnings.push({
      type: "info",
      message:
        "You have an accepted cancellation request that needs a final proof of work upload.",
    });
  }

  if (unfinishedRevisionUploads.length > 0) {
    warnings.push({
      type: "info",
      message: "There are revision uploads waiting for review.",
    });
  }

  if (unfinishedFinalUploads.length > 0) {
    warnings.push({
      type: "info",
      message: "There is a final upload waiting for review.",
    });
  }

  if (unfinishedFinalMilestoneUploads.length > 0) {
    warnings.push({
      type: "info",
      message: "There are milestone uploads waiting for review.",
    });
  }

  // Serialize for client components
  const serializedContract = JSON.parse(JSON.stringify(contract));

  // Check if there's a blocker error that should prevent form display
  const hasBlockingError = warnings.some(
    (warning) =>
      warning.type === "error" &&
      ((ticketType === "cancel" && warning.message.includes("cancellation")) ||
        (ticketType === "revision" && warning.message.includes("revision")) ||
        (ticketType === "change" && warning.message.includes("change")))
  );

  return (
    <Box>
      <Typography variant="h5" fontWeight="bold" sx={{ mb: 3 }}>
        {ticketType === "cancel" && "Request Cancellation"}
        {ticketType === "revision" && "Request Revision"}
        {ticketType === "change" && "Request Contract Change"}
      </Typography>

      {/* Display warnings */}
      {warnings.length > 0 && (
        <Box sx={{ mb: 3 }}>
          {warnings.map((warning, index) => (
            <Alert
              key={index}
              severity={
                warning.type as "error" | "warning" | "info" | "success"
              }
              sx={{ mb: 1 }}
            >
              {warning.message}
            </Alert>
          ))}
        </Box>
      )}

      {/* Only display the form if there's no blocking error */}
      {!hasBlockingError && (
        <>
          {ticketType === "cancel" && (
            <CancelTicketForm
              contract={serializedContract}
              userId={(session as Session).id}
              username={(session as Session).username}
              isArtist={isArtist}
              isClient={isClient}
            />
          )}

          {ticketType === "revision" && (
            <RevisionTicketForm
              contract={serializedContract}
              userId={(session as Session).id}
              username={(session as Session).username}
              isClient={isClient}
            />
          )}

          {ticketType === "change" && (
            <ChangeTicketForm
              contract={serializedContract}
              userId={(session as Session).id}
              username={(session as Session).username}
              isClient={isClient}
            />
          )}
        </>
      )}
    </Box>
  );
}

// src/app/[username]/dashboard/contracts/[contractId]/uploads/[uploadType]/new/page.tsx
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
import { findRevisionTicketById } from "@/lib/db/repositories/ticket.repository";

// These components would be created in src/components/dashboard/contracts/uploads/
import ProgressUploadForm from "@/components/dashboard/contracts/uploads/ProgressUploadForm";
import RevisionUploadForm from "@/components/dashboard/contracts/uploads/RevisionUploadForm";
import FinalUploadForm from "@/components/dashboard/contracts/uploads/FinalUploadForm";
import MilestoneUploadForm from "@/components/dashboard/contracts/uploads/MilestoneUploadForm";

interface CreateUploadPageProps {
  params: {
    username: string;
    contractId: string;
    uploadType: "progress" | "milestone" | "revision" | "final";
  };
  searchParams: {
    ticketId?: string; // For revision uploads
    milestoneIdx?: string; // For milestone uploads
  };
}

export default async function CreateUploadPage({
  params,
  searchParams,
}: CreateUploadPageProps) {
  const param = await params;
  const searchParam = await searchParams;
  const { username, contractId, uploadType } = param;
  const { ticketId, milestoneIdx } = searchParam;
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

  // Verify user has permission to create this upload type
  const isArtist = contract.artistId.toString() === (session as Session).id;
  if (!isArtist) {
    return <Alert severity="error">Only artists can create uploads</Alert>;
  }

  // Check if contract allows this upload type
  if (
    uploadType === "milestone" &&
    contract.proposalSnapshot.listingSnapshot.flow !== "milestone"
  ) {
    return (
      <Alert severity="error">This contract does not use milestone flow</Alert>
    );
  }

  if (
    uploadType === "progress" &&
    contract.proposalSnapshot.listingSnapshot.flow !== "standard"
  ) {
    return (
      <Alert severity="error">This contract does not use standard flow</Alert>
    );
  }

  if (uploadType === "revision" && !ticketId) {
    return <Alert severity="error">Revision ticket ID is required</Alert>;
  }

  if (uploadType === "milestone" && !milestoneIdx) {
    return <Alert severity="error">Milestone index is required</Alert>;
  }

  // Get revision ticket if this is a revision upload
  let revisionTicket;
  if (uploadType === "revision" && ticketId) {
    try {
      revisionTicket = await findRevisionTicketById(ticketId);
      if (!revisionTicket) {
        return <Alert severity="error">Revision ticket not found</Alert>;
      }

      // Check if the ticket is in a state that allows uploads
      if (
        revisionTicket.status !== "accepted" &&
        revisionTicket.status !== "paid" &&
        revisionTicket.status !== "forcedAcceptedArtist"
      ) {
        return (
          <Alert severity="error">
            This revision ticket is not in a state that allows uploads
          </Alert>
        );
      }
    } catch (err) {
      console.error("Error fetching revision ticket:", err);
      return (
        <Alert severity="error">Failed to load revision ticket data</Alert>
      );
    }
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
  let hasBlockingWarning = false;

  // First, check resolution tickets as they might block other operations
  if (unresolvedResolutionTickets.length > 0) {
    warnings.push({
      type: "warning",
      message:
        "There are active resolution cases for this contract. It's recommended to wait for them to be resolved before creating new uploads.",
    });
  }

  // Check for upload-specific blocks
  switch (uploadType) {
    case "progress":
      // Standard progress uploads don't have many restrictions
      // But we can show informational warnings
      if (unresolvedCancelTickets.length > 0) {
        warnings.push({
          type: "warning",
          message: "There is an active cancellation request for this contract.",
        });
      }
      break;

    case "milestone":
      // Check if there's already an active final milestone upload for this milestone
      if (milestoneIdx) {
        const milestoneIdxNum = parseInt(milestoneIdx);
        const activeMilestoneUploads = unfinishedFinalMilestoneUploads.filter(
          (upload) => upload.milestoneIdx === milestoneIdxNum && upload.isFinal
        );

        if (activeMilestoneUploads.length > 0) {
          warnings.push({
            type: "error",
            message: `There is already an active final upload for milestone #${
              milestoneIdxNum + 1
            }. Please wait for client review before submitting a new one.`,
          });
          hasBlockingWarning = true;
        }
      }

      // Other informational warnings
      if (unfinishedRevisionTickets.length > 0) {
        warnings.push({
          type: "info",
          message: `You have ${unfinishedRevisionTickets.length} revision ticket(s) that need uploads.`,
        });
      }
      break;

    case "revision":
      // Check if there's already an active revision upload for this specific ticket
      if (ticketId) {
        const activeTicketUploads = unfinishedRevisionUploads.filter(
          (upload) => upload.revisionTicketId.toString() === ticketId
        );

        if (activeTicketUploads.length > 0) {
          warnings.push({
            type: "error",
            message:
              "There is already an active revision upload for this ticket. Please wait for client review before submitting a new one.",
          });
          hasBlockingWarning = true;
        }
      }

      // If there are other revision tickets that need uploads, inform the artist
      const otherRevisionTickets = unfinishedRevisionTickets.filter(
        (ticket) => !ticketId || ticket._id.toString() !== ticketId
      );

      if (otherRevisionTickets.length > 0) {
        warnings.push({
          type: "info",
          message: `You have ${otherRevisionTickets.length} other revision ticket(s) that need uploads.`,
        });
      }
      break;

    case "final":
      // Check if there's already an active final upload
      if (unfinishedFinalUploads.length > 0) {
        warnings.push({
          type: "error",
          message:
            "There is already an active final upload. Please wait for client review before submitting a new one.",
        });
        hasBlockingWarning = true;
      }

      // Check if this is a cancellation upload
      if (ticketId) {
        // Make sure all required revision uploads are completed before allowing final cancellation upload
        if (unfinishedRevisionTickets.length > 0) {
          warnings.push({
            type: "error",
            message:
              "You must complete all revision requests before submitting a cancellation proof.",
          });
          hasBlockingWarning = true;
        }
      } else {
        // For regular final delivery
        // 1. Check if all milestones are completed for milestone contracts
        if (
          contract.proposalSnapshot.listingSnapshot.flow === "milestone" &&
          contract.milestones
        ) {
          const incompleteMilestones = contract.milestones.filter(
            (milestone) => milestone.status !== "accepted"
          );

          if (incompleteMilestones.length > 0) {
            warnings.push({
              type: "error",
              message:
                "All milestones must be completed before submitting a final delivery.",
            });
            hasBlockingWarning = true;
          }
        }

        // 2. Check if all revisions are completed
        if (unfinishedRevisionTickets.length > 0) {
          warnings.push({
            type: "error",
            message:
              "You must complete all revision requests before submitting the final delivery.",
          });
          hasBlockingWarning = true;
        }
      }
      break;
  }

  // Serialize for client components
  const serializedContract = JSON.parse(JSON.stringify(contract));

  return (
    <Box>
      <Typography variant="h5" fontWeight="bold" sx={{ mb: 3 }}>
        {uploadType === "progress" && "Upload Progress"}
        {uploadType === "milestone" && "Upload Milestone Progress"}
        {uploadType === "revision" && "Upload Revision"}
        {uploadType === "final" && "Upload Final Delivery"}
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

      {/* Only display the form if there's no blocking warning */}
      {!hasBlockingWarning && (
        <>
          {uploadType === "progress" && (
            <ProgressUploadForm
              contract={serializedContract}
              userId={(session as Session).id}
              username={(session as Session).username}
            />
          )}

          {uploadType === "milestone" && (
            <MilestoneUploadForm
              contract={serializedContract}
              userId={(session as Session).id}
              username={(session as Session).username}
              milestoneIdx={parseInt(milestoneIdx || "0")}
              isAllowedFinal={unfinishedRevisionTickets.length === 0}
            />
          )}

          {uploadType === "revision" && ticketId && (
            <RevisionUploadForm
              contract={serializedContract}
              userId={(session as Session).id}
              username={(session as Session).username}
              ticketId={ticketId}
            />
          )}

          {uploadType === "final" && (
            <FinalUploadForm
              contract={serializedContract}
              userId={(session as Session).id}
              username={(session as Session).username}
              cancelTicketId={ticketId}
            />
          )}
        </>
      )}

      {/* For blocking errors, display a message explaining why the form is not shown */}
      {/* {hasBlockingWarning && (
        <Paper sx={{ p: 3, bgcolor: "#f5f5f5" }}>
          <Typography variant="body1" color="error">
            You cannot create a new {uploadType} upload at this time. Please
            address the issues mentioned above first.
          </Typography>
        </Paper>
      )} */}
    </Box>
  );
}

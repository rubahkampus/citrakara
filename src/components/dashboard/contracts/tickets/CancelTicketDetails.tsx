// src/components/dashboard/contracts/tickets/CancelTicketDetails.tsx
"use client";

import { useState } from "react";
import {
  Box,
  Paper,
  Typography,
  Button,
  Alert,
  CircularProgress,
  Divider,
  Chip,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Link,
} from "@mui/material";
import { useRouter } from "next/navigation";
import { IContract } from "@/lib/db/models/contract.model";
import { ICancelTicket } from "@/lib/db/models/ticket.model";

interface CancelTicketDetailsProps {
  contract: IContract;
  ticket: ICancelTicket;
  userId: string;
  isArtist: boolean;
  isClient: boolean;
}

export default function CancelTicketDetails({
  contract,
  ticket,
  userId,
  isArtist,
  isClient,
}: CancelTicketDetailsProps) {
  const router = useRouter();
  const [response, setResponse] = useState<"accept" | "reject" | "">("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showEscalateDialog, setShowEscalateDialog] = useState(false);

  // Format date for display
  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleString();
  };

  // Determine if user can respond to this ticket
  const canRespond = () => {
    // Only the counterparty can respond (not the requester)
    if (ticket.requestedBy === "client" && isArtist) return true;
    if (ticket.requestedBy === "artist" && isClient) return true;
    return false;
  };

  // Format price for display
  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat("en-US").format(amount);
  };

  // Calculate approximate refund based on contract policy and status
  const calculateApproximateOutcome = () => {
    // This is a simplified estimation that should match backend logic
    const totalAmount = contract.finance.total;

    let artistAmount = 0;
    let clientAmount = 0;

    if (ticket.requestedBy === "client") {
      // Client cancellation
      const cancellationFee =
        contract.proposalSnapshot.listingSnapshot.cancelationFee?.kind ===
        "flat"
          ? contract.proposalSnapshot.listingSnapshot.cancelationFee.amount
          : (totalAmount *
              contract.proposalSnapshot.listingSnapshot.cancelationFee
                ?.amount) /
            100;

      // Assuming 0% work progress for new cancellation
      artistAmount = cancellationFee;
      clientAmount = totalAmount - cancellationFee;
    } else {
      // Artist cancellation
      const cancellationFee =
        contract.proposalSnapshot.listingSnapshot.cancelationFee?.kind ===
        "flat"
          ? contract.proposalSnapshot.listingSnapshot.cancelationFee.amount
          : (totalAmount *
              contract.proposalSnapshot.listingSnapshot.cancelationFee
                ?.amount) /
            100;

      // Assuming 0% work progress for new cancellation
      artistAmount = 0;
      clientAmount = totalAmount;
    }

    return {
      totalAmount,
      artistAmount,
      clientAmount,
    };
  };

  const outcome = calculateApproximateOutcome();

  // Handle response submission
  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      // Validate input
      if (!response) {
        throw new Error(
          "Please select whether to accept or reject this cancellation request"
        );
      }

      if (response === "reject" && !rejectionReason.trim()) {
        throw new Error("Please provide a reason for rejection");
      }

      // Prepare request body
      const requestBody = {
        response,
        reason: response === "reject" ? rejectionReason : undefined,
      };

      // Submit to API
      const apiResponse = await fetch(
        `/api/contract/${contract._id}/tickets/cancel/${ticket._id}/respond`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestBody),
        }
      );

      if (!apiResponse.ok) {
        const data = await apiResponse.json();
        throw new Error(data.error || `Failed to submit response`);
      }

      setSuccess(true);

      // Refresh the page after successful submission
      setTimeout(() => {
        router.refresh();
      }, 1000);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unknown error occurred"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle escalation request
  const handleEscalation = () => {
    setShowEscalateDialog(true);
  };

  // Confirm escalation
  const confirmEscalation = () => {
    setShowEscalateDialog(false);
    router.push(
      `/dashboard/${userId}/resolution/new?contractId=${contract._id}&targetType=cancel&targetId=${ticket._id}`
    );
  };

  // Get status color based on status
  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "primary";
      case "accepted":
        return "success";
      case "forcedAccepted":
        return "warning";
      case "rejected":
        return "error";
      case "disputed":
        return "warning";
      default:
        return "default";
    }
  };

  // Check if ticket is past expiration
  const isPastExpiry = new Date(ticket.expiresAt) < new Date();

  return (
    <Paper elevation={2} sx={{ p: 3 }}>
      <Box
        sx={{
          mb: 3,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}
      >
        <Box>
          <Typography variant="h6">Cancellation Request</Typography>
          <Typography variant="body2" color="text.secondary">
            Submitted by:{" "}
            {ticket.requestedBy === "client"
              ? isClient
                ? "you"
                : "the client"
              : isArtist
              ? "you"
              : "the artist"}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Created: {formatDate(ticket.createdAt)}
          </Typography>
          {ticket.resolvedAt && (
            <Typography variant="body2" color="text.secondary">
              Resolved: {formatDate(ticket.resolvedAt)}
            </Typography>
          )}
        </Box>
        <Chip
          label={ticket.status}
          color={getStatusColor(ticket.status)}
          variant="outlined"
        />
      </Box>

      {/* Show warning if approaching expiry */}
      {ticket.status === "pending" && !isPastExpiry && (
        <Alert severity="info" sx={{ mb: 3 }}>
          This cancellation request will expire on{" "}
          {formatDate(ticket.expiresAt)}.
        </Alert>
      )}

      {/* Show warning if past expiry */}
      {ticket.status === "pending" && isPastExpiry && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          This cancellation request has expired. You may need to submit a new
          request or escalate to resolution.
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          Your response has been submitted successfully.
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Divider sx={{ mb: 3 }} />

      {/* Ticket Details */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>
          Cancellation Reason
        </Typography>
        <Typography variant="body1" sx={{ mb: 2 }}>
          {ticket.reason}
        </Typography>

        <Alert severity="info" sx={{ mb: 2 }}>
          <Typography variant="body2" sx={{ fontWeight: "bold" }}>
            Cancellation Fee:{" "}
            {contract.proposalSnapshot.listingSnapshot.cancelationFee?.kind ===
            "flat"
              ? formatPrice(
                  contract.proposalSnapshot.listingSnapshot.cancelationFee
                    .amount
                )
              : `${contract.proposalSnapshot.listingSnapshot.cancelationFee?.amount}% of total`}
          </Typography>
        </Alert>
      </Box>

      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>
          Estimated Outcome
        </Typography>
        <Alert severity="warning">
          <Typography variant="body2">
            If accepted with no work done:
          </Typography>
          <Typography variant="body2">
            Artist receives: {formatPrice(outcome.artistAmount)}
          </Typography>
          <Typography variant="body2">
            Client receives: {formatPrice(outcome.clientAmount)}
          </Typography>
          <Typography variant="body2" fontStyle="italic" sx={{ mt: 1 }}>
            Note: Final amounts will be calculated based on actual work
            completed and will require final proof submission by the artist.
          </Typography>
        </Alert>
      </Box>

      {/* Response Form - Only shown if user can respond and ticket is pending */}
      {canRespond() && ticket.status === "pending" && !isPastExpiry && (
        <Box sx={{ mb: 3 }}>
          <Divider sx={{ mb: 3 }} />
          <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2 }}>
            Your Response
          </Typography>

          <Box sx={{ mb: 3, display: "flex", gap: 2 }}>
            <Button
              variant={response === "accept" ? "contained" : "outlined"}
              color="success"
              onClick={() => setResponse("accept")}
              disabled={isSubmitting}
            >
              Accept Cancellation
            </Button>
            <Button
              variant={response === "reject" ? "contained" : "outlined"}
              color="error"
              onClick={() => setResponse("reject")}
              disabled={isSubmitting}
            >
              Reject Cancellation
            </Button>
          </Box>

          {response === "accept" && (
            <Alert severity="warning" sx={{ mb: 3 }}>
              <Typography variant="body2">
                By accepting this cancellation request, you are agreeing to
                terminate the contract.
                {ticket.requestedBy === "client"
                  ? " You will need to upload proof of work completed to determine the final payment split."
                  : " The artist will need to upload proof of work completed to determine the final payment split."}
              </Typography>
            </Alert>
          )}

          {response === "reject" && (
            <Box sx={{ mb: 3 }}>
              <TextField
                label="Reason for Rejection"
                multiline
                rows={3}
                fullWidth
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Explain why you are rejecting this cancellation request"
                required
                disabled={isSubmitting}
                sx={{ mb: 2 }}
              />
            </Box>
          )}

          <Button
            variant="contained"
            color="primary"
            onClick={handleSubmit}
            disabled={
              !response ||
              (response === "reject" && !rejectionReason.trim()) ||
              isSubmitting
            }
          >
            {isSubmitting ? <CircularProgress size={24} /> : "Submit Response"}
          </Button>
        </Box>
      )}

      {/* Escalate to Resolution section */}
      {ticket.status !== "accepted" && ticket.status !== "forcedAccepted" && (
        <Box sx={{ mt: 3 }}>
          <Divider sx={{ mb: 3 }} />
          <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>
            Not satisfied?
          </Typography>
          <Button
            variant="outlined"
            color="warning"
            onClick={handleEscalation}
            disabled={isSubmitting}
          >
            Escalate to Resolution
          </Button>
        </Box>
      )}

      {/* Next Steps section */}
      {ticket.status === "accepted" || ticket.status === "forcedAccepted" ? (
        <Box sx={{ mt: 3 }}>
          <Divider sx={{ mb: 3 }} />
          <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>
            Next Steps
          </Typography>
          {isArtist ? (
            <Box>
              <Typography variant="body2" sx={{ mb: 2 }}>
                Please upload proof of your current work progress to determine
                the final payment split.
              </Typography>
              <Button
                variant="contained"
                color="primary"
                component={Link}
                href={`/dashboard/${userId}/contracts/${contract._id}/uploads/final/new?cancelTicketId=${ticket._id}`}
              >
                Upload Cancellation Proof
              </Button>
            </Box>
          ) : (
            <Typography variant="body2">
              The artist needs to upload proof of work completed. Once uploaded,
              you'll be notified to review it.
            </Typography>
          )}
        </Box>
      ) : null}

      {/* Escalation Dialog */}
      <Dialog
        open={showEscalateDialog}
        onClose={() => setShowEscalateDialog(false)}
      >
        <DialogTitle>Escalate to Resolution?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Escalating this issue will create a resolution ticket for admin
            review. You will need to provide evidence and explain your position.
            Do you want to proceed with escalation?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowEscalateDialog(false)}>Cancel</Button>
          <Button onClick={confirmEscalation} color="warning">
            Proceed to Resolution
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}

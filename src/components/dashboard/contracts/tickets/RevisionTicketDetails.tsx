// src/components/dashboard/contracts/tickets/RevisionTicketDetails.tsx
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
import { IRevisionTicket } from "@/lib/db/models/ticket.model";

interface RevisionTicketDetailsProps {
  contract: IContract;
  ticket: IRevisionTicket;
  userId: string;
  isArtist: boolean;
  isClient: boolean;
}

export default function RevisionTicketDetails({
  contract,
  ticket,
  userId,
  isArtist,
  isClient,
}: RevisionTicketDetailsProps) {
  const router = useRouter();
  const [response, setResponse] = useState<"accept" | "reject" | "">("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showEscalateDialog, setShowEscalateDialog] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);

  // Format date for display
  const formatDate = (date?: string | Date) => {
    if (!date) return "N/A";
    const parsedDate = typeof date === "string" ? new Date(date) : date;
    return parsedDate.toLocaleString();
  };

  // Format price for display
  const formatPrice = (amount?: number) => {
    if (amount === undefined) return "N/A";
    return new Intl.NumberFormat("en-US").format(amount);
  };

  // Determine if this is a paid revision
  const isPaidRevision = ticket.paidFee !== undefined && ticket.paidFee > 0;

  // Determine if user can respond to this ticket (artist only)
  const canRespond = () => {
    return isArtist && ticket.status === "pending";
  };

  // Determine if client can pay for this revision
  const canPay = () => {
    return (
      isClient &&
      (ticket.status === "accepted" ||
        ticket.status === "forcedAcceptedArtist") &&
      isPaidRevision &&
      !ticket.escrowTxnId
    );
  };

  // Determine if artist can upload revision
  const canUploadRevision = () => {
    return (
      isArtist &&
      ((ticket.status === "accepted" && !isPaidRevision) ||
        ticket.status === "paid" ||
        (ticket.status === "forcedAcceptedArtist" && !isPaidRevision))
    );
  };

  // Handle response submission (for artist)
  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      // Validate input
      if (!response) {
        throw new Error(
          "Please select whether to accept or reject this revision request"
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
        `/api/contract/${contract._id}/tickets/revision/${ticket._id}/respond`,
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

  // Handle payment submission (for client)
  const handlePayment = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      // Submit payment to API
      const apiResponse = await fetch(
        `/api/contract/${contract._id}/tickets/revision/${ticket._id}/pay`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        }
      );

      if (!apiResponse.ok) {
        const data = await apiResponse.json();
        throw new Error(data.error || `Failed to process payment`);
      }

      setSuccess(true);
      setShowPaymentDialog(false);

      // Refresh the page after successful payment
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
      `/dashboard/${userId}/resolution/new?contractId=${contract._id}&targetType=revision&targetId=${ticket._id}`
    );
  };

  // Get status color based on status
  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "primary";
      case "accepted":
      case "forcedAcceptedArtist":
        return "success";
      case "paid":
        return "success";
      case "rejected":
        return "error";
      case "disputed":
        return "warning";
      case "cancelled":
        return "default";
      default:
        return "default";
    }
  };

  // Check if ticket is past expiration
  const isPastExpiry =
    ticket.expiresAt && new Date(ticket.expiresAt) < new Date();

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
          <Typography variant="h6">Revision Request</Typography>
          <Typography variant="body2" color="text.secondary">
            Created: {formatDate(ticket.createdAt)}
          </Typography>
          {ticket.resolvedAt && (
            <Typography variant="body2" color="text.secondary">
              Resolved: {formatDate(ticket.resolvedAt)}
            </Typography>
          )}
          {ticket.milestoneIdx !== undefined && (
            <Typography variant="body2" color="text.secondary">
              For Milestone:{" "}
              {contract.milestones?.[ticket.milestoneIdx]?.title ||
                `#${ticket.milestoneIdx + 1}`}
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
      {ticket.status === "pending" && !isPastExpiry && ticket.expiresAt && (
        <Alert severity="info" sx={{ mb: 3 }}>
          This revision request will expire on {formatDate(ticket.expiresAt)}.
        </Alert>
      )}

      {/* Show warning if past expiry */}
      {ticket.status === "pending" && isPastExpiry && ticket.expiresAt && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          This revision request has expired. You may need to submit a new
          request or escalate to resolution.
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          Your action has been processed successfully.
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
          Revision Request Details
        </Typography>
        <Typography variant="body1" sx={{ mb: 2, whiteSpace: "pre-line" }}>
          {ticket.description}
        </Typography>

        {isPaidRevision && (
          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="body2" fontWeight="bold">
              This is a paid revision request.
            </Typography>
            <Typography variant="body2">
              Fee: {formatPrice(ticket.paidFee)}
            </Typography>
            {ticket.escrowTxnId ? (
              <Typography variant="body2">Payment Status: Paid</Typography>
            ) : (
              <Typography variant="body2">
                Payment Status: Pending payment
              </Typography>
            )}
          </Alert>
        )}
      </Box>

      {/* Reference Images */}
      {ticket.referenceImages && ticket.referenceImages.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>
            Reference Images
          </Typography>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
            {ticket.referenceImages.map((url, index) => (
              <Box
                key={index}
                component="a"
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                sx={{
                  display: "block",
                  width: {
                    xs: "100%",
                    sm: "calc(50% - 8px)",
                    md: "calc(33.33% - 11px)",
                  },
                }}
              >
                <Box
                  component="img"
                  src={url}
                  alt={`Reference ${index + 1}`}
                  sx={{
                    width: "100%",
                    height: "auto",
                    maxHeight: 300,
                    objectFit: "contain",
                    borderRadius: 1,
                    border: "1px solid #eee",
                  }}
                />
              </Box>
            ))}
          </Box>
        </Box>
      )}

      {/* Rejection Reason - if rejected */}
      {ticket.status === "rejected" && ticket.artistRejectionReason && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>
            Rejection Reason
          </Typography>
          <Typography variant="body1" sx={{ mb: 2 }}>
            {ticket.artistRejectionReason}
          </Typography>
        </Box>
      )}

      {/* Response Form - Only shown if user is artist and ticket is pending */}
      {canRespond() && (
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
              Accept Revision
            </Button>
            <Button
              variant={response === "reject" ? "contained" : "outlined"}
              color="error"
              onClick={() => setResponse("reject")}
              disabled={isSubmitting}
            >
              Reject Revision
            </Button>
          </Box>

          {response === "accept" && (
            <Alert severity="info" sx={{ mb: 3 }}>
              <Typography variant="body2">
                By accepting this revision request, you are agreeing to make the
                requested changes.
                {isPaidRevision &&
                  " The client will need to pay the revision fee before you can upload your work."}
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
                placeholder="Explain why you are rejecting this revision request"
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

      {/* Payment Button - Only shown if user is client and ticket is accepted and requires payment */}
      {canPay() && (
        <Box sx={{ mb: 3 }}>
          <Divider sx={{ mb: 3 }} />
          <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2 }}>
            Payment Required
          </Typography>

          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="body2">
              This revision requires payment before the artist can begin work.
            </Typography>
            <Typography variant="body2">
              Fee: {formatPrice(ticket.paidFee)}
            </Typography>
          </Alert>

          <Button
            variant="contained"
            color="primary"
            onClick={() => setShowPaymentDialog(true)}
            disabled={isSubmitting}
          >
            Pay Revision Fee
          </Button>
        </Box>
      )}

      {/* Upload Revision Button - Only shown if artist can upload revision */}
      {canUploadRevision() && (
        <Box sx={{ mb: 3 }}>
          <Divider sx={{ mb: 3 }} />
          <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2 }}>
            Next Steps
          </Typography>

          <Typography variant="body2" sx={{ mb: 2 }}>
            You can now upload your revision based on the client's feedback.
          </Typography>

          <Button
            variant="contained"
            color="primary"
            component={Link}
            href={`/dashboard/${userId}/contracts/${contract._id}/uploads/revision/new?ticketId=${ticket._id}`}
          >
            Upload Revision
          </Button>
        </Box>
      )}

      {/* Escalate to Resolution section */}
      {ticket.status !== "paid" && ticket.status !== "cancelled" && (
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

      {/* Payment Dialog */}
      <Dialog
        open={showPaymentDialog}
        onClose={() => setShowPaymentDialog(false)}
      >
        <DialogTitle>Pay Revision Fee</DialogTitle>
        <DialogContent>
          <DialogContentText>
            You are about to pay {formatPrice(ticket.paidFee)} for this
            revision. This amount will be deducted from your wallet balance. Do
            you want to proceed with payment?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowPaymentDialog(false)}>Cancel</Button>
          <Button
            onClick={handlePayment}
            color="primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? <CircularProgress size={24} /> : "Confirm Payment"}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}

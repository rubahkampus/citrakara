// src/components/dashboard/contracts/tickets/ChangeTicketDetails.tsx
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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
} from "@mui/material";
import { useRouter } from "next/navigation";
import { IContract } from "@/lib/db/models/contract.model";
import { IChangeTicket } from "@/lib/db/models/ticket.model";

interface ChangeTicketDetailsProps {
  contract: IContract;
  ticket: IChangeTicket;
  userId: string;
  isArtist: boolean;
  isClient: boolean;
}

export default function ChangeTicketDetails({
  contract,
  ticket,
  userId,
  isArtist,
  isClient,
}: ChangeTicketDetailsProps) {
  const router = useRouter();
  const [response, setResponse] = useState<
    "accept" | "reject" | "propose" | ""
  >("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [proposedFee, setProposedFee] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showEscalateDialog, setShowEscalateDialog] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);

  // Format date for display
  const formatDate = (date?: string | Date) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleString();
  };

  // Format price for display
  const formatPrice = (amount?: number) => {
    if (amount === undefined) return "N/A";
    return new Intl.NumberFormat("en-US").format(amount);
  };

  // Determine if this is a paid change
  const isPaidChange = ticket.isPaidChange;

  // Determine if user can respond to this ticket
  const canRespond = () => {
    // Artist can respond to pendingArtist tickets
    if (isArtist && ticket.status === "pendingArtist") return true;

    // Client can respond to pendingClient tickets (when artist proposes a fee)
    if (isClient && ticket.status === "pendingClient") return true;

    return false;
  };

  // Determine if client can pay for this change
  const canPay = () => {
    return isClient && ticket.status === "pendingClient" && isPaidChange;
  };

  // Handle response submission (for artist or client)
  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      // Validate input
      if (!response) {
        throw new Error("Please select a response option");
      }

      if (response === "reject" && !rejectionReason.trim()) {
        throw new Error("Please provide a reason for rejection");
      }

      if (response === "propose" && (proposedFee <= 0 || isNaN(proposedFee))) {
        throw new Error("Please provide a valid fee amount");
      }

      // Prepare request body
      const requestBody: any = {
        response,
      };

      if (response === "reject") {
        requestBody.reason = rejectionReason;
      } else if (response === "propose") {
        requestBody.paidFee = proposedFee;
      }

      // Submit to API
      const apiResponse = await fetch(
        `/api/contract/${contract._id}/tickets/change/${ticket._id}/respond`,
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
        `/api/contract/${contract._id}/tickets/change/${ticket._id}/pay`,
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
      `/dashboard/${userId}/resolution/new?contractId=${contract._id}&targetType=change&targetId=${ticket._id}`
    );
  };

  // Get status color based on status
  const getStatusColor = (status: string) => {
    switch (status) {
      case "pendingArtist":
        return "primary";
      case "pendingClient":
        return "primary";
      case "acceptedArtist":
        return "success";
      case "forcedAcceptedClient":
      case "forcedAcceptedArtist":
        return "warning";
      case "paid":
        return "success";
      case "rejectedArtist":
      case "rejectedClient":
        return "error";
      case "cancelled":
        return "default";
      default:
        return "default";
    }
  };

  // Get readable status
  const getReadableStatus = (status: string) => {
    switch (status) {
      case "pendingArtist":
        return "Pending Artist Review";
      case "pendingClient":
        return "Pending Client Payment";
      case "acceptedArtist":
        return "Accepted by Artist";
      case "rejectedArtist":
        return "Rejected by Artist";
      case "rejectedClient":
        return "Rejected by Client";
      case "forcedAcceptedClient":
        return "Forced Accept (Client)";
      case "forcedAcceptedArtist":
        return "Forced Accept (Artist)";
      case "paid":
        return "Paid & Applied";
      case "cancelled":
        return "Cancelled";
      default:
        return status;
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
          <Typography variant="h6">Contract Change Request</Typography>
          <Typography variant="body2" color="text.secondary">
            Created: {formatDate(ticket.createdAt)}
          </Typography>
          {ticket.resolvedAt && (
            <Typography variant="body2" color="text.secondary">
              Resolved: {formatDate(ticket.resolvedAt)}
            </Typography>
          )}
          {ticket.contractVersionBefore !== undefined &&
            ticket.contractVersionAfter !== undefined && (
              <Typography variant="body2" color="text.secondary">
                Changed contract from version {ticket.contractVersionBefore} to{" "}
                {ticket.contractVersionAfter}
              </Typography>
            )}
        </Box>
        <Chip
          label={getReadableStatus(ticket.status)}
          color={getStatusColor(ticket.status)}
          variant="outlined"
        />
      </Box>

      {/* Show warning if approaching expiry */}
      {ticket.status === "pendingArtist" &&
        !isPastExpiry &&
        ticket.expiresAt && (
          <Alert severity="info" sx={{ mb: 3 }}>
            This change request will expire on {formatDate(ticket.expiresAt)}.
          </Alert>
        )}

      {/* Show warning if past expiry */}
      {ticket.status === "pendingArtist" &&
        isPastExpiry &&
        ticket.expiresAt && (
          <Alert severity="warning" sx={{ mb: 3 }}>
            This change request has expired. You may need to submit a new
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
          Change Request Reason
        </Typography>
        <Typography variant="body1" sx={{ mb: 2, whiteSpace: "pre-line" }}>
          {ticket.reason}
        </Typography>

        {isPaidChange && (
          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="body2" fontWeight="bold">
              This is a paid change request.
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

      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>
          Requested Changes
        </Typography>

        <Box sx={{ mb: 2 }}>
          {ticket.changeSet.deadlineAt && (
            <Typography variant="body2">
              <strong>Deadline:</strong>{" "}
              {formatDate(ticket.changeSet.deadlineAt)}
            </Typography>
          )}

          {ticket.changeSet.generalDescription && (
            <Box sx={{ mb: 1 }}>
              <Typography variant="body2" fontWeight="bold">
                General Description:
              </Typography>
              <Typography variant="body2" sx={{ whiteSpace: "pre-line" }}>
                {ticket.changeSet.generalDescription}
              </Typography>
            </Box>
          )}

          {ticket.changeSet.generalOptions &&
            Object.keys(ticket.changeSet.generalOptions).length > 0 && (
              <Typography variant="body2">
                <strong>General Options:</strong> Changes requested
              </Typography>
            )}

          {ticket.changeSet.subjectOptions &&
            Object.keys(ticket.changeSet.subjectOptions).length > 0 && (
              <Typography variant="body2">
                <strong>Subject Options:</strong> Changes requested
              </Typography>
            )}
        </Box>
      </Box>

      {/* Reference Images */}
      {ticket.changeSet.referenceImages &&
        ticket.changeSet.referenceImages.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>
              Reference Images
            </Typography>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
              {ticket.changeSet.referenceImages.map((url, index) => (
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

      {/* Artist Response Form - Only shown if user is artist and ticket is pendingArtist */}
      {canRespond() && isArtist && ticket.status === "pendingArtist" && (
        <Box sx={{ mb: 3 }}>
          <Divider sx={{ mb: 3 }} />
          <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2 }}>
            Your Response
          </Typography>

          <Box sx={{ mb: 3, display: "flex", gap: 2, flexWrap: "wrap" }}>
            <Button
              variant={response === "accept" ? "contained" : "outlined"}
              color="success"
              onClick={() => setResponse("accept")}
              disabled={isSubmitting}
            >
              Accept Without Fee
            </Button>
            <Button
              variant={response === "propose" ? "contained" : "outlined"}
              color="primary"
              onClick={() => setResponse("propose")}
              disabled={isSubmitting}
            >
              Propose Fee
            </Button>
            <Button
              variant={response === "reject" ? "contained" : "outlined"}
              color="error"
              onClick={() => setResponse("reject")}
              disabled={isSubmitting}
            >
              Reject Changes
            </Button>
          </Box>

          {response === "accept" && (
            <Alert severity="info" sx={{ mb: 3 }}>
              <Typography variant="body2">
                By accepting this change request, you are agreeing to modify the
                contract as requested without any additional fees.
              </Typography>
            </Alert>
          )}

          {response === "propose" && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="body2" sx={{ mb: 2 }}>
                You can propose a fee for implementing these changes. The client
                will need to pay this fee before the changes are applied.
              </Typography>
              <TextField
                label="Proposed Fee"
                type="number"
                inputProps={{ min: 0, step: 0.01 }}
                fullWidth
                value={proposedFee}
                onChange={(e) => setProposedFee(Number(e.target.value))}
                placeholder="Enter fee amount"
                required
                disabled={isSubmitting}
                sx={{ mb: 2 }}
              />
            </Box>
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
                placeholder="Explain why you are rejecting these changes"
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
              (response === "propose" &&
                (proposedFee <= 0 || isNaN(proposedFee))) ||
              isSubmitting
            }
          >
            {isSubmitting ? <CircularProgress size={24} /> : "Submit Response"}
          </Button>
        </Box>
      )}

      {/* Client Response Form - Only shown if user is client and ticket is pendingClient */}
      {canRespond() && isClient && ticket.status === "pendingClient" && (
        <Box sx={{ mb: 3 }}>
          <Divider sx={{ mb: 3 }} />
          <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2 }}>
            Your Response
          </Typography>

          <Alert severity="info" sx={{ mb: 3 }}>
            <Typography variant="body2" fontWeight="bold">
              The artist has proposed a fee for this change.
            </Typography>
            <Typography variant="body2">
              Fee: {formatPrice(ticket.paidFee)}
            </Typography>
            <Typography variant="body2">
              You can pay this fee to proceed with the changes, or reject the
              proposal.
            </Typography>
          </Alert>

          <Box sx={{ mb: 3, display: "flex", gap: 2 }}>
            <Button
              variant="contained"
              color="success"
              onClick={() => setShowPaymentDialog(true)}
              disabled={isSubmitting}
            >
              Pay Fee
            </Button>
            <Button
              variant={response === "reject" ? "contained" : "outlined"}
              color="error"
              onClick={() => setResponse("reject")}
              disabled={isSubmitting}
            >
              Reject Fee
            </Button>
          </Box>

          {response === "reject" && (
            <Box sx={{ mb: 3 }}>
              <TextField
                label="Reason for Rejection"
                multiline
                rows={3}
                fullWidth
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Explain why you are rejecting this fee"
                required
                disabled={isSubmitting}
                sx={{ mb: 2 }}
              />
              <Button
                variant="contained"
                color="primary"
                onClick={handleSubmit}
                disabled={!rejectionReason.trim() || isSubmitting}
              >
                {isSubmitting ? (
                  <CircularProgress size={24} />
                ) : (
                  "Submit Rejection"
                )}
              </Button>
            </Box>
          )}
        </Box>
      )}

      {/* Escalate to Resolution section */}
      {ticket.status !== "paid" &&
        ticket.status !== "cancelled" &&
        ticket.status !== "acceptedArtist" && (
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
        <DialogTitle>Pay Change Fee</DialogTitle>
        <DialogContent>
          <DialogContentText>
            You are about to pay {formatPrice(ticket.paidFee)} for this contract
            change. This amount will be deducted from your wallet balance. Do
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

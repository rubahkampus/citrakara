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
  Stack,
  Grid,
} from "@mui/material";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm, Controller } from "react-hook-form";
import { IContract } from "@/lib/db/models/contract.model";
import { ICancelTicket } from "@/lib/db/models/ticket.model";
import { axiosClient } from "@/lib/utils/axiosClient";
import ThumbUpIcon from "@mui/icons-material/ThumbUp";
import ThumbDownIcon from "@mui/icons-material/ThumbDown";
import WarningIcon from "@mui/icons-material/Warning";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import InfoIcon from "@mui/icons-material/Info";
import UploadIcon from "@mui/icons-material/Upload";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";

interface CancelTicketDetailsProps {
  contract: IContract;
  ticket: ICancelTicket;
  userId: string;
  isArtist: boolean;
  isClient: boolean;
}

interface FormValues {
  rejectionReason: string;
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showEscalateDialog, setShowEscalateDialog] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormValues>({
    defaultValues: {
      rejectionReason: "",
    },
  });

  // Format date for display
  const formatDate = (date?: string | Date) => {
    if (!date) return "N/A";
    const parsedDate = typeof date === "string" ? new Date(date) : date;
    return parsedDate.toLocaleString();
  };

  // Format price for display
  const formatPrice = (amount?: number) => {
    if (amount === undefined) return "N/A";
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Calculate time remaining until expiry
  const calculateTimeRemaining = () => {
    if (!ticket.expiresAt) return null;

    const expiryDate = new Date(ticket.expiresAt);
    const now = new Date();
    const diffMs = expiryDate.getTime() - now.getTime();

    if (diffMs <= 0) return "Expired";

    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (diffHrs > 24) {
      const days = Math.floor(diffHrs / 24);
      return `${days} day${days > 1 ? "s" : ""} remaining`;
    }

    return `${diffHrs}h ${diffMins}m remaining`;
  };

  // Determine if user can respond to this ticket
  const canRespond = () => {
    // Only the counterparty can respond (not the requester)
    if (ticket.requestedBy === "client" && isArtist) return true;
    if (ticket.requestedBy === "artist" && isClient) return true;
    return false;
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

  // Handle form submission
  const onSubmit = async (data: FormValues) => {
    if (!response) return;

    setIsSubmitting(true);
    setError(null);

    try {
      // Prepare request body
      const requestBody = {
        response,
        reason: response === "reject" ? data.rejectionReason : undefined,
      };

      // Submit to API
      await axiosClient.post(
        `/api/contract/${contract._id}/tickets/cancel/${ticket._id}/respond`,
        requestBody
      );

      setSuccess(true);
      reset();
      setResponse("");

      // Refresh the page after successful submission
      setTimeout(() => {
        router.refresh();
      }, 1000);
    } catch (err: any) {
      setError(
        err.response?.data?.error || err.message || "An unknown error occurred"
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

  // Get status label (more user-friendly than raw status)
  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pending":
        return ticket.requestedBy === "client"
          ? "Pending Artist Response"
          : "Pending Client Response";
      case "accepted":
        return "Accepted";
      case "forcedAccepted":
        return "Accepted (Admin)";
      case "rejected":
        return "Rejected";
      case "disputed":
        return "In Dispute";
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  // Check if ticket is past expiration
  const isPastExpiry =
    ticket.expiresAt && new Date(ticket.expiresAt) < new Date();

  // Check if approaching expiry (less than 12 hours remaining)
  const isApproachingExpiry = () => {
    if (!ticket.expiresAt) return false;

    const expiryDate = new Date(ticket.expiresAt);
    const now = new Date();
    const diffMs = expiryDate.getTime() - now.getTime();
    const diffHrs = diffMs / (1000 * 60 * 60);

    return diffHrs > 0 && diffHrs < 12;
  };

  // Check if user should upload cancellation proof
  const shouldUploadCancellationProof = () => {
    return (
      isArtist &&
      (ticket.status === "accepted" || ticket.status === "forcedAccepted")
    );
  };

  return (
    <Paper elevation={2} sx={{ p: 3 }}>
      {/* Header Section with Status */}
      <Box
        sx={{
          mb: 3,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}
      >
        <Box>
          <Typography variant="h5" gutterBottom fontWeight="medium">
            Cancellation Request
          </Typography>

          <Stack direction="row" spacing={2} alignItems="center" sx={{ mt: 1 }}>
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <CalendarTodayIcon
                sx={{ fontSize: 18, mr: 0.5, color: "text.secondary" }}
              />
              <Typography variant="body2" color="text.secondary">
                Created: {formatDate(ticket.createdAt)}
              </Typography>
            </Box>

            {ticket.resolvedAt && (
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <CheckCircleIcon
                  sx={{ fontSize: 18, mr: 0.5, color: "success.main" }}
                />
                <Typography variant="body2" color="text.secondary">
                  Resolved: {formatDate(ticket.resolvedAt)}
                </Typography>
              </Box>
            )}

            {ticket.status === "pending" && ticket.expiresAt && (
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <AccessTimeIcon
                  sx={{
                    fontSize: 18,
                    mr: 0.5,
                    color: isPastExpiry
                      ? "error.main"
                      : isApproachingExpiry()
                      ? "warning.main"
                      : "info.main",
                  }}
                />
                <Typography
                  variant="body2"
                  color={
                    isPastExpiry
                      ? "error"
                      : isApproachingExpiry()
                      ? "warning.main"
                      : "text.secondary"
                  }
                >
                  {calculateTimeRemaining()}
                </Typography>
              </Box>
            )}
          </Stack>
        </Box>

        <Chip
          label={getStatusLabel(ticket.status)}
          color={getStatusColor(ticket.status)}
          sx={{ fontWeight: "medium", px: 1 }}
        />
      </Box>

      {/* Alert Messages */}
      {ticket.status === "pending" &&
        !isPastExpiry &&
        ticket.expiresAt &&
        isApproachingExpiry() && (
          <Alert severity="warning" sx={{ mb: 3 }} icon={<AccessTimeIcon />}>
            <Typography variant="body2">
              This cancellation request will expire soon - on{" "}
              {formatDate(ticket.expiresAt)}.
              {canRespond() && " Please respond as soon as possible."}
            </Typography>
          </Alert>
        )}

      {ticket.status === "pending" && isPastExpiry && ticket.expiresAt && (
        <Alert severity="error" sx={{ mb: 3 }}>
          <Typography variant="body2">
            This cancellation request has expired on{" "}
            {formatDate(ticket.expiresAt)}. You may need to submit a new request
            or escalate to resolution.
          </Typography>
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }} icon={<CheckCircleIcon />}>
          Your response has been submitted successfully.
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Divider sx={{ mb: 3 }} />

      {/* Main Content Area */}
      <Grid container spacing={3}>
        {/* Left Column: Cancellation Details */}
        <Grid item xs={12} md={7}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom fontWeight="medium">
              Cancellation Details
            </Typography>

            <Paper
              variant="outlined"
              sx={{ p: 2, borderRadius: 1, bgcolor: "background.paper", mb: 2 }}
            >
              <Typography variant="body1" sx={{ whiteSpace: "pre-line" }}>
                {ticket.reason}
              </Typography>
            </Paper>

            <Alert severity="info" sx={{ mb: 2 }} icon={<InfoIcon />}>
              <Typography variant="subtitle2" fontWeight="bold">
                Cancellation Fee:
              </Typography>
              <Typography variant="body2">
                {contract.proposalSnapshot.listingSnapshot.cancelationFee
                  ?.kind === "flat"
                  ? formatPrice(
                      contract.proposalSnapshot.listingSnapshot.cancelationFee
                        .amount
                    )
                  : `${contract.proposalSnapshot.listingSnapshot.cancelationFee?.amount}% of total`}
              </Typography>
              <Typography variant="body2">
                {ticket.requestedBy === "client"
                  ? "Client will pay this fee to the artist even if no work has been started."
                  : "Artist will forfeit this fee to the client if cancelation is accepted."}
              </Typography>
            </Alert>
          </Box>

          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom fontWeight="medium">
              Estimated Financial Outcome
            </Typography>
            <Alert severity="warning" sx={{ mb: 2 }}>
              <Typography variant="subtitle2" fontWeight="bold">
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
              <Typography variant="h6" fontWeight="medium" gutterBottom>
                Your Response
              </Typography>

              <form onSubmit={handleSubmit(onSubmit)}>
                <Box sx={{ mb: 3 }}>
                  <Stack direction="row" spacing={2}>
                    <Button
                      variant={response === "accept" ? "contained" : "outlined"}
                      color="success"
                      onClick={() => setResponse("accept")}
                      disabled={isSubmitting}
                      startIcon={<ThumbUpIcon />}
                      sx={{ flexGrow: 1 }}
                      size="large"
                      type="button"
                    >
                      Accept Cancellation
                    </Button>
                    <Button
                      variant={response === "reject" ? "contained" : "outlined"}
                      color="error"
                      onClick={() => setResponse("reject")}
                      disabled={isSubmitting}
                      startIcon={<ThumbDownIcon />}
                      sx={{ flexGrow: 1 }}
                      size="large"
                      type="button"
                    >
                      Reject Cancellation
                    </Button>
                  </Stack>
                </Box>

                {response === "accept" && (
                  <Alert severity="warning" sx={{ mb: 3 }} icon={<InfoIcon />}>
                    <Typography variant="body2">
                      By accepting this cancellation request, you are agreeing
                      to terminate the contract.
                      {ticket.requestedBy === "client"
                        ? " You (the artist) will need to upload proof of work completed to determine the final payment split."
                        : " The artist will need to upload proof of work completed to determine the final payment split."}
                    </Typography>
                  </Alert>
                )}

                {response === "reject" && (
                  <Box sx={{ mb: 3 }}>
                    <Controller
                      name="rejectionReason"
                      control={control}
                      rules={{
                        required: "Rejection reason is required",
                        minLength: {
                          value: 10,
                          message: "Please provide at least 10 characters",
                        },
                      }}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label="Reason for Rejection"
                          multiline
                          rows={3}
                          fullWidth
                          placeholder="Explain why you are rejecting this cancellation request"
                          required
                          disabled={isSubmitting}
                          error={!!errors.rejectionReason}
                          helperText={errors.rejectionReason?.message}
                          sx={{ mb: 2 }}
                        />
                      )}
                    />
                  </Box>
                )}

                <Button
                  variant="contained"
                  color="primary"
                  type="submit"
                  disabled={
                    !response ||
                    (response === "reject" &&
                      !control._formValues.rejectionReason) ||
                    isSubmitting
                  }
                  sx={{ minWidth: 120 }}
                >
                  {isSubmitting ? (
                    <CircularProgress size={24} />
                  ) : (
                    "Submit Response"
                  )}
                </Button>
              </form>
            </Box>
          )}

          {/* Next Steps section - Only shown when cancellation is accepted */}
          {(ticket.status === "accepted" ||
            ticket.status === "forcedAccepted") && (
            <Box sx={{ mb: 3 }}>
              <Divider sx={{ mb: 3 }} />
              <Typography variant="h6" fontWeight="medium" gutterBottom>
                Next Steps
              </Typography>

              {shouldUploadCancellationProof() ? (
                <Box>
                  <Alert severity="info" sx={{ mb: 2 }} icon={<UploadIcon />}>
                    <Typography variant="body2">
                      As the artist, you need to upload proof of your current
                      work progress to determine the final payment split.
                    </Typography>
                  </Alert>

                  <Button
                    variant="contained"
                    color="primary"
                    component={Link}
                    href={`/dashboard/${userId}/contracts/${contract._id}/uploads/final/new?cancelTicketId=${ticket._id}`}
                    startIcon={<UploadIcon />}
                  >
                    Upload Cancellation Proof
                  </Button>
                </Box>
              ) : (
                <Alert severity="info" sx={{ mb: 2 }}>
                  <Typography variant="body2">
                    The artist needs to upload proof of work completed. Once
                    uploaded, you'll be notified to review it.
                  </Typography>
                </Alert>
              )}
            </Box>
          )}

          {/* Escalate to Resolution section */}
          {ticket.status !== "accepted" &&
            ticket.status !== "forcedAccepted" && (
              <Box sx={{ mt: 4 }}>
                <Divider sx={{ mb: 3 }} />
                <Typography
                  variant="subtitle1"
                  fontWeight="medium"
                  gutterBottom
                >
                  Not satisfied with the process?
                </Typography>
                <Button
                  variant="outlined"
                  color="warning"
                  onClick={handleEscalation}
                  disabled={isSubmitting}
                  startIcon={<WarningIcon />}
                >
                  Escalate to Resolution
                </Button>

                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ display: "block", mt: 1 }}
                >
                  Escalation will be reviewed by our support team to help
                  resolve any issues.
                </Typography>
              </Box>
            )}
        </Grid>

        {/* Right Column: Financial Information */}
        <Grid item xs={12} md={5}>
          <Box sx={{ mt: { xs: 0, md: 4 } }}>
            <Paper
              variant="outlined"
              sx={{
                p: 3,
                borderRadius: 1,
                bgcolor: "background.paper",
              }}
            >
              <Typography variant="h6" gutterBottom fontWeight="medium">
                Contract Information
              </Typography>

              <Stack spacing={2}>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Contract Status
                  </Typography>
                  <Typography variant="body1">{contract.status}</Typography>
                </Box>

                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Total Amount
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {formatPrice(contract.finance.total)}
                  </Typography>
                </Box>

                {contract.deadlineAt && (
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">
                      Deadline
                    </Typography>
                    <Typography variant="body1">
                      {formatDate(contract.deadlineAt)}
                    </Typography>
                  </Box>
                )}

                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Requested By
                  </Typography>
                  <Typography variant="body1">
                    {ticket.requestedBy === "client"
                      ? isClient
                        ? "You (Client)"
                        : "Client"
                      : isArtist
                      ? "You (Artist)"
                      : "Artist"}
                  </Typography>
                </Box>

                {ticket.expiresAt && (
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">
                      Request Expires
                    </Typography>
                    <Typography
                      variant="body1"
                      color={isPastExpiry ? "error.main" : "inherit"}
                    >
                      {formatDate(ticket.expiresAt)}
                    </Typography>
                  </Box>
                )}
              </Stack>

              <Divider sx={{ my: 2 }} />

              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  When a contract is cancelled:
                </Typography>
                <Typography
                  variant="body2"
                  component="ul"
                  sx={{ mt: 1, pl: 2 }}
                >
                  <li>The artist must submit proof of completed work</li>
                  <li>Final payment is based on % of work completed</li>
                  <li>Cancellation fee applies as per contract terms</li>
                  <li>Both parties will be notified of the final outcome</li>
                </Typography>
              </Box>
            </Paper>
          </Box>
        </Grid>
      </Grid>

      {/* Escalation Dialog */}
      <Dialog
        open={showEscalateDialog}
        onClose={() => setShowEscalateDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <WarningIcon sx={{ mr: 1, color: "warning.main" }} />
            Escalate to Resolution?
          </Box>
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Escalating this issue will create a resolution ticket for admin
            review. You will need to provide evidence and explain your position.
            <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
              When should you escalate?
            </Typography>
            <Typography variant="body2">
              • If communication has broken down
              <br />
              • If there's a disagreement about contract terms
              <br />• If you believe the other party isn't fulfilling their
              obligations
            </Typography>
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowEscalateDialog(false)} color="inherit">
            Cancel
          </Button>
          <Button
            onClick={confirmEscalation}
            color="warning"
            variant="contained"
          >
            Proceed to Resolution
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}

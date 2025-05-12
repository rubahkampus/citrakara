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
  Stack,
  Grid,
  Card,
  CardMedia,
  CardContent,
  IconButton,
  Tooltip,
} from "@mui/material";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { IContract } from "@/lib/db/models/contract.model";
import { IRevisionTicket } from "@/lib/db/models/ticket.model";
import { axiosClient } from "@/lib/utils/axiosClient";
import ThumbUpIcon from "@mui/icons-material/ThumbUp";
import ThumbDownIcon from "@mui/icons-material/ThumbDown";
import WarningIcon from "@mui/icons-material/Warning";
import ImageIcon from "@mui/icons-material/Image";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import HistoryIcon from "@mui/icons-material/History";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import UniversalPaymentDialog from "@/components/UniversalPaymentDialog";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import InfoIcon from "@mui/icons-material/Info";
import PaymentIcon from "@mui/icons-material/Payment";
import UploadIcon from "@mui/icons-material/Upload";

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

  // Determine if this is a paid revision
  const isPaidRevision = ticket.paidFee !== undefined && ticket.paidFee > 0;

  // Determine if user can respond to this ticket (artist only)
  const canRespond = () => {
    return isArtist && ticket.status === "pending" && !isPastExpiry;
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
        rejectionReason: response === "reject" ? rejectionReason : undefined,
      };

      // Submit to API using axios
      await axiosClient.post(
        `/api/contract/${contract._id}/tickets/revision/${ticket._id}/respond`,
        requestBody
      );

      setSuccess(true);

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

  // Handle payment submission (for client)
  const handlePayment = async (paymentData: any) => {
    setIsSubmitting(true);
    setError(null);

    try {
      // Submit payment to API using the universal payment data
      await axiosClient.post(
        `/api/contract/${contract._id}/tickets/revision/${ticket._id}/pay`,
        paymentData
      );

      setSuccess(true);
      setShowPaymentDialog(false);

      // Refresh the page after successful payment
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

  // Get status label (more user-friendly than raw status)
  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pending":
        return "Pending Artist Response";
      case "accepted":
        return "Accepted";
      case "forcedAcceptedArtist":
        return "Accepted (Admin)";
      case "paid":
        return "Paid - In Progress";
      case "rejected":
        return "Rejected";
      case "disputed":
        return "In Dispute";
      case "cancelled":
        return "Cancelled";
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
            Revision Request
            {ticket.milestoneIdx !== undefined && (
              <Typography
                component="span"
                variant="subtitle1"
                color="text.secondary"
                sx={{ ml: 1 }}
              >
                for{" "}
                {contract.milestones?.[ticket.milestoneIdx]?.title ||
                  `Milestone #${ticket.milestoneIdx + 1}`}
              </Typography>
            )}
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
              This revision request will expire soon - on{" "}
              {formatDate(ticket.expiresAt)}.
              {isArtist && " Please respond as soon as possible."}
            </Typography>
          </Alert>
        )}

      {ticket.status === "pending" && isPastExpiry && ticket.expiresAt && (
        <Alert severity="error" sx={{ mb: 3 }}>
          <Typography variant="body2">
            This revision request has expired on {formatDate(ticket.expiresAt)}.
            {isClient &&
              " You may need to submit a new request or escalate to resolution."}
          </Typography>
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }} icon={<CheckCircleIcon />}>
          Your action has been processed successfully.
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
        {/* Left Column: Revision Details */}
        <Grid item xs={12} md={7}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom fontWeight="medium">
              Revision Request Details
            </Typography>

            <Paper
              variant="outlined"
              sx={{ p: 2, borderRadius: 1, bgcolor: "background.paper", mb: 2 }}
            >
              <Typography variant="body1" sx={{ whiteSpace: "pre-line" }}>
                {ticket.description}
              </Typography>
            </Paper>

            {isPaidRevision && (
              <Paper
                variant="outlined"
                sx={{
                  p: 2,
                  borderRadius: 1,
                  bgcolor: ticket.escrowTxnId ? "success.50" : "warning.50",
                  borderColor: ticket.escrowTxnId
                    ? "success.200"
                    : "warning.200",
                  mb: 2,
                }}
              >
                <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                  {ticket.escrowTxnId
                    ? "Paid Revision"
                    : "Paid Revision - Payment Required"}
                </Typography>
                <Typography variant="body2">
                  Fee: {formatPrice(ticket.paidFee)}
                </Typography>
                <Typography variant="body2">
                  Payment Status:{" "}
                  {ticket.escrowTxnId ? "Paid" : "Pending payment"}
                </Typography>
              </Paper>
            )}

            {/* Rejection Reason - if rejected */}
            {ticket.status === "rejected" && ticket.artistRejectionReason && (
              <Paper
                variant="outlined"
                sx={{
                  p: 2,
                  borderRadius: 1,
                  bgcolor: "error.50",
                  borderColor: "error.200",
                  mt: 2,
                }}
              >
                <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                  Rejection Reason
                </Typography>
                <Typography variant="body1">
                  {ticket.artistRejectionReason}
                </Typography>
              </Paper>
            )}
          </Box>

          {/* Response Form - Only shown if user is artist and ticket is pending */}
          {canRespond() && (
            <Box sx={{ mb: 3 }}>
              <Divider sx={{ mb: 3 }} />
              <Typography variant="h6" fontWeight="medium" gutterBottom>
                Your Response
              </Typography>

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
                  >
                    Accept Revision
                  </Button>
                  <Button
                    variant={response === "reject" ? "contained" : "outlined"}
                    color="error"
                    onClick={() => setResponse("reject")}
                    disabled={isSubmitting}
                    startIcon={<ThumbDownIcon />}
                    sx={{ flexGrow: 1 }}
                    size="large"
                  >
                    Reject Revision
                  </Button>
                </Stack>
              </Box>

              {response === "accept" && (
                <Alert severity="info" sx={{ mb: 3 }} icon={<InfoIcon />}>
                  <Typography variant="body2">
                    By accepting this revision request, you are agreeing to make
                    the requested changes.
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
                    error={
                      response === "reject" && rejectionReason.trim() === ""
                    }
                    helperText={
                      response === "reject" && rejectionReason.trim() === ""
                        ? "Rejection reason is required"
                        : ""
                    }
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
                sx={{ minWidth: 120 }}
              >
                {isSubmitting ? (
                  <CircularProgress size={24} />
                ) : (
                  "Submit Response"
                )}
              </Button>
            </Box>
          )}

          {/* Payment Button - Only shown if user is client and ticket is accepted and requires payment */}
          {canPay() && (
            <Box sx={{ mb: 3 }}>
              <Divider sx={{ mb: 3 }} />
              <Typography variant="h6" fontWeight="medium" gutterBottom>
                Payment Required
              </Typography>

              <Alert severity="info" sx={{ mb: 2 }} icon={<PaymentIcon />}>
                <Typography variant="body2">
                  This revision requires payment before the artist can begin
                  work.
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
                startIcon={<PaymentIcon />}
              >
                Pay Revision Fee
              </Button>

              {/* Universal Payment Dialog */}
              <UniversalPaymentDialog
                open={showPaymentDialog}
                onClose={() => setShowPaymentDialog(false)}
                title="Pay Revision Fee"
                totalAmount={ticket.paidFee || 0}
                onSubmit={handlePayment}
                description={`Payment for revision request on ${
                  contract.milestones?.[ticket.milestoneIdx || 0]?.title ||
                  "this contract"
                }.`}
              />
            </Box>
          )}

          {/* Upload Revision Button - Only shown if artist can upload revision */}
          {canUploadRevision() && (
            <Box sx={{ mb: 3 }}>
              <Divider sx={{ mb: 3 }} />
              <Typography variant="h6" fontWeight="medium" gutterBottom>
                Next Steps
              </Typography>

              <Alert
                severity="success"
                sx={{ mb: 2 }}
                icon={<CheckCircleIcon />}
              >
                <Typography variant="body2">
                  You can now upload your revision based on the client's
                  feedback.
                </Typography>
              </Alert>

              <Button
                variant="contained"
                color="primary"
                component={Link}
                href={`/dashboard/${userId}/contracts/${contract._id}/uploads/revision/new?ticketId=${ticket._id}`}
                startIcon={<UploadIcon />}
              >
                Upload Revision
              </Button>
            </Box>
          )}

          {/* Escalate to Resolution section */}
          {(isClient || isArtist) &&
            ticket.status !== "paid" &&
            ticket.status !== "cancelled" && (
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

        {/* Right Column: Reference Images */}
        <Grid item xs={12} md={5}>
          {ticket.referenceImages && ticket.referenceImages.length > 0 ? (
            <Box>
              <Typography variant="h6" gutterBottom fontWeight="medium">
                Reference Images
              </Typography>
              <Grid container spacing={2}>
                {ticket.referenceImages.map((url, index) => (
                  <Grid item xs={12} sm={6} key={index}>
                    <Card variant="outlined" sx={{ height: "100%" }}>
                      <CardMedia
                        component="img"
                        image={url}
                        alt={`Reference ${index + 1}`}
                        sx={{
                          height: 200,
                          objectFit: "cover",
                        }}
                        onClick={() => window.open(url, "_blank")}
                      />
                      <CardContent sx={{ p: 1, "&:last-child": { pb: 1 } }}>
                        <Typography variant="caption" color="text.secondary">
                          Reference Image {index + 1}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>
          ) : (
            <Box sx={{ mt: { xs: 0, md: 4 } }}>
              <Paper
                variant="outlined"
                sx={{
                  p: 3,
                  borderRadius: 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  bgcolor: "background.paper",
                  minHeight: 200,
                }}
              >
                <ImageIcon
                  sx={{ fontSize: 48, color: "text.disabled", mb: 2 }}
                />
                <Typography
                  variant="body2"
                  color="text.secondary"
                  align="center"
                >
                  No reference images were provided with this revision request.
                </Typography>
              </Paper>
            </Box>
          )}
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

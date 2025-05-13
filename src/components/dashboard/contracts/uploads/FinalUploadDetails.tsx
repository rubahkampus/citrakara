// src/components/dashboard/contracts/uploads/FinalUploadDetails.tsx
"use client";

import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { axiosClient } from "@/lib/utils/axiosClient";
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
  LinearProgress,
  Tooltip,
  IconButton,
} from "@mui/material";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { IContract } from "@/lib/db/models/contract.model";
import { IFinalUpload } from "@/lib/db/models/upload.model";
import { ICancelTicket } from "@/lib/db/models/ticket.model";
import ThumbUpIcon from "@mui/icons-material/ThumbUp";
import ThumbDownIcon from "@mui/icons-material/ThumbDown";
import WarningIcon from "@mui/icons-material/Warning";
import ImageIcon from "@mui/icons-material/Image";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import InfoIcon from "@mui/icons-material/Info";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";

interface FinalUploadDetailsProps {
  contract: IContract;
  upload: IFinalUpload;
  userId: string;
  isArtist: boolean;
  isClient: boolean;
  canReview: boolean;
  username: string
}

interface ReviewFormData {
  rejectionReason: string;
}

export default function FinalUploadDetails({
  contract,
  upload,
  userId,
  isArtist,
  isClient,
  canReview,
  username
}: FinalUploadDetailsProps) {
  const router = useRouter();
  const [cancelTicket, setCancelTicket] = useState<ICancelTicket | null>(null);
  const [isLoadingTicket, setIsLoadingTicket] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showEscalateDialog, setShowEscalateDialog] = useState(false);
  const [showRejectionDialog, setShowRejectionDialog] = useState(false);

  const isCompleteDelivery = upload.workProgress === 100;
  const isCancellationProof = upload.workProgress < 100;

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ReviewFormData>({
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

  // Calculate time remaining until expiry
  const calculateTimeRemaining = () => {
    if (!upload.expiresAt) return null;

    const expiryDate = new Date(upload.expiresAt);
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

  // Check if approaching expiry (less than 12 hours remaining)
  const isApproachingExpiry = () => {
    if (!upload.expiresAt) return false;

    const expiryDate = new Date(upload.expiresAt);
    const now = new Date();
    const diffMs = expiryDate.getTime() - now.getTime();
    const diffHrs = diffMs / (1000 * 60 * 60);

    return diffHrs > 0 && diffHrs < 12;
  };

  // Check if upload is past deadline
  const isPastExpiry =
    upload.expiresAt && new Date(upload.expiresAt) < new Date();

  // Fetch cancel ticket if this is a cancellation proof
  useEffect(() => {
    if (upload.cancelTicketId) {
      const fetchCancelTicket = async () => {
        setIsLoadingTicket(true);
        try {
          const response = await axiosClient.get(
            `/api/contract/${contract._id}/tickets/cancel/${upload.cancelTicketId}`
          );
          setCancelTicket(response.data);
        } catch (err: any) {
          setError(
            err.response?.data?.error ||
              err.message ||
              "An error occurred while fetching ticket"
          );
        } finally {
          setIsLoadingTicket(false);
        }
      };

      fetchCancelTicket();
    }
  }, [contract._id, upload.cancelTicketId]);

  // Determine status colors
  const getStatusColor = (status: string) => {
    switch (status) {
      case "submitted":
        return "primary";
      case "accepted":
        return "success";
      case "rejected":
        return "error";
      case "forcedAccepted":
        return "warning";
      case "disputed":
        return "error";
      default:
        return "default";
    }
  };

  // Get status label (more user-friendly than raw status)
  const getStatusLabel = (status: string) => {
    switch (status) {
      case "submitted":
        return "Pending Client Review";
      case "accepted":
        return "Accepted";
      case "rejected":
        return "Rejected";
      case "forcedAccepted":
        return "Accepted (Admin)";
      case "disputed":
        return "In Dispute";
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  // Handle accept final delivery
  const handleAccept = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      await axiosClient.post(
        `/api/contract/${contract._id}/uploads/final/${upload._id}`,
        { action: "accept" }
      );

      setSuccess(true);
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

  // Handle reject final delivery
  const onSubmitRejection = async (data: ReviewFormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      await axiosClient.post(
        `/api/contract/${contract._id}/uploads/final/${upload._id}`,
        {
          action: "reject",
          rejectionReason: data.rejectionReason,
        }
      );

      setSuccess(true);
      setShowRejectionDialog(false);

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
      `/${username}/dashboard/contracts/${contract._id}/resolution/new?targetType=final&targetId=${upload._id}`
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
            {isCompleteDelivery ? "Final Delivery" : "Cancellation Proof"}
          </Typography>

          <Stack direction="row" spacing={2} alignItems="center" sx={{ mt: 1 }}>
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <CalendarTodayIcon
                sx={{ fontSize: 18, mr: 0.5, color: "text.secondary" }}
              />
              <Typography variant="body2" color="text.secondary">
                Submitted: {formatDate(upload.createdAt)}
              </Typography>
            </Box>

            {upload.closedAt && (
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <CheckCircleIcon
                  sx={{ fontSize: 18, mr: 0.5, color: "success.main" }}
                />
                <Typography variant="body2" color="text.secondary">
                  Resolved: {formatDate(upload.closedAt)}
                </Typography>
              </Box>
            )}

            {upload.status === "submitted" && upload.expiresAt && (
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

        {upload.status && (
          <Chip
            label={getStatusLabel(upload.status)}
            color={getStatusColor(upload.status)}
            sx={{ fontWeight: "medium", px: 1 }}
          />
        )}
      </Box>

      {/* Alert Messages */}
      {upload.status === "submitted" &&
        !isPastExpiry &&
        upload.expiresAt &&
        isApproachingExpiry() && (
          <Alert severity="warning" sx={{ mb: 3 }} icon={<AccessTimeIcon />}>
            <Typography variant="body2">
              This{" "}
              {isCompleteDelivery ? "final delivery" : "cancellation proof"}{" "}
              review will expire soon - on {formatDate(upload.expiresAt)}.
              {isClient && canReview && " Please respond as soon as possible."}
            </Typography>
          </Alert>
        )}

      {upload.status === "submitted" && isPastExpiry && upload.expiresAt && (
        <Alert severity="error" sx={{ mb: 3 }}>
          <Typography variant="body2">
            This {isCompleteDelivery ? "final delivery" : "cancellation proof"}{" "}
            review has expired on {formatDate(upload.expiresAt)}.
            {isClient && " The delivery may be auto-accepted soon."}
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
        {/* Left Column: Delivery Details */}
        <Grid item xs={12} md={7}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom fontWeight="medium">
              {isCompleteDelivery ? "Final Delivery" : "Cancellation"} Details
            </Typography>

            <Paper
              variant="outlined"
              sx={{ p: 2, borderRadius: 1, bgcolor: "background.paper", mb: 2 }}
            >
              {/* Work Progress */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                  Work Progress
                </Typography>
                <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                  <Typography variant="body2" sx={{ mr: 1 }}>
                    {upload.workProgress}%
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={upload.workProgress}
                    color={isCompleteDelivery ? "success" : "warning"}
                    sx={{ height: 8, borderRadius: 1, flexGrow: 1 }}
                  />
                </Box>

                {isCancellationProof && (
                  <Typography variant="body2" color="text.secondary">
                    This is a partial delivery for cancellation. Payment will be
                    split according to the work percentage and contract policy.
                  </Typography>
                )}
              </Box>

              {/* Delivery Type & Dates */}
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Delivery Type:
                  </Typography>
                  <Typography variant="body1">
                    {isCompleteDelivery
                      ? "Final Delivery"
                      : "Cancellation Proof"}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Review Deadline:
                  </Typography>
                  <Typography variant="body1">
                    {formatDate(upload.expiresAt)}
                  </Typography>
                </Grid>
                {isCancellationProof && upload.cancelTicketId && (
                  <Grid item xs={12}>
                    <Divider sx={{ my: 1 }} />
                    <Box sx={{ mt: 1 }}>
                      <Link
                        href={`/dashboard/${userId}/contracts/${contract._id}/tickets/cancel/${upload.cancelTicketId}`}
                        style={{ textDecoration: "none" }}
                      >
                        <Button
                          variant="outlined"
                          size="small"
                          color="info"
                          sx={{ mt: 1 }}
                        >
                          View Cancellation Request
                        </Button>
                      </Link>
                    </Box>
                  </Grid>
                )}
              </Grid>
            </Paper>

            {/* Cancellation Ticket Details */}
            {isCancellationProof && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                  Cancellation Details
                </Typography>

                <Paper
                  variant="outlined"
                  sx={{ p: 2, borderRadius: 1, bgcolor: "background.paper" }}
                >
                  {isLoadingTicket ? (
                    <Box
                      sx={{ display: "flex", justifyContent: "center", p: 2 }}
                    >
                      <CircularProgress size={24} />
                    </Box>
                  ) : cancelTicket ? (
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">
                          Requested by:
                        </Typography>
                        <Typography variant="body1">
                          {cancelTicket.requestedBy === "client"
                            ? isClient
                              ? "You"
                              : "Client"
                            : isArtist
                            ? "You"
                            : "Artist"}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">
                          Status:
                        </Typography>
                        <Chip
                          label={getStatusLabel(cancelTicket.status)}
                          color={getStatusColor(cancelTicket.status)}
                          size="small"
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <Typography variant="body2" color="text.secondary">
                          Reason:
                        </Typography>
                        <Typography variant="body1" sx={{ mt: 0.5 }}>
                          {cancelTicket.reason}
                        </Typography>
                      </Grid>
                    </Grid>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      Cancellation details not available
                    </Typography>
                  )}
                </Paper>
              </Box>
            )}

            {/* Artist's Description */}
            {upload.description && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                  Artist's Description
                </Typography>
                <Paper
                  variant="outlined"
                  sx={{ p: 2, borderRadius: 1, bgcolor: "background.paper" }}
                >
                  <Typography variant="body1" sx={{ whiteSpace: "pre-line" }}>
                    {upload.description}
                  </Typography>
                </Paper>
              </Box>
            )}

            {/* Contract Terms */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                Contract Information
              </Typography>
              <Paper
                variant="outlined"
                sx={{ p: 2, borderRadius: 1, bgcolor: "background.paper" }}
              >
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Contract Status:
                    </Typography>
                    <Chip
                      label={contract.status}
                      color={
                        contract.status === "active" ? "success" : "default"
                      }
                      size="small"
                      sx={{ mt: 0.5 }}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Created:
                    </Typography>
                    <Typography variant="body1">
                      {formatDate(contract.createdAt)}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Deadline:
                    </Typography>
                    <Typography variant="body1">
                      {formatDate(contract.deadlineAt)}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Grace Period Ends:
                    </Typography>
                    <Typography variant="body1">
                      {formatDate(contract.graceEndsAt)}
                    </Typography>
                  </Grid>
                  {isCancellationProof && (
                    <Grid item xs={12}>
                      <Divider sx={{ my: 1 }} />
                      <Box
                        sx={{ display: "flex", alignItems: "center", mt: 1 }}
                      >
                        <AttachMoneyIcon
                          sx={{ color: "text.secondary", mr: 1 }}
                        />
                        <Typography variant="body2" color="text.secondary">
                          Payment will be split according to the work percentage
                          ({upload.workProgress}%)
                        </Typography>
                      </Box>
                    </Grid>
                  )}
                </Grid>
              </Paper>
            </Box>

            {/* Response Form - Only shown if user is client and can review */}
            {isClient && canReview && upload.status === "submitted" && (
              <Box sx={{ mb: 3 }}>
                <Divider sx={{ mb: 3 }} />
                <Typography variant="h6" fontWeight="medium" gutterBottom>
                  Your Response
                </Typography>

                <Alert severity="info" sx={{ mb: 3 }} icon={<InfoIcon />}>
                  <Typography variant="body2">
                    {isCompleteDelivery
                      ? "By accepting this final delivery, you acknowledge that the artist has completed the project as agreed. The contract will be marked as completed."
                      : "By accepting this cancellation proof, you confirm the work percentage is accurate. The contract will be cancelled and payment will be split accordingly."}
                  </Typography>
                </Alert>

                <Box sx={{ mb: 3 }}>
                  <Stack direction="row" spacing={2}>
                    <Button
                      variant="contained"
                      color="success"
                      onClick={handleAccept}
                      disabled={isSubmitting}
                      startIcon={<ThumbUpIcon />}
                      sx={{ flexGrow: 1 }}
                      size="large"
                    >
                      {isSubmitting && success === false ? (
                        <CircularProgress size={24} color="inherit" />
                      ) : (
                        `Accept ${
                          isCompleteDelivery ? "Final Delivery" : "Cancellation"
                        }`
                      )}
                    </Button>
                    <Button
                      variant="outlined"
                      color="error"
                      onClick={() => setShowRejectionDialog(true)}
                      disabled={isSubmitting}
                      startIcon={<ThumbDownIcon />}
                      sx={{ flexGrow: 1 }}
                      size="large"
                    >
                      Reject
                    </Button>
                  </Stack>
                </Box>
              </Box>
            )}

            {/* Escalate to Resolution section */}
            {(isClient || isArtist) && upload.status && (
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
          </Box>
        </Grid>

        {/* Right Column: Upload Images */}
        <Grid item xs={12} md={5}>
          {upload.images && upload.images.length > 0 ? (
            <Box>
              <Typography variant="h6" gutterBottom fontWeight="medium">
                {isCompleteDelivery ? "Final Delivery" : "Cancellation Proof"}{" "}
                Images
              </Typography>
              <Grid container spacing={2}>
                {upload.images.map((url, index) => (
                  <Grid item xs={12} sm={6} key={index}>
                    <Card variant="outlined" sx={{ height: "100%" }}>
                      <CardMedia
                        component="img"
                        image={url}
                        alt={`Image ${index + 1}`}
                        sx={{
                          height: 200,
                          objectFit: "cover",
                          cursor: "pointer",
                        }}
                        onClick={() => window.open(url, "_blank")}
                      />
                      <CardContent sx={{ p: 1, "&:last-child": { pb: 1 } }}>
                        <Typography variant="caption" color="text.secondary">
                          Image {index + 1}
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
                  No images were uploaded for this delivery.
                </Typography>
              </Paper>
            </Box>
          )}
        </Grid>
      </Grid>

      {/* Rejection Dialog */}
      <Dialog
        open={showRejectionDialog}
        onClose={() => setShowRejectionDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <form onSubmit={handleSubmit(onSubmitRejection)}>
          <DialogTitle>
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <ThumbDownIcon sx={{ mr: 1, color: "error.main" }} />
              Reject{" "}
              {isCompleteDelivery ? "Final Delivery" : "Cancellation Proof"}
            </Box>
          </DialogTitle>
          <DialogContent>
            <DialogContentText>
              Please provide a detailed reason for rejecting this{" "}
              {isCompleteDelivery ? "final delivery" : "cancellation proof"}.
              This will help the artist understand what needs to be improved.
            </DialogContentText>
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
                  autoFocus
                  margin="dense"
                  label="Reason for Rejection"
                  multiline
                  rows={4}
                  fullWidth
                  placeholder="Explain why you are rejecting this delivery..."
                  error={!!errors.rejectionReason}
                  helperText={errors.rejectionReason?.message}
                  sx={{ mt: 2 }}
                />
              )}
            />
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => setShowRejectionDialog(false)}
              color="inherit"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              color="error"
              variant="contained"
              disabled={isSubmitting}
            >
              {isSubmitting ? <CircularProgress size={24} /> : "Reject"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

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

// src/components/dashboard/contracts/uploads/MilestoneUploadDetails.tsx
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
import { IProgressUploadMilestone } from "@/lib/db/models/upload.model";
import { axiosClient } from "@/lib/utils/axiosClient";
import ThumbUpIcon from "@mui/icons-material/ThumbUp";
import ThumbDownIcon from "@mui/icons-material/ThumbDown";
import WarningIcon from "@mui/icons-material/Warning";
import ImageIcon from "@mui/icons-material/Image";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import HistoryIcon from "@mui/icons-material/History";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import InfoIcon from "@mui/icons-material/Info";

interface MilestoneUploadDetailsProps {
  contract: IContract;
  upload: IProgressUploadMilestone;
  userId: string;
  isArtist: boolean;
  isClient: boolean;
  canReview: boolean;
}

export default function MilestoneUploadDetails({
  contract,
  upload,
  userId,
  isArtist,
  isClient,
  canReview,
}: MilestoneUploadDetailsProps) {
  const router = useRouter();
  const [rejectionReason, setRejectionReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showEscalateDialog, setShowEscalateDialog] = useState(false);
  const [showRejectionDialog, setShowRejectionDialog] = useState(false);

  // Format date for display
  const formatDate = (date?: string | Date) => {
    if (!date) return "N/A";
    const parsedDate = typeof date === "string" ? new Date(date) : date;
    return parsedDate.toLocaleString();
  };

  // Get milestone information
  const milestone = contract.milestones?.[upload.milestoneIdx];

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

  // Handle accept milestone
  const handleAccept = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      await axiosClient.post(
        `/api/contract/${contract._id}/uploads/milestone/${upload._id}`,
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

  // Handle reject milestone
  const handleReject = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      // Validate input
      if (!rejectionReason.trim()) {
        throw new Error("Please provide a reason for rejection");
      }

      await axiosClient.post(
        `/api/contract/${contract._id}/uploads/milestone/${upload._id}`,
        {
          action: "reject",
          rejectionReason,
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
      `/dashboard/${userId}/resolution/new?contractId=${contract._id}&targetType=milestone&targetId=${upload._id}`
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
            Milestone Upload
            {milestone && (
              <Typography
                component="span"
                variant="subtitle1"
                color="text.secondary"
                sx={{ ml: 1 }}
              >
                for {milestone.title || `Milestone #${upload.milestoneIdx + 1}`}
              </Typography>
            )}
          </Typography>

          <Stack direction="row" spacing={2} alignItems="center" sx={{ mt: 1 }}>
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <CalendarTodayIcon
                sx={{ fontSize: 18, mr: 0.5, color: "text.secondary" }}
              />
              <Typography variant="body2" color="text.secondary">
                Created: {formatDate(upload.createdAt)}
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

            {upload.isFinal &&
              upload.status === "submitted" &&
              upload.expiresAt && (
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

        {upload.isFinal && upload.status && (
          <Chip
            label={getStatusLabel(upload.status)}
            color={getStatusColor(upload.status)}
            sx={{ fontWeight: "medium", px: 1 }}
          />
        )}
      </Box>

      {/* Alert Messages */}
      {upload.isFinal &&
        upload.status === "submitted" &&
        !isPastExpiry &&
        upload.expiresAt &&
        isApproachingExpiry() && (
          <Alert severity="warning" sx={{ mb: 3 }} icon={<AccessTimeIcon />}>
            <Typography variant="body2">
              This milestone review will expire soon - on{" "}
              {formatDate(upload.expiresAt)}.
              {isClient && canReview && " Please respond as soon as possible."}
            </Typography>
          </Alert>
        )}

      {upload.isFinal &&
        upload.status === "submitted" &&
        isPastExpiry &&
        upload.expiresAt && (
          <Alert severity="error" sx={{ mb: 3 }}>
            <Typography variant="body2">
              This milestone review has expired on{" "}
              {formatDate(upload.expiresAt)}.
              {isClient && " The milestone may be auto-accepted soon."}
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
        {/* Left Column: Milestone Details */}
        <Grid item xs={12} md={7}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom fontWeight="medium">
              Milestone Details
            </Typography>

            <Paper
              variant="outlined"
              sx={{ p: 2, borderRadius: 1, bgcolor: "background.paper", mb: 2 }}
            >
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                  Milestone Information
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Milestone Percentage:
                    </Typography>
                    <Typography variant="body1">
                      {milestone?.percent || 0}%
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Delivery Type:
                    </Typography>
                    <Typography variant="body1">
                      {upload.isFinal ? "Final Delivery" : "Progress Update"}
                    </Typography>
                  </Grid>
                  {upload.isFinal && upload.expiresAt && (
                    <Grid item xs={12}>
                      <Typography variant="body2" color="text.secondary">
                        Review Deadline:
                      </Typography>
                      <Typography variant="body1">
                        {formatDate(upload.expiresAt)}
                      </Typography>
                    </Grid>
                  )}
                </Grid>
              </Box>
            </Paper>

            {/* Artist's Description */}
            {upload.description && (
              <Box sx={{ mb: 2 }}>
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
          </Box>

          {/* Response Form - Only shown if user is client and can review */}
          {isClient &&
            canReview &&
            upload.isFinal &&
            upload.status === "submitted" && (
              <Box sx={{ mb: 3 }}>
                <Divider sx={{ mb: 3 }} />
                <Typography variant="h6" fontWeight="medium" gutterBottom>
                  Your Response
                </Typography>

                <Alert severity="info" sx={{ mb: 3 }} icon={<InfoIcon />}>
                  <Typography variant="body2">
                    By accepting this milestone, you acknowledge that the artist
                    has completed this part of the project as agreed. Once
                    accepted, the milestone cannot be changed.
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
                      Accept Milestone
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
                      Reject Milestone
                    </Button>
                  </Stack>
                </Box>
              </Box>
            )}

          {/* Escalate to Resolution section */}
          {(isClient || isArtist) && upload.isFinal && upload.status && (
            <Box sx={{ mt: 4 }}>
              <Divider sx={{ mb: 3 }} />
              <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
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
                Escalation will be reviewed by our support team to help resolve
                any issues.
              </Typography>
            </Box>
          )}
        </Grid>

        {/* Right Column: Upload Images */}
        <Grid item xs={12} md={5}>
          {upload.images && upload.images.length > 0 ? (
            <Box>
              <Typography variant="h6" gutterBottom fontWeight="medium">
                Milestone Images
              </Typography>
              <Grid container spacing={2}>
                {upload.images.map((url, index) => (
                  <Grid item xs={12} sm={6} key={index}>
                    <Card variant="outlined" sx={{ height: "100%" }}>
                      <CardMedia
                        component="img"
                        image={url}
                        alt={`Milestone ${index + 1}`}
                        sx={{
                          height: 200,
                          objectFit: "cover",
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
                  No images were uploaded for this milestone.
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
        <DialogTitle>
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <ThumbDownIcon sx={{ mr: 1, color: "error.main" }} />
            Reject Milestone
          </Box>
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Please provide a detailed reason for rejecting this milestone. This
            will help the artist understand what needs to be improved.
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            label="Reason for Rejection"
            multiline
            rows={4}
            fullWidth
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            placeholder="Explain why you are rejecting this milestone..."
            required
            error={rejectionReason.trim() === ""}
            helperText={
              rejectionReason.trim() === ""
                ? "Rejection reason is required"
                : ""
            }
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowRejectionDialog(false)} color="inherit">
            Cancel
          </Button>
          <Button
            onClick={handleReject}
            color="error"
            variant="contained"
            disabled={rejectionReason.trim() === "" || isSubmitting}
          >
            {isSubmitting ? <CircularProgress size={24} /> : "Reject Milestone"}
          </Button>
        </DialogActions>
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

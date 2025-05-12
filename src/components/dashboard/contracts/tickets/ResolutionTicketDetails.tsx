// src/components/dashboard/contracts/tickets/ResolutionTicketDetails.tsx
"use client";

import { useState, useEffect } from "react";
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
  Grid,
  Stack,
  Card,
  CardMedia,
  CardContent,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from "@mui/material";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm, Controller } from "react-hook-form";
import { axiosClient } from "@/lib/utils/axiosClient";
import { IResolutionTicket } from "@/lib/db/models/ticket.model";

// Icons
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ImageIcon from "@mui/icons-material/Image";
import InfoIcon from "@mui/icons-material/Info";
import AddPhotoAlternateIcon from "@mui/icons-material/AddPhotoAlternate";
import DeleteIcon from "@mui/icons-material/Delete";
import GavelIcon from "@mui/icons-material/Gavel";
import CancelIcon from "@mui/icons-material/Cancel";

interface ResolutionTicketDetailsProps {
  ticket: IResolutionTicket;
  userId: string;
  contractId: string;
  isArtist: boolean;
  isClient: boolean;
}

interface CounterproofFormValues {
  counterDescription: string;
}

export default function ResolutionTicketDetails({
  ticket,
  userId,
  contractId,
  isArtist,
  isClient,
}: ResolutionTicketDetailsProps) {
  const router = useRouter();
  const [files, setFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<string>("");

  // Determine if user is the submitter or counterparty
  const isSubmitter = ticket.submittedById.toString() === userId;
  const isCounterparty =
    !isSubmitter &&
    ((ticket.submittedBy === "client" && isArtist) ||
      (ticket.submittedBy === "artist" && isClient));

  // React Hook Form setup for counterproof submission
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<CounterproofFormValues>({
    defaultValues: {
      counterDescription: "",
    },
  });

  // Calculate and update time remaining until counterproof deadline
  useEffect(() => {
    if (ticket && ticket.counterExpiresAt && ticket.status === "open") {
      const updateTimeRemaining = () => {
        const now = new Date();
        const expiresAt = new Date(ticket.counterExpiresAt);
        const diff = expiresAt.getTime() - now.getTime();

        if (diff <= 0) {
          setTimeRemaining("Expired");
          return;
        }

        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        setTimeRemaining(`${hours}h ${minutes}m remaining`);
      };

      updateTimeRemaining();
      const interval = setInterval(updateTimeRemaining, 60000); // Update every minute

      return () => clearInterval(interval);
    }
  }, [ticket]);

  // Format date for display
  const formatDate = (date?: string | Date) => {
    if (!date) return "N/A";
    const parsedDate = typeof date === "string" ? new Date(date) : date;
    return parsedDate.toLocaleString();
  };

  // Handle file input change for counterproof
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);

      // Enforce the 5 file limit
      const totalFiles = [...files, ...selectedFiles];
      const limitedFiles = totalFiles.slice(0, 5);

      if (totalFiles.length > 5) {
        setError("Maximum 5 images allowed. Only the first 5 will be used.");
        setTimeout(() => setError(null), 3000);
      }

      setFiles(limitedFiles);

      // Create and set preview URLs
      const newPreviewUrls = limitedFiles.map((file) =>
        URL.createObjectURL(file)
      );

      // Revoke previous URLs to avoid memory leaks
      previewUrls.forEach((url) => URL.revokeObjectURL(url));
      setPreviewUrls(newPreviewUrls);
    }
  };

  // Remove a file and its preview
  const removeFile = (index: number) => {
    URL.revokeObjectURL(previewUrls[index]);
    setFiles(files.filter((_, i) => i !== index));
    setPreviewUrls(previewUrls.filter((_, i) => i !== index));
  };

  // Submit counterproof
  const onSubmitCounterproof = async (data: CounterproofFormValues) => {
    setIsSubmitting(true);
    setError(null);

    try {
      // Create FormData
      const formData = new FormData();
      formData.append("counterDescription", data.counterDescription);

      // Add counterproof images
      files.forEach((file) => {
        formData.append("counterProofImages[]", file);
      });

      // Submit to API using axios
      await axiosClient.post(
        `/api/resolution/${ticket._id}/counterproof`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      setSuccess(true);

      // Refresh the page after successful submission
      setTimeout(() => {
        router.refresh();
      }, 1500);
    } catch (err: any) {
      setError(
        err.response?.data?.error || err.message || "An unknown error occurred"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle cancellation of ticket (only for submitter)
  const handleCancelTicket = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      await axiosClient.post(`/api/resolution/${ticket._id}/cancel`);
      setSuccess(true);
      setShowCancelDialog(false);

      // Refresh the page after successful cancellation
      setTimeout(() => {
        router.refresh();
      }, 1500);
    } catch (err: any) {
      setError(
        err.response?.data?.error || err.message || "An unknown error occurred"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Determine if user can submit counterproof
  const canSubmitCounterproof = () => {
    return (
      isCounterparty &&
      ticket.status === "open" &&
      !ticket.counterDescription &&
      new Date(ticket.counterExpiresAt) > new Date()
    );
  };

  // Determine if user can cancel the ticket
  const canCancelTicket = () => {
    return (
      isSubmitter &&
      (ticket.status === "open" || ticket.status === "awaitingReview")
    );
  };

  // Check if past counterproof deadline
  const isPastCounterDeadline =
    ticket.status === "open" && new Date(ticket.counterExpiresAt) < new Date();

  // Get status color based on status
  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "primary";
      case "awaitingReview":
        return "warning";
      case "resolved":
        return ticket.decision === "favorClient"
          ? isClient
            ? "success"
            : "error"
          : isArtist
          ? "success"
          : "error";
      case "cancelled":
        return "default";
      default:
        return "default";
    }
  };

  // Get readable status
  const getReadableStatus = (status: string) => {
    switch (status) {
      case "open":
        return "Open - Awaiting Counterproof";
      case "awaitingReview":
        return "Awaiting Admin Review";
      case "resolved":
        return ticket.decision === "favorClient"
          ? "Resolved in Favor of Client"
          : "Resolved in Favor of Artist";
      case "cancelled":
        return "Cancelled";
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  // Get target type display name
  const getTargetTypeDisplay = (type: string) => {
    switch (type) {
      case "cancel":
        return "Cancellation Request";
      case "revision":
        return "Revision Request";
      case "final":
        return "Final Delivery";
      case "milestone":
        return "Milestone Upload";
      default:
        return type.charAt(0).toUpperCase() + type.slice(1);
    }
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
            Resolution Request: {getTargetTypeDisplay(ticket.targetType)}
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

            {ticket.status === "open" && (
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <AccessTimeIcon
                  sx={{
                    fontSize: 18,
                    mr: 0.5,
                    color: isPastCounterDeadline ? "error.main" : "info.main",
                  }}
                />
                <Typography
                  variant="body2"
                  color={isPastCounterDeadline ? "error" : "text.secondary"}
                >
                  Counterproof:{" "}
                  {isPastCounterDeadline ? "Expired" : timeRemaining}
                </Typography>
              </Box>
            )}

            {ticket.status === "resolved" && ticket.resolvedAt && (
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <GavelIcon
                  sx={{ fontSize: 18, mr: 0.5, color: "success.main" }}
                />
                <Typography variant="body2" color="text.secondary">
                  Resolved: {formatDate(ticket.resolvedAt)}
                </Typography>
              </Box>
            )}
          </Stack>
        </Box>

        <Chip
          label={getReadableStatus(ticket.status)}
          color={getStatusColor(ticket.status)}
          sx={{ fontWeight: "medium", px: 1 }}
        />
      </Box>

      {/* Alert Messages */}
      {ticket.status === "open" && !isPastCounterDeadline && isCounterparty && (
        <Alert severity="info" sx={{ mb: 3 }} icon={<AccessTimeIcon />}>
          <Typography variant="body2">
            You have until {formatDate(ticket.counterExpiresAt)} to submit your
            counterproof. After this deadline, the resolution will proceed to
            admin review.
          </Typography>
        </Alert>
      )}

      {ticket.status === "open" && isPastCounterDeadline && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          <Typography variant="body2">
            The counterproof deadline has passed. This resolution will now go to
            admin review.
          </Typography>
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }} icon={<CheckCircleIcon />}>
          <Typography variant="body2">
            {isSubmitting
              ? "Processing your request..."
              : "Your request has been processed successfully."}
          </Typography>
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
        {/* Left Column: Resolution Details */}
        <Grid item xs={12} md={7}>
          {/* Submitter's Position */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom fontWeight="medium">
              {isSubmitter
                ? "Your"
                : ticket.submittedBy === "client"
                ? "Client's"
                : "Artist's"}{" "}
              Position
            </Typography>

            <Paper
              variant="outlined"
              sx={{ p: 2, borderRadius: 1, bgcolor: "background.paper", mb: 2 }}
            >
              <Typography variant="body1" sx={{ whiteSpace: "pre-line" }}>
                {ticket.description}
              </Typography>
            </Paper>

            {/* Proof Images */}
            {ticket.proofImages && ticket.proofImages.length > 0 && (
              <Grid container spacing={2}>
                {ticket.proofImages.map((url, index) => (
                  <Grid item xs={12} sm={6} key={index}>
                    <Card variant="outlined" sx={{ height: "100%" }}>
                      <CardMedia
                        component="img"
                        image={url}
                        alt={`Evidence ${index + 1}`}
                        sx={{
                          height: 200,
                          objectFit: "cover",
                        }}
                        onClick={() => window.open(url, "_blank")}
                      />
                      <CardContent sx={{ p: 1, "&:last-child": { pb: 1 } }}>
                        <Typography variant="caption" color="text.secondary">
                          Evidence Image {index + 1}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </Box>

          {/* Counterparty's Response - only shown if provided */}
          {ticket.counterDescription && (
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" gutterBottom fontWeight="medium">
                {isCounterparty
                  ? "Your"
                  : ticket.counterparty === "client"
                  ? "Client's"
                  : "Artist's"}{" "}
                Response
              </Typography>

              <Paper
                variant="outlined"
                sx={{
                  p: 2,
                  borderRadius: 1,
                  bgcolor: "background.paper",
                  mb: 2,
                }}
              >
                <Typography variant="body1" sx={{ whiteSpace: "pre-line" }}>
                  {ticket.counterDescription}
                </Typography>
              </Paper>

              {/* Counterproof Images */}
              {ticket.counterProofImages &&
                ticket.counterProofImages.length > 0 && (
                  <Grid container spacing={2}>
                    {ticket.counterProofImages.map((url, index) => (
                      <Grid item xs={12} sm={6} key={index}>
                        <Card variant="outlined" sx={{ height: "100%" }}>
                          <CardMedia
                            component="img"
                            image={url}
                            alt={`Counter Evidence ${index + 1}`}
                            sx={{
                              height: 200,
                              objectFit: "cover",
                            }}
                            onClick={() => window.open(url, "_blank")}
                          />
                          <CardContent sx={{ p: 1, "&:last-child": { pb: 1 } }}>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              Counter Evidence Image {index + 1}
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                )}
            </Box>
          )}

          {/* Admin Decision - only shown if resolved */}
          {ticket.status === "resolved" && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom fontWeight="medium">
                Admin Decision
              </Typography>

              <Paper
                variant="outlined"
                sx={{
                  p: 2,
                  borderRadius: 1,
                  bgcolor:
                    ticket.decision === "favorClient"
                      ? isClient
                        ? "success.50"
                        : "error.50"
                      : isArtist
                      ? "success.50"
                      : "error.50",
                  borderColor:
                    ticket.decision === "favorClient"
                      ? isClient
                        ? "success.200"
                        : "error.200"
                      : isArtist
                      ? "success.200"
                      : "error.200",
                  mb: 2,
                }}
              >
                <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                  Decision:{" "}
                  {ticket.decision === "favorClient"
                    ? "In favor of the client"
                    : "In favor of the artist"}
                </Typography>
                {ticket.resolutionNote && (
                  <Typography variant="body1" sx={{ whiteSpace: "pre-line" }}>
                    {ticket.resolutionNote}
                  </Typography>
                )}
              </Paper>
            </Box>
          )}

          {/* Status information: Next steps based on ticket status */}
          {ticket.status === "open" &&
            !canSubmitCounterproof() &&
            !isSubmitter && (
              <Box sx={{ mb: 3 }}>
                <Alert severity="info" sx={{ mb: 2 }} icon={<InfoIcon />}>
                  <Typography variant="body2">
                    Waiting for{" "}
                    {ticket.counterparty === "client" ? "client" : "artist"} to
                    provide counterproof. If no response is received by{" "}
                    {formatDate(ticket.counterExpiresAt)}, this resolution will
                    automatically proceed to admin review.
                  </Typography>
                </Alert>
              </Box>
            )}

          {ticket.status === "awaitingReview" && (
            <Box sx={{ mb: 3 }}>
              <Alert severity="info" sx={{ mb: 2 }} icon={<InfoIcon />}>
                <Typography variant="body2">
                  This resolution is now with our admin team for review. You'll
                  be notified once a decision has been made.
                </Typography>
              </Alert>
            </Box>
          )}

          {/* Cancel button for submitter if ticket is still open or awaiting review */}
          {canCancelTicket() && (
            <Box sx={{ mt: 4 }}>
              <Divider sx={{ mb: 3 }} />
              <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
                Cancel this resolution request
              </Typography>
              <Button
                variant="outlined"
                color="error"
                startIcon={<CancelIcon />}
                onClick={() => setShowCancelDialog(true)}
                disabled={isSubmitting}
              >
                Cancel Resolution Request
              </Button>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: "block", mt: 1 }}
              >
                Only use this if the issue has been resolved directly between
                you and the {ticket.counterparty}.
              </Typography>
            </Box>
          )}
        </Grid>

        {/* Right Column: Counterproof Submission Form or Target Item Details */}
        <Grid item xs={12} md={5}>
          {/* Counterproof Submission Form - Only shown for counterparty if still open and no counterproof yet */}
          {canSubmitCounterproof() ? (
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom fontWeight="medium">
                Submit Your Response
              </Typography>

              <Alert severity="info" sx={{ mb: 3 }} icon={<InfoIcon />}>
                <Typography variant="body2">
                  Please provide your perspective on this issue. You have until{" "}
                  {formatDate(ticket.counterExpiresAt)} to respond.
                </Typography>
              </Alert>

              <form onSubmit={handleSubmit(onSubmitCounterproof)}>
                <Box sx={{ mb: 3 }}>
                  <Controller
                    name="counterDescription"
                    control={control}
                    rules={{
                      required: "Your response is required",
                      minLength: {
                        value: 20,
                        message: "Description must be at least 20 characters",
                      },
                    }}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Your Response"
                        multiline
                        rows={4}
                        fullWidth
                        placeholder="Provide your side of the story..."
                        error={!!errors.counterDescription}
                        helperText={errors.counterDescription?.message}
                        disabled={isSubmitting}
                        sx={{ mb: 2 }}
                      />
                    )}
                  />
                </Box>

                {/* Proof images upload */}
                <Box sx={{ mb: 3 }}>
                  <Typography
                    variant="subtitle2"
                    gutterBottom
                    fontWeight="medium"
                  >
                    Supporting Evidence
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    gutterBottom
                  >
                    Upload images to support your position (max 5 images)
                  </Typography>

                  <Button
                    component="label"
                    variant="outlined"
                    startIcon={<AddPhotoAlternateIcon />}
                    disabled={isSubmitting || files.length >= 5}
                    sx={{ mt: 1 }}
                  >
                    Add Images
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleFileChange}
                      style={{ display: "none" }}
                      disabled={isSubmitting || files.length >= 5}
                    />
                  </Button>
                  {files.length > 0 && (
                    <Typography
                      variant="caption"
                      display="block"
                      sx={{ mt: 1 }}
                    >
                      {files.length}/5 images selected
                    </Typography>
                  )}

                  {previewUrls.length > 0 && (
                    <Grid container spacing={1} sx={{ mt: 1 }}>
                      {previewUrls.map((url, index) => (
                        <Grid item xs={6} key={index}>
                          <Box sx={{ position: "relative" }}>
                            <Box
                              component="img"
                              src={url}
                              alt={`Evidence Preview ${index + 1}`}
                              sx={{
                                width: "100%",
                                height: 100,
                                objectFit: "cover",
                                borderRadius: 1,
                              }}
                            />
                            <IconButton
                              size="small"
                              onClick={() => removeFile(index)}
                              sx={{
                                position: "absolute",
                                top: 4,
                                right: 4,
                                bgcolor: "rgba(255,255,255,0.7)",
                                "&:hover": {
                                  bgcolor: "rgba(255,255,255,0.9)",
                                },
                              }}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        </Grid>
                      ))}
                    </Grid>
                  )}
                </Box>

                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <CircularProgress size={24} />
                  ) : (
                    "Submit Response"
                  )}
                </Button>
              </form>
            </Box>
          ) : (
            /* Target Item Information */
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom fontWeight="medium">
                Resolution Information
              </Typography>

              <Paper
                variant="outlined"
                sx={{
                  p: 2,
                  borderRadius: 1,
                  bgcolor: "background.paper",
                  mb: 2,
                }}
              >
                <Stack spacing={2}>
                  <Box>
                    <Typography variant="subtitle2" gutterBottom>
                      Type
                    </Typography>
                    <Typography variant="body2">
                      {getTargetTypeDisplay(ticket.targetType)}
                    </Typography>
                  </Box>

                  <Box>
                    <Typography variant="subtitle2" gutterBottom>
                      Submitted By
                    </Typography>
                    <Typography variant="body2">
                      {isSubmitter
                        ? "You"
                        : ticket.submittedBy === "client"
                        ? "Client"
                        : "Artist"}
                    </Typography>
                  </Box>

                  <Box>
                    <Typography variant="subtitle2" gutterBottom>
                      Counterparty
                    </Typography>
                    <Typography variant="body2">
                      {isCounterparty
                        ? "You"
                        : ticket.counterparty === "client"
                        ? "Client"
                        : "Artist"}
                    </Typography>
                  </Box>

                  <Box>
                    <Typography variant="subtitle2" gutterBottom>
                      Contract
                    </Typography>
                    <Button
                      variant="text"
                      size="small"
                      component={Link}
                      href={`/dashboard/${userId}/contracts/${contractId}`}
                    >
                      View Contract
                    </Button>
                  </Box>

                  <Box>
                    <Typography variant="subtitle2" gutterBottom>
                      Disputed Item
                    </Typography>
                    <Button
                      variant="text"
                      size="small"
                      component={Link}
                      href={`/dashboard/${userId}/contracts/${contractId}/${ticket.targetType}s/${ticket.targetId}`}
                    >
                      View {getTargetTypeDisplay(ticket.targetType)}
                    </Button>
                  </Box>
                </Stack>
              </Paper>

              <Alert
                severity={ticket.status === "resolved" ? "info" : "warning"}
                sx={{ mb: 2 }}
              >
                <Typography variant="body2">
                  {ticket.status === "resolved"
                    ? "This resolution has been decided by our admin team."
                    : ticket.status === "cancelled"
                    ? "This resolution request has been cancelled."
                    : ticket.status === "awaitingReview"
                    ? "This resolution is currently under review by our admin team. You'll be notified of the decision once it's made."
                    : "Resolution requests help resolve disagreements between clients and artists with the assistance of our admin team."}
                </Typography>
              </Alert>
            </Box>
          )}
        </Grid>
      </Grid>

      {/* Cancel Resolution Dialog */}
      <Dialog
        open={showCancelDialog}
        onClose={() => setShowCancelDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <CancelIcon sx={{ mr: 1, color: "error.main" }} />
            Cancel Resolution Request?
          </Box>
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to cancel this resolution request? This should
            only be done if:
            <ul>
              <li>
                The issue has been resolved directly between you and the{" "}
                {ticket.counterparty}
              </li>
              <li>You no longer wish to pursue this resolution</li>
            </ul>
            This action cannot be undone. If needed, you'll have to create a new
            resolution ticket.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCancelDialog(false)} color="inherit">
            No, Keep It
          </Button>
          <Button
            onClick={handleCancelTicket}
            color="error"
            variant="contained"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <CircularProgress size={24} />
            ) : (
              "Yes, Cancel Resolution"
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}

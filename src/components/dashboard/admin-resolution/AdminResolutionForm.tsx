// src/components/dashboard/admin-resolution/AdminResolutionForm.tsx
"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import {
  Box,
  Paper,
  Typography,
  Button,
  Alert,
  CircularProgress,
  Divider,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
  TextField,
  Grid,
  Card,
  CardMedia,
  CardContent,
  Chip,
  Stack,
  Tabs,
  Tab,
  IconButton,
  Tooltip,
} from "@mui/material";
import { axiosClient } from "@/lib/utils/axiosClient";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import GavelIcon from "@mui/icons-material/Gavel";
import WarningIcon from "@mui/icons-material/Warning";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import ZoomInIcon from "@mui/icons-material/ZoomIn";
import Link from "next/link";

interface AdminResolutionFormProps {
  ticket: any;
  contract: any;
  userId: string;
}

interface FormValues {
  decision: "favorClient" | "favorArtist" | "";
  resolutionNote: string;
}

export default function AdminResolutionForm({
  ticket,
  contract,
  userId,
}: AdminResolutionFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [expandedImage, setExpandedImage] = useState<string | null>(null);

  // React Hook Form setup
  const {
    control,
    handleSubmit,
    watch,
    formState: { errors, isValid },
  } = useForm<FormValues>({
    defaultValues: {
      decision: "",
      resolutionNote: "",
    },
    mode: "onChange",
  });

  const watchedDecision = watch("decision");

  // Determine if the ticket is ready for admin resolution
  const canResolve = useMemo(
    () => ticket.status === "awaitingReview",
    [ticket.status]
  );

  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  // Format date for display
  const formatDate = (date?: string | Date) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleString();
  };

  // Get target type display name
  const getTargetTypeDisplay = (type: string) => {
    switch (type) {
      case "cancelTicket":
        return "Cancellation Request";
      case "revisionTicket":
        return "Revision Request";
      case "changeTicket":
        return "Change Request";
      case "finalUpload":
        return "Final Delivery";
      case "progressMilestoneUpload":
        return "Milestone Progress Upload";
      case "revisionUpload":
        return "Revision Upload";
      default:
        return type.charAt(0).toUpperCase() + type.slice(1);
    }
  };

  // Get target URL for viewing the disputed item
  const getTargetUrl = () => {
    switch (ticket.targetType) {
      case "cancelTicket":
      case "revisionTicket":
      case "changeTicket":
        return `/dashboard/${userId}/contracts/${ticket.contractId}/tickets/${ticket.targetType}/${ticket.targetId}`;
      case "finalUpload":
        return `/dashboard/${userId}/contracts/${ticket.contractId}/uploads/final/${ticket.targetId}`;
      case "progressMilestoneUpload":
        return `/dashboard/${userId}/contracts/${ticket.contractId}/uploads/milestone/${ticket.targetId}`;
      case "revisionUpload":
        return `/dashboard/${userId}/contracts/${ticket.contractId}/uploads/revision/${ticket.targetId}`;
      default:
        return `/dashboard/${userId}/contracts/${ticket.contractId}`;
    }
  };

  // Handle form submission
  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    setError(null);

    try {
      await axiosClient.post(`/api/admin/resolution/${ticket._id}/resolve`, {
        decision: data.decision,
        resolutionNote: data.resolutionNote,
      });

      setSuccess(true);

      // Redirect after successful submission
      setTimeout(() => {
        router.push(`/dashboard/${userId}/admin/resolutions`);
        router.refresh();
      }, 2000);
    } catch (err: any) {
      setError(
        err.response?.data?.error || err.message || "An unknown error occurred"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper to generate a consequence message based on the target type and decision
  const getDecisionConsequenceMessage = (decision: string) => {
    if (!decision) return "";

    // Base message based on who is favored
    const favoredParty = decision === "favorClient" ? "Client" : "Artist";
    let baseMessage = `This decision will rule in favor of the ${favoredParty}.`;

    // Additional details based on target type
    switch (ticket.targetType) {
      case "cancel":
        return `${baseMessage} ${
          decision === "favorClient"
            ? "The cancellation will be accepted and the contract will be marked as cancelled with appropriate compensation based on work completed."
            : "The cancellation will be rejected and the contract will continue."
        }`;

      case "revision":
        return `${baseMessage} ${
          decision === "favorClient"
            ? "The artist will be required to make the requested revisions."
            : "The artist will not be required to make the requested revisions."
        }`;

      case "change":
        return `${baseMessage} ${
          decision === "favorClient"
            ? "The requested changes to the contract will be applied without additional fees."
            : "The changes will not be required or the artist's proposed fees will be enforced."
        }`;

      case "final":
        return `${baseMessage} ${
          decision === "favorClient"
            ? "The final delivery will be rejected and the artist must make adjustments."
            : "The final delivery will be forcibly accepted and the contract marked as completed."
        }`;

      case "milestone":
      case "progressMilestone":
        return `${baseMessage} ${
          decision === "favorClient"
            ? "The milestone upload will be rejected and the artist must address the issues."
            : "The milestone will be forcibly accepted and the contract will progress to the next phase."
        }`;

      case "revisionUpload":
        return `${baseMessage} ${
          decision === "favorClient"
            ? "The revision upload will be rejected and the artist must address the issues."
            : "The revision will be forcibly accepted."
        }`;

      default:
        return baseMessage;
    }
  };

  return (
    <Box>
      {/* Status alerts */}
      {!canResolve && (
        <Alert severity="info" sx={{ mb: 3 }}>
          {ticket.status === "open"
            ? "This ticket is still open for counterproof submission. You can review it, but you cannot make a decision yet."
            : ticket.status === "resolved"
            ? "This ticket has already been resolved."
            : "This ticket cannot be resolved at this time."}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }} icon={<CheckCircleIcon />}>
          Resolution submitted successfully. Redirecting...
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Ticket information section */}
      <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            mb: 2,
          }}
        >
          <Typography variant="h6" fontWeight="medium">
            Resolution Ticket Details
          </Typography>
          <Chip
            label={ticket.status.toUpperCase()}
            color={
              ticket.status === "open"
                ? "primary"
                : ticket.status === "awaitingReview"
                ? "warning"
                : ticket.status === "resolved"
                ? "success"
                : "default"
            }
            icon={
              ticket.status === "resolved" ? (
                <CheckCircleIcon />
              ) : ticket.status === "cancelled" ? (
                <CancelIcon />
              ) : ticket.status === "awaitingReview" ? (
                <GavelIcon />
              ) : undefined
            }
          />
        </Box>

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Stack spacing={2}>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Target Type
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  {getTargetTypeDisplay(ticket.targetType)}
                </Typography>
              </Box>

              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Submitted By
                </Typography>
                <Typography variant="body1">
                  {ticket.submittedBy === "client" ? "Client" : "Artist"}
                </Typography>
              </Box>

              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Counterparty
                </Typography>
                <Typography variant="body1">
                  {ticket.counterparty === "client" ? "Client" : "Artist"}
                </Typography>
              </Box>
            </Stack>
          </Grid>

          <Grid item xs={12} md={6}>
            <Stack spacing={2}>
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <CalendarTodayIcon
                  sx={{ fontSize: 18, mr: 1, color: "text.secondary" }}
                />
                <Typography variant="subtitle2" color="text.secondary">
                  Created
                </Typography>
                <Typography variant="body1" sx={{ ml: 1 }}>
                  {formatDate(ticket.createdAt)}
                </Typography>
              </Box>

              {ticket.status === "open" && (
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  <CalendarTodayIcon
                    sx={{ fontSize: 18, mr: 1, color: "text.secondary" }}
                  />
                  <Typography variant="subtitle2" color="text.secondary">
                    Counterproof Deadline
                  </Typography>
                  <Typography variant="body1" sx={{ ml: 1 }}>
                    {formatDate(ticket.counterExpiresAt)}
                  </Typography>
                </Box>
              )}

              {ticket.status === "resolved" && (
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  <GavelIcon
                    sx={{ fontSize: 18, mr: 1, color: "text.secondary" }}
                  />
                  <Typography variant="subtitle2" color="text.secondary">
                    Resolved On
                  </Typography>
                  <Typography variant="body1" sx={{ ml: 1 }}>
                    {formatDate(ticket.resolvedAt)}
                  </Typography>
                </Box>
              )}
            </Stack>
          </Grid>
        </Grid>

        <Box sx={{ mt: 2 }}>
          <Button
            component={Link}
            href={`/dashboard/${userId}/contracts/${ticket.contractId}`}
            variant="text"
            size="small"
          >
            View Contract
          </Button>
          <Button
            component={Link}
            href={getTargetUrl()}
            variant="text"
            size="small"
            sx={{ ml: 2 }}
          >
            View Disputed Item
          </Button>
        </Box>
      </Paper>

      {/* Evidence comparison section */}
      <Box sx={{ mb: 4 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          aria-label="evidence tabs"
          sx={{ mb: 3 }}
        >
          <Tab
            label={`${
              ticket.submittedBy === "client" ? "Client" : "Artist"
            }'s Evidence`}
            id="tab-0"
            aria-controls="tabpanel-0"
          />
          <Tab
            label={`${
              ticket.counterparty === "client" ? "Client" : "Artist"
            }'s Counterevidence`}
            id="tab-1"
            aria-controls="tabpanel-1"
          />
          <Tab label="Side by Side" id="tab-2" aria-controls="tabpanel-2" />
        </Tabs>

        {/* Original Evidence Tab */}
        <div
          role="tabpanel"
          hidden={activeTab !== 0}
          id="tabpanel-0"
          aria-labelledby="tab-0"
        >
          {activeTab === 0 && (
            <Paper elevation={2} sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight="medium" gutterBottom>
                {ticket.submittedBy === "client" ? "Client" : "Artist"}'s
                Evidence
              </Typography>

              <Typography
                variant="body1"
                paragraph
                sx={{ whiteSpace: "pre-line" }}
              >
                {ticket.description}
              </Typography>

              {ticket.proofImages && ticket.proofImages.length > 0 ? (
                <Box sx={{ mt: 3 }}>
                  <Typography
                    variant="subtitle2"
                    fontWeight="medium"
                    gutterBottom
                  >
                    Evidence Images ({ticket.proofImages.length})
                  </Typography>
                  <Grid container spacing={2}>
                    {ticket.proofImages.map((img: string, i: number) => (
                      <Grid item xs={12} sm={6} md={4} key={i}>
                        <Card variant="outlined">
                          <CardMedia
                            component="img"
                            image={img}
                            alt={`Evidence ${i + 1}`}
                            sx={{ height: 200, objectFit: "cover" }}
                          />
                          <CardContent sx={{ p: 1, pb: "8px !important" }}>
                            <Box
                              sx={{
                                display: "flex",
                                justifyContent: "space-between",
                              }}
                            >
                              <Typography variant="caption">
                                Evidence {i + 1}
                              </Typography>
                              <Tooltip title="View Larger">
                                <IconButton
                                  size="small"
                                  onClick={() => window.open(img, "_blank")}
                                >
                                  <ZoomInIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              ) : (
                <Alert severity="info" sx={{ mt: 2 }}>
                  No evidence images provided.
                </Alert>
              )}
            </Paper>
          )}
        </div>

        {/* Counterevidence Tab */}
        <div
          role="tabpanel"
          hidden={activeTab !== 1}
          id="tabpanel-1"
          aria-labelledby="tab-1"
        >
          {activeTab === 1 && (
            <Paper elevation={2} sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight="medium" gutterBottom>
                {ticket.counterparty === "client" ? "Client" : "Artist"}'s
                Response
              </Typography>

              {ticket.counterDescription ? (
                <>
                  <Typography
                    variant="body1"
                    paragraph
                    sx={{ whiteSpace: "pre-line" }}
                  >
                    {ticket.counterDescription}
                  </Typography>

                  {ticket.counterProofImages &&
                  ticket.counterProofImages.length > 0 ? (
                    <Box sx={{ mt: 3 }}>
                      <Typography
                        variant="subtitle2"
                        fontWeight="medium"
                        gutterBottom
                      >
                        Counterevidence Images (
                        {ticket.counterProofImages.length})
                      </Typography>
                      <Grid container spacing={2}>
                        {ticket.counterProofImages.map(
                          (img: string, i: number) => (
                            <Grid item xs={12} sm={6} md={4} key={i}>
                              <Card variant="outlined">
                                <CardMedia
                                  component="img"
                                  image={img}
                                  alt={`Counterevidence ${i + 1}`}
                                  sx={{ height: 200, objectFit: "cover" }}
                                />
                                <CardContent
                                  sx={{ p: 1, pb: "8px !important" }}
                                >
                                  <Box
                                    sx={{
                                      display: "flex",
                                      justifyContent: "space-between",
                                    }}
                                  >
                                    <Typography variant="caption">
                                      Counterevidence {i + 1}
                                    </Typography>
                                    <Tooltip title="View Larger">
                                      <IconButton
                                        size="small"
                                        onClick={() =>
                                          window.open(img, "_blank")
                                        }
                                      >
                                        <ZoomInIcon fontSize="small" />
                                      </IconButton>
                                    </Tooltip>
                                  </Box>
                                </CardContent>
                              </Card>
                            </Grid>
                          )
                        )}
                      </Grid>
                    </Box>
                  ) : (
                    <Alert severity="info" sx={{ mt: 2 }}>
                      No counterevidence images provided.
                    </Alert>
                  )}
                </>
              ) : (
                <Alert
                  severity={ticket.status === "open" ? "info" : "warning"}
                  sx={{ mt: 2 }}
                >
                  {ticket.status === "open" ? (
                    <>
                      No counterproof has been submitted yet. The counterparty
                      has until {formatDate(ticket.counterExpiresAt)} to
                      respond.
                    </>
                  ) : (
                    "No counterproof was submitted before the deadline."
                  )}
                </Alert>
              )}
            </Paper>
          )}
        </div>

        {/* Side by Side Tab */}
        <div
          role="tabpanel"
          hidden={activeTab !== 2}
          id="tabpanel-2"
          aria-labelledby="tab-2"
        >
          {activeTab === 2 && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Paper elevation={2} sx={{ p: 3, height: "100%" }}>
                  <Typography variant="h6" fontWeight="medium" gutterBottom>
                    {ticket.submittedBy === "client" ? "Client" : "Artist"}'s
                    Evidence
                  </Typography>

                  <Typography
                    variant="body1"
                    paragraph
                    sx={{ whiteSpace: "pre-line" }}
                  >
                    {ticket.description}
                  </Typography>

                  {ticket.proofImages && ticket.proofImages.length > 0 && (
                    <Box sx={{ mt: 2 }}>
                      <Typography
                        variant="subtitle2"
                        fontWeight="medium"
                        gutterBottom
                      >
                        Evidence Images
                      </Typography>
                      <Grid container spacing={1}>
                        {ticket.proofImages.map((img: string, i: number) => (
                          <Grid item xs={6} sm={4} key={i}>
                            <Card variant="outlined">
                              <CardMedia
                                component="img"
                                image={img}
                                alt={`Evidence ${i + 1}`}
                                sx={{ height: 100, objectFit: "cover" }}
                                onClick={() => window.open(img, "_blank")}
                              />
                            </Card>
                          </Grid>
                        ))}
                      </Grid>
                    </Box>
                  )}
                </Paper>
              </Grid>

              <Grid item xs={12} md={6}>
                <Paper elevation={2} sx={{ p: 3, height: "100%" }}>
                  <Typography variant="h6" fontWeight="medium" gutterBottom>
                    {ticket.counterparty === "client" ? "Client" : "Artist"}'s
                    Response
                  </Typography>

                  {ticket.counterDescription ? (
                    <>
                      <Typography
                        variant="body1"
                        paragraph
                        sx={{ whiteSpace: "pre-line" }}
                      >
                        {ticket.counterDescription}
                      </Typography>

                      {ticket.counterProofImages &&
                        ticket.counterProofImages.length > 0 && (
                          <Box sx={{ mt: 2 }}>
                            <Typography
                              variant="subtitle2"
                              fontWeight="medium"
                              gutterBottom
                            >
                              Counterevidence Images
                            </Typography>
                            <Grid container spacing={1}>
                              {ticket.counterProofImages.map(
                                (img: string, i: number) => (
                                  <Grid item xs={6} sm={4} key={i}>
                                    <Card variant="outlined">
                                      <CardMedia
                                        component="img"
                                        image={img}
                                        alt={`Counterevidence ${i + 1}`}
                                        sx={{ height: 100, objectFit: "cover" }}
                                        onClick={() =>
                                          window.open(img, "_blank")
                                        }
                                      />
                                    </Card>
                                  </Grid>
                                )
                              )}
                            </Grid>
                          </Box>
                        )}
                    </>
                  ) : (
                    <Alert
                      severity={ticket.status === "open" ? "info" : "warning"}
                      sx={{ mt: 2 }}
                    >
                      {ticket.status === "open" ? (
                        <>
                          No counterproof has been submitted yet. The
                          counterparty has until{" "}
                          {formatDate(ticket.counterExpiresAt)} to respond.
                        </>
                      ) : (
                        "No counterproof was submitted before the deadline."
                      )}
                    </Alert>
                  )}
                </Paper>
              </Grid>
            </Grid>
          )}
        </div>
      </Box>

      {/* Resolution Decision Form */}
      {ticket.status === "resolved" ? (
        <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
          <Typography variant="h6" fontWeight="medium" gutterBottom>
            Resolution Decision
          </Typography>
          <Box sx={{ mb: 2 }}>
            <Chip
              label={
                ticket.decision === "favorClient"
                  ? "Decision in Favor of Client"
                  : "Decision in Favor of Artist"
              }
              color={ticket.decision === "favorClient" ? "info" : "secondary"}
              icon={<GavelIcon />}
              sx={{ mb: 2 }}
            />
          </Box>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Resolution Note
          </Typography>
          <Paper
            variant="outlined"
            sx={{ p: 2, borderRadius: 1, bgcolor: "background.paper" }}
          >
            <Typography variant="body1" sx={{ whiteSpace: "pre-line" }}>
              {ticket.resolutionNote}
            </Typography>
          </Paper>
          <Box sx={{ mt: 2 }}>
            <Typography variant="caption" color="text.secondary">
              Resolved by {ticket.resolvedBy?.toString()} on{" "}
              {formatDate(ticket.resolvedAt)}
            </Typography>
          </Box>
        </Paper>
      ) : canResolve ? (
        <form onSubmit={handleSubmit(onSubmit)}>
          <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
            <Typography variant="h6" fontWeight="medium" gutterBottom>
              Make Resolution Decision
            </Typography>

            <Alert severity="info" sx={{ mb: 3 }}>
              <Typography variant="body2">
                As an administrator, you need to decide which party's position
                to uphold. Consider all evidence provided by both parties before
                making your decision. The outcome of this resolution will affect
                the disputed{" "}
                {getTargetTypeDisplay(ticket.targetType).toLowerCase()}.
              </Typography>
            </Alert>

            <Box sx={{ mb: 3 }}>
              <Controller
                name="decision"
                control={control}
                rules={{ required: "A decision is required" }}
                render={({ field }) => (
                  <FormControl component="fieldset" error={!!errors.decision}>
                    <FormLabel component="legend">Decision</FormLabel>
                    <RadioGroup row {...field}>
                      <FormControlLabel
                        value="favorClient"
                        control={<Radio />}
                        label="In Favor of Client"
                      />
                      <FormControlLabel
                        value="favorArtist"
                        control={<Radio />}
                        label="In Favor of Artist"
                      />
                    </RadioGroup>
                    {errors.decision && (
                      <Typography variant="caption" color="error">
                        {errors.decision.message}
                      </Typography>
                    )}
                  </FormControl>
                )}
              />
            </Box>

            {/* Show consequence of decision */}
            {watchedDecision && (
              <Alert
                severity={
                  watchedDecision === "favorClient" ? "info" : "warning"
                }
                sx={{ mb: 3 }}
                icon={<GavelIcon />}
              >
                <Typography variant="body2">
                  {getDecisionConsequenceMessage(watchedDecision)}
                </Typography>
              </Alert>
            )}

            <Box sx={{ mb: 3 }}>
              <Controller
                name="resolutionNote"
                control={control}
                rules={{
                  required: "A resolution note is required",
                  minLength: {
                    value: 50,
                    message:
                      "Please provide at least 50 characters of explanation",
                  },
                }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Resolution Note"
                    multiline
                    rows={4}
                    fullWidth
                    placeholder="Provide a detailed explanation of your decision. This will be visible to both parties."
                    error={!!errors.resolutionNote}
                    helperText={
                      errors.resolutionNote?.message ||
                      "Explain the reasoning behind your decision in detail. Both parties will see this explanation."
                    }
                  />
                )}
              />
            </Box>

            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={!canResolve || isSubmitting || !isValid}
                startIcon={
                  isSubmitting ? <CircularProgress size={20} /> : <GavelIcon />
                }
              >
                {isSubmitting ? "Submitting..." : "Submit Resolution"}
              </Button>

              <Chip
                icon={<WarningIcon />}
                label="This action cannot be undone"
                color="warning"
                variant="outlined"
              />
            </Box>
          </Paper>
        </form>
      ) : null}

      {/* Contract Information */}
      <Divider sx={{ my: 4 }} />

      <Paper elevation={2} sx={{ p: 3 }}>
        <Typography variant="h6" fontWeight="medium" gutterBottom>
          Contract Information
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Stack spacing={2}>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Contract Status
                </Typography>
                <Chip
                  label={contract.status.toUpperCase()}
                  color={
                    contract.status === "active"
                      ? "success"
                      : contract.status === "disputed"
                      ? "warning"
                      : contract.status === "completed"
                      ? "info"
                      : "default"
                  }
                  size="small"
                  sx={{ mt: 0.5 }}
                />
              </Box>

              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Created
                </Typography>
                <Typography variant="body2">
                  {formatDate(contract.createdAt)}
                </Typography>
              </Box>
            </Stack>
          </Grid>

          <Grid item xs={12} md={4}>
            <Stack spacing={2}>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Artist ID
                </Typography>
                <Typography variant="body2">
                  {contract.artistId.toString()}
                </Typography>
              </Box>

              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Client ID
                </Typography>
                <Typography variant="body2">
                  {contract.clientId.toString()}
                </Typography>
              </Box>
            </Stack>
          </Grid>

          <Grid item xs={12} md={4}>
            <Stack spacing={2}>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Deadline
                </Typography>
                <Typography variant="body2">
                  {formatDate(contract.deadlineAt)}
                </Typography>
              </Box>

              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Grace Period Ends
                </Typography>
                <Typography variant="body2">
                  {formatDate(contract.graceEndsAt)}
                </Typography>
              </Box>
            </Stack>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
}

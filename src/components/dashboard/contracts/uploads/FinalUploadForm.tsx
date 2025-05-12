// src/components/dashboard/contracts/uploads/FinalUploadForm.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import axios from "axios";
import {
  Box,
  Button,
  TextField,
  Typography,
  Alert,
  CircularProgress,
  Paper,
  Slider,
  FormControlLabel,
  Checkbox,
  IconButton,
  Grid,
  Divider,
  Stack,
  Chip,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import AddPhotoAlternateIcon from "@mui/icons-material/AddPhotoAlternate";
import WarningIcon from "@mui/icons-material/Warning";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { IContract } from "@/lib/db/models/contract.model";
import { ICancelTicket } from "@/lib/db/models/ticket.model";

interface FinalUploadFormProps {
  contract: IContract;
  userId: string;
  cancelTicketId?: string;
}

interface FormValues {
  description: string;
  workProgress: number;
  isForCancellation: boolean;
}

export default function FinalUploadForm({
  contract,
  userId,
  cancelTicketId,
}: FinalUploadFormProps) {
  const router = useRouter();
  const [files, setFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [cancelTicket, setCancelTicket] = useState<ICancelTicket | null>(null);
  const [activeCancelTicket, setActiveCancelTicket] =
    useState<ICancelTicket | null>(null);

  const axiosClient = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || "",
  });

  // Check if this is a milestone contract
  const isMilestoneContract =
    contract.proposalSnapshot?.listingSnapshot?.flow === "milestone";

  // Check milestone status for milestone contracts
  const incompleteMilestones =
    isMilestoneContract && contract.milestones
      ? contract.milestones.filter(
          (milestone) => milestone.status !== "accepted"
        )
      : [];

  const allMilestonesComplete =
    isMilestoneContract && incompleteMilestones.length === 0;

  // Calculate default work progress based on contract type
  const calculateDefaultWorkProgress = (): number => {
    // For cancellation with milestone flow
    if (
      (cancelTicketId || activeCancelTicket) &&
      isMilestoneContract &&
      contract.milestones &&
      contract.milestones.length > 0
    ) {
      // Sum up percentages from completed milestones
      return contract.milestones.reduce((total, milestone) => {
        if (milestone.status === "accepted") {
          return total + milestone.percent;
        }
        return total;
      }, 0);
    }
    // For cancellation with standard flow
    if (cancelTicketId || activeCancelTicket) {
      return 50; // Default to 50% for standard cancellations
    }
    // For final delivery (not a cancellation)
    return 100;
  };

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      description: "",
      workProgress: calculateDefaultWorkProgress(),
      isForCancellation: !!cancelTicketId,
    },
  });

  const watchIsForCancellation = watch("isForCancellation");
  const watchWorkProgress = watch("workProgress");

  // Effect to fetch active cancellation tickets
  useEffect(() => {
    const fetchActiveCancellationTickets = async () => {
      if (cancelTicketId) return; // Skip if we already have a cancelTicketId prop

      try {
        const response = await axiosClient.get(
          `/api/contract/${contract._id}/tickets/cancel/active`
        );

        if (response.data && response.data.length > 0) {
          // If there's a ticket in accepted or forcedAccepted state
          const acceptedTicket = response.data.find(
            (ticket: ICancelTicket) =>
              ticket.status === "accepted" || ticket.status === "forcedAccepted"
          );

          if (acceptedTicket) {
            setActiveCancelTicket(acceptedTicket);
            // Set form to cancellation mode
            setValue("isForCancellation", true);
            // Calculate default work progress for cancellation
            setValue("workProgress", calculateDefaultWorkProgress());
          }
        }
      } catch (err) {
        console.error("Error fetching active cancellation tickets:", err);
      }
    };

    fetchActiveCancellationTickets();
  }, [contract._id, cancelTicketId, setValue]);

  // Fetch ticket details if this is for a cancellation
  useEffect(() => {
    if (cancelTicketId) {
      const fetchTicket = async () => {
        try {
          const response = await axiosClient.get(
            `/api/contract/${contract._id}/tickets/cancel/${cancelTicketId}`
          );
          if (response.data) {
            setCancelTicket(response.data);
            // Set form to cancellation mode
            setValue("isForCancellation", true);
            setValue("workProgress", calculateDefaultWorkProgress());
          }
        } catch (err) {
          setError(
            axios.isAxiosError(err) && err.response
              ? err.response.data.error
              : "An error occurred while fetching ticket"
          );
        }
      };

      fetchTicket();
    }
  }, [contract._id, cancelTicketId, setValue]);

  // Toggle cancellation mode effect
  useEffect(() => {
    if (watchIsForCancellation && watchWorkProgress === 100) {
      setValue(
        "workProgress",
        cancelTicketId ? calculateDefaultWorkProgress() : 50
      );
    } else if (!watchIsForCancellation && watchWorkProgress < 100) {
      setValue("workProgress", 100);
    }
  }, [watchIsForCancellation, setValue, watchWorkProgress, cancelTicketId]);

  // Handle file input change
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

  // Get display ticket (from either source)
  const displayTicket = cancelTicket || activeCancelTicket;

  const getRequestedBy = (ticket?: ICancelTicket): string => {
    if (!ticket || !ticket.requestedBy) return "";
    return ticket.requestedBy === "client" ? "Client" : "Artist";
  };

  const getReason = (ticket?: ICancelTicket): string => {
    if (!ticket) return "";
    return ticket.reason || "";
  };

  // Format ticket status for display
  const formatStatus = (status: string | undefined): string => {
    if (!status) return "";
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  // Handle form submission
  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    setError(null);

    try {
      // Validate inputs
      if (files.length === 0) {
        throw new Error("Please select at least one image to upload");
      }

      if (data.isForCancellation && data.workProgress >= 100) {
        throw new Error(
          "Work progress for cancellation must be less than 100%"
        );
      }

      if (!data.isForCancellation && data.workProgress < 100) {
        throw new Error("Work progress for final delivery must be 100%");
      }

      // For milestone flow final upload (not cancellation), verify all milestones are completed
      if (
        !data.isForCancellation &&
        contract.milestones &&
        contract.milestones.length > 0 &&
        contract.proposalSnapshot?.listingSnapshot?.flow === "milestone"
      ) {
        const incompleteMilestones = contract.milestones.filter(
          (milestone) => milestone.status !== "accepted"
        );

        if (incompleteMilestones.length > 0) {
          throw new Error(
            "All milestones must be completed and accepted before submitting the final delivery"
          );
        }
      }

      // Create FormData
      const formData = new FormData();
      formData.append("description", data.description);
      formData.append("workProgress", data.workProgress.toString());

      // Add cancelTicketId from props if available
      if (cancelTicketId && data.isForCancellation) {
        formData.append("cancelTicketId", cancelTicketId);
      }
      // Or use the active cancel ticket ID if found
      else if (activeCancelTicket && data.isForCancellation) {
        formData.append("cancelTicketId", activeCancelTicket._id.toString());
      }

      files.forEach((file) => {
        formData.append("images[]", file);
      });

      // Submit to API using axios
      await axiosClient.post(
        `/api/contract/${contract._id}/uploads/final/new`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      setSuccess(true);

      // Redirect after successful submission
      setTimeout(() => {
        router.push(`/dashboard/${userId}/contracts/${contract._id}/uploads`);
        router.refresh();
      }, 1500);
    } catch (err) {
      if (axios.isAxiosError(err) && err.response) {
        setError(err.response.data.error || "Failed to upload final delivery");
      } else {
        setError(
          err instanceof Error ? err.message : "An unknown error occurred"
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Paper elevation={2} sx={{ p: 3 }}>
      {success ? (
        <Alert severity="success" sx={{ mb: 2 }}>
          {watchIsForCancellation ? "Cancellation proof" : "Final delivery"}{" "}
          upload successful! Redirecting...
        </Alert>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {/* Milestone Status Warning */}
          {isMilestoneContract &&
            !watchIsForCancellation &&
            !allMilestonesComplete && (
              <Alert severity="warning" icon={<WarningIcon />} sx={{ mb: 3 }}>
                <Typography variant="body1" fontWeight="medium">
                  All milestones must be completed before final delivery
                </Typography>
                <Typography variant="body2">
                  {incompleteMilestones.length} of {contract.milestones?.length}{" "}
                  milestones are incomplete. You can only submit a final
                  delivery when all milestones are accepted.
                </Typography>
              </Alert>
            )}

          {/* Milestone Status Success */}
          {isMilestoneContract &&
            !watchIsForCancellation &&
            allMilestonesComplete && (
              <Alert
                severity="success"
                icon={<CheckCircleIcon />}
                sx={{ mb: 3 }}
              >
                <Typography variant="body1" fontWeight="medium">
                  All milestones complete!
                </Typography>
                <Typography variant="body2">
                  All {contract.milestones?.length} milestones have been
                  accepted. You can now submit your final delivery.
                </Typography>
              </Alert>
            )}

          {/* Contract Type Info */}
          <Box sx={{ mb: 3 }}>
            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
              sx={{ mb: 2 }}
            >
              <Typography variant="h6" fontWeight="bold">
                {watchIsForCancellation
                  ? "Cancellation Proof"
                  : "Final Delivery"}
              </Typography>

              {isMilestoneContract ? (
                <Chip
                  label="Milestone Contract"
                  color="primary"
                  variant="outlined"
                  size="small"
                />
              ) : (
                <Chip
                  label="Standard Contract"
                  color="secondary"
                  variant="outlined"
                  size="small"
                />
              )}
            </Stack>

            {/* Upload Type Section */}
            <Box sx={{ mb: 3 }}>
              {/* Cancellation toggle - only show if not explicitly a cancellation upload and no active tickets */}
              {!cancelTicketId && !activeCancelTicket && (
                <Box sx={{ mb: 2 }}>
                  <Controller
                    name="isForCancellation"
                    control={control}
                    render={({ field }) => (
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={field.value}
                            onChange={(e) => field.onChange(e.target.checked)}
                            disabled={isSubmitting}
                          />
                        }
                        label="This is a cancellation proof (partial work)"
                      />
                    )}
                  />

                  {watchIsForCancellation && (
                    <Alert severity="info" sx={{ mt: 1 }}>
                      For cancellations, you need to specify the percentage of
                      work completed. The contract will be cancelled, and
                      payment will be split according to policy and work
                      completion.
                    </Alert>
                  )}
                </Box>
              )}

              {/* Active Cancellation Ticket Notice */}
              {activeCancelTicket && (
                <Alert severity="warning" sx={{ mb: 2 }}>
                  <Typography variant="body1" fontWeight="medium">
                    Cancellation Upload Required
                  </Typography>
                  <Typography variant="body2">
                    An accepted cancellation request requires you to upload
                    proof of your progress. This will be treated as a
                    cancellation proof.
                  </Typography>
                </Alert>
              )}

              {/* Cancel ticket information if available */}
              {/* Cancel ticket information if available */}
              {displayTicket && (
                <Box
                  sx={{
                    mb: 2,
                    p: 2,
                    bgcolor: "background.paper",
                    borderRadius: 1,
                    border: "1px solid",
                    borderColor: "divider",
                  }}
                >
                  <Typography
                    variant="subtitle1"
                    fontWeight="bold"
                    gutterBottom
                  >
                    Cancellation Request Details
                  </Typography>
                  <Grid container spacing={1}>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Requested by:
                      </Typography>
                      <Typography variant="body2" fontWeight="medium">
                        {getRequestedBy(displayTicket)}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Status:
                      </Typography>
                      <Typography variant="body2" fontWeight="medium">
                        {formatStatus(displayTicket.status)}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sx={{ mt: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Reason:
                      </Typography>
                      <Typography variant="body2">
                        {getReason(displayTicket)}
                      </Typography>
                    </Grid>
                  </Grid>
                </Box>
              )}
            </Box>

            {/* Work Progress Section - for cancellations only */}
            {(watchIsForCancellation ||
              cancelTicketId ||
              activeCancelTicket) && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  Work Progress
                </Typography>

                {isMilestoneContract && (
                  <Alert severity="info" sx={{ mb: 2 }}>
                    <Typography variant="body2">
                      Default progress is based on completed milestones (
                      {calculateDefaultWorkProgress()}%). You can adjust this if
                      necessary.
                    </Typography>
                  </Alert>
                )}

                <Controller
                  name="workProgress"
                  control={control}
                  rules={{
                    validate: (value) =>
                      (watchIsForCancellation && value < 100) ||
                      (!watchIsForCancellation && value === 100) ||
                      "Work progress must be less than 100% for cancellations and exactly 100% for final delivery",
                  }}
                  render={({ field }) => (
                    <Box>
                      <Typography gutterBottom>
                        Current Progress: {field.value}%
                      </Typography>
                      <Slider
                        value={field.value}
                        onChange={(_, newValue) => field.onChange(newValue)}
                        aria-labelledby="work-progress-slider"
                        min={0}
                        max={watchIsForCancellation ? 99 : 100}
                        disabled={isSubmitting}
                        sx={{ mb: 2 }}
                      />
                      {errors.workProgress && (
                        <Typography color="error" variant="caption">
                          {errors.workProgress.message}
                        </Typography>
                      )}
                    </Box>
                  )}
                />

                <Typography
                  variant="body2"
                  sx={{ fontStyle: "italic", color: "text.secondary" }}
                >
                  For cancellations, please accurately estimate the percentage
                  of work completed. This affects how payment will be split.
                </Typography>
              </Box>
            )}
          </Box>

          <Divider sx={{ my: 3 }} />

          {/* Image Upload Section */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Upload{" "}
              {watchIsForCancellation ? "Current Progress" : "Final Delivery"}{" "}
              Images
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Upload up to 5 images showing your{" "}
              {watchIsForCancellation ? "current progress" : "final delivery"}.
            </Typography>

            <Box sx={{ mb: 2 }}>
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
                <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                  {files.length}/5 images selected
                </Typography>
              )}
            </Box>

            {previewUrls.length > 0 ? (
              <Grid container spacing={1} sx={{ mt: 1 }}>
                {previewUrls.map((url, index) => (
                  <Grid item key={index} xs={6} sm={4} md={3}>
                    <Box sx={{ position: "relative" }}>
                      <Box
                        component="img"
                        src={url}
                        alt={`Preview ${index}`}
                        sx={{
                          width: "100%",
                          height: 120,
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
            ) : (
              <Alert severity="info" sx={{ mt: 1 }}>
                Please select at least one image to upload.
              </Alert>
            )}
          </Box>

          {/* Description Section */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Description
            </Typography>

            <Controller
              name="description"
              control={control}
              rules={{
                required: "Description is required",
                minLength: {
                  value: 10,
                  message: "Description must be at least 10 characters",
                },
              }}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Description"
                  multiline
                  rows={4}
                  fullWidth
                  placeholder={
                    watchIsForCancellation
                      ? "Describe the current state of the work and any limitations"
                      : "Provide details about the final delivery"
                  }
                  error={!!errors.description}
                  helperText={errors.description?.message}
                  disabled={isSubmitting}
                />
              )}
            />
          </Box>

          {/* Submit Buttons */}
          <Stack direction="row" spacing={2}>
            <Button
              variant="outlined"
              onClick={() => router.back()}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={
                isSubmitting ||
                files.length === 0 ||
                (isMilestoneContract &&
                  !watchIsForCancellation &&
                  !allMilestonesComplete)
              }
              sx={{ minWidth: 120 }}
            >
              {isSubmitting ? (
                <CircularProgress size={24} />
              ) : watchIsForCancellation ? (
                "Upload Cancellation Proof"
              ) : (
                "Upload Final Delivery"
              )}
            </Button>
          </Stack>

          {/* Helpful note when submit is disabled due to incomplete milestones */}
          {isMilestoneContract &&
            !watchIsForCancellation &&
            !allMilestonesComplete && (
              <Typography
                variant="caption"
                color="error"
                sx={{ display: "block", mt: 2, textAlign: "center" }}
              >
                Complete all milestones before submitting the final delivery
              </Typography>
            )}
        </form>
      )}
    </Paper>
  );
}

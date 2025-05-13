// src/components/dashboard/contracts/tickets/ResolutionTicketForm.tsx
"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import axios from "axios";
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Divider,
  Stack,
  Grid,
  IconButton,
  Chip,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import AddPhotoAlternateIcon from "@mui/icons-material/AddPhotoAlternate";
import { IContract } from "@/lib/db/models/contract.model";

interface ResolutionTicketFormProps {
  contract: IContract;
  userId: string;
  username: string;
  isArtist: boolean;
  isClient: boolean;
  initialTargetType:
    | "cancelTicket"
    | "revisionTicket"
    | "changeTicket"
    | "finalUpload"
    | "progressMilestoneUpload"
    | "revisionUpload";
  initialTargetId: string;
}

interface FormValues {
  description: string;
}

export default function ResolutionTicketForm({
  contract,
  userId,
  username,
  isArtist,
  isClient,
  initialTargetType,
  initialTargetId,
}: ResolutionTicketFormProps) {
  const router = useRouter();
  const fetchedRef = useRef(false);

  // Validate MongoDB ObjectID
  const validateMongoId = (id: string): boolean => {
    return /^[0-9a-fA-F]{24}$/.test(id);
  };

  // Form state with react-hook-form
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      description: "",
    },
  });

  // Files state
  const [files, setFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);

  // Target details - for displaying information about the selected target
  const [targetDetails, setTargetDetails] = useState<any>(null);
  const [targetLabel, setTargetLabel] = useState<string>("");
  const [loadingDetails, setLoadingDetails] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const axiosClient = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || "",
  });

  // Get display name for target type
  const getTargetTypeDisplay = (type: string): string => {
    switch (type) {
      case "cancelTicket":
        return "Cancellation Request";
      case "revisionTicket":
        return "Revision Request";
      case "changeTicket":
        return "Change Request";
      case "finalUpload":
        return "Final Delivery";
      case "progressMilestone":
        return "Milestone Progress Upload";
      case "revisionUpload":
        return "Revision Upload";
      default:
        return type.charAt(0).toUpperCase() + type.slice(1);
    }
  };

  // Determine API endpoint based on target type
  const getApiEndpoint = (targetType: string, targetId: string): string => {
    switch (targetType) {
      case "cancelTicket":
      case "revisionTicket":
      case "changeTicket":
        return `/api/contract/${contract._id}/tickets/${targetType}/${targetId}`;
      case "finalUpload":
      case "progressMilestoneUpload":
        return `/api/contract/${contract._id}/uploads/milestone/${targetId}`;
      case "revisionUpload":
        return `/api/contract/${contract._id}/uploads/revision/${targetId}`;
      default:
        return `/api/contract/${contract._id}/tickets/${targetType}/${targetId}`;
    }
  };

  // Fetch target details when component mounts - using a ref to prevent multiple fetches
  useEffect(() => {
    // Skip if we've already fetched
    if (fetchedRef.current) return;

    const fetchTargetDetails = async () => {
      // Validate inputs
      if (!initialTargetType || !initialTargetId) {
        setError("Missing target information");
        setIsLoading(false);
        return;
      }

      if (!validateMongoId(initialTargetId)) {
        setError("Invalid target ID format");
        setIsLoading(false);
        return;
      }

      try {
        // Mark as fetched before the actual fetch to prevent additional calls
        fetchedRef.current = true;

        // Get the appropriate API endpoint
        const apiUrl = getApiEndpoint(initialTargetType, initialTargetId);
        console.log(`Fetching details from: ${apiUrl}`);

        const response = await axiosClient.get(apiUrl);

        if (response && response.data) {
          // Determine if we're dealing with a ticket or upload
          const isTicket = ["cancel", "revision", "change"].includes(
            initialTargetType
          );
          const data = isTicket ? response.data.ticket : response.data.upload;

          setTargetDetails(data);

          // Set a descriptive label based on the target type and data
          let label = getTargetTypeDisplay(initialTargetType);

          switch (initialTargetType) {
            case "cancelTicket":
              label += ` - ${
                data.requestedBy === "client" ? "Client" : "Artist"
              } Initiated`;
              break;
            case "revisionTicket":
              if (data.milestoneIdx !== undefined) {
                label += ` - Milestone ${data.milestoneIdx + 1}`;
              }
              break;
            case "changeTicket":
              label += data.isPaidChange ? " - Paid Change" : "";
              break;
            case "finalUpload":
              label += ` - ${data.workProgress}% Complete`;
              break;
            case "progressMilestoneUpload":
              const pmIndex =
                data.milestoneIdx !== undefined ? data.milestoneIdx : 0;
              const pmTitle =
                contract.milestones && contract.milestones[pmIndex]
                  ? contract.milestones[pmIndex].title
                  : `Milestone ${pmIndex + 1}`;
              label = `${pmTitle} Progress Upload`;
              break;
            case "revisionUpload":
              label = "Revision Upload";
              if (data.revisionTicketId) {
                // If we wanted to be fancy, we could make another API call to get revision ticket details
                // but for simplicity, we'll just use the revision ID
                label += ` #${data.revisionTicketId.substring(0, 6)}`;
              }
              break;
          }

          setTargetLabel(label);
        } else {
          setError("Could not find the item to dispute");
        }
      } catch (err) {
        console.error("Error fetching target details:", err);
        setError("Could not load details for the selected item");
      } finally {
        setLoadingDetails(false);
        setIsLoading(false);
      }
    };

    fetchTargetDetails();

    // The dependency array is kept empty because we're using fetchedRef to control execution
    // This ensures the effect only runs once when the component mounts
  }, []);

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

  // Handle form submission
  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    setError(null);

    try {
      // Validate input
      if (!data.description.trim()) {
        throw new Error("Please provide a detailed description of the issue");
      }

      if (!initialTargetType || !initialTargetId) {
        throw new Error("Missing target information");
      }

      // Create FormData
      const formData = new FormData();
      formData.append("description", data.description);
      formData.append("targetType", initialTargetType);
      formData.append("targetId", initialTargetId);

      // Add proof images
      files.forEach((file) => {
        formData.append("proofImages[]", file);
      });

      // Submit to API using axios
      await axiosClient.post(
        `/api/contracts/${contract._id}/resolution`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      setSuccess(true);

      // Redirect after successful submission
      setTimeout(() => {
        router.push(`/dashboard/${username}/resolution`);
        router.refresh();
      }, 1500);
    } catch (err) {
      if (axios.isAxiosError(err) && err.response) {
        setError(
          err.response.data.error || "Failed to create resolution request"
        );
      } else {
        setError(
          err instanceof Error ? err.message : "An unknown error occurred"
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render loading state
  if (isLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  // Show error if there's an issue loading target details
  if (error && !targetDetails) {
    return (
      <Paper elevation={2} sx={{ p: 3 }}>
        <Alert severity="error">
          <Typography variant="body1" fontWeight="bold">
            Error Loading Item
          </Typography>
          <Typography variant="body2">{error}</Typography>
          <Button
            variant="outlined"
            size="small"
            onClick={() => router.back()}
            sx={{ mt: 2 }}
          >
            Go Back
          </Button>
        </Alert>
      </Paper>
    );
  }

  return (
    <Paper elevation={2} sx={{ p: 3 }}>
      {success ? (
        <Alert severity="success" sx={{ mb: 2 }}>
          Resolution request submitted successfully! Redirecting...
        </Alert>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Alert severity="info" sx={{ mb: 3 }}>
            <Typography variant="body1" fontWeight="bold">
              About Resolution Requests
            </Typography>
            <Typography variant="body2">
              Resolution requests are reviewed by administrators who will
              examine both sides of the dispute and make a final decision. Both
              parties will have the opportunity to provide evidence.
            </Typography>
          </Alert>

          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              What are you disputing?
            </Typography>

            <Box
              sx={{
                p: 2,
                mb: 2,
                borderRadius: 1,
                bgcolor: "background.paper",
                border: "1px solid",
                borderColor: "divider",
              }}
            >
              <Stack
                direction="row"
                spacing={2}
                alignItems="center"
                sx={{ mb: 2 }}
              >
                <Typography variant="subtitle1" fontWeight="medium">
                  {targetLabel}
                </Typography>
                <Chip
                  label={targetDetails?.status || "Unknown"}
                  size="small"
                  color={
                    targetDetails?.status === "pending" ? "warning" : "default"
                  }
                />
              </Stack>

              {targetDetails && (
                <Stack spacing={1}>
                  {targetDetails.description && (
                    <Typography
                      variant="body2"
                      sx={{ color: "text.secondary" }}
                    >
                      <strong>Description:</strong>{" "}
                      {targetDetails.description.substring(0, 100)}
                      {targetDetails.description.length > 100 && "..."}
                    </Typography>
                  )}
                  <Typography variant="body2" sx={{ color: "text.secondary" }}>
                    <strong>Created:</strong>{" "}
                    {new Date(targetDetails.createdAt).toLocaleDateString()}
                  </Typography>
                </Stack>
              )}
            </Box>
          </Box>

          <Divider sx={{ mb: 3 }} />

          {/* Detailed description */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Detailed Description
            </Typography>
            <Typography variant="body2" sx={{ mb: 2 }}>
              Please describe the issue in detail. Be specific about what went
              wrong and why you believe this requires administrative
              intervention.
            </Typography>

            <Controller
              name="description"
              control={control}
              rules={{
                required: "A detailed description is required",
                minLength: {
                  value: 20,
                  message: "Description must be at least 20 characters",
                },
              }}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Description"
                  multiline
                  rows={5}
                  fullWidth
                  placeholder="Explain your dispute in detail..."
                  error={!!errors.description}
                  helperText={errors.description?.message}
                  disabled={isSubmitting}
                />
              )}
            />
          </Box>

          {/* Proof images */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Supporting Evidence
            </Typography>
            <Typography variant="body2" sx={{ mb: 2 }}>
              Upload screenshots, images, or other relevant evidence to support
              your case. At least one image is required.
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
              {files.length > 0 ? (
                <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                  {files.length}/5 images selected
                </Typography>
              ) : (
                <Typography
                  variant="caption"
                  color="error"
                  display="block"
                  sx={{ mt: 1 }}
                >
                  At least one proof image is required
                </Typography>
              )}
            </Box>

            {previewUrls.length > 0 && (
              <Grid container spacing={1} sx={{ mt: 1 }}>
                {previewUrls.map((url, index) => (
                  <Grid item key={index} xs={6} sm={4} md={3}>
                    <Box sx={{ position: "relative" }}>
                      <Box
                        component="img"
                        src={url}
                        alt={`Evidence ${index + 1}`}
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
            )}
          </Box>

          <Alert severity="warning" sx={{ mb: 3 }}>
            <Typography variant="body2">
              Filing a resolution request is a serious matter. Administrators
              will review all evidence from both parties before making a
              decision. The counterparty will have 24 hours to respond with
              their own evidence.
            </Typography>
          </Alert>

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
              disabled={isSubmitting || files.length === 0}
              sx={{ minWidth: 120 }}
            >
              {isSubmitting ? (
                <CircularProgress size={24} />
              ) : (
                "Submit Resolution Request"
              )}
            </Button>
          </Stack>
        </form>
      )}
    </Paper>
  );
}

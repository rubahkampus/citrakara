// src/components/dashboard/contracts/tickets/ResolutionTicketForm.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Stack,
  Grid,
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
}

interface FormValues {
  targetType: "cancel" | "revision" | "final" | "milestone" | "";
  targetId: string;
  description: string;
}

interface TargetItem {
  id: string;
  type: "cancel" | "revision" | "final" | "milestone";
  label: string;
  date: string;
  status: string;
}

export default function ResolutionTicketForm({
  contract,
  userId,
  username,
  isArtist,
  isClient,
}: ResolutionTicketFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Check if we have preset params from URL
  const presetTargetType = searchParams.get("targetType") as
    | "cancel"
    | "revision"
    | "final"
    | "milestone"
    | null;
  const presetTargetId = searchParams.get("targetId");

  // Form state with react-hook-form
  const {
    control,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<FormValues>({
    defaultValues: {
      targetType: presetTargetType || "",
      targetId: presetTargetId || "",
      description: "",
    },
  });

  const watchTargetType = watch("targetType");
  const watchTargetId = watch("targetId");

  // Files state
  const [files, setFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);

  // Available targets for resolution
  const [availableTargets, setAvailableTargets] = useState<{
    cancel: TargetItem[];
    revision: TargetItem[];
    final: TargetItem[];
    milestone: TargetItem[];
  }>({
    cancel: [],
    revision: [],
    final: [],
    milestone: [],
  });

  // Target details - for displaying more information about the selected target
  const [targetDetails, setTargetDetails] = useState<any>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Process status
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const axiosClient = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || "",
  });

  // Fetch available targets for resolution
  useEffect(() => {
    const fetchTargets = async () => {
      setIsLoading(true);
      try {
        // Initialize the arrays for each target type
        const cancelTickets: TargetItem[] = [];
        const revisionTickets: TargetItem[] = [];
        const finalUploads: TargetItem[] = [];
        const milestoneUploads: TargetItem[] = [];

        // Fetch cancel tickets
        if (contract.cancelTickets && contract.cancelTickets.length > 0) {
          for (const ticketId of contract.cancelTickets) {
            try {
              const response = await axiosClient.get(
                `/api/contract/${contract._id}/tickets/cancel/${ticketId}`
              );

              if (response.data && response.data.ticket) {
                const ticket = response.data.ticket;
                cancelTickets.push({
                  id: ticket._id.toString(),
                  type: "cancel",
                  label: `Cancel Request - ${
                    ticket.requestedBy === "client" ? "Client" : "Artist"
                  } Initiated`,
                  date: new Date(ticket.createdAt).toLocaleDateString(),
                  status: ticket.status,
                });
              }
            } catch (err) {
              console.error("Error fetching cancel ticket:", err);
            }
          }
        }

        // Fetch revision tickets
        if (contract.revisionTickets && contract.revisionTickets.length > 0) {
          for (const ticketId of contract.revisionTickets) {
            try {
              const response = await axiosClient.get(
                `/api/contract/${contract._id}/tickets/revision/${ticketId}`
              );

              if (response.data && response.data.ticket) {
                const ticket = response.data.ticket;
                revisionTickets.push({
                  id: ticket._id.toString(),
                  type: "revision",
                  label: `Revision Request ${
                    ticket.milestoneIdx !== undefined
                      ? `- Milestone ${ticket.milestoneIdx + 1}`
                      : ""
                  }`,
                  date: new Date(ticket.createdAt).toLocaleDateString(),
                  status: ticket.status,
                });
              }
            } catch (err) {
              console.error("Error fetching revision ticket:", err);
            }
          }
        }

        // Fetch final uploads
        if (contract.finalUploads && contract.finalUploads.length > 0) {
          for (const uploadId of contract.finalUploads) {
            try {
              const response = await axiosClient.get(
                `/api/contract/${contract._id}/uploads/final/${uploadId}`
              );

              if (response.data && response.data.upload) {
                const upload = response.data.upload;
                finalUploads.push({
                  id: upload._id.toString(),
                  type: "final",
                  label: `Final Delivery - ${upload.workProgress}% Complete`,
                  date: new Date(upload.createdAt).toLocaleDateString(),
                  status: upload.status,
                });
              }
            } catch (err) {
              console.error("Error fetching final upload:", err);
            }
          }
        }

        // Fetch milestone uploads
        if (
          contract.progressUploadsMilestone &&
          contract.progressUploadsMilestone.length > 0
        ) {
          for (const uploadId of contract.progressUploadsMilestone) {
            try {
              const response = await axiosClient.get(
                `/api/contract/${contract._id}/uploads/milestone/${uploadId}`
              );

              if (response.data && response.data.upload) {
                const upload = response.data.upload;
                const milestoneIndex = upload.milestoneIdx;
                const milestoneTitle =
                  contract.milestones && contract.milestones[milestoneIndex]
                    ? contract.milestones[milestoneIndex].title
                    : `Milestone ${milestoneIndex + 1}`;

                milestoneUploads.push({
                  id: upload._id.toString(),
                  type: "milestone",
                  label: `${milestoneTitle} Upload`,
                  date: new Date(upload.createdAt).toLocaleDateString(),
                  status: upload.status,
                });
              }
            } catch (err) {
              console.error("Error fetching milestone upload:", err);
            }
          }
        }

        setAvailableTargets({
          cancel: cancelTickets,
          revision: revisionTickets,
          final: finalUploads,
          milestone: milestoneUploads,
        });
      } catch (err) {
        setError("Failed to load resolution targets");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTargets();
  }, [contract, axiosClient]);

  // Fetch target details when target ID changes
  useEffect(() => {
    const fetchTargetDetails = async () => {
      if (!watchTargetType || !watchTargetId) {
        setTargetDetails(null);
        return;
      }

      setLoadingDetails(true);
      try {
        let response;
        switch (watchTargetType) {
          case "cancel":
            response = await axiosClient.get(
              `/api/contract/${contract._id}/tickets/cancel/${watchTargetId}`
            );
            break;
          case "revision":
            response = await axiosClient.get(
              `/api/contract/${contract._id}/tickets/revision/${watchTargetId}`
            );
            break;
          case "final":
            response = await axiosClient.get(
              `/api/contract/${contract._id}/uploads/final/${watchTargetId}`
            );
            break;
          case "milestone":
            response = await axiosClient.get(
              `/api/contract/${contract._id}/uploads/milestone/${watchTargetId}`
            );
            break;
        }

        if (response && response.data) {
          const data =
            watchTargetType === "cancel" || watchTargetType === "revision"
              ? response.data.ticket
              : response.data.upload;

          setTargetDetails(data);
        }
      } catch (err) {
        console.error("Error fetching target details:", err);
      } finally {
        setLoadingDetails(false);
      }
    };

    fetchTargetDetails();
  }, [watchTargetType, watchTargetId, contract._id, axiosClient]);

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

      if (!data.targetType) {
        throw new Error("Please select what you are disputing");
      }

      if (!data.targetId) {
        throw new Error("Please select the specific item you are disputing");
      }

      // Create FormData
      const formData = new FormData();
      formData.append("description", data.description);
      formData.append("targetType", data.targetType);
      formData.append("targetId", data.targetId);

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
        router.push(`/dashboard/${username}/`);
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

  // Check if there are any items available for resolution
  const hasAvailableTargets =
    availableTargets.cancel.length > 0 ||
    availableTargets.revision.length > 0 ||
    availableTargets.final.length > 0 ||
    availableTargets.milestone.length > 0;

  if (!hasAvailableTargets) {
    return (
      <Paper elevation={2} sx={{ p: 3 }}>
        <Alert severity="info">
          <Typography variant="body1" fontWeight="bold">
            No Items to Dispute
          </Typography>
          <Typography variant="body2">
            There are currently no items in this contract that can be disputed.
            Resolution tickets can only be created for cancel requests, revision
            requests, final deliveries, or milestone uploads.
          </Typography>
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

            <Box sx={{ mb: 3 }}>
              <Controller
                name="targetType"
                control={control}
                rules={{ required: "Please select what you are disputing" }}
                render={({ field }) => (
                  <FormControl fullWidth error={!!errors.targetType}>
                    <InputLabel id="target-type-label">Dispute Type</InputLabel>
                    <Select
                      {...field}
                      labelId="target-type-label"
                      id="target-type"
                      label="Dispute Type"
                      disabled={isSubmitting || !!presetTargetType}
                    >
                      <MenuItem value="">
                        Select what you are disputing
                      </MenuItem>
                      <MenuItem
                        value="cancel"
                        disabled={availableTargets.cancel.length === 0}
                      >
                        Cancellation Request
                      </MenuItem>
                      <MenuItem
                        value="revision"
                        disabled={availableTargets.revision.length === 0}
                      >
                        Revision Request
                      </MenuItem>
                      <MenuItem
                        value="final"
                        disabled={availableTargets.final.length === 0}
                      >
                        Final Delivery
                      </MenuItem>
                      <MenuItem
                        value="milestone"
                        disabled={availableTargets.milestone.length === 0}
                      >
                        Milestone Upload
                      </MenuItem>
                    </Select>
                    {errors.targetType && (
                      <Typography variant="caption" color="error">
                        {errors.targetType.message}
                      </Typography>
                    )}
                  </FormControl>
                )}
              />
            </Box>

            {watchTargetType && (
              <Box sx={{ mb: 3 }}>
                <Controller
                  name="targetId"
                  control={control}
                  rules={{ required: "Please select a specific item" }}
                  render={({ field }) => (
                    <FormControl fullWidth error={!!errors.targetId}>
                      <InputLabel id="target-id-label">
                        Specific Item
                      </InputLabel>
                      <Select
                        {...field}
                        labelId="target-id-label"
                        id="target-id"
                        label="Specific Item"
                        disabled={isSubmitting || !!presetTargetId}
                      >
                        <MenuItem value="">Select specific item</MenuItem>
                        {availableTargets[watchTargetType].map((target) => (
                          <MenuItem key={target.id} value={target.id}>
                            {target.label} - {target.date}
                          </MenuItem>
                        ))}
                      </Select>
                      {errors.targetId && (
                        <Typography variant="caption" color="error">
                          {errors.targetId.message}
                        </Typography>
                      )}
                    </FormControl>
                  )}
                />
              </Box>
            )}

            {/* Display target details when selected */}
            {watchTargetId && (
              <Box
                sx={{
                  p: 2,
                  mb: 2,
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: 1,
                  bgcolor: "background.paper",
                }}
              >
                <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                  Selected Item Details
                </Typography>

                {loadingDetails ? (
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    <CircularProgress size={16} sx={{ mr: 1 }} />
                    <Typography variant="body2">Loading details...</Typography>
                  </Box>
                ) : targetDetails ? (
                  <Stack spacing={1}>
                    <Typography variant="body2">
                      <strong>Status:</strong> {targetDetails.status}
                    </Typography>
                    {targetDetails.description && (
                      <Typography variant="body2">
                        <strong>Description:</strong>{" "}
                        {targetDetails.description.substring(0, 100)}
                        {targetDetails.description.length > 100 && "..."}
                      </Typography>
                    )}
                    <Typography variant="body2">
                      <strong>Created:</strong>{" "}
                      {new Date(targetDetails.createdAt).toLocaleDateString()}
                    </Typography>
                  </Stack>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No details available
                  </Typography>
                )}
              </Box>
            )}
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

"use client";

import { useEffect, useState } from "react";
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
  IconButton,
  Grid,
  Divider,
  Stack,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import AddPhotoAlternateIcon from "@mui/icons-material/AddPhotoAlternate";
import { IContract } from "@/lib/db/models/contract.model";
import { IRevisionTicket } from "@/lib/db/models/ticket.model";

interface RevisionUploadFormProps {
  contract: IContract;
  userId: string;
  ticketId: string;
}

interface FormValues {
  description: string;
}

export default function RevisionUploadForm({
  contract,
  userId,
  ticketId,
}: RevisionUploadFormProps) {
  const router = useRouter();
  const [files, setFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [ticket, setTicket] = useState<IRevisionTicket | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const axiosClient = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || "",
  });

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      description: "",
    },
  });

  // Fetch ticket details
  useEffect(() => {
    const fetchTicket = async () => {
      try {
        const response = await axiosClient.get(
          `/api/contract/${contract._id}/tickets/revision/${ticketId}`
        );
        setTicket(response.data);
      } catch (err) {
        if (axios.isAxiosError(err) && err.response) {
          setError(err.response.data.error || "Failed to fetch ticket details");
        } else {
          setError(
            err instanceof Error ? err.message : "An unknown error occurred"
          );
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchTicket();
  }, [contract._id, ticketId]);

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
      // Validate inputs
      if (files.length === 0) {
        throw new Error("Please select at least one image to upload");
      }

      // Create FormData
      const formData = new FormData();
      formData.append("description", data.description);
      formData.append("revisionTicketId", ticketId);

      files.forEach((file) => {
        formData.append("images[]", file);
      });

      // Submit to API using axios
      await axiosClient.post(
        `/api/contract/${contract._id}/uploads/revision/new`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      setSuccess(true);

      // Redirect after successful submission
      setTimeout(() => {
        router.push(
          `/dashboard/${contract.artistId}/contracts/${contract._id}/uploads`
        );
        router.refresh();
      }, 1500);
    } catch (err) {
      if (axios.isAxiosError(err) && err.response) {
        setError(err.response.data.error || "Failed to upload revision");
      } else {
        setError(
          err instanceof Error ? err.message : "An unknown error occurred"
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!ticket) {
    return (
      <Alert severity="error">Failed to load revision ticket details</Alert>
    );
  }

  return (
    <Paper elevation={2} sx={{ p: 3 }}>
      {success ? (
        <Alert severity="success" sx={{ mb: 2 }}>
          Revision upload successful! Redirecting...
        </Alert>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {/* Revision Ticket Info Display */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Revision Request Details
            </Typography>
            <Box
              sx={{
                p: 2,
                bgcolor: "background.paper",
                borderRadius: 1,
                border: "1px solid",
                borderColor: "divider",
              }}
            >
              <Typography variant="subtitle1" fontWeight="bold">
                Status: {ticket.status}
              </Typography>

              {ticket.milestoneIdx !== undefined && (
                <Typography variant="body2" sx={{ mt: 1 }}>
                  For Milestone:{" "}
                  {contract.milestones?.[ticket.milestoneIdx]?.title ||
                    `#${ticket.milestoneIdx}`}
                </Typography>
              )}

              <Typography variant="body2" sx={{ mt: 2 }}>
                Client's description:
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  mt: 0.5,
                  p: 1.5,
                  bgcolor: "action.hover",
                  borderRadius: 1,
                }}
              >
                {ticket.description}
              </Typography>

              {ticket.referenceImages && ticket.referenceImages.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" fontWeight="medium">
                    Reference images:
                  </Typography>
                  <Grid container spacing={1} sx={{ mt: 0.5 }}>
                    {ticket.referenceImages.map((url, index) => (
                      <Grid item key={index} xs={6} sm={4} md={3} lg={2}>
                        <Box
                          component="img"
                          src={url}
                          alt={`Reference ${index}`}
                          sx={{
                            width: "100%",
                            height: 100,
                            objectFit: "cover",
                            borderRadius: 1,
                          }}
                        />
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              )}
            </Box>
          </Box>

          <Divider sx={{ my: 3 }} />

          {/* Description Input */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Revision Description
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
                  placeholder="Explain what changes you've made in this revision..."
                  error={!!errors.description}
                  helperText={errors.description?.message}
                  disabled={isSubmitting}
                />
              )}
            />
          </Box>

          {/* Image Upload Section */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Upload Revised Images
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Upload up to 5 images for your revision.
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
              disabled={isSubmitting || files.length === 0}
              sx={{ minWidth: 120 }}
            >
              {isSubmitting ? (
                <CircularProgress size={24} />
              ) : (
                "Upload Revision"
              )}
            </Button>
          </Stack>
        </form>
      )}
    </Paper>
  );
}

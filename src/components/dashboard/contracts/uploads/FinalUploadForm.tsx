// src/components/dashboard/contracts/uploads/FinalUploadForm.tsx
"use client";

import { useState, useEffect } from "react";
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
  Divider,
} from "@mui/material";
import { useRouter } from "next/navigation";
import { IContract } from "@/lib/db/models/contract.model";
import { ICancelTicket } from "@/lib/db/models/ticket.model";

interface FinalUploadFormProps {
  contract: IContract;
  userId: string;
  cancelTicketId?: string;
}

export default function FinalUploadForm({
  contract,
  userId,
  cancelTicketId,
}: FinalUploadFormProps) {
  const router = useRouter();
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [workProgress, setWorkProgress] = useState(100);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [cancelTicket, setCancelTicket] = useState<ICancelTicket | null>(null);
  const [isForCancellation, setIsForCancellation] = useState(!!cancelTicketId);

  // Fetch ticket details if this is for a cancellation
  useEffect(() => {
    if (cancelTicketId) {
      const fetchTicket = async () => {
        try {
          const response = await fetch(
            `/api/contract/${contract._id}/tickets/cancel/${cancelTicketId}`
          );
          if (!response.ok) {
            throw new Error("Failed to fetch cancel ticket details");
          }
          const data = await response.json();
          setCancelTicket(data);
          setWorkProgress(70); // Default to 70% for cancellations, can be adjusted
        } catch (err) {
          setError(
            err instanceof Error
              ? err.message
              : "An error occurred while fetching ticket"
          );
        }
      };

      fetchTicket();
    }
  }, [contract._id, cancelTicketId]);

  // Handle file input change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      setFiles(selectedFiles);

      // Create and set preview URLs
      const newPreviewUrls = selectedFiles.map((file) =>
        URL.createObjectURL(file)
      );
      setPreviewUrls((prevUrls) => {
        // Revoke previous URLs to avoid memory leaks
        prevUrls.forEach((url) => URL.revokeObjectURL(url));
        return newPreviewUrls;
      });
    }
  };

  // Handle progress slider change
  const handleProgressChange = (event: Event, newValue: number | number[]) => {
    setWorkProgress(newValue as number);
  };

  // Toggle cancellation mode
  const handleCancellationToggle = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setIsForCancellation(event.target.checked);
    if (event.target.checked) {
      setWorkProgress(70); // Default for cancellation
    } else {
      setWorkProgress(100); // Default for final delivery
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // Validate inputs
      if (files.length === 0) {
        throw new Error("Please select at least one image to upload");
      }

      if (isForCancellation && workProgress >= 100) {
        throw new Error(
          "Work progress for cancellation must be less than 100%"
        );
      }

      if (!isForCancellation && workProgress < 100) {
        throw new Error("Work progress for final delivery must be 100%");
      }

      // Create FormData
      const formData = new FormData();
      formData.append("description", description);
      formData.append("workProgress", workProgress.toString());

      if (cancelTicketId && isForCancellation) {
        formData.append("cancelTicketId", cancelTicketId);
      }

      files.forEach((file) => {
        formData.append("images[]", file);
      });

      // Submit to API
      const response = await fetch(
        `/api/contract/${contract._id}/uploads/final/new`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to upload final delivery");
      }

      const data = await response.json();
      setSuccess(true);

      // Redirect after successful submission
      setTimeout(() => {
        router.push(
          `/dashboard/${contract.artistId}/contracts/${contract._id}/uploads`
        );
        router.refresh();
      }, 1500);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unknown error occurred"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Paper elevation={2} sx={{ p: 3 }}>
      {success ? (
        <Alert severity="success" sx={{ mb: 2 }}>
          {isForCancellation ? "Cancellation proof" : "Final delivery"} upload
          successful! Redirecting...
        </Alert>
      ) : (
        <form onSubmit={handleSubmit}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {/* Cancellation toggle - only show if not explicitly a cancellation upload */}
          {!cancelTicketId && (
            <Box sx={{ mb: 3 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={isForCancellation}
                    onChange={handleCancellationToggle}
                    disabled={isSubmitting}
                  />
                }
                label="This is a cancellation proof (partial work)"
              />

              {isForCancellation && (
                <Alert severity="info" sx={{ mt: 1 }}>
                  For cancellations, you need to specify the percentage of work
                  completed. The contract will be cancelled, and payment will be
                  split according to policy and work completion.
                </Alert>
              )}
            </Box>
          )}

          {/* Cancel ticket information if available */}
          {cancelTicket && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" fontWeight="bold">
                Cancellation Request Details
              </Typography>
              <Typography variant="body2">
                Requested by: {cancelTicket.requestedBy}
              </Typography>
              <Typography variant="body2">
                Status: {cancelTicket.status}
              </Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>
                Reason: {cancelTicket.reason}
              </Typography>
            </Box>
          )}

          {(isForCancellation || cancelTicketId) && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" gutterBottom>
                Work Progress: {workProgress}%
              </Typography>
              <Slider
                value={workProgress}
                onChange={handleProgressChange}
                aria-labelledby="work-progress-slider"
                min={0}
                max={99}
                disabled={isSubmitting}
              />
              <Typography variant="body2" sx={{ mt: 1, fontStyle: "italic" }}>
                For cancellations, please accurately estimate the percentage of
                work completed. This affects how payment will be split.
              </Typography>
            </Box>
          )}

          <Divider sx={{ my: 3 }} />

          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>
              Upload {isForCancellation ? "Current Progress" : "Final Delivery"}{" "}
              Images
            </Typography>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileChange}
              disabled={isSubmitting}
              style={{ marginBottom: "16px" }}
            />

            {previewUrls.length > 0 && (
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 2 }}>
                {previewUrls.map((url, index) => (
                  <Box
                    key={index}
                    component="img"
                    src={url}
                    alt={`Preview ${index}`}
                    sx={{
                      width: 100,
                      height: 100,
                      objectFit: "cover",
                      borderRadius: 1,
                    }}
                  />
                ))}
              </Box>
            )}
          </Box>

          <Box sx={{ mb: 3 }}>
            <TextField
              label="Description"
              multiline
              rows={4}
              fullWidth
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isSubmitting}
              placeholder={
                isForCancellation
                  ? "Describe the current state of the work and any limitations"
                  : "Provide details about the final delivery"
              }
            />
          </Box>

          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={isSubmitting}
            sx={{ minWidth: 120 }}
          >
            {isSubmitting ? (
              <CircularProgress size={24} />
            ) : isForCancellation ? (
              "Upload Cancellation Proof"
            ) : (
              "Upload Final Delivery"
            )}
          </Button>
        </form>
      )}
    </Paper>
  );
}

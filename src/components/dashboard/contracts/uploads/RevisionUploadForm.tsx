// src/components/dashboard/contracts/uploads/RevisionUploadForm.tsx
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
  Divider,
} from "@mui/material";
import { useRouter } from "next/navigation";
import { IContract } from "@/lib/db/models/contract.model";
import { IRevisionTicket } from "@/lib/db/models/ticket.model";

interface RevisionUploadFormProps {
  contract: IContract;
  userId: string;
  ticketId: string;
}

export default function RevisionUploadForm({
  contract,
  userId,
  ticketId,
}: RevisionUploadFormProps) {
  const router = useRouter();
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [ticket, setTicket] = useState<IRevisionTicket | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch ticket details
  useEffect(() => {
    const fetchTicket = async () => {
      try {
        const response = await fetch(
          `/api/contract/${contract._id}/tickets/revision/${ticketId}`
        );
        if (!response.ok) {
          throw new Error("Failed to fetch ticket details");
        }
        const data = await response.json();
        setTicket(data);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "An error occurred while fetching ticket"
        );
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

      // Create FormData
      const formData = new FormData();
      formData.append("description", description);
      formData.append("revisionTicketId", ticketId);

      files.forEach((file) => {
        formData.append("images[]", file);
      });

      // Submit to API
      const response = await fetch(
        `/api/contract/${contract._id}/uploads/revision/new`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to upload revision");
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
        <form onSubmit={handleSubmit}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" fontWeight="bold">
              Revision Request Details
            </Typography>
            <Typography variant="body2">Status: {ticket.status}</Typography>
            {ticket.milestoneIdx !== undefined && (
              <Typography variant="body2">
                For Milestone:{" "}
                {contract.milestones?.[ticket.milestoneIdx]?.title ||
                  `#${ticket.milestoneIdx}`}
              </Typography>
            )}
            <Typography variant="body2" sx={{ mt: 1 }}>
              Client's description:
            </Typography>
            <Typography variant="body2" sx={{ mt: 0.5, mb: 1 }}>
              {ticket.description}
            </Typography>

            {ticket.referenceImages && ticket.referenceImages.length > 0 && (
              <Box>
                <Typography variant="body2">Reference images:</Typography>
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 1 }}>
                  {ticket.referenceImages.map((url, index) => (
                    <Box
                      key={index}
                      component="img"
                      src={url}
                      alt={`Reference ${index}`}
                      sx={{
                        width: 100,
                        height: 100,
                        objectFit: "cover",
                        borderRadius: 1,
                      }}
                    />
                  ))}
                </Box>
              </Box>
            )}
          </Box>

          <Divider sx={{ my: 3 }} />

          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>
              Upload Revised Images
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
              label="Revision Description"
              multiline
              rows={4}
              fullWidth
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isSubmitting}
              placeholder="Explain what changes you've made in this revision"
            />
          </Box>

          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={isSubmitting}
            sx={{ minWidth: 120 }}
          >
            {isSubmitting ? <CircularProgress size={24} /> : "Upload Revision"}
          </Button>
        </form>
      )}
    </Paper>
  );
}

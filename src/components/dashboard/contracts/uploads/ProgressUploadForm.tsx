// src/components/dashboard/contracts/uploads/ProgressUploadForm.tsx
"use client";

import { useState } from "react";
import {
  Box,
  Button,
  TextField,
  Typography,
  Alert,
  CircularProgress,
  Paper,
} from "@mui/material";
import { useRouter } from "next/navigation";
import { IContract } from "@/lib/db/models/contract.model";

interface ProgressUploadFormProps {
  contract: IContract;
  userId: string;
}

export default function ProgressUploadForm({
  contract,
  userId,
}: ProgressUploadFormProps) {
  const router = useRouter();
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

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
      files.forEach((file) => {
        formData.append("images[]", file);
      });

      // Submit to API
      const response = await fetch(
        `/api/contract/${contract._id}/uploads/progress/new`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to upload progress");
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
          Progress upload successful! Redirecting...
        </Alert>
      ) : (
        <form onSubmit={handleSubmit}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>
              Upload Images
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
              placeholder="Provide details about this progress update"
            />
          </Box>

          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={isSubmitting}
            sx={{ minWidth: 120 }}
          >
            {isSubmitting ? <CircularProgress size={24} /> : "Upload Progress"}
          </Button>
        </form>
      )}
    </Paper>
  );
}

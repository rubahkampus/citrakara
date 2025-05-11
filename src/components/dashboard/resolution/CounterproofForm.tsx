// src/components/dashboard/resolution/CounterProofForm
"use client";

import { useState, useRef, useEffect } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Paper,
  Grid,
  IconButton,
} from "@mui/material";
import { useRouter } from "next/navigation";
import CloseIcon from "@mui/icons-material/Close";
import AddPhotoAlternateIcon from "@mui/icons-material/AddPhotoAlternate";

interface CounterproofFormProps {
  ticketId: string;
  onSubmitted: () => void;
  onCancel: () => void;
}

export default function CounterproofForm({
  ticketId,
  onSubmitted,
  onCancel,
}: CounterproofFormProps) {
  const router = useRouter();
  const [description, setDescription] = useState("");
  const [proofImages, setProofImages] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle description change
  const handleDescriptionChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setDescription(event.target.value);
  };

  // Handle file selection
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const selectedFiles: File[] = [];
    const newPreviewUrls: string[] = [];

    // Process each selected file
    Array.from(files).forEach((file) => {
      // Check if file is an image
      if (!file.type.startsWith("image/")) {
        setError("Only image files are allowed");
        return;
      }

      // Check file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        setError("File size exceeds 5MB limit");
        return;
      }

      selectedFiles.push(file);
      newPreviewUrls.push(URL.createObjectURL(file));
    });

    setProofImages([...proofImages, ...selectedFiles]);
    setPreviewUrls([...previewUrls, ...newPreviewUrls]);
  };

  // Remove an image from the selection
  const handleRemoveImage = (index: number) => {
    const updatedFiles = [...proofImages];
    const updatedPreviews = [...previewUrls];

    // Revoke object URL to avoid memory leaks
    URL.revokeObjectURL(updatedPreviews[index]);

    updatedFiles.splice(index, 1);
    updatedPreviews.splice(index, 1);

    setProofImages(updatedFiles);
    setPreviewUrls(updatedPreviews);
  };

  // Open file input dialog
  const handleAddImageClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Submit the counterproof
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    // Validate form
    if (description.trim() === "") {
      setError("Please provide a description of your counterproof");
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      // Create form data for submission
      const formData = new FormData();
      formData.append("counterDescription", description);

      // Add images if any
      proofImages.forEach((file) => {
        formData.append("counterProofImages[]", file);
      });

      // Submit the form
      const response = await fetch(`/api/resolution/${ticketId}/counterproof`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to submit counterproof");
      }

      // Handle success
      setSuccess(true);
      // Call the onSubmitted callback after a short delay
      setTimeout(() => {
        onSubmitted();
      }, 1500);
    } catch (err) {
      console.error("Error submitting counterproof:", err);
      setError(
        err instanceof Error ? err.message : "An unknown error occurred"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Clean up preview URLs on unmount
  useEffect(() => {
    return () => {
      previewUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [previewUrls]);

  return (
    <Box component="form" onSubmit={handleSubmit} noValidate>
      <Typography variant="h6" gutterBottom>
        Submit Counterproof
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Counterproof submitted successfully!
        </Alert>
      )}

      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle2" gutterBottom>
          Your Response
        </Typography>
        <TextField
          required
          fullWidth
          multiline
          rows={6}
          variant="outlined"
          placeholder="Describe your position in response to the claim..."
          value={description}
          onChange={handleDescriptionChange}
          disabled={isSubmitting || success}
          error={!!error && description.trim() === ""}
          helperText="Provide a clear and detailed explanation of your perspective on the dispute."
        />
      </Box>

      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle2" gutterBottom>
          Evidence Images (Optional)
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Add up to 5 images to support your case. Maximum 5MB per image.
        </Typography>

        {/* Hidden file input */}
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileChange}
          ref={fileInputRef}
          style={{ display: "none" }}
          disabled={isSubmitting || success || proofImages.length >= 5}
        />

        {/* Image upload button */}
        <Button
          variant="outlined"
          startIcon={<AddPhotoAlternateIcon />}
          onClick={handleAddImageClick}
          disabled={isSubmitting || success || proofImages.length >= 5}
          sx={{ mb: 2 }}
        >
          Add Images
        </Button>

        {/* Image previews */}
        {previewUrls.length > 0 && (
          <Grid container spacing={2} sx={{ mt: 1 }}>
            {previewUrls.map((url, index) => (
              <Grid item xs={6} sm={4} md={3} key={index}>
                <Paper
                  elevation={1}
                  sx={{ position: "relative", overflow: "hidden", pb: "100%" }}
                >
                  <Box
                    sx={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      height: "100%",
                    }}
                  >
                    <img
                      src={url}
                      alt={`Evidence ${index + 1}`}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                    <IconButton
                      size="small"
                      onClick={() => handleRemoveImage(index)}
                      disabled={isSubmitting || success}
                      sx={{
                        position: "absolute",
                        top: 4,
                        right: 4,
                        backgroundColor: "rgba(0,0,0,0.5)",
                        color: "white",
                        "&:hover": {
                          backgroundColor: "rgba(0,0,0,0.7)",
                        },
                      }}
                    >
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </Paper>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>

      <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2, mt: 4 }}>
        <Button
          variant="outlined"
          onClick={onCancel}
          disabled={isSubmitting || success}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="contained"
          disabled={isSubmitting || success || description.trim() === ""}
        >
          {isSubmitting ? (
            <CircularProgress size={24} sx={{ color: "white" }} />
          ) : (
            "Submit Counterproof"
          )}
        </Button>
      </Box>
    </Box>
  );
}

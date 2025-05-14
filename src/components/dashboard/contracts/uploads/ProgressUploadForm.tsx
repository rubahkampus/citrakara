// src/components/dashboard/contracts/uploads/ProgressUploadForm.tsx
"use client";

import { useState } from "react";
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
  Stack,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import AddPhotoAlternateIcon from "@mui/icons-material/AddPhotoAlternate";
import { IContract } from "@/lib/db/models/contract.model";

interface ProgressUploadFormProps {
  contract: IContract;
  userId: string;
  username: string;
}

interface FormValues {
  description: string;
}

export default function ProgressUploadForm({
  contract,
  userId,
  username,
}: ProgressUploadFormProps) {
  const router = useRouter();
  const [files, setFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

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

      files.forEach((file) => {
        formData.append("images[]", file);
      });

      // Submit to API using axios
      await axiosClient.post(
        `/api/contract/${contract._id}/uploads/progress`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      setSuccess(true);

      // Redirect after successful submission
      setTimeout(() => {
        router.push(`/${username}/dashboard/contracts/${contract._id}/uploads`);
        router.refresh();
      }, 1500);
    } catch (err) {
      if (axios.isAxiosError(err) && err.response) {
        setError(err.response.data.error || "Failed to upload progress");
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
          Unggahan progres berhasil! Mengalihkan...
        </Alert>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {/* Seksi Deskripsi */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Deskripsi Progres
            </Typography>

            <Controller
              name="description"
              control={control}
              rules={{
                required: "Deskripsi diperlukan",
                minLength: {
                  value: 10,
                  message: "Deskripsi harus minimal 10 karakter",
                },
              }}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Deskripsi"
                  multiline
                  rows={4}
                  fullWidth
                  placeholder="Berikan detail tentang pembaruan progres ini"
                  error={!!errors.description}
                  helperText={errors.description?.message}
                  disabled={isSubmitting}
                />
              )}
            />
          </Box>

          {/* Seksi Unggah Gambar */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Unggah Gambar
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Unggah hingga 5 gambar yang menunjukkan progres Anda.
            </Typography>

            <Box sx={{ mb: 2 }}>
              <Button
                component="label"
                variant="outlined"
                startIcon={<AddPhotoAlternateIcon />}
                disabled={isSubmitting || files.length >= 5}
                sx={{ mt: 1 }}
              >
                Tambah Gambar
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
                  {files.length}/5 gambar terpilih
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
                        alt={`Pratinjau ${index}`}
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
                Silakan pilih setidaknya satu gambar untuk diunggah.
              </Alert>
            )}
          </Box>

          {/* Tombol Kirim */}
          <Stack direction="row" spacing={2}>
            <Button
              variant="outlined"
              onClick={() => router.back()}
              disabled={isSubmitting}
            >
              Batal
            </Button>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={isSubmitting || files.length === 0}
              sx={{ minWidth: 120 }}
            >
              {isSubmitting ? <CircularProgress size={24} /> : "Unggah Progres"}
            </Button>
          </Stack>
        </form>
      )}
    </Paper>
  );
}

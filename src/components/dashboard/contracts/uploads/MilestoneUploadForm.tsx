// src/components/dashboard/contracts/uploads/MilestoneUploadForm.tsx
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
  FormControlLabel,
  Checkbox,
  IconButton,
  Grid,
  Divider,
  Stack,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import AddPhotoAlternateIcon from "@mui/icons-material/AddPhotoAlternate";
import { IContract } from "@/lib/db/models/contract.model";

interface MilestoneUploadFormProps {
  contract: IContract;
  userId: string;
  username: string;
  milestoneIdx: number;
  isAllowedFinal: boolean;
}

interface FormValues {
  description: string;
  isFinal: boolean;
}

export default function MilestoneUploadForm({
  contract,
  userId,
  username,
  milestoneIdx,
  isAllowedFinal,
}: MilestoneUploadFormProps) {
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
    watch,
  } = useForm<FormValues>({
    defaultValues: {
      description: "",
      isFinal: false,
    },
  });

  const watchIsFinal = watch("isFinal");

  // Get current milestone information for display
  const milestone = contract.milestones?.[milestoneIdx];

  if (!milestone) {
    return <Alert severity="error">Milestone not found</Alert>;
  }

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
      formData.append("milestoneIdx", milestoneIdx.toString());
      formData.append("isFinal", data.isFinal.toString());

      files.forEach((file) => {
        formData.append("images[]", file);
      });

      // Submit to API using axios
      await axiosClient.post(
        `/api/contract/${contract._id}/uploads/milestone`,
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
        setError(
          err.response.data.error || "Failed to upload milestone progress"
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

  return (
    <Paper elevation={2} sx={{ p: 3 }}>
      {success ? (
        <Alert severity="success" sx={{ mb: 2 }}>
          Unggahan milestone berhasil! Mengalihkan...
        </Alert>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {/* Tampilkan Info Milestone */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Informasi Milestone
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
                {milestone.title} ({milestone.percent}%)
              </Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>
                Status:{" "}
                <span style={{ fontWeight: "bold" }}>{milestone.status}</span>
              </Typography>
            </Box>
          </Box>

          <Divider sx={{ my: 3 }} />

          {/* Bagian Deskripsi */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Deskripsi Progres
            </Typography>

            <Controller
              name="description"
              control={control}
              rules={{
                required: "Deskripsi wajib diisi",
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
                  placeholder="Jelaskan progres Anda pada milestone ini..."
                  error={!!errors.description}
                  helperText={errors.description?.message}
                  disabled={isSubmitting}
                />
              )}
            />
          </Box>

          {/* Bagian Unggah Gambar */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Unggah Gambar
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Unggah hingga 5 gambar yang menunjukkan progres Anda pada
              milestone ini.
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
                Harap pilih setidaknya satu gambar untuk diunggah.
              </Alert>
            )}
          </Box>

          {/* Checkbox Pengiriman Final */}
          <Box sx={{ mb: 3 }}>
            <Controller
              name="isFinal"
              control={control}
              render={({ field }) => (
                <FormControlLabel
                  control={
                    <Checkbox
                      {...field}
                      checked={field.value}
                      onChange={(e) => field.onChange(e.target.checked)}
                      disabled={isSubmitting || !isAllowedFinal}
                    />
                  }
                  label="Ini adalah pengiriman final untuk milestone ini (semua revisi harus selesai terlebih dahulu)"
                />
              )}
            />

            {watchIsFinal && (
              <Alert severity="info" sx={{ mt: 1 }}>
                Dengan menandai ini sebagai final, Anda menunjukkan bahwa
                milestone ini telah selesai dan siap untuk ditinjau oleh klien.
                Klien perlu menerima unggahan ini untuk melanjutkan ke milestone
                berikutnya.
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
              {isSubmitting ? (
                <CircularProgress size={24} />
              ) : (
                "Unggah Milestone"
              )}
            </Button>
          </Stack>
        </form>
      )}
    </Paper>
  );
}

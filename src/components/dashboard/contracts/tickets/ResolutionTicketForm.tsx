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
        return "Permintaan Pembatalan";
      case "revisionTicket":
        return "Permintaan Revisi";
      case "changeTicket":
        return "Permintaan Perubahan";
      case "finalUpload":
        return "Pengiriman Final";
      case "progressMilestone":
        return "Unggahan Progres Milestone";
      case "revisionUpload":
        return "Unggahan Revisi";
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
      // Validasi input
      if (!initialTargetType || !initialTargetId) {
        setError("Informasi target hilang");
        setIsLoading(false);
        return;
      }

      if (!validateMongoId(initialTargetId)) {
        setError("Format ID target tidak valid");
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
                data.requestedBy === "client" ? "Klien" : "Seniman"
              } Memulai`;
              break;
            case "revisionTicket":
              if (data.milestoneIdx !== undefined) {
                label += ` - Milestone ${data.milestoneIdx + 1}`;
              }
              break;
            case "changeTicket":
              label += data.isPaidChange ? " - Perubahan Berbayar" : "";
              break;
            case "finalUpload":
              label += ` - ${data.workProgress}% Selesai`;
              break;
            case "progressMilestoneUpload":
              const pmIndex =
                data.milestoneIdx !== undefined ? data.milestoneIdx : 0;
              const pmTitle =
                contract.milestones && contract.milestones[pmIndex]
                  ? contract.milestones[pmIndex].title
                  : `Milestone ${pmIndex + 1}`;
              label = `${pmTitle} Unggahan Progres`;
              break;
            case "revisionUpload":
              label = "Unggahan Revisi";
              if (data.revisionTicketId) {
                // Jika kita ingin lebih canggih, kita bisa melakukan panggilan API lain untuk mendapatkan detail tiket revisi
                // tetapi untuk kesederhanaan, kita akan hanya menggunakan ID revisi
                label += ` #${data.revisionTicketId.substring(0, 6)}`;
              }
              break;
          }

          setTargetLabel(label);
        } else {
          setError("Tidak dapat menemukan item untuk dipersengketakan");
        }
      } catch (err) {
        console.error("Error saat mengambil detail target:", err);
        setError("Tidak dapat memuat detail untuk item yang dipilih");
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
        setError(
          "Maksimal 5 gambar diperbolehkan. Hanya 5 gambar pertama yang akan digunakan."
        );
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
      // Validasi input
      if (!data.description.trim()) {
        throw new Error(
          "Harap berikan deskripsi yang rinci tentang masalah ini"
        );
      }

      if (!initialTargetType || !initialTargetId) {
        throw new Error("Informasi target hilang");
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
          Permintaan resolusi berhasil diajukan! Mengalihkan...
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
              Tentang Permintaan Resolusi
            </Typography>
            <Typography variant="body2">
              Permintaan resolusi akan ditinjau oleh administrator yang akan
              memeriksa kedua sisi perselisihan dan membuat keputusan akhir.
              Kedua pihak akan memiliki kesempatan untuk memberikan bukti.
            </Typography>
          </Alert>

          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Apa yang Anda perselisihkan?
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
                      <strong>Deskripsi:</strong>{" "}
                      {targetDetails.description.substring(0, 100)}
                      {targetDetails.description.length > 100 && "..."}
                    </Typography>
                  )}
                  <Typography variant="body2" sx={{ color: "text.secondary" }}>
                    <strong>Dibuat:</strong>{" "}
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
              Deskripsi Rinci
            </Typography>
            <Typography variant="body2" sx={{ mb: 2 }}>
              Harap jelaskan masalah ini secara rinci. Jelaskan secara spesifik
              apa yang salah dan mengapa Anda merasa hal ini memerlukan
              intervensi administratif.
            </Typography>

            <Controller
              name="description"
              control={control}
              rules={{
                required: "Deskripsi rinci wajib diisi",
                minLength: {
                  value: 20,
                  message: "Deskripsi harus memiliki setidaknya 20 karakter",
                },
              }}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Description"
                  multiline
                  rows={5}
                  fullWidth
                  placeholder="Jelaskan perselisihan Anda secara rinci..."
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
              Bukti Pendukung
            </Typography>
            <Typography variant="body2" sx={{ mb: 2 }}>
              Unggah tangkapan layar, gambar, atau bukti relevan lainnya untuk
              mendukung kasus Anda. Setidaknya satu gambar diperlukan.
            </Typography>

            <Box sx={{ mb: 2 }}>
              <Button
                component="label"
                variant="outlined"
                startIcon={<AddPhotoAlternateIcon />}
                disabled={isSubmitting || files.length >= 5}
                sx={{ mt: 1 }}
              >
                Tambahkan Gambar
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
                  {files.length}/5 gambar terpilih
                </Typography>
              ) : (
                <Typography
                  variant="caption"
                  color="error"
                  display="block"
                  sx={{ mt: 1 }}
                >
                  Setidaknya satu gambar bukti diperlukan
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
              Mengajukan permintaan resolusi adalah hal yang serius.
              Administrator akan meninjau semua bukti dari kedua pihak sebelum
              membuat keputusan. Pihak lawan akan memiliki waktu 24 jam untuk
              merespons dengan bukti mereka sendiri.
            </Typography>
          </Alert>

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
                "Kirim Permintaan Resolusi"
              )}
            </Button>
          </Stack>
        </form>
      )}
    </Paper>
  );
}

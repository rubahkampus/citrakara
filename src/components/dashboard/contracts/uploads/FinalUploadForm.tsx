// src/components/dashboard/contracts/uploads/FinalUploadForm.tsx
"use client";

import { useState, useEffect } from "react";
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
  Slider,
  FormControlLabel,
  Checkbox,
  IconButton,
  Grid,
  Divider,
  Stack,
  Chip,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import AddPhotoAlternateIcon from "@mui/icons-material/AddPhotoAlternate";
import WarningIcon from "@mui/icons-material/Warning";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { IContract } from "@/lib/db/models/contract.model";
import { ICancelTicket } from "@/lib/db/models/ticket.model";

interface FinalUploadFormProps {
  contract: IContract;
  userId: string;
  username: string;
  cancelTicketId?: string;
}

interface FormValues {
  description: string;
  workProgress: number;
  isForCancellation: boolean;
}

export default function FinalUploadForm({
  contract,
  userId,
  username,
  cancelTicketId,
}: FinalUploadFormProps) {
  const router = useRouter();
  const [files, setFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [cancelTicket, setCancelTicket] = useState<ICancelTicket | null>(null);
  const [activeCancelTicket, setActiveCancelTicket] =
    useState<ICancelTicket | null>(null);

  const axiosClient = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || "",
  });

  // Check if this is a milestone contract
  const isMilestoneContract =
    contract.proposalSnapshot?.listingSnapshot?.flow === "milestone";
  console.log("Is milestone contract:", isMilestoneContract);

  // Check milestone status for milestone contracts
  const incompleteMilestones =
    isMilestoneContract && contract.milestones
      ? contract.milestones.filter(
          (milestone) => milestone.status !== "accepted"
        )
      : [];
  console.log("Incomplete milestones:", incompleteMilestones);

  const allMilestonesComplete =
    isMilestoneContract && incompleteMilestones.length === 0;
  console.log("All milestones complete:", allMilestonesComplete);

  // Calculate default work progress based on contract type
  const calculateDefaultWorkProgress = (): number => {
    console.log("Calculating default work progress...");
    // For cancellation with milestone flow
    if (
      (cancelTicketId || activeCancelTicket) &&
      isMilestoneContract &&
      contract.milestones &&
      contract.milestones.length > 0
    ) {
      // Sum up percentages from completed milestones
      const progress = contract.milestones.reduce((total, milestone) => {
        if (milestone.status === "accepted") {
          return total + milestone.percent;
        }
        return total;
      }, 0);
      console.log("Default work progress (milestone cancellation):", progress);
      return progress;
    }
    // For cancellation with standard flow
    if (cancelTicketId || activeCancelTicket) {
      console.log("Default work progress (standard cancellation): 50");
      return 50; // Default to 50% for standard cancellations
    }
    // For final delivery (not a cancellation)
    console.log("Default work progress (final delivery): 100");
    return 100;
  };

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      description: "",
      workProgress: calculateDefaultWorkProgress(),
      isForCancellation: !!cancelTicketId,
    },
  });

  const watchIsForCancellation = watch("isForCancellation");
  const watchWorkProgress = watch("workProgress");

  // Effect to fetch active cancellation tickets
  useEffect(() => {
    const fetchActiveCancellationTickets = async () => {
      if (cancelTicketId) return; // Skip if we already have a cancelTicketId prop

      try {
        console.log("Fetching active cancellation tickets...");
        const response = await axiosClient.get(
          `/api/contract/${contract._id}/tickets/cancel/active`
        );

        console.log("Active cancellation tickets response:", response.data);

        if (response.data && response.data.length > 0) {
          // If there's a ticket in accepted or forcedAccepted state
          const acceptedTicket = response.data.find(
            (ticket: ICancelTicket) =>
              ticket.status === "accepted" || ticket.status === "forcedAccepted"
          );

          if (acceptedTicket) {
            console.log("Found accepted cancellation ticket:", acceptedTicket);
            setActiveCancelTicket(acceptedTicket);
            // Set form to cancellation mode
            setValue("isForCancellation", true);
            // Calculate default work progress for cancellation
            setValue("workProgress", calculateDefaultWorkProgress());
          }
        } else {
            console.log('No active cancellation ticket')
          }
      } catch (err) {
        console.error("Error fetching active cancellation tickets:", err);
      }
    };

    fetchActiveCancellationTickets();
  }, [contract._id, cancelTicketId, setValue]);

  // Fetch ticket details if this is for a cancellation
  useEffect(() => {
    if (cancelTicketId) {
      const fetchTicket = async () => {
        try {
          console.log("Fetching cancellation ticket details...");
          const response = await axiosClient.get(
            `/api/contract/${contract._id}/tickets/cancel/${cancelTicketId}`
          );
          console.log("Cancellation ticket response:", response.data);

          if (response.data) {
            setCancelTicket(response.data);
            // Set form to cancellation mode
            setValue("isForCancellation", true);
            setValue("workProgress", calculateDefaultWorkProgress());
          }
        } catch (err) {
          console.error(
            "Error fetching cancellation ticket details:",
            axios.isAxiosError(err) && err.response
              ? err.response.data.error
              : err
          );
          setError(
            axios.isAxiosError(err) && err.response
              ? err.response.data.error
              : "An error occurred while fetching ticket"
          );
        }
      };

      fetchTicket();
    }
  }, [contract._id, cancelTicketId, setValue]);

  // Toggle cancellation mode effect
  useEffect(() => {
    console.log(
      "Toggling cancellation mode:",
      "isForCancellation:",
      watchIsForCancellation,
      "workProgress:",
      watchWorkProgress
    );

    if (watchIsForCancellation && watchWorkProgress === 100) {
      console.log("Switching to cancellation mode, adjusting work progress...");
      setValue(
        "workProgress",
        cancelTicketId ? calculateDefaultWorkProgress() : 100
      );
    } else if (!watchIsForCancellation && watchWorkProgress < 100) {
      console.log(
        "Switching to final delivery mode, setting work progress to 100..."
      );
      setValue("workProgress", 100);
    }
  }, [watchIsForCancellation, setValue, watchWorkProgress, cancelTicketId]);

  // Handle file input change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);

      console.log("Selected files:", selectedFiles);

      // Enforce the 5 file limit
      const totalFiles = [...files, ...selectedFiles];
      const limitedFiles = totalFiles.slice(0, 5);

      if (totalFiles.length > 5) {
        console.warn(
          "Maximum 5 images allowed. Only the first 5 will be used."
        );
        setError("Maximum 5 images allowed. Only the first 5 will be used.");
        setTimeout(() => setError(null), 3000);
      }

      setFiles(limitedFiles);

      // Create and set preview URLs
      const newPreviewUrls = limitedFiles.map((file) =>
        URL.createObjectURL(file)
      );

      console.log("New preview URLs:", newPreviewUrls);

      // Revoke previous URLs to avoid memory leaks
      previewUrls.forEach((url) => {
        console.log("Revoking URL:", url);
        URL.revokeObjectURL(url);
      });
      setPreviewUrls(newPreviewUrls);
    }
  };

  // Remove a file and its preview
  const removeFile = (index: number) => {
    URL.revokeObjectURL(previewUrls[index]);

    setFiles(files.filter((_, i) => i !== index));
    setPreviewUrls(previewUrls.filter((_, i) => i !== index));
  };

  // Get display ticket (from either source)
  const displayTicket = cancelTicket || activeCancelTicket;

  const getRequestedBy = (ticket?: ICancelTicket): string => {
    if (!ticket || !ticket.requestedBy) return "";
    return ticket.requestedBy === "client" ? "Klien" : "Seniman";
  };

  const getReason = (ticket?: ICancelTicket): string => {
    if (!ticket) return "";
    return ticket.reason || "";
  };

  // Format ticket status for display
  const formatStatus = (status: string | undefined): string => {
    if (!status) return "";
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  // Handle form submission
  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    setError(null);
    try {
      // Validasi input
      if (files.length === 0) {
        throw new Error("Harap pilih setidaknya satu gambar untuk diunggah");
      }

      if (data.isForCancellation && data.workProgress >= 100) {
        throw new Error(
          "Progres pekerjaan untuk pembatalan harus kurang dari 100%"
        );
      }

      if (!data.isForCancellation && data.workProgress < 100) {
        throw new Error("Progres pekerjaan untuk pengiriman final harus 100%");
      }

      // Untuk alur milestone unggahan final (bukan pembatalan), pastikan semua milestone telah diselesaikan
      if (
        !data.isForCancellation &&
        contract.milestones &&
        contract.milestones.length > 0 &&
        contract.proposalSnapshot?.listingSnapshot?.flow === "milestone"
      ) {
        const incompleteMilestones = contract.milestones.filter(
          (milestone) => milestone.status !== "accepted"
        );

        if (incompleteMilestones.length > 0) {
          throw new Error(
            "Semua milestone harus diselesaikan dan diterima sebelum mengirimkan pengiriman final"
          );
        }
      }

      // Create FormData
      const formData = new FormData();
      formData.append("description", data.description);
      formData.append("workProgress", data.workProgress.toString());

      // Add cancelTicketId from props if available
      if (cancelTicketId && data.isForCancellation) {
        formData.append("cancelTicketId", cancelTicketId);
      }
      // Or use the active cancel ticket ID if found
      else if (activeCancelTicket && data.isForCancellation) {
        formData.append("cancelTicketId", activeCancelTicket._id.toString());
      }

      files.forEach((file) => {
        formData.append("images[]", file);
      });

      for (var pair of formData.entries()) {
        console.log('fd');
        console.log(pair[0] + ", " + pair[1]);
      } // Debugging line

      // Submit to API using axios
      // await axiosClient.post(
      //   `/api/contract/${contract._id}/uploads/final/new`,
      //   formData,
      //   {
      //     headers: { "Content-Type": "multipart/form-data" },
      //   }
      // );

      // setSuccess(true);

      // // Redirect after successful submission
      // setTimeout(() => {
      //   router.push(`/${username}/dashboard/contracts/${contract._id}/uploads`);
      //   router.refresh();
      // }, 1500);
    } catch (err) {
      if (axios.isAxiosError(err) && err.response) {
        setError(err.response.data.error || "Failed to upload final delivery");
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
          {watchIsForCancellation ? "Bukti Pembatalan" : "Pengiriman Final"}{" "}
          unggahan berhasil! Mengalihkan...
        </Alert>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {/* Peringatan Status Milestone */}
          {isMilestoneContract &&
            !watchIsForCancellation &&
            !allMilestonesComplete && (
              <Alert severity="warning" icon={<WarningIcon />} sx={{ mb: 3 }}>
                <Typography variant="body1" fontWeight="medium">
                  Semua milestone harus diselesaikan sebelum pengiriman final
                </Typography>
                <Typography variant="body2">
                  {incompleteMilestones.length} dari{" "}
                  {contract.milestones?.length} milestone belum lengkap. Anda
                  hanya bisa mengirimkan pengiriman final setelah semua
                  milestone diterima.
                </Typography>
              </Alert>
            )}

          {/* Status Milestone Sukses */}
          {isMilestoneContract &&
            !watchIsForCancellation &&
            allMilestonesComplete && (
              <Alert
                severity="success"
                icon={<CheckCircleIcon />}
                sx={{ mb: 3 }}
              >
                <Typography variant="body1" fontWeight="medium">
                  Semua milestone selesai!
                </Typography>
                <Typography variant="body2">
                  Semua {contract.milestones?.length} milestone telah diterima.
                  Anda sekarang dapat mengirimkan pengiriman final Anda.
                </Typography>
              </Alert>
            )}

          {/* Informasi Jenis Kontrak */}
          <Box sx={{ mb: 3 }}>
            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
              sx={{ mb: 2 }}
            >
              <Typography variant="h6" fontWeight="bold">
                {watchIsForCancellation
                  ? "Bukti Pembatalan"
                  : "Pengiriman Final"}
              </Typography>

              {isMilestoneContract ? (
                <Chip
                  label="Kontrak Milestone"
                  color="primary"
                  variant="outlined"
                  size="small"
                />
              ) : (
                <Chip
                  label="Kontrak Standar"
                  color="secondary"
                  variant="outlined"
                  size="small"
                />
              )}
            </Stack>

            {/* Bagian Jenis Unggahan */}
            <Box sx={{ mb: 3 }}>
              {/* Toggle Pembatalan - hanya tampil jika bukan unggahan pembatalan dan tidak ada tiket aktif */}
              {!cancelTicketId && !activeCancelTicket && (
                <Box sx={{ mb: 2 }}>
                  <Controller
                    name="isForCancellation"
                    control={control}
                    render={({ field }) => (
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={field.value}
                            onChange={(e) => field.onChange(e.target.checked)}
                            disabled={isSubmitting}
                          />
                        }
                        label="Ini adalah bukti pembatalan (pekerjaan parsial)"
                      />
                    )}
                  />

                  {watchIsForCancellation && (
                    <Alert severity="info" sx={{ mt: 1 }}>
                      Untuk pembatalan, Anda perlu menentukan persentase
                      pekerjaan yang telah diselesaikan. Kontrak akan
                      dibatalkan, dan pembayaran akan dibagi sesuai kebijakan
                      dan penyelesaian pekerjaan.
                    </Alert>
                  )}
                </Box>
              )}

              {/* Pemberitahuan Tiket Pembatalan Aktif */}
              {activeCancelTicket && (
                <Alert severity="warning" sx={{ mb: 2 }}>
                  <Typography variant="body1" fontWeight="medium">
                    Unggahan Pembatalan Diperlukan
                  </Typography>
                  <Typography variant="body2">
                    Permintaan pembatalan yang diterima mengharuskan Anda untuk
                    mengunggah bukti progres Anda. Ini akan dianggap sebagai
                    bukti pembatalan.
                  </Typography>
                </Alert>
              )}

              {/* Informasi tiket pembatalan jika tersedia */}
              {displayTicket && (
                <Box
                  sx={{
                    mb: 2,
                    p: 2,
                    bgcolor: "background.paper",
                    borderRadius: 1,
                    border: "1px solid",
                    borderColor: "divider",
                  }}
                >
                  <Typography
                    variant="subtitle1"
                    fontWeight="bold"
                    gutterBottom
                  >
                    Detail Permintaan Pembatalan
                  </Typography>
                  <Grid container spacing={1}>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Diminta oleh:
                      </Typography>
                      <Typography variant="body2" fontWeight="medium">
                        {getRequestedBy(displayTicket)}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Status:
                      </Typography>
                      <Typography variant="body2" fontWeight="medium">
                        {formatStatus(displayTicket.status)}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sx={{ mt: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Alasan:
                      </Typography>
                      <Typography variant="body2">
                        {getReason(displayTicket)}
                      </Typography>
                    </Grid>
                  </Grid>
                </Box>
              )}
            </Box>

            {/* Bagian Progres Pekerjaan - hanya untuk pembatalan */}
            {(watchIsForCancellation ||
              cancelTicketId ||
              activeCancelTicket) && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  Progres Pekerjaan
                </Typography>

                {isMilestoneContract && (
                  <Alert severity="info" sx={{ mb: 2 }}>
                    <Typography variant="body2">
                      Progres default berdasarkan milestone yang diselesaikan (
                      {calculateDefaultWorkProgress()}%). Anda dapat
                      menyesuaikan ini jika diperlukan.
                    </Typography>
                  </Alert>
                )}

                <Controller
                  name="workProgress"
                  control={control}
                  rules={{
                    validate: (value) =>
                      (watchIsForCancellation && value < 100) ||
                      (!watchIsForCancellation && value === 100) ||
                      "Progres pekerjaan harus kurang dari 100% untuk pembatalan dan tepat 100% untuk pengiriman final",
                  }}
                  render={({ field }) => (
                    <Box>
                      <Typography gutterBottom>
                        Progres Saat Ini: {field.value}%
                      </Typography>
                      <Slider
                        value={field.value}
                        onChange={(_, newValue) => field.onChange(newValue)}
                        aria-labelledby="work-progress-slider"
                        min={0}
                        max={watchIsForCancellation ? 99 : 100}
                        disabled={isSubmitting}
                        sx={{ mb: 2 }}
                      />
                      {errors.workProgress && (
                        <Typography color="error" variant="caption">
                          {errors.workProgress.message}
                        </Typography>
                      )}
                    </Box>
                  )}
                />

                <Typography
                  variant="body2"
                  sx={{ fontStyle: "italic", color: "text.secondary" }}
                >
                  Untuk pembatalan, harap perkirakan secara akurat persentase
                  pekerjaan yang telah diselesaikan. Ini akan mempengaruhi
                  bagaimana pembayaran akan dibagi.
                </Typography>
              </Box>
            )}
          </Box>

          <Divider sx={{ my: 3 }} />

          {/* Bagian Unggah Gambar */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Unggah{" "}
              {watchIsForCancellation ? "Progres Saat Ini" : "Pengiriman Final"}{" "}
              Gambar
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Unggah hingga 5 gambar yang menunjukkan{" "}
              {watchIsForCancellation ? "progres saat ini" : "pengiriman final"}{" "}
              Anda.
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

          {/* Bagian Deskripsi */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Deskripsi
            </Typography>

            <Controller
              name="description"
              control={control}
              rules={{
                required: "Deskripsi wajib diisi",
                minLength: {
                  value: 10,
                  message: "Deskripsi harus memiliki setidaknya 10 karakter",
                },
              }}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Deskripsi"
                  multiline
                  rows={4}
                  fullWidth
                  placeholder={
                    watchIsForCancellation
                      ? "Jelaskan kondisi pekerjaan saat ini dan keterbatasannya"
                      : "Berikan detail tentang pengiriman final"
                  }
                  error={!!errors.description}
                  helperText={errors.description?.message}
                  disabled={isSubmitting}
                />
              )}
            />
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
              disabled={
                isSubmitting ||
                files.length === 0 ||
                (isMilestoneContract &&
                  !watchIsForCancellation &&
                  !allMilestonesComplete)
              }
              sx={{ minWidth: 120 }}
            >
              {isSubmitting ? (
                <CircularProgress size={24} />
              ) : watchIsForCancellation ? (
                "Unggah Bukti Pembatalan"
              ) : (
                "Unggah Pengiriman Final"
              )}
            </Button>
          </Stack>

          {/* Catatan berguna ketika kirim dinonaktifkan karena milestone yang belum lengkap */}
          {isMilestoneContract &&
            !watchIsForCancellation &&
            !allMilestonesComplete && (
              <Typography
                variant="caption"
                color="error"
                sx={{ display: "block", mt: 2, textAlign: "center" }}
              >
                Selesaikan semua milestone sebelum mengirim pengiriman final
              </Typography>
            )}
        </form>
      )}
    </Paper>
  );
}

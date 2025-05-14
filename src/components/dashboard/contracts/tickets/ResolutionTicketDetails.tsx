// src/components/dashboard/contracts/tickets/ResolutionTicketDetails.tsx
"use client";

import { useState, useEffect } from "react";
import {
  Box,
  Paper,
  Typography,
  Button,
  Alert,
  CircularProgress,
  Divider,
  Chip,
  TextField,
  Grid,
  Stack,
  Card,
  CardMedia,
  CardContent,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from "@mui/material";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm, Controller } from "react-hook-form";
import { axiosClient } from "@/lib/utils/axiosClient";
import { IResolutionTicket } from "@/lib/db/models/ticket.model";

// Icons
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ImageIcon from "@mui/icons-material/Image";
import InfoIcon from "@mui/icons-material/Info";
import AddPhotoAlternateIcon from "@mui/icons-material/AddPhotoAlternate";
import DeleteIcon from "@mui/icons-material/Delete";
import GavelIcon from "@mui/icons-material/Gavel";
import CancelIcon from "@mui/icons-material/Cancel";

interface ResolutionTicketDetailsProps {
  ticket: IResolutionTicket;
  userId: string;
  contractId: string;
  isArtist: boolean;
  isClient: boolean;
}

interface CounterproofFormValues {
  counterDescription: string;
}

export default function ResolutionTicketDetails({
  ticket,
  userId,
  contractId,
  isArtist,
  isClient,
}: ResolutionTicketDetailsProps) {
  const router = useRouter();
  const [files, setFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<string>("");

  // Determine if user is the submitter or counterparty
  const isSubmitter = ticket.submittedById.toString() === userId;
  const isCounterparty =
    !isSubmitter &&
    ((ticket.submittedBy === "client" && isArtist) ||
      (ticket.submittedBy === "artist" && isClient));

  // React Hook Form setup for counterproof submission
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<CounterproofFormValues>({
    defaultValues: {
      counterDescription: "",
    },
  });

  // Calculate and update time remaining until counterproof deadline
  useEffect(() => {
    if (ticket && ticket.counterExpiresAt && ticket.status === "open") {
      const updateTimeRemaining = () => {
        const now = new Date();
        const expiresAt = new Date(ticket.counterExpiresAt);
        const diff = expiresAt.getTime() - now.getTime();

        if (diff <= 0) {
          setTimeRemaining("Expired");
          return;
        }

        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        setTimeRemaining(`${hours}h ${minutes}m remaining`);
      };

      updateTimeRemaining();
      const interval = setInterval(updateTimeRemaining, 60000); // Update every minute

      return () => clearInterval(interval);
    }
  }, [ticket]);

  // Format date for display
  const formatDate = (date?: string | Date) => {
    if (!date) return "N/A";
    const parsedDate = typeof date === "string" ? new Date(date) : date;
    return parsedDate.toLocaleString();
  };

  // Handle file input change for counterproof
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

  // Submit counterproof
  const onSubmitCounterproof = async (data: CounterproofFormValues) => {
    setIsSubmitting(true);
    setError(null);

    try {
      // Create FormData
      const formData = new FormData();
      formData.append("counterDescription", data.counterDescription);

      // Add counterproof images
      files.forEach((file) => {
        formData.append("counterProofImages[]", file);
      });

      // Submit to API using axios
      await axiosClient.post(
        `/api/resolution/${ticket._id}/counterproof`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      setSuccess(true);

      // Refresh the page after successful submission
      setTimeout(() => {
        router.refresh();
      }, 1500);
    } catch (err: any) {
      setError(
        err.response?.data?.error || err.message || "An unknown error occurred"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle cancellation of ticket (only for submitter)
  const handleCancelTicket = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      await axiosClient.post(`/api/resolution/${ticket._id}/cancel`);
      setSuccess(true);
      setShowCancelDialog(false);

      // Refresh the page after successful cancellation
      setTimeout(() => {
        router.refresh();
      }, 1500);
    } catch (err: any) {
      setError(
        err.response?.data?.error || err.message || "An unknown error occurred"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Determine if user can submit counterproof
  const canSubmitCounterproof = () => {
    return (
      isCounterparty &&
      ticket.status === "open" &&
      !ticket.counterDescription &&
      new Date(ticket.counterExpiresAt) > new Date()
    );
  };

  // Determine if user can cancel the ticket
  const canCancelTicket = () => {
    return (
      isSubmitter &&
      (ticket.status === "open" || ticket.status === "awaitingReview")
    );
  };

  // Check if past counterproof deadline
  const isPastCounterDeadline =
    ticket.status === "open" && new Date(ticket.counterExpiresAt) < new Date();

  // Get status color based on status
  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "primary";
      case "awaitingReview":
        return "warning";
      case "resolved":
        return ticket.decision === "favorClient"
          ? isClient
            ? "success"
            : "error"
          : isArtist
          ? "success"
          : "error";
      case "cancelled":
        return "default";
      default:
        return "default";
    }
  };

  // Mendapatkan status yang mudah dibaca
  const getReadableStatus = (status: string) => {
    switch (status) {
      case "open":
        return "Terbuka - Menunggu Bukti Tandingan";
      case "awaitingReview":
        return "Menunggu Tinjauan Admin";
      case "resolved":
        return ticket.decision === "favorClient"
          ? "Diselesaikan Mendukung Klien"
          : "Diselesaikan Mendukung Seniman";
      case "cancelled":
        return "Dibatalkan";
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  // Get target type display name
  const getTargetTypeDisplay = (type: string) => {
    switch (type) {
      case "cancelTicket":
        return "Permintaan Pembatalan";
      case "revisionTicket":
        return "Permintaan Revisi";
      case "changeTicket":
        return "Permintaan Perubahan";
      case "finalUpload":
        return "Pengiriman Final";
      case "progressMilestoneUpload":
        return "Unggahan Progres Milestone";
      case "revisionUpload":
        return "Unggahan Revisi";
      default:
        return type.charAt(0).toUpperCase() + type.slice(1);
    }
  };

  // Get target URL for viewing the disputed item
  const getTargetUrl = () => {
    switch (ticket.targetType) {
      case "cancelTicket":
      case "revisionTicket":
      case "changeTicket":
        return `/dashboard/${userId}/contracts/${contractId}/tickets/${ticket.targetType}/${ticket.targetId}`;
      case "finalUpload":
        return `/dashboard/${userId}/contracts/${contractId}/uploads/final/${ticket.targetId}`;
      case "progressMilestoneUpload":
        return `/dashboard/${userId}/contracts/${contractId}/uploads/milestone/${ticket.targetId}`;
      case "revisionUpload":
        return `/dashboard/${userId}/contracts/${contractId}/uploads/revision/${ticket.targetId}`;
      default:
        return `/dashboard/${userId}/contracts/${contractId}`;
    }
  };

  return (
    <Paper elevation={2} sx={{ p: 3 }}>
      {/* Header Section with Status */}
      <Box
        sx={{
          mb: 3,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}
      >
        <Box>
          <Typography variant="h5" gutterBottom fontWeight="medium">
            Permintaan Resolusi: {getTargetTypeDisplay(ticket.targetType)}
          </Typography>

          <Stack direction="row" spacing={2} alignItems="center" sx={{ mt: 1 }}>
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <CalendarTodayIcon
                sx={{ fontSize: 18, mr: 0.5, color: "text.secondary" }}
              />
              <Typography variant="body2" color="text.secondary">
                Dibuat: {formatDate(ticket.createdAt)}
              </Typography>
            </Box>

            {ticket.status === "open" && (
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <AccessTimeIcon
                  sx={{
                    fontSize: 18,
                    mr: 0.5,
                    color: isPastCounterDeadline ? "error.main" : "info.main",
                  }}
                />
                <Typography
                  variant="body2"
                  color={isPastCounterDeadline ? "error" : "text.secondary"}
                >
                  Bukti tandingan:{" "}
                  {isPastCounterDeadline ? "Kedaluwarsa" : timeRemaining}
                </Typography>
              </Box>
            )}

            {ticket.status === "resolved" && ticket.resolvedAt && (
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <GavelIcon
                  sx={{ fontSize: 18, mr: 0.5, color: "success.main" }}
                />
                <Typography variant="body2" color="text.secondary">
                  Diselesaikan: {formatDate(ticket.resolvedAt)}
                </Typography>
              </Box>
            )}
          </Stack>
        </Box>

        <Chip
          label={getReadableStatus(ticket.status)}
          color={getStatusColor(ticket.status)}
          sx={{ fontWeight: "medium", px: 1 }}
        />
      </Box>

      {/* Pesan Peringatan */}
      {ticket.status === "open" && !isPastCounterDeadline && isCounterparty && (
        <Alert severity="info" sx={{ mb: 3 }} icon={<AccessTimeIcon />}>
          <Typography variant="body2">
            Anda memiliki waktu hingga {formatDate(ticket.counterExpiresAt)}{" "}
            untuk mengajukan bukti tandingan. Setelah tenggat waktu ini,
            resolusi akan dilanjutkan ke tinjauan admin.
          </Typography>
        </Alert>
      )}

      {ticket.status === "open" && isPastCounterDeadline && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          <Typography variant="body2">
            Tenggat waktu bukti tandingan telah lewat. Resolusi ini sekarang
            akan dilanjutkan ke tinjauan admin.
          </Typography>
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }} icon={<CheckCircleIcon />}>
          <Typography variant="body2">
            {isSubmitting
              ? "Memproses permintaan Anda..."
              : "Permintaan Anda telah diproses dengan sukses."}
          </Typography>
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Divider sx={{ mb: 3 }} />

      {/* Area Konten Utama */}
      <Grid container spacing={3}>
        {/* Kolom Kiri: Detail Resolusi */}
        <Grid item xs={12} md={7}>
          {/* Posisi Pengirim */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom fontWeight="medium">
              {isSubmitter
                ? "Posisi Anda"
                : ticket.submittedBy === "client"
                ? "Posisi Klien"
                : "Posisi Seniman"}{" "}
            </Typography>

            <Paper
              variant="outlined"
              sx={{ p: 2, borderRadius: 1, bgcolor: "background.paper", mb: 2 }}
            >
              <Typography variant="body1" sx={{ whiteSpace: "pre-line" }}>
                {ticket.description}
              </Typography>
            </Paper>

            {/* Gambar Bukti */}
            {ticket.proofImages && ticket.proofImages.length > 0 && (
              <Grid container spacing={2}>
                {ticket.proofImages.map((url, index) => (
                  <Grid item xs={12} sm={6} key={index}>
                    <Card variant="outlined" sx={{ height: "100%" }}>
                      <CardMedia
                        component="img"
                        image={url}
                        alt={`Bukti ${index + 1}`}
                        sx={{
                          height: 200,
                          objectFit: "cover",
                        }}
                        onClick={() => window.open(url, "_blank")}
                      />
                      <CardContent sx={{ p: 1, "&:last-child": { pb: 1 } }}>
                        <Typography variant="caption" color="text.secondary">
                          Gambar Bukti {index + 1}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </Box>

          {/* Respon Pihak Lawan - hanya ditampilkan jika diberikan */}
          {ticket.counterDescription && (
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" gutterBottom fontWeight="medium">
                {isCounterparty
                  ? "Respon Anda"
                  : ticket.counterparty === "client"
                  ? "Respon Klien"
                  : "Respon Seniman"}{" "}
              </Typography>

              <Paper
                variant="outlined"
                sx={{
                  p: 2,
                  borderRadius: 1,
                  bgcolor: "background.paper",
                  mb: 2,
                }}
              >
                <Typography variant="body1" sx={{ whiteSpace: "pre-line" }}>
                  {ticket.counterDescription}
                </Typography>
              </Paper>

              {/* Counterproof Images */}
              {ticket.counterProofImages &&
                ticket.counterProofImages.length > 0 && (
                  <Grid container spacing={2}>
                    {ticket.counterProofImages.map((url, index) => (
                      <Grid item xs={12} sm={6} key={index}>
                        <Card variant="outlined" sx={{ height: "100%" }}>
                          <CardMedia
                            component="img"
                            image={url}
                            alt={`Counter Evidence ${index + 1}`}
                            sx={{
                              height: 200,
                              objectFit: "cover",
                            }}
                            onClick={() => window.open(url, "_blank")}
                          />
                          <CardContent sx={{ p: 1, "&:last-child": { pb: 1 } }}>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              Gambar Bukti Tandingan {index + 1}
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                )}
            </Box>
          )}

          {/* Admin Decision - only shown if resolved */}
          {ticket.status === "resolved" && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom fontWeight="medium">
                Keputusan Admin
              </Typography>

              <Paper
                variant="outlined"
                sx={{
                  p: 2,
                  borderRadius: 1,
                  bgcolor:
                    ticket.decision === "favorClient"
                      ? isClient
                        ? "success.50"
                        : "error.50"
                      : isArtist
                      ? "success.50"
                      : "error.50",
                  borderColor:
                    ticket.decision === "favorClient"
                      ? isClient
                        ? "success.200"
                        : "error.200"
                      : isArtist
                      ? "success.200"
                      : "error.200",
                  mb: 2,
                }}
              >
                <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                  Keputusan:{" "}
                  {ticket.decision === "favorClient"
                    ? "Mendukung klien"
                    : "Mendukung seniman"}
                </Typography>
                {ticket.resolutionNote && (
                  <Typography variant="body1" sx={{ whiteSpace: "pre-line" }}>
                    {ticket.resolutionNote}
                  </Typography>
                )}
              </Paper>
            </Box>
          )}

          {/* Informasi status: Langkah selanjutnya berdasarkan status tiket */}
          {ticket.status === "open" &&
            !canSubmitCounterproof() &&
            !isSubmitter && (
              <Box sx={{ mb: 3 }}>
                <Alert severity="info" sx={{ mb: 2 }} icon={<InfoIcon />}>
                  <Typography variant="body2">
                    Menunggu{" "}
                    {ticket.counterparty === "client" ? "klien" : "seniman"}{" "}
                    untuk memberikan bukti tandingan. Jika tidak ada respons
                    yang diterima sebelum {formatDate(ticket.counterExpiresAt)},
                    resolusi ini akan otomatis dilanjutkan ke tinjauan admin.
                  </Typography>
                </Alert>
              </Box>
            )}

          {ticket.status === "awaitingReview" && (
            <Box sx={{ mb: 3 }}>
              <Alert severity="info" sx={{ mb: 2 }} icon={<InfoIcon />}>
                <Typography variant="body2">
                  Resolusi ini sekarang sedang dalam tinjauan tim admin kami.
                  Anda akan diberi tahu setelah keputusan dibuat.
                </Typography>
              </Alert>
            </Box>
          )}

          {/* Tombol pembatalan untuk pengirim jika tiket masih terbuka atau dalam tinjauan */}
          {canCancelTicket() && (
            <Box sx={{ mt: 4 }}>
              <Divider sx={{ mb: 3 }} />
              <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
                Batalkan permintaan resolusi ini
              </Typography>
              <Button
                variant="outlined"
                color="error"
                startIcon={<CancelIcon />}
                onClick={() => setShowCancelDialog(true)}
                disabled={isSubmitting}
              >
                Batalkan Permintaan Resolusi
              </Button>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: "block", mt: 1 }}
              >
                Gunakan ini hanya jika masalah telah diselesaikan langsung
                antara Anda dan {ticket.counterparty}.
              </Typography>
            </Box>
          )}
        </Grid>

        {/* Kolom Kanan: Formulir Pengajuan Bukti Tandingan atau Detail Item Target */}
        <Grid item xs={12} md={5}>
          {/* Formulir Pengajuan Bukti Tandingan - Hanya ditampilkan untuk pihak lawan jika masih terbuka dan belum ada bukti tandingan */}
          {canSubmitCounterproof() ? (
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom fontWeight="medium">
                Kirimkan Respon Anda
              </Typography>

              <Alert severity="info" sx={{ mb: 3 }} icon={<InfoIcon />}>
                <Typography variant="body2">
                  Harap berikan perspektif Anda tentang masalah ini. Anda
                  memiliki waktu hingga {formatDate(ticket.counterExpiresAt)}{" "}
                  untuk merespons.
                </Typography>
              </Alert>

              <form onSubmit={handleSubmit(onSubmitCounterproof)}>
                <Box sx={{ mb: 3 }}>
                  <Controller
                    name="counterDescription"
                    control={control}
                    rules={{
                      required: "Respon Anda wajib diisi",
                      minLength: {
                        value: 20,
                        message:
                          "Deskripsi harus memiliki setidaknya 20 karakter",
                      },
                    }}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Your Response"
                        multiline
                        rows={4}
                        fullWidth
                        placeholder="Provide your side of the story..."
                        error={!!errors.counterDescription}
                        helperText={errors.counterDescription?.message}
                        disabled={isSubmitting}
                        sx={{ mb: 2 }}
                      />
                    )}
                  />
                </Box>
                {/* Unggah gambar bukti */}
                <Box sx={{ mb: 3 }}>
                  <Typography
                    variant="subtitle2"
                    gutterBottom
                    fontWeight="medium"
                  >
                    Bukti Pendukung
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    gutterBottom
                  >
                    Unggah gambar untuk mendukung posisi Anda (maksimal 5
                    gambar)
                  </Typography>

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
                    <Typography
                      variant="caption"
                      display="block"
                      sx={{ mt: 1 }}
                    >
                      {files.length}/5 gambar terpilih
                    </Typography>
                  )}

                  {previewUrls.length > 0 && (
                    <Grid container spacing={1} sx={{ mt: 1 }}>
                      {previewUrls.map((url, index) => (
                        <Grid item xs={6} key={index}>
                          <Box sx={{ position: "relative" }}>
                            <Box
                              component="img"
                              src={url}
                              alt={`Tampilan Bukti ${index + 1}`}
                              sx={{
                                width: "100%",
                                height: 100,
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

                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <CircularProgress size={24} />
                  ) : (
                    "Kirim Respon"
                  )}
                </Button>
              </form>
            </Box>
          ) : (
            /* Target Item Information */
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom fontWeight="medium">
                Informasi Resolusi
              </Typography>

              <Paper
                variant="outlined"
                sx={{
                  p: 2,
                  borderRadius: 1,
                  bgcolor: "background.paper",
                  mb: 2,
                }}
              >
                <Stack spacing={2}>
                  <Box>
                    <Typography variant="subtitle2" gutterBottom>
                      Jenis
                    </Typography>
                    <Typography variant="body2">
                      {getTargetTypeDisplay(ticket.targetType)}
                    </Typography>
                  </Box>

                  <Box>
                    <Typography variant="subtitle2" gutterBottom>
                      Dikirim Oleh
                    </Typography>
                    <Typography variant="body2">
                      {isSubmitter
                        ? "Anda"
                        : ticket.submittedBy === "client"
                        ? "Klien"
                        : "Seniman"}
                    </Typography>
                  </Box>

                  <Box>
                    <Typography variant="subtitle2" gutterBottom>
                      Pihak Lawan
                    </Typography>
                    <Typography variant="body2">
                      {isCounterparty
                        ? "Anda"
                        : ticket.counterparty === "client"
                        ? "Klien"
                        : "Seniman"}
                    </Typography>
                  </Box>

                  <Box>
                    <Typography variant="subtitle2" gutterBottom>
                      Kontrak
                    </Typography>
                    <Button
                      variant="text"
                      size="small"
                      component={Link}
                      href={`/dashboard/${userId}/contracts/${contractId}`}
                    >
                      Lihat Kontrak
                    </Button>
                  </Box>

                  <Box>
                    <Typography variant="subtitle2" gutterBottom>
                      Item yang Dipersengketakan
                    </Typography>
                    <Button
                      variant="text"
                      size="small"
                      component={Link}
                      href={getTargetUrl()}
                    >
                      Lihat {getTargetTypeDisplay(ticket.targetType)}
                    </Button>
                  </Box>
                </Stack>
              </Paper>

              <Alert
                severity={ticket.status === "resolved" ? "info" : "warning"}
                sx={{ mb: 2 }}
              >
                <Typography variant="body2">
                  {ticket.status === "resolved"
                    ? "Resolusi ini telah diputuskan oleh tim admin kami."
                    : ticket.status === "cancelled"
                    ? "Permintaan resolusi ini telah dibatalkan."
                    : ticket.status === "awaitingReview"
                    ? "Resolusi ini sedang dalam tinjauan oleh tim admin kami. Anda akan diberi tahu setelah keputusan dibuat."
                    : "Permintaan resolusi membantu menyelesaikan perselisihan antara klien dan seniman dengan bantuan tim admin kami."}
                </Typography>
              </Alert>
            </Box>
          )}
        </Grid>
      </Grid>

      {/* Cancel Resolution Dialog */}
      <Dialog
        open={showCancelDialog}
        onClose={() => setShowCancelDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <CancelIcon sx={{ mr: 1, color: "error.main" }} />
            Batalkan Permintaan Resolusi?
          </Box>
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Apakah Anda yakin ingin membatalkan permintaan resolusi ini? Ini
            hanya boleh dilakukan jika:
            <ul>
              <li>
                Masalah telah diselesaikan langsung antara Anda dan{" "}
                {ticket.counterparty}
              </li>
              <li>Anda tidak ingin melanjutkan resolusi ini</li>
            </ul>
            Tindakan ini tidak dapat dibatalkan. Jika diperlukan, Anda harus
            membuat tiket resolusi baru.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCancelDialog(false)} color="inherit">
            Tidak, Pertahankan
          </Button>
          <Button
            onClick={handleCancelTicket}
            color="error"
            variant="contained"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <CircularProgress size={24} />
            ) : (
              "Ya, Batalkan Resolusi"
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}

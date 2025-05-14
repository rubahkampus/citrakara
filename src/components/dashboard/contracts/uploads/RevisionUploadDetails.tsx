"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import {
  Box,
  Paper,
  Typography,
  Divider,
  Button,
  Chip,
  Alert,
  AlertTitle,
  CircularProgress,
  Link,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Skeleton,
  Stack,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import InfoIcon from "@mui/icons-material/Info";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import { IContract } from "@/lib/db/models/contract.model";
import { IRevisionUpload } from "@/lib/db/models/upload.model";
import { IRevisionTicket } from "@/lib/db/models/ticket.model";

interface RevisionUploadDetailsProps {
  contract: IContract;
  upload: IRevisionUpload;
  userId: string;
  isArtist: boolean;
  isClient: boolean;
  isAdmin: boolean;
  canReview: boolean;
}

interface ReviewFormValues {
  action: "accept" | "reject";
}

export default function RevisionUploadDetails({
  contract,
  upload,
  userId,
  isArtist,
  isClient,
  isAdmin,
  canReview,
}: RevisionUploadDetailsProps) {
  const router = useRouter();
  const [ticket, setTicket] = useState<IRevisionTicket | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
  const [reviewAction, setReviewAction] = useState<"accept" | "reject" | null>(
    null
  );
  const [reviewSuccess, setReviewSuccess] = useState(false);

  const { handleSubmit } = useForm<ReviewFormValues>();

  const axiosClient = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || "",
  });

  // Format date for display
  const formatDate = (date?: string | Date) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleString();
  };

  // Fetch the associated revision ticket
  useEffect(() => {
    const fetchTicket = async () => {
      try {
        const response = await axiosClient.get(
          `/api/contract/${contract._id}/tickets/revision?ticketId=${upload.revisionTicketId}`
        );
        setTicket(response.data.ticket);
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
  }, [contract._id, upload.revisionTicketId]);

  // Handle review confirmation
  const handleReviewConfirm = async () => {
    if (!reviewAction) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await axiosClient.post(
        `/api/contract/${contract._id}/uploads/revision/${upload._id}`,
        { action: reviewAction },
        { headers: { "Content-Type": "application/json" } }
      );

      setReviewSuccess(true);
      setOpenConfirmDialog(false);

      // Refresh the page after a short delay
      setTimeout(() => {
        router.refresh();
      }, 1500);
    } catch (err) {
      if (axios.isAxiosError(err) && err.response) {
        setError(err.response.data.error || "Review action failed");
      } else {
        setError(
          err instanceof Error ? err.message : "An unknown error occurred"
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle review button click
  const handleReview = (action: "accept" | "reject") => {
    setReviewAction(action);
    setOpenConfirmDialog(true);
  };

  // Determine status colors
  const getStatusColor = (status: string) => {
    switch (status) {
      case "submitted":
        return "primary";
      case "accepted":
        return "success";
      case "rejected":
        return "error";
      case "forcedAccepted":
        return "warning";
      case "disputed":
        return "error";
      default:
        return "default";
    }
  };

  // Check if upload is past deadline
  const isPastDeadline =
    upload.expiresAt && new Date(upload.expiresAt) < new Date();

  if (isLoading) {
    return (
      <Paper elevation={2} sx={{ p: 3 }}>
        <Skeleton variant="text" width="50%" height={40} />
        <Skeleton variant="text" width="30%" />
        <Skeleton variant="text" width="25%" />
        <Divider sx={{ my: 2 }} />
        <Skeleton variant="rectangular" height={200} sx={{ mb: 2 }} />
        <Skeleton variant="text" width="40%" />
        <Skeleton variant="text" width="100%" height={100} />
      </Paper>
    );
  }

  return (
    <Paper elevation={2} sx={{ p: 3 }}>
      {/* Header with Status */}
      <Box
        sx={{
          mb: 3,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}
      >
        <Box>
          <Typography variant="h5" fontWeight="medium">
            Unggahan Revisi
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Diunggah oleh {isArtist ? "Anda" : "seniman"} pada{" "}
            {formatDate(upload.createdAt)}
          </Typography>
          {ticket?.milestoneIdx !== undefined && (
            <Typography variant="body2" sx={{ mt: 0.5 }}>
              Untuk Milestone:{" "}
              <span style={{ fontWeight: "medium" }}>
                {contract.milestones?.[ticket.milestoneIdx]?.title ||
                  `#${ticket.milestoneIdx}`}
              </span>
            </Typography>
          )}
        </Box>

        <Chip
          label={upload.status}
          color={getStatusColor(upload.status)}
          variant="outlined"
          sx={{ fontWeight: "medium" }}
        />
      </Box>

      {/* Pesan Sukses */}
      {reviewSuccess && (
        <Alert severity="success" sx={{ mb: 3 }}>
          <AlertTitle>Sukses</AlertTitle>
          Revisi telah {reviewAction === "accept" ? "diterima" : "ditolak"}{" "}
          dengan sukses!
        </Alert>
      )}

      {/* Pesan Error */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          <AlertTitle>Error</AlertTitle>
          {error}
        </Alert>
      )}

      {/* Status Alerts */}
      {upload.status === "submitted" && (
        <Alert
          severity="info"
          sx={{ mb: 3 }}
          icon={isPastDeadline ? <AccessTimeIcon /> : <InfoIcon />}
        >
          <AlertTitle>
            {isPastDeadline
              ? "Batas Waktu Review Mendekat"
              : "Review Diperlukan"}
          </AlertTitle>
          Unggahan revisi ini memerlukan review {isClient ? "Anda" : "klien"}.
          {isPastDeadline &&
            " Unggahan ini melewati batas waktu review dan dapat diterima secara otomatis."}
        </Alert>
      )}

      <Divider sx={{ mb: 3 }} />

      {/* Detail Tiket Revisi */}
      {ticket && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" fontWeight="medium" sx={{ mb: 1.5 }}>
            Detail Permintaan Revisi
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
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  Status:
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  {ticket.status}
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  Dibuat pada:
                </Typography>
                <Typography variant="body1">
                  {formatDate(ticket.createdAt)}
                </Typography>
              </Grid>

              {ticket.paidFee !== undefined && (
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Revisi Berbayar:
                  </Typography>
                  <Typography variant="body1">
                    Ya (Biaya: ${(ticket.paidFee / 100).toFixed(2)})
                  </Typography>
                </Grid>
              )}
            </Grid>

            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Permintaan klien:
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  mt: 0.5,
                  p: 1.5,
                  bgcolor: "action.hover",
                  borderRadius: 1,
                  whiteSpace: "pre-line",
                }}
              >
                {ticket.description}
              </Typography>
            </Box>

            {ticket.referenceImages && ticket.referenceImages.length > 0 && (
              <Box sx={{ mt: 2 }}>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 0.5 }}
                >
                  Gambar referensi:
                </Typography>
                <Grid container spacing={1}>
                  {ticket.referenceImages.map((url, index) => (
                    <Grid item key={index} xs={6} sm={4} md={3} lg={2}>
                      <Box
                        component="img"
                        src={url}
                        alt={`Referensi ${index}`}
                        sx={{
                          width: "100%",
                          height: 100,
                          objectFit: "cover",
                          borderRadius: 1,
                          border: "1px solid #eee",
                        }}
                      />
                    </Grid>
                  ))}
                </Grid>
              </Box>
            )}

            <Box sx={{ mt: 2 }}>
              <Link
                href={`/dashboard/${userId}/contracts/${contract._id}/tickets/revision/${ticket._id}`}
                underline="hover"
              >
                Lihat tiket revisi lengkap
              </Link>
            </Box>
          </Box>
        </Box>
      )}

      {/* Gambar */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" fontWeight="medium" sx={{ mb: 1.5 }}>
          Gambar Revisi
        </Typography>
        <Grid container spacing={2}>
          {upload.images.map((url, index) => (
            <Grid item key={index} xs={12} sm={6} md={4}>
              <Box
                component="a"
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                sx={{
                  display: "block",
                  width: "100%",
                  position: "relative",
                  "&:hover": {
                    "& > .img-overlay": {
                      opacity: 1,
                    },
                  },
                }}
              >
                <Box
                  component="img"
                  src={url}
                  alt={`Revisi ${index + 1}`}
                  sx={{
                    width: "100%",
                    height: 250,
                    objectFit: "cover",
                    borderRadius: 1,
                    border: "1px solid #eee",
                  }}
                />
                <Box
                  className="img-overlay"
                  sx={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    background: "rgba(0,0,0,0.5)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "white",
                    opacity: 0,
                    transition: "opacity 0.2s",
                    borderRadius: 1,
                  }}
                >
                  <Typography variant="body2">
                    Klik untuk melihat ukuran penuh
                  </Typography>
                </Box>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Deskripsi Seniman */}
      {upload.description && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" fontWeight="medium" sx={{ mb: 1.5 }}>
            Deskripsi Seniman
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
            <Typography variant="body1" sx={{ whiteSpace: "pre-line" }}>
              {upload.description}
            </Typography>
          </Box>
        </Box>
      )}

      {/* Tombol Aksi untuk Klien */}
      {!isAdmin && isClient && canReview && upload.status === "submitted" && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" fontWeight="medium" sx={{ mb: 1.5 }}>
            Aksi Tinjau
          </Typography>
          <Stack direction="row" spacing={2}>
            <Button
              variant="outlined"
              color="error"
              startIcon={<CancelIcon />}
              onClick={() => handleReview("reject")}
              disabled={isAdmin || isSubmitting}
            >
              Tolak Revisi
            </Button>
            <Button
              variant="contained"
              color="success"
              startIcon={<CheckCircleIcon />}
              onClick={() => handleReview("accept")}
              disabled={isAdmin || isSubmitting}
            >
              Terima Revisi
            </Button>
          </Stack>
        </Box>
      )}

      {/* Riwayat Status */}
      <Box>
        <Typography variant="h6" fontWeight="medium" sx={{ mb: 1.5 }}>
          Timeline Status
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
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">
                Dibuat:
              </Typography>
              <Typography variant="body1">
                {formatDate(upload.createdAt)}
              </Typography>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">
                Tenggat Tinjauan:
              </Typography>
              <Typography
                variant="body1"
                color={isPastDeadline ? "error.main" : "text.primary"}
              >
                {formatDate(upload.expiresAt)}
                {isPastDeadline && " (Lewat)"}
              </Typography>
            </Grid>

            {upload.resolvedAt && (
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  Diselesaikan:
                </Typography>
                <Typography variant="body1">
                  {formatDate(upload.resolvedAt)}
                </Typography>
              </Grid>
            )}

            {upload.status !== "submitted" && (
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  Status Akhir:
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  {upload.status}
                </Typography>
              </Grid>
            )}
          </Grid>
        </Box>
      </Box>

      {/* Dialog Konfirmasi */}
      <Dialog
        open={openConfirmDialog}
        onClose={() => setOpenConfirmDialog(false)}
      >
        <DialogTitle>
          {reviewAction === "accept" ? "Terima Revisi" : "Tolak Revisi"}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {reviewAction === "accept"
              ? "Apakah Anda yakin ingin menerima revisi ini? Tindakan ini tidak dapat dibatalkan."
              : "Apakah Anda yakin ingin menolak revisi ini? Tindakan ini tidak dapat dibatalkan dan mungkin memerlukan revisi lebih lanjut dari seniman."}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setOpenConfirmDialog(false)}
            disabled={isAdmin || isSubmitting}
          >
            Batal
          </Button>
          <Button
            onClick={handleReviewConfirm}
            color={reviewAction === "accept" ? "success" : "error"}
            variant="contained"
            disabled={isAdmin || isSubmitting}
            startIcon={isSubmitting ? <CircularProgress size={20} /> : null}
          >
            {isSubmitting
              ? "Memproses..."
              : reviewAction === "accept"
              ? "Ya, Terima"
              : "Ya, Tolak"}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}

"use client";

import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { axiosClient } from "@/lib/utils/axiosClient";
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
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Stack,
  Grid,
  Card,
  CardMedia,
  CardContent,
  LinearProgress,
  Tooltip,
  IconButton,
  Rating,
} from "@mui/material";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { IContract } from "@/lib/db/models/contract.model";
import { IFinalUpload } from "@/lib/db/models/upload.model";
import { ICancelTicket } from "@/lib/db/models/ticket.model";
import { IReview } from "@/lib/db/models/review.model";
import ThumbUpIcon from "@mui/icons-material/ThumbUp";
import ThumbDownIcon from "@mui/icons-material/ThumbDown";
import WarningIcon from "@mui/icons-material/Warning";
import ImageIcon from "@mui/icons-material/Image";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import InfoIcon from "@mui/icons-material/Info";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import StarIcon from "@mui/icons-material/Star";
import StarBorderIcon from "@mui/icons-material/StarBorder";
import CreateReviewDialog from "../reviews/CreateReviewDialog";

interface FinalUploadDetailsProps {
  contract: IContract;
  upload: IFinalUpload;
  userId: string;
  isArtist: boolean;
  isClient: boolean;
  isAdmin: boolean;
  canReview: boolean;
  username: string;
}

interface ReviewFormData {
  rejectionReason: string;
}

export default function FinalUploadDetails({
  contract,
  upload,
  userId,
  isArtist,
  isClient,
  isAdmin,
  canReview,
  username,
}: FinalUploadDetailsProps) {
  const router = useRouter();
  const [cancelTicket, setCancelTicket] = useState<ICancelTicket | null>(null);
  const [isLoadingTicket, setIsLoadingTicket] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showEscalateDialog, setShowEscalateDialog] = useState(false);
  const [showRejectionDialog, setShowRejectionDialog] = useState(false);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [existingReview, setExistingReview] = useState<IReview | null>(null);
  const [isLoadingReview, setIsLoadingReview] = useState(false);

  const isCompleteDelivery = upload.workProgress === 100;
  const isCancellationProof = upload.workProgress < 100;

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ReviewFormData>({
    defaultValues: {
      rejectionReason: "",
    },
  });

  // Format tanggal untuk ditampilkan
  const formatDate = (date?: string | Date) => {
    if (!date) return "N/A";
    const parsedDate = typeof date === "string" ? new Date(date) : date;
    return parsedDate.toLocaleString();
  };

  // Hitung waktu tersisa hingga kedaluwarsa
  const calculateTimeRemaining = () => {
    if (!upload.expiresAt) return null;

    const expiryDate = new Date(upload.expiresAt);
    const now = new Date();
    const diffMs = expiryDate.getTime() - now.getTime();

    if (diffMs <= 0) return "Kedaluwarsa";

    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (diffHrs > 24) {
      const days = Math.floor(diffHrs / 24);
      return `${days} hari tersisa`;
    }

    return `${diffHrs}j ${diffMins}m tersisa`;
  };

  // Check if approaching expiry (less than 12 hours remaining)
  const isApproachingExpiry = () => {
    if (!upload.expiresAt) return false;

    const expiryDate = new Date(upload.expiresAt);
    const now = new Date();
    const diffMs = expiryDate.getTime() - now.getTime();
    const diffHrs = diffMs / (1000 * 60 * 60);

    return diffHrs > 0 && diffHrs < 12;
  };

  // Check if upload is past deadline
  const isPastExpiry =
    upload.expiresAt && new Date(upload.expiresAt) < new Date();

  // Fetch cancel ticket if this is a cancellation proof
  useEffect(() => {
    if (upload.cancelTicketId) {
      const fetchCancelTicket = async () => {
        setIsLoadingTicket(true);
        try {
          const response = await axiosClient.get(
            `/api/contract/${contract._id}/tickets/cancel/${upload.cancelTicketId}`
          );
          setCancelTicket(response.data);
        } catch (err: any) {
          setError(
            err.response?.data?.error ||
              err.message ||
              "An error occurred while fetching ticket"
          );
        } finally {
          setIsLoadingTicket(false);
        }
      };

      fetchCancelTicket();
    }
  }, [contract._id, upload.cancelTicketId]);

  // Fetch existing review for this upload
  useEffect(() => {
    const fetchReview = async () => {
      if (!upload._id || !isClient) return;

      setIsLoadingReview(true);
      try {
        const response = await axiosClient.get(
          `/api/contract/${contract._id}/uploads/final/${upload._id}/review`
        );
        if (response.data.exists) {
          setExistingReview(response.data.review);
        }
      } catch (err) {
        console.error("Error fetching review:", err);
      } finally {
        setIsLoadingReview(false);
      }
    };

    fetchReview();
  }, [upload._id, isClient]);

  // Determine status colors
  const getStatusColor = (status: string | undefined | null) => {
    if (!status) return "default"; // Handle undefined/null status

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

  // Get status label (more user-friendly than raw status)
  const getStatusLabel = (status: string | undefined | null) => {
    if (!status) return "Status Tidak Diketahui"; // Handle undefined/null status

    switch (status) {
      case "submitted":
        return "Menunggu Tinjauan Klien";
      case "accepted":
        return "Diterima";
      case "rejected":
        return "Ditolak";
      case "forcedAccepted":
        return "Diterima (Admin)";
      case "disputed":
        return "Sedang Dipersengketakan";
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  // Additional helper for conditional rendering
  const shouldShowStatusChip = (status: string | undefined | null): boolean => {
    return status !== undefined && status !== null;
  };

  // Handle accept final delivery
  const handleAccept = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      await axiosClient.post(
        `/api/contract/${contract._id}/uploads/final/${upload._id}`,
        { action: "accept" }
      );

      setSuccess(true);
      setTimeout(() => {
        router.refresh();
      }, 1000);
    } catch (err: any) {
      setError(
        err.response?.data?.error || err.message || "An unknown error occurred"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle reject final delivery
  const onSubmitRejection = async (data: ReviewFormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      await axiosClient.post(
        `/api/contract/${contract._id}/uploads/final/${upload._id}`,
        {
          action: "reject",
          rejectionReason: data.rejectionReason,
        }
      );

      setSuccess(true);
      setShowRejectionDialog(false);

      setTimeout(() => {
        router.refresh();
      }, 1000);
    } catch (err: any) {
      setError(
        err.response?.data?.error || err.message || "An unknown error occurred"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle escalation request
  const handleEscalation = () => {
    setShowEscalateDialog(true);
  };

  // Confirm escalation
  const confirmEscalation = () => {
    setShowEscalateDialog(false);
    router.push(
      `/${username}/dashboard/contracts/${contract._id}/resolution/new?targetType=final&targetId=${upload._id}`
    );
  };

  // Handle successful review submission
  const handleReviewSuccess = () => {
    // Refresh to show updated reviews
    router.refresh();
  };

  console.log(upload.status, "Upload Status");
  console.log(cancelTicket)

  // Determine if client can leave a review (only for accepted deliveries)
  const canLeaveReview =
    isClient &&
    isCompleteDelivery &&
    upload.status === "accepted" &&
    !existingReview;

  return (
    <Paper elevation={2} sx={{ p: 3 }}>
      {/* Bagian Header dengan Status */}
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
            {isCompleteDelivery ? "Pengiriman Final" : "Bukti Pembatalan"}
          </Typography>

          <Stack direction="row" spacing={2} alignItems="center" sx={{ mt: 1 }}>
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <CalendarTodayIcon
                sx={{ fontSize: 18, mr: 0.5, color: "text.secondary" }}
              />
              <Typography variant="body2" color="text.secondary">
                Diajukan: {formatDate(upload.createdAt)}
              </Typography>
            </Box>

            {upload.closedAt && (
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <CheckCircleIcon
                  sx={{ fontSize: 18, mr: 0.5, color: "success.main" }}
                />
                <Typography variant="body2" color="text.secondary">
                  Diselesaikan: {formatDate(upload.closedAt)}
                </Typography>
              </Box>
            )}

            {upload.status === "submitted" && upload.expiresAt && (
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <AccessTimeIcon
                  sx={{
                    fontSize: 18,
                    mr: 0.5,
                    color: isPastExpiry
                      ? "error.main"
                      : isApproachingExpiry()
                      ? "warning.main"
                      : "info.main",
                  }}
                />
                <Typography
                  variant="body2"
                  color={
                    isPastExpiry
                      ? "error"
                      : isApproachingExpiry()
                      ? "warning.main"
                      : "text.secondary"
                  }
                >
                  {calculateTimeRemaining()}
                </Typography>
              </Box>
            )}
          </Stack>
        </Box>

        {upload.status && (
          <Chip
            label={getStatusLabel(upload.status)}
            color={getStatusColor(upload.status)}
            sx={{ fontWeight: "medium", px: 1 }}
          />
        )}
      </Box>

      {/* Pesan Peringatan */}
      {upload.status === "submitted" &&
        !isPastExpiry &&
        upload.expiresAt &&
        isApproachingExpiry() && (
          <Alert severity="warning" sx={{ mb: 3 }} icon={<AccessTimeIcon />}>
            <Typography variant="body2">
              Tinjauan{" "}
              {isCompleteDelivery ? "pengiriman final" : "bukti pembatalan"} ini
              akan segera kedaluwarsa - pada {formatDate(upload.expiresAt)}.
              {!isAdmin &&
                isClient &&
                canReview &&
                " Harap tanggapi sesegera mungkin."}
            </Typography>
          </Alert>
        )}

      {upload.status === "submitted" && isPastExpiry && upload.expiresAt && (
        <Alert severity="error" sx={{ mb: 3 }}>
          <Typography variant="body2">
            Tinjauan{" "}
            {isCompleteDelivery ? "pengiriman final" : "bukti pembatalan"} ini
            telah kedaluwarsa pada {formatDate(upload.expiresAt)}.
            {isClient &&
              " Pengiriman ini mungkin akan diterima otomatis segera."}
          </Typography>
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }} icon={<CheckCircleIcon />}>
          Tindakan Anda telah diproses dengan sukses.
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Review Button - Shown only to clients for accepted complete deliveries */}
      {canLeaveReview && (
        <Alert
          severity="info"
          icon={<StarIcon />}
          action={
            <Button
              color="primary"
              size="small"
              variant="contained"
              onClick={() => setShowReviewDialog(true)}
              startIcon={<StarIcon />}
            >
              Beri Ulasan
            </Button>
          }
          sx={{ mb: 3 }}
        >
          <Typography variant="body2">
            Pengiriman telah diterima. Bagikan pengalaman Anda dengan memberikan
            ulasan kepada seniman.
          </Typography>
        </Alert>
      )}

      {/* Display existing review if one exists */}
      {existingReview && (
        <Alert severity="success" icon={<StarIcon />} sx={{ mb: 3 }}>
          <Typography variant="body2" fontWeight="medium" gutterBottom>
            Anda telah memberikan ulasan untuk pengiriman ini
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center", mt: 1 }}>
            <Box sx={{ mr: 2 }}>
              <Rating value={existingReview.rating} readOnly size="small" />
            </Box>
            <Typography variant="body2">
              "{existingReview.comment.substring(0, 100)}
              {existingReview.comment.length > 100 ? "..." : ""}"
            </Typography>
          </Box>
        </Alert>
      )}

      <Divider sx={{ mb: 3 }} />

      {/* Area Konten Utama */}
      <Grid container spacing={3}>
        {/* Kolom Kiri: Detail Pengiriman */}
        <Grid item xs={12} md={7}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom fontWeight="medium">
              {isCompleteDelivery ? "Pengiriman Final" : "Pembatalan"} Detail
            </Typography>

            <Paper
              variant="outlined"
              sx={{ p: 2, borderRadius: 1, bgcolor: "background.paper", mb: 2 }}
            >
              {/* Progres Pekerjaan */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                  Progres Pekerjaan
                </Typography>
                <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                  <Typography variant="body2" sx={{ mr: 1 }}>
                    {upload.workProgress}%
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={upload.workProgress}
                    color={isCompleteDelivery ? "success" : "warning"}
                    sx={{ height: 8, borderRadius: 1, flexGrow: 1 }}
                  />
                </Box>

                {isCancellationProof && (
                  <Typography variant="body2" color="text.secondary">
                    Ini adalah pengiriman parsial untuk pembatalan. Pembayaran
                    akan dibagi sesuai persentase pekerjaan dan kebijakan
                    kontrak.
                  </Typography>
                )}
              </Box>

              {/* Jenis Pengiriman & Tanggal */}
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Jenis Pengiriman:
                  </Typography>
                  <Typography variant="body1">
                    {isCompleteDelivery
                      ? "Pengiriman Final"
                      : "Bukti Pembatalan"}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Tenggat Waktu Tinjauan:
                  </Typography>
                  <Typography variant="body1">
                    {formatDate(upload.expiresAt)}
                  </Typography>
                </Grid>
                {isCancellationProof && upload.cancelTicketId && (
                  <Grid item xs={12}>
                    <Divider sx={{ my: 1 }} />
                    <Box sx={{ mt: 1 }}>
                      <Link
                        href={`/${username}/dashboard/contracts/${contract._id}/tickets/cancel/${upload.cancelTicketId}`}
                        style={{ textDecoration: "none" }}
                      >
                        <Button
                          variant="outlined"
                          size="small"
                          color="info"
                          sx={{ mt: 1 }}
                        >
                          Lihat Permintaan Pembatalan
                        </Button>
                      </Link>
                    </Box>
                  </Grid>
                )}
              </Grid>
            </Paper>

            {/* Detail Tiket Pembatalan */}
            {isCancellationProof && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                  Detail Pembatalan
                </Typography>

                <Paper
                  variant="outlined"
                  sx={{ p: 2, borderRadius: 1, bgcolor: "background.paper" }}
                >
                  {isLoadingTicket ? (
                    <Box
                      sx={{ display: "flex", justifyContent: "center", p: 2 }}
                    >
                      <CircularProgress size={24} />
                    </Box>
                  ) : cancelTicket ? (
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">
                          Diminta oleh:
                        </Typography>
                        <Typography variant="body1">
                          {(cancelTicket as any).ticket.requestedBy === "client"
                            ? isClient
                              ? "Anda"
                              : "Klien"
                            : isArtist
                            ? "Anda"
                            : "Seniman"}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">
                          Status:
                        </Typography>
                        <Chip
                          label={getStatusLabel((cancelTicket as any).ticket.status)}
                          color={getStatusColor((cancelTicket as any).ticket.status)}
                          size="small"
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <Typography variant="body2" color="text.secondary">
                          Alasan:
                        </Typography>
                        <Typography variant="body1" sx={{ mt: 0.5 }}>
                          {(cancelTicket as any).ticket.reason}
                        </Typography>
                      </Grid>
                    </Grid>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      Detail pembatalan tidak tersedia
                    </Typography>
                  )}
                </Paper>
              </Box>
            )}

            {/* Deskripsi Seniman */}
            {upload.description && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                  Deskripsi Seniman
                </Typography>
                <Paper
                  variant="outlined"
                  sx={{ p: 2, borderRadius: 1, bgcolor: "background.paper" }}
                >
                  <Typography variant="body1" sx={{ whiteSpace: "pre-line" }}>
                    {upload.description}
                  </Typography>
                </Paper>
              </Box>
            )}

            {/* Syarat Kontrak */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                Informasi Kontrak
              </Typography>
              <Paper
                variant="outlined"
                sx={{ p: 2, borderRadius: 1, bgcolor: "background.paper" }}
              >
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Status Kontrak:
                    </Typography>
                    <Chip
                      label={contract.status}
                      color={
                        contract.status === "active" ? "success" : "default"
                      }
                      size="small"
                      sx={{ mt: 0.5 }}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Dibuat:
                    </Typography>
                    <Typography variant="body1">
                      {formatDate(contract.createdAt)}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Tenggat Waktu:
                    </Typography>
                    <Typography variant="body1">
                      {formatDate(contract.deadlineAt)}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Masa Tenggang Berakhir:
                    </Typography>
                    <Typography variant="body1">
                      {formatDate(contract.graceEndsAt)}
                    </Typography>
                  </Grid>
                  {isCancellationProof && (
                    <Grid item xs={12}>
                      <Divider sx={{ my: 1 }} />
                      <Box
                        sx={{ display: "flex", alignItems: "center", mt: 1 }}
                      >
                        <AttachMoneyIcon
                          sx={{ color: "text.secondary", mr: 1 }}
                        />
                        <Typography variant="body2" color="text.secondary">
                          Pembayaran akan dibagi sesuai persentase pekerjaan (
                          {upload.workProgress}%)
                        </Typography>
                      </Box>
                    </Grid>
                  )}
                </Grid>
              </Paper>
            </Box>

            {/* Formulir Respon - Hanya ditampilkan jika pengguna adalah klien dan dapat meninjau */}
            {!isAdmin &&
              isClient &&
              canReview &&
              upload.status === "submitted" && (
                <Box sx={{ mb: 3 }}>
                  <Divider sx={{ mb: 3 }} />
                  <Typography variant="h6" fontWeight="medium" gutterBottom>
                    Respon Anda
                  </Typography>

                  <Alert severity="info" sx={{ mb: 3 }} icon={<InfoIcon />}>
                    <Typography variant="body2">
                      {isCompleteDelivery
                        ? "Dengan menerima pengiriman final ini, Anda mengakui bahwa seniman telah menyelesaikan proyek sesuai kesepakatan. Kontrak akan ditandai sebagai selesai."
                        : "Dengan menerima bukti pembatalan ini, Anda mengonfirmasi bahwa persentase pekerjaan sudah akurat. Kontrak akan dibatalkan dan pembayaran akan dibagi sesuai."}
                    </Typography>
                  </Alert>

                  <Box sx={{ mb: 3 }}>
                    <Stack direction="row" spacing={2}>
                      <Button
                        variant="contained"
                        color="success"
                        onClick={handleAccept}
                        disabled={isAdmin || isSubmitting}
                        startIcon={<ThumbUpIcon />}
                        sx={{ flexGrow: 1 }}
                        size="large"
                      >
                        {isSubmitting && success === false ? (
                          <CircularProgress size={24} color="inherit" />
                        ) : (
                          `Terima ${
                            isCompleteDelivery
                              ? "Pengiriman Final"
                              : "Pembatalan"
                          }`
                        )}
                      </Button>
                      <Button
                        variant="outlined"
                        color="error"
                        onClick={() => setShowRejectionDialog(true)}
                        disabled={isAdmin || isSubmitting}
                        startIcon={<ThumbDownIcon />}
                        sx={{ flexGrow: 1 }}
                        size="large"
                      >
                        Tolak
                      </Button>
                    </Stack>
                  </Box>
                </Box>
              )}

            {/* Bagian Eskalasi ke Resolusi */}
            {(isClient || isArtist) && upload.status && (
              <Box sx={{ mt: 4 }}>
                <Divider sx={{ mb: 3 }} />
                <Typography
                  variant="subtitle1"
                  fontWeight="medium"
                  gutterBottom
                >
                  Tidak puas dengan prosesnya?
                </Typography>
                <Button
                  variant="outlined"
                  color="warning"
                  onClick={handleEscalation}
                  disabled={isAdmin || isSubmitting}
                  startIcon={<WarningIcon />}
                >
                  Eskalasi ke Resolusi
                </Button>

                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ display: "block", mt: 1 }}
                >
                  Eskalasi akan ditinjau oleh tim dukungan kami untuk membantu
                  menyelesaikan masalah apapun.
                </Typography>
              </Box>
            )}
          </Box>
        </Grid>

        {/* Right Column: Upload Images */}
        <Grid item xs={12} md={5}>
          {upload.images && upload.images.length > 0 ? (
            <Box>
              <Typography variant="h6" gutterBottom fontWeight="medium">
                {isCompleteDelivery ? "Pengiriman Final" : "Bukti Pembatalan"}{" "}
                Gambar
              </Typography>
              <Grid container spacing={2}>
                {upload.images.map((url, index) => (
                  <Grid item xs={12} sm={6} key={index}>
                    <Card variant="outlined" sx={{ height: "100%" }}>
                      <CardMedia
                        component="img"
                        image={url}
                        alt={`Gambar ${index + 1}`}
                        sx={{
                          height: 200,
                          objectFit: "cover",
                          cursor: "pointer",
                        }}
                        onClick={() => window.open(url, "_blank")}
                      />
                      <CardContent sx={{ p: 1, "&:last-child": { pb: 1 } }}>
                        <Typography variant="caption" color="text.secondary">
                          Gambar {index + 1}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>
          ) : (
            <Box sx={{ mt: { xs: 0, md: 4 } }}>
              <Paper
                variant="outlined"
                sx={{
                  p: 3,
                  borderRadius: 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  bgcolor: "background.paper",
                  minHeight: 200,
                }}
              >
                <ImageIcon
                  sx={{ fontSize: 48, color: "text.disabled", mb: 2 }}
                />
                <Typography
                  variant="body2"
                  color="text.secondary"
                  align="center"
                >
                  Tidak ada gambar yang diunggah untuk pengiriman ini.
                </Typography>
              </Paper>
            </Box>
          )}
        </Grid>
      </Grid>

      {/* Rejection Dialog */}
      <Dialog
        open={showRejectionDialog}
        onClose={() => setShowRejectionDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <form onSubmit={handleSubmit(onSubmitRejection)}>
          <DialogTitle>
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <ThumbDownIcon sx={{ mr: 1, color: "error.main" }} />
              Tolak{" "}
              {isCompleteDelivery ? "Pengiriman Final" : "Bukti Pembatalan"}
            </Box>
          </DialogTitle>
          <DialogContent>
            <DialogContentText>
              Harap berikan alasan rinci untuk menolak{" "}
              {isCompleteDelivery ? "pengiriman final" : "bukti pembatalan"}{" "}
              ini. Ini akan membantu seniman memahami apa yang perlu diperbaiki.
            </DialogContentText>
            <Controller
              name="rejectionReason"
              control={control}
              rules={{
                required: "Alasan penolakan wajib diisi",
                minLength: {
                  value: 10,
                  message: "Harap berikan setidaknya 10 karakter",
                },
              }}
              render={({ field }) => (
                <TextField
                  {...field}
                  autoFocus
                  margin="dense"
                  label="Alasan Penolakan"
                  multiline
                  rows={4}
                  fullWidth
                  placeholder="Jelaskan mengapa Anda menolak pengiriman ini..."
                  error={!!errors.rejectionReason}
                  helperText={errors.rejectionReason?.message}
                  sx={{ mt: 2 }}
                />
              )}
            />
          </DialogContent>

          <DialogActions>
            <Button
              onClick={() => setShowRejectionDialog(false)}
              color="inherit"
            >
              Batal
            </Button>
            <Button
              type="submit"
              color="error"
              variant="contained"
              disabled={isAdmin || isSubmitting}
            >
              {isSubmitting ? <CircularProgress size={24} /> : "Tolak"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Review Dialog */}
      {canLeaveReview && (
        <CreateReviewDialog
          open={showReviewDialog}
          onClose={() => setShowReviewDialog(false)}
          uploadId={upload._id.toString()}
          contractId={contract._id.toString()}
          uploadImages={upload.images || []}
          onSuccess={handleReviewSuccess}
        />
      )}

      {/* Escalation Dialog */}
      <Dialog
        open={showEscalateDialog}
        onClose={() => setShowEscalateDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <WarningIcon sx={{ mr: 1, color: "warning.main" }} />
            Eskalasi ke Resolusi?
          </Box>
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Meningkatkan masalah ini akan membuat tiket resolusi untuk tinjauan
            admin. Anda perlu memberikan bukti dan menjelaskan posisi Anda.
            <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
              Kapan Anda harus mengeskalasi?
            </Typography>
            <Typography variant="body2">
              • Jika komunikasi terputus
              <br />
              • Jika ada ketidaksepakatan tentang syarat kontrak
              <br />• Jika Anda percaya pihak lain tidak memenuhi kewajibannya
            </Typography>
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowEscalateDialog(false)} color="inherit">
            Batal
          </Button>
          <Button
            onClick={confirmEscalation}
            color="warning"
            variant="contained"
            disabled={isAdmin}
          >
            Lanjutkan ke Resolusi
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}

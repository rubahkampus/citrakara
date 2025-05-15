// src/components/dashboard/admin-resolution/AdminResolutionForm.tsx
"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import {
  Box,
  Paper,
  Typography,
  Button,
  Alert,
  CircularProgress,
  Divider,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
  TextField,
  Grid,
  Card,
  CardMedia,
  CardContent,
  Chip,
  Stack,
  Tabs,
  Tab,
  IconButton,
  Tooltip,
  ButtonGroup,
} from "@mui/material";
import { axiosClient } from "@/lib/utils/axiosClient";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import GavelIcon from "@mui/icons-material/Gavel";
import WarningIcon from "@mui/icons-material/Warning";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import ZoomInIcon from "@mui/icons-material/ZoomIn";
import VisibilityIcon from "@mui/icons-material/Visibility";
import Link from "next/link";

interface AdminResolutionFormProps {
  ticket: any;
  contract: any;
  userId: string;
}

interface FormValues {
  decision: "favorClient" | "favorArtist" | "";
  resolutionNote: string;
}

export default function AdminResolutionForm({
  ticket,
  contract,
  userId,
}: AdminResolutionFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [expandedImage, setExpandedImage] = useState<string | null>(null);

  // React Hook Form setup
  const {
    control,
    handleSubmit,
    watch,
    formState: { errors, isValid },
  } = useForm<FormValues>({
    defaultValues: {
      decision: "",
      resolutionNote: "",
    },
    mode: "onChange",
  });

  const watchedDecision = watch("decision");

  // Determine if the ticket is ready for admin resolution
  const canResolve = useMemo(
    () => ticket.status === "awaitingReview",
    [ticket.status]
  );

  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  // Format date for display
  const formatDate = (date?: string | Date) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleString();
  };

  // Get target type display name
  const getTargetTypeDisplay = (type: string) => {
    switch (type) {
      case "cancelTicket":
        return "Pembatalan Kontrak";
      case "revisionTicket":
        return "Permintaan Revisi";
      case "changeTicket":
        return "Permintaan Perubahan";
      case "finalUpload":
        return "Pengiriman Final";
      case "progressMilestoneUpload":
        return "Progres Milestone";
      case "revisionUpload":
        return "Pengiriman Revisi";
      default:
        return type.charAt(0).toUpperCase() + type.slice(1);
    }
  };

  // Get target URL for viewing the disputed item in standard view
  const getTargetUrl = () => {
    switch (ticket.targetType) {
      case "cancelTicket":
      case "revisionTicket":
      case "changeTicket":
        return `/dashboard/${userId}/contracts/${
          ticket.contractId
        }/tickets/${ticket.targetType.replace("Ticket", "")}/${
          ticket.targetId
        }`;
      case "finalUpload":
        return `/dashboard/${userId}/contracts/${ticket.contractId}/uploads/final/${ticket.targetId}`;
      case "progressMilestoneUpload":
        return `/dashboard/${userId}/contracts/${ticket.contractId}/uploads/milestone/${ticket.targetId}`;
      case "revisionUpload":
        return `/dashboard/${userId}/contracts/${ticket.contractId}/uploads/revision/${ticket.targetId}`;
      default:
        return `/dashboard/${userId}/contracts/${ticket.contractId}`;
    }
  };

  // Get target URL for admin review
  const getAdminTargetUrl = () => {
    // Route to admin-specific view
    return `/dashboard/${userId}/admin-resolution/${ticket._id}/${ticket.targetType}/${ticket.targetId}`;
  };

  // Handle form submission
  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    setError(null);

    try {
      await axiosClient.post(`/api/admin/resolution/${ticket._id}/resolve`, {
        decision: data.decision,
        resolutionNote: data.resolutionNote,
      });

      setSuccess(true);

      // Redirect after successful submission
      setTimeout(() => {
        router.push(`/dashboard/${userId}/admin/resolutions`);
        router.refresh();
      }, 2000);
    } catch (err: any) {
      setError(
        err.response?.data?.error || err.message || "An unknown error occurred"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper to generate a consequence message based on the target type and decision
  const getDecisionConsequenceMessage = (decision: string) => {
    if (!decision) return "";

    // Base message based on who is favored
    const favoredParty = decision === "favorClient" ? "Klien" : "Seniman";
    let baseMessage = `Keputusan ini akan berpihak pada ${favoredParty}.`;

    // Additional details based on target type
    switch (ticket.targetType) {
      case "cancelTicket":
        return `${baseMessage} ${
          decision === "favorClient"
            ? "Pembatalan akan diterima dan kontrak akan ditandai sebagai dibatalkan dengan kompensasi yang sesuai berdasarkan pekerjaan yang telah diselesaikan."
            : "Pembatalan akan ditolak dan kontrak akan dilanjutkan."
        }`;

      case "revisionTicket":
        return `${baseMessage} ${
          decision === "favorClient"
            ? "Seniman akan diminta untuk melakukan revisi yang diminta."
            : "Seniman tidak akan diminta untuk melakukan revisi yang diminta."
        }`;

      case "changeTicket":
        return `${baseMessage} ${
          decision === "favorClient"
            ? "Perubahan yang diminta pada kontrak akan diterapkan tanpa biaya tambahan."
            : "Perubahan tidak akan diperlukan atau biaya yang diusulkan seniman akan diberlakukan."
        }`;

      case "finalUpload":
        return `${baseMessage} ${
          decision === "favorClient"
            ? "Pengiriman final akan ditolak dan seniman harus melakukan penyesuaian."
            : "Pengiriman final akan dipaksa diterima dan kontrak ditandai sebagai selesai."
        }`;

      case "progressMilestoneUpload":
        return `${baseMessage} ${
          decision === "favorClient"
            ? "Unggahan milestone akan ditolak dan seniman harus mengatasi masalah tersebut."
            : "Milestone akan dipaksa diterima dan kontrak akan berlanjut ke tahap berikutnya."
        }`;

      case "revisionUpload":
        return `${baseMessage} ${
          decision === "favorClient"
            ? "Unggahan revisi akan ditolak dan seniman harus mengatasi masalah tersebut."
            : "Revisi akan dipaksa diterima."
        }`;

      default:
        return baseMessage;
    }
  };

  return (
    <Box>
      {/* Status alerts */}
      {!canResolve && (
        <Alert severity="info" sx={{ mb: 3 }}>
          {ticket.status === "open"
            ? "Tiket ini masih terbuka untuk pengajuan bukti bantahan. Anda dapat meninjau, tetapi belum dapat membuat keputusan."
            : ticket.status === "resolved"
            ? "Tiket ini sudah diselesaikan."
            : "Tiket ini tidak dapat diselesaikan saat ini."}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }} icon={<CheckCircleIcon />}>
          Pengajuan penyelesaian berhasil. Mengalihkan...
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Ticket information section */}
      <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            mb: 2,
          }}
        >
          <Typography variant="h6" fontWeight="medium">
            Detail Tiket Penyelesaian
          </Typography>
          <Chip
            label={ticket.status.toUpperCase()}
            color={
              ticket.status === "open"
                ? "primary"
                : ticket.status === "awaitingReview"
                ? "warning"
                : ticket.status === "resolved"
                ? "success"
                : "default"
            }
            icon={
              ticket.status === "resolved" ? (
                <CheckCircleIcon />
              ) : ticket.status === "cancelled" ? (
                <CancelIcon />
              ) : ticket.status === "awaitingReview" ? (
                <GavelIcon />
              ) : undefined
            }
          />
        </Box>

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Stack spacing={2}>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Jenis Target
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  {getTargetTypeDisplay(ticket.targetType)}
                </Typography>
              </Box>

              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Diajukan Oleh
                </Typography>
                <Typography variant="body1">
                  {ticket.submittedBy === "client" ? "Klien" : "Seniman"}
                </Typography>
              </Box>

              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Pihak Lawan
                </Typography>
                <Typography variant="body1">
                  {ticket.counterparty === "client" ? "Klien" : "Seniman"}
                </Typography>
              </Box>
            </Stack>
          </Grid>

          <Grid item xs={12} md={6}>
            <Stack spacing={2}>
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <CalendarTodayIcon
                  sx={{ fontSize: 18, mr: 1, color: "text.secondary" }}
                />
                <Typography variant="subtitle2" color="text.secondary">
                  Dibuat
                </Typography>
                <Typography variant="body1" sx={{ ml: 1 }}>
                  {formatDate(ticket.createdAt)}
                </Typography>
              </Box>

              {ticket.status === "open" && (
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  <CalendarTodayIcon
                    sx={{ fontSize: 18, mr: 1, color: "text.secondary" }}
                  />
                  <Typography variant="subtitle2" color="text.secondary">
                    Batas Waktu Bukti Bantahan
                  </Typography>
                  <Typography variant="body1" sx={{ ml: 1 }}>
                    {formatDate(ticket.counterExpiresAt)}
                  </Typography>
                </Box>
              )}

              {ticket.status === "resolved" && (
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  <GavelIcon
                    sx={{ fontSize: 18, mr: 1, color: "text.secondary" }}
                  />
                  <Typography variant="subtitle2" color="text.secondary">
                    Diselesaikan Pada
                  </Typography>
                  <Typography variant="body1" sx={{ ml: 1 }}>
                    {formatDate(ticket.resolvedAt)}
                  </Typography>
                </Box>
              )}
            </Stack>
          </Grid>
        </Grid>

        <Box sx={{ mt: 3 }}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Tindakan
          </Typography>
          <ButtonGroup variant="outlined">
            <Button
              component={Link}
              href={`/dashboard/${userId}/contracts/${ticket.contractId}`}
              startIcon={<VisibilityIcon />}
              size="small"
            >
              Lihat Kontrak
            </Button>
            <Button
              component={Link}
              href={getAdminTargetUrl()}
              startIcon={<VisibilityIcon />}
              size="small"
              color="secondary"
            >
              Lihat Item Bermasalah
            </Button>
          </ButtonGroup>
        </Box>
      </Paper>

      {/* Evidence comparison section */}
      <Box sx={{ mb: 4 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          aria-label="evidence tabs"
          sx={{ mb: 3 }}
        >
          <Tab
            label={`Bukti ${
              ticket.submittedBy === "client" ? "Klien" : "Seniman"
            }`}
            id="tab-0"
            aria-controls="tabpanel-0"
          />
          <Tab
            label={`Bukti Bantahan ${
              ticket.counterparty === "client" ? "Klien" : "Seniman"
            }`}
            id="tab-1"
            aria-controls="tabpanel-1"
          />
          <Tab label="Berdampingan" id="tab-2" aria-controls="tabpanel-2" />
        </Tabs>

        {/* Original Evidence Tab */}
        <div
          role="tabpanel"
          hidden={activeTab !== 0}
          id="tabpanel-0"
          aria-labelledby="tab-0"
        >
          {activeTab === 0 && (
            <Paper elevation={2} sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight="medium" gutterBottom>
                Bukti {ticket.submittedBy === "client" ? "Klien" : "Seniman"}
              </Typography>

              <Typography
                variant="body1"
                paragraph
                sx={{ whiteSpace: "pre-line" }}
              >
                {ticket.description}
              </Typography>

              {ticket.proofImages && ticket.proofImages.length > 0 ? (
                <Box sx={{ mt: 3 }}>
                  <Typography
                    variant="subtitle2"
                    fontWeight="medium"
                    gutterBottom
                  >
                    Gambar Bukti ({ticket.proofImages.length})
                  </Typography>
                  <Grid container spacing={2}>
                    {ticket.proofImages.map((img: string, i: number) => (
                      <Grid item xs={12} sm={6} md={4} key={i}>
                        <Card variant="outlined">
                          <CardMedia
                            component="img"
                            image={img}
                            alt={`Bukti ${i + 1}`}
                            sx={{ height: 200, objectFit: "cover" }}
                          />
                          <CardContent sx={{ p: 1, pb: "8px !important" }}>
                            <Box
                              sx={{
                                display: "flex",
                                justifyContent: "space-between",
                              }}
                            >
                              <Typography variant="caption">
                                Bukti {i + 1}
                              </Typography>
                              <Tooltip title="Lihat Lebih Besar">
                                <IconButton
                                  size="small"
                                  onClick={() => window.open(img, "_blank")}
                                >
                                  <ZoomInIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              ) : (
                <Alert severity="info" sx={{ mt: 2 }}>
                  Tidak ada gambar bukti yang disediakan.
                </Alert>
              )}
            </Paper>
          )}
        </div>

        {/* Counterevidence Tab */}
        <div
          role="tabpanel"
          hidden={activeTab !== 1}
          id="tabpanel-1"
          aria-labelledby="tab-1"
        >
          {activeTab === 1 && (
            <Paper elevation={2} sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight="medium" gutterBottom>
                Tanggapan{" "}
                {ticket.counterparty === "client" ? "Klien" : "Seniman"}
              </Typography>

              {ticket.counterDescription ? (
                <>
                  <Typography
                    variant="body1"
                    paragraph
                    sx={{ whiteSpace: "pre-line" }}
                  >
                    {ticket.counterDescription}
                  </Typography>

                  {ticket.counterProofImages &&
                  ticket.counterProofImages.length > 0 ? (
                    <Box sx={{ mt: 3 }}>
                      <Typography
                        variant="subtitle2"
                        fontWeight="medium"
                        gutterBottom
                      >
                        Gambar Bukti Bantahan (
                        {ticket.counterProofImages.length})
                      </Typography>
                      <Grid container spacing={2}>
                        {ticket.counterProofImages.map(
                          (img: string, i: number) => (
                            <Grid item xs={12} sm={6} md={4} key={i}>
                              <Card variant="outlined">
                                <CardMedia
                                  component="img"
                                  image={img}
                                  alt={`Bukti Bantahan ${i + 1}`}
                                  sx={{ height: 200, objectFit: "cover" }}
                                />
                                <CardContent
                                  sx={{ p: 1, pb: "8px !important" }}
                                >
                                  <Box
                                    sx={{
                                      display: "flex",
                                      justifyContent: "space-between",
                                    }}
                                  >
                                    <Typography variant="caption">
                                      Bukti Bantahan {i + 1}
                                    </Typography>
                                    <Tooltip title="Lihat Lebih Besar">
                                      <IconButton
                                        size="small"
                                        onClick={() =>
                                          window.open(img, "_blank")
                                        }
                                      >
                                        <ZoomInIcon fontSize="small" />
                                      </IconButton>
                                    </Tooltip>
                                  </Box>
                                </CardContent>
                              </Card>
                            </Grid>
                          )
                        )}
                      </Grid>
                    </Box>
                  ) : (
                    <Alert severity="info" sx={{ mt: 2 }}>
                      Tidak ada gambar bukti bantahan yang disediakan.
                    </Alert>
                  )}
                </>
              ) : (
                <Alert
                  severity={ticket.status === "open" ? "info" : "warning"}
                  sx={{ mt: 2 }}
                >
                  {ticket.status === "open" ? (
                    <>
                      Belum ada bukti bantahan yang diajukan. Pihak lawan
                      memiliki waktu hingga{" "}
                      {formatDate(ticket.counterExpiresAt)} untuk menanggapi.
                    </>
                  ) : (
                    "Tidak ada bukti bantahan yang diajukan sebelum batas waktu."
                  )}
                </Alert>
              )}
            </Paper>
          )}
        </div>

        {/* Side by Side Tab */}
        <div
          role="tabpanel"
          hidden={activeTab !== 2}
          id="tabpanel-2"
          aria-labelledby="tab-2"
        >
          {activeTab === 2 && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Paper elevation={2} sx={{ p: 3, height: "100%" }}>
                  <Typography variant="h6" fontWeight="medium" gutterBottom>
                    Bukti{" "}
                    {ticket.submittedBy === "client" ? "Klien" : "Seniman"}
                  </Typography>

                  <Typography
                    variant="body1"
                    paragraph
                    sx={{ whiteSpace: "pre-line" }}
                  >
                    {ticket.description}
                  </Typography>

                  {ticket.proofImages && ticket.proofImages.length > 0 && (
                    <Box sx={{ mt: 2 }}>
                      <Typography
                        variant="subtitle2"
                        fontWeight="medium"
                        gutterBottom
                      >
                        Gambar Bukti
                      </Typography>
                      <Grid container spacing={1}>
                        {ticket.proofImages.map((img: string, i: number) => (
                          <Grid item xs={6} sm={4} key={i}>
                            <Card variant="outlined">
                              <CardMedia
                                component="img"
                                image={img}
                                alt={`Bukti ${i + 1}`}
                                sx={{ height: 100, objectFit: "cover" }}
                                onClick={() => window.open(img, "_blank")}
                              />
                            </Card>
                          </Grid>
                        ))}
                      </Grid>
                    </Box>
                  )}
                </Paper>
              </Grid>

              <Grid item xs={12} md={6}>
                <Paper elevation={2} sx={{ p: 3, height: "100%" }}>
                  <Typography variant="h6" fontWeight="medium" gutterBottom>
                    Tanggapan{" "}
                    {ticket.counterparty === "client" ? "Klien" : "Seniman"}
                  </Typography>

                  {ticket.counterDescription ? (
                    <>
                      <Typography
                        variant="body1"
                        paragraph
                        sx={{ whiteSpace: "pre-line" }}
                      >
                        {ticket.counterDescription}
                      </Typography>

                      {ticket.counterProofImages &&
                        ticket.counterProofImages.length > 0 && (
                          <Box sx={{ mt: 2 }}>
                            <Typography
                              variant="subtitle2"
                              fontWeight="medium"
                              gutterBottom
                            >
                              Gambar Bukti Bantahan
                            </Typography>
                            <Grid container spacing={1}>
                              {ticket.counterProofImages.map(
                                (img: string, i: number) => (
                                  <Grid item xs={6} sm={4} key={i}>
                                    <Card variant="outlined">
                                      <CardMedia
                                        component="img"
                                        image={img}
                                        alt={`Bukti Bantahan ${i + 1}`}
                                        sx={{ height: 100, objectFit: "cover" }}
                                        onClick={() =>
                                          window.open(img, "_blank")
                                        }
                                      />
                                    </Card>
                                  </Grid>
                                )
                              )}
                            </Grid>
                          </Box>
                        )}
                    </>
                  ) : (
                    <Alert
                      severity={ticket.status === "open" ? "info" : "warning"}
                      sx={{ mt: 2 }}
                    >
                      {ticket.status === "open" ? (
                        <>
                          Belum ada bukti bantahan yang diajukan. Pihak lawan
                          memiliki waktu hingga{" "}
                          {formatDate(ticket.counterExpiresAt)} untuk
                          menanggapi.
                        </>
                      ) : (
                        "Tidak ada bukti bantahan yang diajukan sebelum batas waktu."
                      )}
                    </Alert>
                  )}
                </Paper>
              </Grid>
            </Grid>
          )}
        </div>
      </Box>

      {/* Resolution Decision Form */}
      {ticket.status === "resolved" ? (
        <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
          <Typography variant="h6" fontWeight="medium" gutterBottom>
            Keputusan Penyelesaian
          </Typography>
          <Box sx={{ mb: 2 }}>
            <Chip
              label={
                ticket.decision === "favorClient"
                  ? "Keputusan Berpihak pada Klien"
                  : "Keputusan Berpihak pada Seniman"
              }
              color={ticket.decision === "favorClient" ? "info" : "secondary"}
              icon={<GavelIcon />}
              sx={{ mb: 2 }}
            />
          </Box>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Catatan Penyelesaian
          </Typography>
          <Paper
            variant="outlined"
            sx={{ p: 2, borderRadius: 1, bgcolor: "background.paper" }}
          >
            <Typography variant="body1" sx={{ whiteSpace: "pre-line" }}>
              {ticket.resolutionNote}
            </Typography>
          </Paper>
          <Box sx={{ mt: 2 }}>
            <Typography variant="caption" color="text.secondary">
              Diselesaikan oleh {ticket.resolvedBy?.toString()} pada{" "}
              {formatDate(ticket.resolvedAt)}
            </Typography>
          </Box>
        </Paper>
      ) : canResolve ? (
        <form onSubmit={handleSubmit(onSubmit)}>
          <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
            <Typography variant="h6" fontWeight="medium" gutterBottom>
              Buat Keputusan Penyelesaian
            </Typography>

            <Alert severity="info" sx={{ mb: 3 }}>
              <Typography variant="body2">
                Sebagai administrator, Anda perlu memutuskan posisi pihak mana
                yang akan didukung. Pertimbangkan semua bukti yang diberikan
                oleh kedua belah pihak sebelum membuat keputusan Anda. Hasil
                dari penyelesaian ini akan mempengaruhi{" "}
                {getTargetTypeDisplay(ticket.targetType).toLowerCase()} yang
                disengketakan.
              </Typography>
            </Alert>

            <Box sx={{ mb: 3 }}>
              <Controller
                name="decision"
                control={control}
                rules={{ required: "Keputusan diperlukan" }}
                render={({ field }) => (
                  <FormControl component="fieldset" error={!!errors.decision}>
                    <FormLabel component="legend">Keputusan</FormLabel>
                    <RadioGroup row {...field}>
                      <FormControlLabel
                        value="favorClient"
                        control={<Radio />}
                        label="Berpihak pada Klien"
                      />
                      <FormControlLabel
                        value="favorArtist"
                        control={<Radio />}
                        label="Berpihak pada Seniman"
                      />
                    </RadioGroup>
                    {errors.decision && (
                      <Typography variant="caption" color="error">
                        {errors.decision.message}
                      </Typography>
                    )}
                  </FormControl>
                )}
              />
            </Box>

            {/* Show consequence of decision */}
            {watchedDecision && (
              <Alert
                severity={
                  watchedDecision === "favorClient" ? "info" : "warning"
                }
                sx={{ mb: 3 }}
                icon={<GavelIcon />}
              >
                <Typography variant="body2">
                  {getDecisionConsequenceMessage(watchedDecision)}
                </Typography>
              </Alert>
            )}

            <Box sx={{ mb: 3 }}>
              <Controller
                name="resolutionNote"
                control={control}
                rules={{
                  required: "Catatan penyelesaian diperlukan",
                  minLength: {
                    value: 50,
                    message: "Harap berikan setidaknya 50 karakter penjelasan",
                  },
                }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Catatan Penyelesaian"
                    multiline
                    rows={4}
                    fullWidth
                    placeholder="Berikan penjelasan rinci tentang keputusan Anda. Ini akan terlihat oleh kedua belah pihak."
                    error={!!errors.resolutionNote}
                    helperText={
                      errors.resolutionNote?.message ||
                      "Jelaskan alasan di balik keputusan Anda secara rinci. Kedua belah pihak akan melihat penjelasan ini."
                    }
                  />
                )}
              />
            </Box>

            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={!canResolve || isSubmitting || !isValid}
                startIcon={
                  isSubmitting ? <CircularProgress size={20} /> : <GavelIcon />
                }
              >
                {isSubmitting ? "Mengirim..." : "Kirim Penyelesaian"}
              </Button>

              <Chip
                icon={<WarningIcon />}
                label="Tindakan ini tidak dapat dibatalkan"
                color="warning"
                variant="outlined"
              />
            </Box>
          </Paper>
        </form>
      ) : null}

      {/* Contract Information */}
      <Divider sx={{ my: 4 }} />

      <Paper elevation={2} sx={{ p: 3 }}>
        <Typography variant="h6" fontWeight="medium" gutterBottom>
          Informasi Kontrak
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Stack spacing={2}>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Status Kontrak
                </Typography>
                <Chip
                  label={contract.status.toUpperCase()}
                  color={
                    contract.status === "active"
                      ? "success"
                      : contract.status === "disputed"
                      ? "warning"
                      : contract.status === "completed"
                      ? "info"
                      : "default"
                  }
                  size="small"
                  sx={{ mt: 0.5 }}
                />
              </Box>

              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Dibuat
                </Typography>
                <Typography variant="body2">
                  {formatDate(contract.createdAt)}
                </Typography>
              </Box>
            </Stack>
          </Grid>

          <Grid item xs={12} md={4}>
            <Stack spacing={2}>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  ID Seniman
                </Typography>
                <Typography variant="body2">
                  {contract.artistId.toString()}
                </Typography>
              </Box>

              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  ID Klien
                </Typography>
                <Typography variant="body2">
                  {contract.clientId.toString()}
                </Typography>
              </Box>
            </Stack>
          </Grid>

          <Grid item xs={12} md={4}>
            <Stack spacing={2}>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Tenggat Waktu
                </Typography>
                <Typography variant="body2">
                  {formatDate(contract.deadlineAt)}
                </Typography>
              </Box>

              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Masa Tenggang Berakhir
                </Typography>
                <Typography variant="body2">
                  {formatDate(contract.graceEndsAt)}
                </Typography>
              </Box>
            </Stack>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
}

// src/components/dashboard/contracts/uploads/ProgressUploadDetails.tsx
"use client";

import {
  Box,
  Paper,
  Typography,
  Divider,
  Grid,
  Stack,
  Card,
  CardMedia,
  CardContent,
  Chip,
  Tooltip,
  IconButton,
} from "@mui/material";
import { IContract } from "@/lib/db/models/contract.model";
import { IProgressUploadStandard } from "@/lib/db/models/upload.model";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import ImageIcon from "@mui/icons-material/Image";
import InfoIcon from "@mui/icons-material/Info";
import DownloadIcon from "@mui/icons-material/Download";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";

interface ProgressUploadDetailsProps {
  contract: IContract;
  upload: IProgressUploadStandard;
  userId: string;
  isArtist: boolean;
  isClient: boolean;
}

export default function ProgressUploadDetails({
  contract,
  upload,
  userId,
  isArtist,
  isClient,
}: ProgressUploadDetailsProps) {
  // Format date for display
  const formatDate = (date?: string | Date) => {
    if (!date) return "N/A";
    const parsedDate = typeof date === "string" ? new Date(date) : date;
    return parsedDate.toLocaleString();
  };

  return (
    <Paper elevation={2} sx={{ p: 3 }}>
      {/* Header Section */}
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
            Pembaruan Progres
          </Typography>

          <Stack direction="row" spacing={2} alignItems="center" sx={{ mt: 1 }}>
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <CalendarTodayIcon
                sx={{ fontSize: 18, mr: 0.5, color: "text.secondary" }}
              />
              <Typography variant="body2" color="text.secondary">
                Diunggah: {formatDate(upload.createdAt)}
              </Typography>
            </Box>
          </Stack>
        </Box>

        <Chip
          label="Pembaruan Informasi"
          color="info"
          sx={{ fontWeight: "medium", px: 1 }}
        />
      </Box>

      <Divider sx={{ mb: 3 }} />

      {/* Area Konten Utama */}
      <Grid container spacing={3}>
        {/* Kolom Kiri: Detail Unggahan */}
        <Grid item xs={12} md={7}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom fontWeight="medium">
              Detail Progres
            </Typography>

            <Paper
              variant="outlined"
              sx={{ p: 2, borderRadius: 1, bgcolor: "background.paper", mb: 2 }}
            >
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                  Informasi Unggahan
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Jenis Unggahan:
                    </Typography>
                    <Typography variant="body1">Pembaruan Progres</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Diunggah Oleh:
                    </Typography>
                    <Typography variant="body1">
                      {isArtist ? "Anda (Seniman)" : "Seniman"}
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">
                      Alur Kontrak:
                    </Typography>
                    <Typography variant="body1">Alur Standar</Typography>
                  </Grid>
                </Grid>
              </Box>
            </Paper>

            {/* Deskripsi Seniman */}
            {upload.description && (
              <Box sx={{ mb: 2 }}>
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

            {/* Catatan untuk klien */}
            {isClient && (
              <Box sx={{ mt: 4 }}>
                <Divider sx={{ mb: 3 }} />
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "flex-start",
                    p: 2,
                    backgroundColor: "info.lighter",
                    borderRadius: 1,
                  }}
                >
                  <InfoIcon
                    sx={{ color: "info.main", mr: 1, mt: 0.5 }}
                    fontSize="small"
                  />
                  <Typography variant="body2" color="text.secondary">
                    Ini adalah pembaruan progres biasa yang dibagikan oleh
                    seniman untuk memberi Anda informasi tentang perkembangan
                    proyek. Tidak ada tindakan yang diperlukan dari pihak Anda.
                    Jangan ragu untuk menghubungi seniman jika Anda memiliki
                    pertanyaan atau umpan balik.
                  </Typography>
                </Box>
              </Box>
            )}

            {/* Catatan untuk seniman */}
            {isArtist && (
              <Box sx={{ mt: 4 }}>
                <Divider sx={{ mb: 3 }} />
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "flex-start",
                    p: 2,
                    backgroundColor: "info.lighter",
                    borderRadius: 1,
                  }}
                >
                  <InfoIcon
                    sx={{ color: "info.main", mr: 1, mt: 0.5 }}
                    fontSize="small"
                  />
                  <Typography variant="body2" color="text.secondary">
                    Anda telah membagikan pembaruan progres ini dengan klien
                    Anda. Ini adalah pembaruan informasi saja dan tidak
                    memerlukan persetujuan klien. Anda dapat melanjutkan
                    pekerjaan pada proyek ini.
                  </Typography>
                </Box>
              </Box>
            )}
          </Box>
        </Grid>

        {/* Kolom Kanan: Unggah Gambar */}
        <Grid item xs={12} md={5}>
          {upload.images && upload.images.length > 0 ? (
            <Box>
              <Typography variant="h6" gutterBottom fontWeight="medium">
                Gambar Progres
              </Typography>
              <Grid container spacing={2}>
                {upload.images.map((url, index) => (
                  <Grid item xs={12} sm={6} key={index}>
                    <Card variant="outlined" sx={{ height: "100%" }}>
                      <Box sx={{ position: "relative" }}>
                        <CardMedia
                          component="img"
                          image={url}
                          alt={`Progres ${index + 1}`}
                          sx={{
                            height: 200,
                            objectFit: "cover",
                            cursor: "pointer",
                          }}
                          onClick={() => window.open(url, "_blank")}
                        />
                        <Tooltip title="Buka di tab baru">
                          <IconButton
                            size="small"
                            onClick={() => window.open(url, "_blank")}
                            sx={{
                              position: "absolute",
                              top: 8,
                              right: 8,
                              bgcolor: "rgba(255,255,255,0.7)",
                              "&:hover": {
                                bgcolor: "rgba(255,255,255,0.9)",
                              },
                            }}
                          >
                            <OpenInNewIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
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
                  Tidak ada gambar yang diunggah untuk pembaruan progres ini.
                </Typography>
              </Paper>
            </Box>
          )}
        </Grid>
      </Grid>
    </Paper>
  );
}

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
            Progress Update
          </Typography>

          <Stack direction="row" spacing={2} alignItems="center" sx={{ mt: 1 }}>
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <CalendarTodayIcon
                sx={{ fontSize: 18, mr: 0.5, color: "text.secondary" }}
              />
              <Typography variant="body2" color="text.secondary">
                Uploaded: {formatDate(upload.createdAt)}
              </Typography>
            </Box>
          </Stack>
        </Box>

        <Chip
          label="Informational Update"
          color="info"
          sx={{ fontWeight: "medium", px: 1 }}
        />
      </Box>

      <Divider sx={{ mb: 3 }} />

      {/* Main Content Area */}
      <Grid container spacing={3}>
        {/* Left Column: Upload Details */}
        <Grid item xs={12} md={7}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom fontWeight="medium">
              Progress Details
            </Typography>

            <Paper
              variant="outlined"
              sx={{ p: 2, borderRadius: 1, bgcolor: "background.paper", mb: 2 }}
            >
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                  Upload Information
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Upload Type:
                    </Typography>
                    <Typography variant="body1">Progress Update</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Uploaded By:
                    </Typography>
                    <Typography variant="body1">
                      {isArtist ? "You (Artist)" : "Artist"}
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">
                      Contract Flow:
                    </Typography>
                    <Typography variant="body1">Standard Flow</Typography>
                  </Grid>
                </Grid>
              </Box>
            </Paper>

            {/* Artist's Description */}
            {upload.description && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                  Artist's Description
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

            {/* Note for client */}
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
                    This is an informal progress update shared by the artist to
                    keep you informed about the project's development. No action
                    is required on your part. Feel free to contact the artist if
                    you have any questions or feedback.
                  </Typography>
                </Box>
              </Box>
            )}

            {/* Note for artist */}
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
                    You've shared this progress update with your client. This is
                    an informational update only and doesn't require client
                    approval. You can continue working on the project.
                  </Typography>
                </Box>
              </Box>
            )}
          </Box>
        </Grid>

        {/* Right Column: Upload Images */}
        <Grid item xs={12} md={5}>
          {upload.images && upload.images.length > 0 ? (
            <Box>
              <Typography variant="h6" gutterBottom fontWeight="medium">
                Progress Images
              </Typography>
              <Grid container spacing={2}>
                {upload.images.map((url, index) => (
                  <Grid item xs={12} sm={6} key={index}>
                    <Card variant="outlined" sx={{ height: "100%" }}>
                      <Box sx={{ position: "relative" }}>
                        <CardMedia
                          component="img"
                          image={url}
                          alt={`Progress ${index + 1}`}
                          sx={{
                            height: 200,
                            objectFit: "cover",
                            cursor: "pointer",
                          }}
                          onClick={() => window.open(url, "_blank")}
                        />
                        <Tooltip title="Open in new tab">
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
                          Image {index + 1}
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
                  No images were uploaded for this progress update.
                </Typography>
              </Paper>
            </Box>
          )}
        </Grid>
      </Grid>
    </Paper>
  );
}
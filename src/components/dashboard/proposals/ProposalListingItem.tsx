"use client";

import React from "react";
import {
  Card,
  CardContent,
  Typography,
  Chip,
  Box,
  Stack,
  Divider,
  Tooltip,
  CardHeader,
  CardActionArea,
  Paper,
  alpha,
} from "@mui/material";
import { IProposal } from "@/lib/db/models/proposal.model";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import PriceCheckIcon from "@mui/icons-material/PriceCheck";
import EventBusyIcon from "@mui/icons-material/EventBusy";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";

interface ProposalListingItemProps {
  proposal: IProposal;
  onView?: (id: string) => void;
}

const statusColors = {
  pendingArtist: "primary",
  pendingClient: "secondary",
  accepted: "success",
  rejectedArtist: "error",
  rejectedClient: "error",
  expired: "default",
  paid: "info",
} as const;

const statusLabels = {
  pendingArtist: "Menunggu Seniman",
  pendingClient: "Menunggu Klien",
  accepted: "Diterima",
  rejectedArtist: "Ditolak oleh Seniman",
  rejectedClient: "Ditolak oleh Klien",
  expired: "Kedaluwarsa",
  paid: "Telah Dibayar",
} as const;

export default function ProposalListingItem({
  proposal,
  onView,
}: ProposalListingItemProps) {
  const formatDate = (dateString: string | Date) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
    }).format(amount);
  };

  const isExpiringSoon = () => {
    if (!proposal.expiresAt) return false;

    const now = new Date();
    const expiresAt = new Date(proposal.expiresAt);
    const hoursLeft = (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60);

    return hoursLeft < 24 && hoursLeft > 0;
  };

  // Check if the proposal is expired
  const isExpired = () => {
    if (!proposal.expiresAt) return false;

    const now = new Date();
    const expiresAt = new Date(proposal.expiresAt);

    return now > expiresAt;
  };

  // Determine the current status, checking for expiration first
  const currentStatus = isExpired() ? "expired" : proposal.status;

  const handleCardClick = () => {
    if (onView && !isExpired()) {
      onView(proposal._id.toString());
    }
  };

  return (
    <Card
      elevation={isExpired() ? 1 : 3}
      sx={{
        transition: "all 0.3s ease",
        "&:hover": {
          transform: isExpired() ? "none" : "translateY(-6px)",
          boxShadow: isExpired() ? 1 : 6,
        },
        height: "100%",
        display: "flex",
        flexDirection: "column",
        borderRadius: "12px",
        overflow: "hidden",
        opacity: isExpired() ? 0.7 : 1,
        filter: isExpired() ? "grayscale(0.8)" : "none",
        position: "relative",
      }}
    >
      {isExpired() && (
        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            zIndex: 1,
            backgroundColor: "rgba(0, 0, 0, 0.03)",
            pointerEvents: "none",
          }}
        />
      )}

      <CardActionArea
        onClick={handleCardClick}
        disabled={isExpired()}
        sx={{
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "stretch",
          justifyContent: "flex-start",
        }}
      >
        <CardHeader
          sx={{
            pb: 1,
            backgroundColor: (theme) =>
              theme.palette.mode === "dark"
                ? alpha(theme.palette.primary.main, 0.1)
                : alpha(theme.palette.primary.main, 0.05),
          }}
          title={
            <Typography
              variant="h6"
              component="h3"
              sx={{
                fontWeight: 600,
                overflow: "hidden",
                textOverflow: "ellipsis",
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
              }}
            >
              {proposal.listingSnapshot.title}
            </Typography>
          }
          action={
            <Tooltip title={statusLabels[currentStatus]}>
              <Chip
                icon={
                  currentStatus === "expired" ? <EventBusyIcon /> : undefined
                }
                label={statusLabels[currentStatus]}
                color={statusColors[currentStatus]}
                size="small"
                sx={{
                  fontWeight: 500,
                  borderRadius: "6px",
                  px: 0.5,
                  ml: 1,
                }}
              />
            </Tooltip>
          }
        />

        <CardContent
          sx={{
            flexGrow: 1,
            display: "flex",
            flexDirection: "column",
            p: { xs: 2, sm: 2.5 },
          }}
        >
          <Stack spacing={2.5} sx={{ height: "100%" }}>
            {/* Dates Section */}
            <Box>
              {/* Jendela Estimasi */}
              <Paper
                elevation={0}
                sx={{
                  p: 1.5,
                  mb: 2,
                  borderRadius: "8px",
                  backgroundColor: (theme) =>
                    theme.palette.mode === "dark"
                      ? alpha(theme.palette.background.paper, 0.6)
                      : alpha(theme.palette.background.paper, 0.8),
                  border: "1px solid",
                  borderColor: (theme) =>
                    theme.palette.mode === "dark"
                      ? alpha(theme.palette.divider, 0.3)
                      : alpha(theme.palette.divider, 0.5),
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                  <CalendarMonthIcon
                    fontSize="small"
                    sx={{ mr: 1, color: "primary.main" }}
                  />
                  <Typography
                    variant="body2"
                    color="primary.main"
                    fontWeight={600}
                  >
                    Estimasi Pengerjaan
                  </Typography>
                </Box>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    mt: 1,
                  }}
                >
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Tercepat
                    </Typography>
                    <Typography variant="body2" fontWeight={500}>
                      {formatDate(proposal.availability.earliestDate)}
                    </Typography>
                  </Box>
                  <Divider orientation="vertical" flexItem sx={{ mx: 2 }} />
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Terlambat
                    </Typography>
                    <Typography variant="body2" fontWeight={500}>
                      {formatDate(proposal.availability.latestDate)}
                    </Typography>
                  </Box>
                </Box>
              </Paper>

              {/* Tenggat Waktu */}
              <Paper
                elevation={0}
                sx={{
                  p: 1.5,
                  borderRadius: "8px",
                  backgroundColor: (theme) =>
                    theme.palette.mode === "dark"
                      ? alpha(theme.palette.primary.main, 0.1)
                      : alpha(theme.palette.primary.main, 0.05),
                  mb: 2,
                  border: "1px solid",
                  borderColor: (theme) =>
                    alpha(theme.palette.primary.main, 0.2),
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", mb: 0.5 }}>
                  <AccessTimeIcon
                    fontSize="small"
                    sx={{ mr: 1, color: "primary.main" }}
                  />
                  <Typography
                    variant="body2"
                    fontWeight={600}
                    color="primary.main"
                  >
                    Tenggat Waktu
                  </Typography>
                </Box>
                <Typography variant="body2" fontWeight={500}>
                  {formatDate(proposal.deadline)}
                </Typography>
              </Paper>

              {/* Pemberitahuan Kedaluwarsa */}
              {!isExpired() && proposal.status !== 'rejectedArtist' && proposal.status !== 'paid' && proposal.expiresAt && (
                <Paper
                  elevation={0}
                  sx={{
                    p: 1.5,
                    borderRadius: "8px",
                    backgroundColor: (theme) =>
                      isExpired()
                        ? alpha(theme.palette.grey[500], 0.1)
                        : isExpiringSoon()
                        ? alpha(theme.palette.error.main, 0.08)
                        : alpha(theme.palette.warning.main, 0.08),
                    border: "1px solid",
                    borderColor: (theme) =>
                      isExpired()
                        ? alpha(theme.palette.grey[500], 0.3)
                        : isExpiringSoon()
                        ? alpha(theme.palette.error.main, 0.3)
                        : alpha(theme.palette.warning.main, 0.3),
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    <EventBusyIcon
                      fontSize="small"
                      sx={{
                        mr: 1,
                        color: isExpired()
                          ? "text.secondary"
                          : isExpiringSoon()
                          ? "error.main"
                          : "warning.main",
                      }}
                    />
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 600,
                        color: isExpired()
                          ? "text.secondary"
                          : isExpiringSoon()
                          ? "error.main"
                          : "warning.main",
                      }}
                    >
                      {isExpired()
                        ? "Penawaran telah kedaluwarsa"
                        : isExpiringSoon()
                        ? "⚠️ Penawaran akan segera berakhir"
                        : "Waktu penawaran"}
                    </Typography>
                  </Box>
                  <Typography
                    variant="body2"
                    fontWeight={500}
                    sx={{
                      mt: 0.5,
                      color: isExpired() ? "text.secondary" : "text.primary",
                    }}
                  >
                    {new Date(proposal.expiresAt).toLocaleString()}
                  </Typography>
                </Paper>
              )}
            </Box>

            <Divider sx={{ width: "100%", margin: "0 auto" }} />

            {/* Price breakdown */}
            <Box sx={{ flexGrow: 1 }}>
              <Box sx={{ display: "flex", alignItems: "center", mb: 1.5 }}>
                <PriceCheckIcon
                  fontSize="small"
                  sx={{ mr: 1, color: "primary.main" }}
                />
                <Typography
                  variant="body2"
                  color="primary.main"
                  fontWeight={600}
                >
                  Rincian Harga
                </Typography>
              </Box>
              <Stack spacing={1.5}>
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography variant="body2">Harga Dasar:</Typography>
                  <Typography variant="body2" fontWeight={500}>
                    {formatCurrency(proposal.calculatedPrice.base)}
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography variant="body2">Opsi:</Typography>
                  <Typography variant="body2" fontWeight={500}>
                    {formatCurrency(proposal.calculatedPrice.optionGroups)}
                  </Typography>
                </Box>
                {proposal.calculatedPrice.addons > 0 && (
                  <Box
                    sx={{ display: "flex", justifyContent: "space-between" }}
                  >
                    <Typography variant="body2">Tambahan:</Typography>
                    <Typography variant="body2" fontWeight={500}>
                      {formatCurrency(proposal.calculatedPrice.addons)}
                    </Typography>
                  </Box>
                )}
                {proposal.calculatedPrice.rush > 0 && (
                  <Box
                    sx={{ display: "flex", justifyContent: "space-between" }}
                  >
                    <Typography variant="body2" color="warning.main">
                      Pengerjaan Cepat:
                    </Typography>
                    <Typography
                      variant="body2"
                      color="warning.main"
                      fontWeight={500}
                    >
                      {formatCurrency(proposal.calculatedPrice.rush)}
                    </Typography>
                  </Box>
                )}
                {proposal.calculatedPrice.discount > 0 && (
                  <Box
                    sx={{ display: "flex", justifyContent: "space-between" }}
                  >
                    <Typography variant="body2" color="success.main">
                      Diskon Seniman:
                    </Typography>
                    <Typography
                      variant="body2"
                      color="success.main"
                      fontWeight={500}
                    >
                      -{formatCurrency(proposal.calculatedPrice.discount)}
                    </Typography>
                  </Box>
                )}
                {proposal.calculatedPrice.surcharge > 0 && (
                  <Box
                    sx={{ display: "flex", justifyContent: "space-between" }}
                  >
                    <Typography variant="body2" color="error.main">
                      Tambahan Seniman:
                    </Typography>
                    <Typography
                      variant="body2"
                      color="error.main"
                      fontWeight={500}
                    >
                      +{formatCurrency(proposal.calculatedPrice.surcharge)}
                    </Typography>
                  </Box>
                )}
                <Divider sx={{ opacity: 0.6 }} />
                <Paper
                  elevation={0}
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    backgroundColor: (theme) =>
                      theme.palette.mode === "dark"
                        ? alpha(theme.palette.primary.main, 0.1)
                        : alpha(theme.palette.primary.main, 0.05),
                    p: 1.5,
                    borderRadius: "8px",
                    border: "1px solid",
                    borderColor: (theme) =>
                      alpha(theme.palette.primary.main, 0.2),
                  }}
                >
                  <Typography variant="subtitle1" fontWeight="bold">
                    Total:
                  </Typography>
                  <Typography
                    variant="subtitle1"
                    fontWeight="bold"
                    color="primary.main"
                  >
                    {formatCurrency(proposal.calculatedPrice.total)}
                  </Typography>
                </Paper>
              </Stack>
            </Box>
          </Stack>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}

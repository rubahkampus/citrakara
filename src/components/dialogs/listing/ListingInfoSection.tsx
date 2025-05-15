"use client";

import React from "react";
import {
  Box,
  Typography,
  useTheme,
  Grid,
  Chip,
  Stack,
  Paper,
  IconButton,
} from "@mui/material";
import {
  AccessTime,
  Receipt,
  Refresh,
  CheckCircle,
  Info,
  Gavel,
  AssignmentOutlined,
  Description,
  Inventory,
  ChevronLeft,
  ChevronRight,
} from "@mui/icons-material";
import Image from "next/image";
import { ICommissionListing } from "@/lib/db/models/commissionListing.model";

interface ListingInfoSectionProps {
  commission: ICommissionListing;
  activeImageIndex: number;
  handleNavigateImage: (direction: "prev" | "next") => void;
  formatPrice: (cents: number) => string;
  fullScreen: boolean;
}

export default function ListingInfoSection({
  commission,
  activeImageIndex,
  handleNavigateImage,
  formatPrice,
  fullScreen,
}: ListingInfoSectionProps) {
  const theme = useTheme();

  const {
    title,
    tags,
    samples,
    price,
    description,
    type,
    flow,
    deadline,
    cancelationFee,
    revisions,
    milestones,
    allowContractChange,
    changeable,
    slots,
    slotsUsed,
    reviewsSummary,
  } = commission;

  // Fixed price display to use the correct format
  const priceDisplay =
    `${formatPrice(price.min)}` +
    (price.min !== price.max ? ` - ${formatPrice(price.max)}` : "");

  const slotsRemaining =
    slots === -1
      ? "Tidak Terbatas"
      : `${Math.max(slots - slotsUsed, 0)} / ${slots}`;

  return (
    <>
      {/* Content */}
      <Box sx={{ mt: -5, p: 3, overflowY: "auto", flex: 1 }}>
        {/* Slots */}
        <Paper elevation={0} variant="outlined" sx={{ p: 2, mb: 3 }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <Inventory fontSize="small" color="action" />
            <Box>
              <Typography variant="body2" color="text.secondary">
                Slot
              </Typography>
              <Typography variant="subtitle2">{slotsRemaining}</Typography>
            </Box>
          </Stack>
        </Paper>

        {/* Description */}
        <Paper elevation={0} variant="outlined" sx={{ p: 2, mb: 3 }}>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
            <Description color="primary" />
            <Typography variant="subtitle1" fontWeight={600}>
              Detail Komisi
            </Typography>
          </Stack>
          {description?.length ? (
            description.map((d, i) => (
              <Box key={i} sx={{ mb: 1.5 }}>
                <Typography variant="subtitle2" fontWeight={500}>
                  {d.title}
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ whiteSpace: "pre-wrap" }}
                >
                  {d.detail}
                </Typography>
              </Box>
            ))
          ) : (
            <Typography variant="body2" color="text.secondary">
              Tidak ada deskripsi.
            </Typography>
          )}
        </Paper>

        {/* Specs grid */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={4}>
            <Paper elevation={0} variant="outlined" sx={{ p: 2 }}>
              <Stack direction="row" spacing={1} alignItems="center">
                <AccessTime fontSize="small" color="action" />
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Waktu Pengerjaan
                  </Typography>
                  <Typography variant="subtitle2">
                    {deadline.min}-{deadline.max} hari
                  </Typography>
                  {deadline.mode === "withRush" && deadline.rushFee && (
                    <Typography variant="caption" color="primary">
                      Pengerjaan cepat tersedia (+
                      {deadline.rushFee.kind === "flat"
                        ? formatPrice(deadline.rushFee.amount)
                        : `${deadline.rushFee.amount}/hari`}
                      )
                    </Typography>
                  )}
                </Box>
              </Stack>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Paper elevation={0} variant="outlined" sx={{ p: 2 }}>
              <Stack direction="row" spacing={1} alignItems="center">
                <Refresh fontSize="small" color="action" />
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Kebijakan Revisi
                  </Typography>
                  <Typography variant="subtitle2">
                    {revisions?.type === "none"
                      ? "Tidak ada revisi"
                      : revisions?.type === "standard"
                      ? revisions?.policy?.limit
                        ? revisions?.policy?.free == 0
                          ? "Hanya berbayar"
                          : `${revisions.policy.free} revisi gratis`
                        : "Revisi gratis tak terbatas"
                      : "Berbasis milestone"}
                  </Typography>
                  {revisions?.policy?.limit &&
                    revisions.policy.extraAllowed && (
                      <Typography variant="caption" color="primary">
                        Revisi berbayar: {formatPrice(revisions.policy.fee)}{" "}
                        setiap revisi
                      </Typography>
                    )}
                </Box>
              </Stack>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Paper elevation={0} variant="outlined" sx={{ p: 2 }}>
              <Stack direction="row" spacing={1} alignItems="center">
                <Receipt fontSize="small" color="action" />
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Biaya Pembatalan
                  </Typography>
                  <Typography variant="subtitle2">
                    {cancelationFee.kind === "flat"
                      ? formatPrice(cancelationFee.amount)
                      : `${cancelationFee.amount}% dari harga`}
                  </Typography>
                </Box>
              </Stack>
            </Paper>
          </Grid>
        </Grid>

        {/* Milestones (if flow is milestone) */}
        {flow === "milestone" && milestones && milestones.length > 0 && (
          <Paper elevation={0} variant="outlined" sx={{ p: 2, mb: 3 }}>
            <Stack
              direction="row"
              alignItems="center"
              spacing={1}
              sx={{ mb: 2 }}
            >
              <AssignmentOutlined color="primary" />
              <Typography variant="subtitle1" fontWeight={600}>
                Jadwal Milestone
              </Typography>
            </Stack>
            <Grid container spacing={2}>
              {milestones.map((milestone, i) => (
                <Grid item xs={12} sm={6} md={4} key={i}>
                  <Paper
                    elevation={0}
                    variant="outlined"
                    sx={{ p: 2, bgcolor: theme.palette.grey[50] }}
                  >
                    <Typography variant="subtitle2" fontWeight={600}>
                      {i + 1}. {milestone.title}
                    </Typography>
                    <Typography variant="body2" color="primary">
                      {milestone.percent}% pembayaran
                    </Typography>
                    {milestone.policy && (
                      <Typography variant="caption" color="text.secondary">
                        {milestone.policy.limit
                          ? `${milestone.policy.free} revisi gratis`
                          : "Revisi tak terbatas"}
                        {milestone.policy.limit &&
                          milestone.policy.extraAllowed &&
                          `, lalu ${formatPrice(
                            milestone.policy.fee
                          )} setiap revisi`}
                      </Typography>
                    )}
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </Paper>
        )}

        {/* Contract Terms */}
        <Paper
          elevation={0}
          variant="outlined"
          sx={{
            p: 2,
            mb: 3,
            bgcolor: theme.palette.primary.light,
            color: theme.palette.primary.contrastText,
          }}
        >
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
            <Gavel />
            <Typography variant="subtitle1" fontWeight={600}>
              Ketentuan Kontrak
            </Typography>
          </Stack>
          <Stack spacing={1}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <CheckCircle fontSize="small" />
              <Typography variant="body2">
                Perubahan kontrak:{" "}
                {allowContractChange ? "Diizinkan" : "Tidak diizinkan"}
              </Typography>
            </Stack>
            {allowContractChange && changeable && changeable.length > 0 && (
              <Typography variant="body2" sx={{ ml: 4 }}>
                Dapat diubah:{" "}
                {changeable
                  .map((item) =>
                    item
                      .replace(/([A-Z])/g, " $1")
                      .replace(/^./, (str) => str.toUpperCase())
                      .trim()
                  )
                  .join(", ")}
              </Typography>
            )}
            <Stack direction="row" alignItems="center" spacing={1}>
              <Info fontSize="small" />
              <Typography variant="body2">
                Dengan melanjutkan, Anda menyetujui persyaratan layanan seniman
              </Typography>
            </Stack>
          </Stack>
        </Paper>
      </Box>
    </>
  );
}

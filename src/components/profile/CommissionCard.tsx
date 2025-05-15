"use client";

import React, { useState, MouseEvent } from "react";
import {
  Box,
  Typography,
  useTheme,
  IconButton,
  Button,
  Stack,
  Chip,
  Tooltip,
  alpha,
} from "@mui/material";
import Image from "next/image";
import {
  ArrowBackIosNew,
  ArrowForwardIos,
  BookmarkBorderRounded,
  ChatRounded,
  AccessTimeRounded,
  LocalOfferRounded,
  StarRounded,
} from "@mui/icons-material";
import { useDialogStore } from "@/lib/stores";
import { useRouter } from "next/navigation";
import type { ICommissionListing } from "@/lib/db/models/commissionListing.model";

interface CommissionCardProps {
  commission: ICommissionListing;
  username: string;
  isOwner: boolean;
}

export default function CommissionCard({
  commission,
  username,
  isOwner,
}: CommissionCardProps) {
  const theme = useTheme();
  const openDialog = useDialogStore((state) => state.open);

  const router = useRouter();

  // Samples carousel
  const samples = commission.samples || [];
  const initialIdx =
    commission.thumbnailIdx >= 0 && commission.thumbnailIdx < samples.length
      ? commission.thumbnailIdx
      : 0;
  const [activeIndex, setActiveIndex] = useState<number>(initialIdx);

  const handlePrev = (e: MouseEvent) => {
    e.stopPropagation();
    if (!samples.length) return;
    setActiveIndex((prev) => (prev - 1 + samples.length) % samples.length);
  };

  const handleNext = (e: MouseEvent) => {
    e.stopPropagation();
    if (!samples.length) return;
    setActiveIndex((prev) => (prev + 1) % samples.length);
  };

  const currentImage = samples[activeIndex];

  // Check slot availability
  const slotsAvailable =
    commission.slots === -1 || commission.slotsUsed < commission.slots;

  // Format price from cents
  const formatPrice = (cents: number) =>
    new Intl.NumberFormat("id-ID").format(cents);
  const { min, max } = commission.price;
  const priceDisplay =
    `${commission.currency} ${formatPrice(min)}` +
    (min !== max ? ` - ${formatPrice(max)}` : "");

  const handleRequest = (e: MouseEvent) => {
    e.stopPropagation();
    openDialog(
      "viewCommission",
      commission._id.toString(),
      commission,
      isOwner
    );
  };

  const handleManage = (e: MouseEvent, activeListingId: string) => {
    // Prevent event bubbling to parent
    e.stopPropagation();
    router.push(`/${username}/dashboard/commissions/${activeListingId}`);
  };

  // Build description text
  const descriptionText =
    commission.description && commission.description.length > 0
      ? commission.description.map((d) => `${d.title}: ${d.detail}`).join(" • ")
      : "";

  // Get deadline information
  const getDeadlineText = () => {
    const { deadline } = commission;
    if (deadline.min === deadline.max) {
      return `${deadline.min} hari`;
    }
    return `${deadline.min}-${deadline.max} hari`;
  };

  // First tag and review data
  const firstTag =
    commission.tags && commission.tags.length > 0 ? commission.tags[0] : null;
  const { avg: rating, count: reviewCount } = commission.reviewsSummary || {
    avg: 0,
    count: 0,
  };

  return (
    <Box
      onClick={handleRequest}
      sx={{
        display: "flex",
        flexDirection: { xs: "column", sm: "row" },
        width: "100%",
        borderRadius: 3,
        overflow: "hidden",
        boxShadow: "0 10px 25px rgba(0,0,0,0.07)",
        backgroundColor: theme.palette.background.paper,
        transition: "all 0.3s ease",
        "&:hover": {
          transform: "translateY(-5px)",
          boxShadow: "0 15px 30px rgba(0,0,0,0.12)",
        },
        position: "relative",
        height: { sm: 320 }, // Fixed height to match image height on larger screens
      }}
    >
      {/* Image Carousel */}
      <Box
        sx={{
          position: "relative",
          flex: { xs: "1", sm: "0 0 45%" },
          height: { xs: 240, sm: 320 },
          backgroundColor: theme.palette.grey[100],
          overflow: "hidden", // Ensure image doesn't overflow
        }}
      >
        {currentImage ? (
          <Image
            src={currentImage}
            alt={commission.title}
            fill
            style={{
              objectFit: "cover",
              transition: "transform 0.5s ease-in-out",
            }}
            unoptimized
          />
        ) : (
          <Box
            sx={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              textAlign: "center",
              width: "100%",
              p: 2,
            }}
          >
            <Typography variant="body1" color="text.secondary">
              Tidak Ada Gambar
            </Typography>
          </Box>
        )}

        {/* Prev/Next Arrows - improved visibility */}
        {samples.length > 1 && (
          <>
            <IconButton
              onClick={handlePrev}
              sx={{
                position: "absolute",
                top: "50%",
                left: 12,
                transform: "translateY(-50%)",
                backgroundColor: alpha(theme.palette.common.black, 0.4),
                color: theme.palette.common.white,
                "&:hover": {
                  backgroundColor: alpha(theme.palette.common.black, 0.6),
                  transform: "translateY(-50%) scale(1.1)",
                },
                width: 36,
                height: 36,
                opacity: { xs: 1, sm: 0.8 },
                transition: "all 0.2s ease",
                ".MuiBox-root:hover &": {
                  opacity: 1,
                },
                zIndex: 2,
              }}
              size="small"
            >
              <ArrowBackIosNew fontSize="small" />
            </IconButton>
            <IconButton
              onClick={handleNext}
              sx={{
                position: "absolute",
                top: "50%",
                right: 12,
                transform: "translateY(-50%)",
                backgroundColor: alpha(theme.palette.common.black, 0.4),
                color: theme.palette.common.white,
                "&:hover": {
                  backgroundColor: alpha(theme.palette.common.black, 0.6),
                  transform: "translateY(-50%) scale(1.1)",
                },
                width: 36,
                height: 36,
                opacity: { xs: 1, sm: 0.8 },
                transition: "all 0.2s ease",
                ".MuiBox-root:hover &": {
                  opacity: 1,
                },
                zIndex: 2,
              }}
              size="small"
            >
              <ArrowForwardIos fontSize="small" />
            </IconButton>
          </>
        )}

        {/* Type label - improved visibility */}
        <Chip
          label={commission.type === "template" ? "YCH" : "Kustom"}
          size="small"
          sx={{
            position: "absolute",
            top: 12,
            left: 12,
            backgroundColor:
              commission.type === "template"
                ? alpha(theme.palette.info.main, 0.95)
                : alpha(theme.palette.success.main, 0.95),
            color: theme.palette.common.white,
            fontWeight: 600,
            fontSize: "0.7rem",
            height: 24,
            zIndex: 2,
            boxShadow: "0 2px 4px rgba(0,0,0,0.15)",
          }}
        />

        {/* Bookmark - improved styling */}
        <IconButton
          onClick={(e) => e.stopPropagation()}
          sx={{
            position: "absolute",
            top: 12,
            right: 12,
            backgroundColor: alpha(theme.palette.common.white, 0.85),
            width: 36,
            height: 36,
            "&:hover": {
              backgroundColor: theme.palette.common.white,
              transform: "scale(1.1)",
            },
            transition: "all 0.2s ease",
            zIndex: 2,
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          }}
          size="small"
        >
          <BookmarkBorderRounded sx={{ fontSize: 20 }} />
        </IconButton>

        {/* Dots Indicator - improved styling */}
        {samples.length > 1 && (
          <Stack
            direction="row"
            spacing={0.8}
            sx={{
              position: "absolute",
              bottom: 12,
              left: "50%",
              transform: "translateX(-50%)",
              backgroundColor: alpha(theme.palette.common.black, 0.5),
              borderRadius: 5,
              p: 0.8,
              zIndex: 2,
              boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
            }}
          >
            {samples.map((_, idx) => (
              <Box
                key={idx}
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveIndex(idx);
                }}
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  backgroundColor:
                    idx === activeIndex
                      ? theme.palette.common.white
                      : alpha(theme.palette.common.white, 0.5),
                  transition: "all 0.2s ease",
                  cursor: "pointer",
                  "&:hover": {
                    backgroundColor: alpha(theme.palette.common.white, 0.8),
                  },
                }}
              />
            ))}
          </Stack>
        )}
      </Box>

      {/* Content Area - improved spacing */}
      <Box
        sx={{
          flex: 1,
          p: { xs: 2.5, sm: 3 },
          display: "flex",
          flexDirection: "column",
          height: "100%", // Ensures content area fills full height
          justifyContent: "space-between", // Better distribution of elements
          overflow: "auto", // Allow scrolling if content overflows
        }}
      >
        {/* Content wrapper to manage scrolling */}
        <Box sx={{ overflow: "auto", height: "100%" }}>
          {/* Top info area with stats */}
          <Stack
            direction="row"
            alignItems="center"
            spacing={2}
            sx={{ mb: 1.5 }}
          >
            {firstTag && (
              <Chip
                label={firstTag}
                size="small"
                sx={{
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                  color: theme.palette.primary.main,
                  fontWeight: 500,
                  height: 24,
                }}
              />
            )}

            {reviewCount > 0 && (
              <Stack direction="row" alignItems="center" spacing={0.5}>
                <StarRounded
                  sx={{ color: theme.palette.warning.main, fontSize: 18 }}
                />
                <Typography variant="body2" fontWeight={600}>
                  {rating.toFixed(1)}
                  <Typography
                    component="span"
                    variant="body2"
                    color="text.secondary"
                    sx={{ ml: 0.5, fontWeight: 400 }}
                  >
                    ({reviewCount})
                  </Typography>
                </Typography>
              </Stack>
            )}

            <Stack direction="row" alignItems="center" spacing={0.5}>
              <AccessTimeRounded
                sx={{ color: theme.palette.text.secondary, fontSize: 18 }}
              />
              <Typography variant="body2" color="text.secondary">
                {getDeadlineText()}
              </Typography>
            </Stack>
          </Stack>

          {/* Title */}
          <Typography
            variant="h5"
            fontWeight={700}
            sx={{
              mb: 1.5,
              color: theme.palette.text.primary,
              lineHeight: 1.2,
            }}
          >
            {commission.title}
          </Typography>

          {/* Price */}
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
            <LocalOfferRounded
              sx={{ color: theme.palette.primary.main, fontSize: 20 }}
            />
            <Typography
              variant="h6"
              fontWeight={600}
              sx={{
                color: theme.palette.primary.main,
                letterSpacing: "-0.02em",
              }}
            >
              Mulai {priceDisplay}
            </Typography>
          </Stack>

          {/* Description */}
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              display: "-webkit-box",
              WebkitLineClamp: 3,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              mb: 2.5,
              lineHeight: 1.6,
            }}
          >
            {descriptionText}
          </Typography>

          {/* Status chip */}
          {!slotsAvailable && (
            <Chip
              label="Slot tidak tersedia"
              size="small"
              sx={{
                bgcolor: alpha(theme.palette.error.main, 0.1),
                color: theme.palette.error.main,
                fontWeight: 500,
                mb: 2,
                width: "fit-content",
              }}
            />
          )}
        </Box>

        {/* Actions - fixed at bottom */}
        <Stack
          direction="row"
          spacing={1.5}
          sx={{
            mt: 2,
            alignItems: "center",
          }}
        >
          {!isOwner && (
            <Button
              onClick={handleRequest}
              disabled={!slotsAvailable}
              fullWidth
              variant="contained"
              sx={{
                py: 1.5,
                borderRadius: "12px",
                textTransform: "none",
                background: slotsAvailable
                  ? "linear-gradient(90deg, #A8FF00 0%, #00FFD1 100%)"
                  : theme.palette.action.disabledBackground,
                color: slotsAvailable
                  ? theme.palette.common.black
                  : theme.palette.text.disabled,
                fontWeight: 700,
                fontSize: "1rem",
                boxShadow: slotsAvailable
                  ? "0 5px 15px rgba(168, 255, 0, 0.3)"
                  : "none",
                "&:hover": {
                  background: slotsAvailable
                    ? "linear-gradient(90deg, #9EF500 0%, #00F0C5 100%)"
                    : theme.palette.action.disabledBackground,
                  boxShadow: slotsAvailable
                    ? "0 8px 20px rgba(168, 255, 0, 0.4)"
                    : "none",
                },
                transition: "all 0.3s ease",
              }}
            >
              {slotsAvailable ? "Ajukan Komisi" : "Saat Ini Tidak Tersedia"}
            </Button>
          )}

          {isOwner && (
            <Button
              onClick={(e) => handleManage(e, commission._id.toString())}
              variant="outlined"
              fullWidth
              sx={{
                py: 1.5,
                borderRadius: "12px",
                textTransform: "none",
                fontWeight: 600,
                borderWidth: 2,
              }}
            >
              Kelola Daftar
            </Button>
          )}

          <Tooltip title="Chat dengan seniman">
            <IconButton
              onClick={(e) => e.stopPropagation()}
              sx={{
                backgroundColor: theme.palette.grey[100],
                height: 48,
                width: 48,
                "&:hover": {
                  backgroundColor: alpha(theme.palette.primary.main, 0.1),
                },
              }}
            >
              <ChatRounded />
            </IconButton>
          </Tooltip>
        </Stack>
      </Box>
    </Box>
  );
}

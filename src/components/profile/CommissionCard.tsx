// src/components/profile/CommissionCard.tsx
"use client";

import { Box, Typography, Grid, useTheme, Avatar } from "@mui/material";
import Image from "next/image";
import { useDialogStore } from "@/lib/stores";
import { KButton } from "@/components/KButton";
import { ICommissionListing } from "@/lib/db/models/commissionListing.model";

interface CommissionCardProps {
  commission: ICommissionListing;
  isOwner: boolean;
}

export default function CommissionCard({
  commission,
  isOwner,
}: CommissionCardProps) {
  const theme = useTheme();
  const openDialog = useDialogStore((state) => state.open);

  // Check slot availability
  const slotsAvailable =
    commission.slots === -1 || commission.slotsUsed < commission.slots;

  // Format price
  const formatPrice = (price: number) =>
    new Intl.NumberFormat("id-ID").format(price);
  const priceDisplay =
    `${commission.currency}${formatPrice(commission.price.min)}` +
    (commission.price.min !== commission.price.max
      ? ` - ${formatPrice(commission.price.max)}`
      : "");

  const handleView = () => {
    openDialog("viewCommission", commission._id.toString(), commission, isOwner);
  };

  const handleChat = () => {
    openDialog("viewCommission", commission._id.toString(), commission, isOwner);
  };

  return (
    <Box
      onClick={handleView}
      sx={{
        cursor: "pointer",
        mb: 2,
        transition: "transform 0.15s, box-shadow 0.15s",
        "&:hover": { transform: "translateY(-2px)" },
      }}
    >
      <Grid container spacing={0}>
        <Grid item xs={12} sm={4} md={3}>
          <Box
            sx={{
              position: "relative",
              height: { xs: 200, sm: 150 },
              width: "100%",
              bgcolor: theme.palette.divider,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
            }}
          >
            {commission.samples ? (
              <Image
                src={commission.samples[commission.thumbnailIdx]}
                alt={commission.title}
                layout="fill"
                objectFit="cover"
                unoptimized
              />
            ) : (
              <Typography color="text.secondary">No Image</Typography>
            )}
          </Box>
        </Grid>

        <Grid item xs={12} sm={8} md={9}>
          <Box
            sx={{
              p: 2,
              height: "100%",
              bgcolor: "background.paper",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <Typography
              variant="h6"
              component="h2"
              fontWeight="medium"
              sx={{ mb: 1 }}
            >
              {commission.title}
            </Typography>

            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                mb: 2,
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {commission.description.map((desc, index) => (
                <Typography key={index} variant="body2" color="text.secondary">
                  {desc.title}: {desc.detail}
                </Typography>
              ))}
            </Typography>

            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mt: "auto",
              }}
            >
              <Typography variant="h6" fontWeight="medium" color="text.primary">
                {priceDisplay}
              </Typography>

              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                {!isOwner && (
                  <Avatar
                    sx={{ width: 32, height: 32 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleChat();
                    }}
                  />
                )}

                {!isOwner && (
                  <KButton
                    size="small"
                    variant="contained"
                    disabled={!slotsAvailable}
                    sx={{ minWidth: 110, fontSize: "0.875rem" }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleChat();
                    }}
                  >
                    {slotsAvailable ? "Send Request" : "Slot Unavailable"}
                  </KButton>
                )}
              </Box>
            </Box>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
}

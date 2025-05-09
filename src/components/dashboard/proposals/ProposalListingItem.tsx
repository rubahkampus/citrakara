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
} from "@mui/material";
import { IProposal } from "@/lib/db/models/proposal.model";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import PriceCheckIcon from "@mui/icons-material/PriceCheck";

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
  pendingArtist: "Awaiting Artist",
  pendingClient: "Awaiting Client",
  accepted: "Accepted",
  rejectedArtist: "Rejected by Artist",
  rejectedClient: "Rejected by Client",
  expired: "Expired",
  paid: "Paid",
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

    return hoursLeft < 24;
  };

  const handleCardClick = () => {
    if (onView) {
      onView(proposal._id.toString());
    }
  };

  return (
    <Card
      elevation={3}
      sx={{
        transition: "all 0.3s ease",
        "&:hover": {
          transform: "translateY(-6px)",
          boxShadow: 6,
        },
        height: "100%",
        display: "flex",
        flexDirection: "column",
        borderRadius: "12px",
        overflow: "hidden",
      }}
    >
      <CardActionArea
        onClick={handleCardClick}
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
                ? "rgba(255, 255, 255, 0.05)"
                : "rgba(0, 0, 0, 0.02)",
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
            <Tooltip title={statusLabels[proposal.status]}>
              <Chip
                label={statusLabels[proposal.status]}
                color={statusColors[proposal.status]}
                size="small"
                sx={{
                  fontWeight: 500,
                  borderRadius: "6px",
                  px: 0.5,
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
            p: { xs: 1.5, sm: 2 },
          }}
        >
          <Stack spacing={2} sx={{ height: "100%" }}>
            {/* Dates Section */}
            <Box>
              {/* Availability Window */}
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                  <AccessTimeIcon
                    fontSize="small"
                    sx={{ mr: 1, color: "text.secondary" }}
                  />
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    fontWeight={500}
                  >
                    Availability Window
                  </Typography>
                </Box>
                <Typography
                  variant="body2"
                  sx={{ display: "flex", justifyContent: "space-between" }}
                >
                  <span>
                    From:{" "}
                    <Box component="span" sx={{ fontWeight: 500 }}>
                      {formatDate(proposal.availability.earliestDate)}
                    </Box>
                  </span>
                  <span>
                    To:{" "}
                    <Box component="span" sx={{ fontWeight: 500 }}>
                      {formatDate(proposal.availability.latestDate)}
                    </Box>
                  </span>
                </Typography>
              </Box>

              {/* Deadline */}
              <Box
                sx={{
                  p: 1,
                  borderRadius: "6px",
                  backgroundColor: (theme) =>
                    theme.palette.mode === "dark"
                      ? "rgba(0, 127, 255, 0.08)"
                      : "rgba(0, 127, 255, 0.05)",
                  mb: 2,
                }}
              >
                <Typography
                  variant="body2"
                  fontWeight={600}
                  color="primary"
                  sx={{ mb: 0.5 }}
                >
                  Deadline
                </Typography>
                <Typography variant="body2" fontWeight={500}>
                  {formatDate(proposal.deadline)}
                </Typography>
              </Box>

              {/* Expiration Notice */}
              {proposal.expiresAt && (
                <Typography
                  variant="body2"
                  color="error"
                  sx={{
                    fontWeight: isExpiringSoon() ? 600 : 400,
                    display: "flex",
                    alignItems: "center",
                    backgroundColor: isExpiringSoon()
                      ? "rgba(211, 47, 47, 0.08)"
                      : "transparent",
                    p: isExpiringSoon() ? 0.75 : 0,
                    borderRadius: isExpiringSoon() ? "6px" : 0,
                  }}
                >
                  {isExpiringSoon() && "⚠️ "}
                  Offer expires: {new Date(proposal.expiresAt).toLocaleString()}
                </Typography>
              )}
            </Box>

            <Divider
              sx={{
                opacity: 0.6,
                width: "100%",
                margin: "0 auto",
              }}
            />

            {/* Price breakdown */}
            <Box sx={{ flexGrow: 1 }}>
              <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                <PriceCheckIcon
                  fontSize="small"
                  sx={{ mr: 1, color: "text.secondary" }}
                />
                <Typography
                  variant="body2"
                  color="text.secondary"
                  fontWeight={500}
                >
                  Price Breakdown
                </Typography>
              </Box>
              <Stack spacing={1}>
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography variant="body2">Base Price:</Typography>
                  <Typography variant="body2">
                    {formatCurrency(proposal.calculatedPrice.base)}
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography variant="body2">Options:</Typography>
                  <Typography variant="body2">
                    {formatCurrency(proposal.calculatedPrice.optionGroups)}
                  </Typography>
                </Box>
                {proposal.calculatedPrice.addons > 0 && (
                  <Box
                    sx={{ display: "flex", justifyContent: "space-between" }}
                  >
                    <Typography variant="body2">Add-ons:</Typography>
                    <Typography variant="body2">
                      {formatCurrency(proposal.calculatedPrice.addons)}
                    </Typography>
                  </Box>
                )}
                {proposal.calculatedPrice.rush > 0 && (
                  <Box
                    sx={{ display: "flex", justifyContent: "space-between" }}
                  >
                    <Typography variant="body2" color="warning.main">
                      Rush Fee:
                    </Typography>
                    <Typography variant="body2" color="warning.main">
                      {formatCurrency(proposal.calculatedPrice.rush)}
                    </Typography>
                  </Box>
                )}
                {proposal.calculatedPrice.discount > 0 && (
                  <Box
                    sx={{ display: "flex", justifyContent: "space-between" }}
                  >
                    <Typography variant="body2" color="success.main">
                      Discount:
                    </Typography>
                    <Typography variant="body2" color="success.main">
                      -{formatCurrency(proposal.calculatedPrice.discount)}
                    </Typography>
                  </Box>
                )}
                {proposal.calculatedPrice.surcharge > 0 && (
                  <Box
                    sx={{ display: "flex", justifyContent: "space-between" }}
                  >
                    <Typography variant="body2" color="error.main">
                      Surcharge:
                    </Typography>
                    <Typography variant="body2" color="error.main">
                      +{formatCurrency(proposal.calculatedPrice.surcharge)}
                    </Typography>
                  </Box>
                )}
                <Divider sx={{ opacity: 0.6 }} />
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    backgroundColor: (theme) =>
                      theme.palette.mode === "dark"
                        ? "rgba(255, 255, 255, 0.05)"
                        : "rgba(0, 0, 0, 0.03)",
                    p: 1,
                    borderRadius: "6px",
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
                </Box>
              </Stack>
            </Box>
          </Stack>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}

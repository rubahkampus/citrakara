"use client";

import React from "react";
import {
  Card,
  CardContent,
  Typography,
  Chip,
  Box,
  Button,
  Stack,
  Divider,
  Tooltip,
  CardHeader,
  Avatar,
} from "@mui/material";
import { IProposal } from "@/lib/db/models/proposal.model";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import PriceCheckIcon from "@mui/icons-material/PriceCheck";

interface ProposalListingItemProps {
  proposal: IProposal;
  onEdit?: (id: string) => void;
  onRespond?: (id: string) => void;
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
  onEdit,
  onRespond,
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

  return (
    <Card
      elevation={3}
      sx={{
        transition: "transform 0.2s",
        "&:hover": { transform: "translateY(-4px)" },
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <CardHeader
        title={
          <Typography variant="h6" component="h3" sx={{ fontWeight: 600 }}>
            {proposal.listingSnapshot.title}
          </Typography>
        }
        action={
          <Tooltip title={statusLabels[proposal.status]}>
            <Chip
              label={statusLabels[proposal.status]}
              color={statusColors[proposal.status]}
              size="small"
              sx={{ fontWeight: 500 }}
            />
          </Tooltip>
        }
      />

      <CardContent
        sx={{ flexGrow: 1, display: "flex", flexDirection: "column" }}
      >
        <Stack spacing={2} sx={{ height: "100%" }}>
          {/* Dates */}
          <Box>
            <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
              <AccessTimeIcon
                fontSize="small"
                sx={{ mr: 1, color: "text.secondary" }}
              />
              <Typography variant="body2" color="text.secondary">
                Availability Window
              </Typography>
            </Box>
            <Typography variant="body2">
              {formatDate(proposal.availability.earliestDate)} →
              <Box component="span" sx={{ fontWeight: 600, mx: 1 }}>
                {formatDate(proposal.deadline)}
              </Box>
              → {formatDate(proposal.availability.latestDate)}
            </Typography>
            {proposal.expiresAt && (
              <Typography
                variant="body2"
                color="error"
                sx={{
                  mt: 1,
                  fontWeight: isExpiringSoon() ? 600 : 400,
                  display: "flex",
                  alignItems: "center",
                }}
              >
                {isExpiringSoon() && "⚠️ "}
                Expires: {new Date(proposal.expiresAt).toLocaleString()}
              </Typography>
            )}
          </Box>

          <Divider />

          {/* Price breakdown */}
          <Box sx={{ flexGrow: 1 }}>
            <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
              <PriceCheckIcon
                fontSize="small"
                sx={{ mr: 1, color: "text.secondary" }}
              />
              <Typography variant="body2" color="text.secondary">
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
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography variant="body2">Add-ons:</Typography>
                  <Typography variant="body2">
                    {formatCurrency(proposal.calculatedPrice.addons)}
                  </Typography>
                </Box>
              )}
              {proposal.calculatedPrice.rush > 0 && (
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography variant="body2" color="warning.main">
                    Rush Fee:
                  </Typography>
                  <Typography variant="body2" color="warning.main">
                    {formatCurrency(proposal.calculatedPrice.rush)}
                  </Typography>
                </Box>
              )}
              {proposal.calculatedPrice.discount > 0 && (
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography variant="body2" color="success.main">
                    Discount:
                  </Typography>
                  <Typography variant="body2" color="success.main">
                    -{formatCurrency(proposal.calculatedPrice.discount)}
                  </Typography>
                </Box>
              )}
              {proposal.calculatedPrice.surcharge > 0 && (
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography variant="body2" color="error.main">
                    Surcharge:
                  </Typography>
                  <Typography variant="body2" color="error.main">
                    +{formatCurrency(proposal.calculatedPrice.surcharge)}
                  </Typography>
                </Box>
              )}
              <Divider />
              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <Typography variant="subtitle1" fontWeight="bold">
                  Total:
                </Typography>
                <Typography variant="subtitle1" fontWeight="bold">
                  {formatCurrency(proposal.calculatedPrice.total)}
                </Typography>
              </Box>
            </Stack>
          </Box>

          {/* Actions */}
          <Box sx={{ display: "flex", gap: 1, mt: "auto", pt: 2 }}>
            {onEdit && (
              <Button
                variant="outlined"
                color="primary"
                onClick={() => onEdit(proposal._id.toString())}
                fullWidth
              >
                Edit
              </Button>
            )}
            {onRespond && (
              <Button
                variant="contained"
                color="primary"
                onClick={() => onRespond(proposal._id.toString())}
                fullWidth
              >
                Respond
              </Button>
            )}
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

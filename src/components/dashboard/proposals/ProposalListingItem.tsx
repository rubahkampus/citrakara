// src/components/dashboard/proposals/ProposalListingItem.tsx
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
} from "@mui/material";
import { ProposalUI } from "@/types/proposal";

interface ProposalListingItemProps {
  proposal: ProposalUI;
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
} as const;

const statusLabels = {
  pendingArtist: "Awaiting Artist",
  pendingClient: "Awaiting Client",
  accepted: "Accepted",
  rejectedArtist: "Rejected by Artist",
  rejectedClient: "Rejected by Client",
  expired: "Expired",
} as const;

export default function ProposalListingItem({
  proposal,
  onEdit,
  onRespond,
}: ProposalListingItemProps) {
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
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

  return (
    <Card>
      <CardContent>
        <Stack spacing={2}>
          {/* Header with title and status */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "start",
            }}
          >
            <Typography variant="h6" component="h3" sx={{ fontWeight: 600 }}>
              {proposal.listingTitle}
            </Typography>
            <Chip
              label={statusLabels[proposal.status]}
              color={statusColors[proposal.status]}
              size="small"
            />
          </Box>

          {/* Dates */}
          <Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Availability Window
            </Typography>
            <Typography variant="body2">
              {formatDate(proposal.availability.earliestDate)} →
              <Box component="span" sx={{ fontWeight: 600, mx: 1 }}>
                {formatDate(proposal.deadline)}
              </Box>
              → {formatDate(proposal.availability.latestDate)}
            </Typography>
            {proposal.expiresAt && (
              <Typography variant="body2" color="error" sx={{ mt: 1 }}>
                Expires: {new Date(proposal.expiresAt).toLocaleString()}
              </Typography>
            )}
          </Box>

          <Divider />

          {/* Price breakdown */}
          <Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Price Breakdown
            </Typography>
            <Stack spacing={1}>
              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <Typography variant="body2">Options:</Typography>
                <Typography variant="body2">
                  {formatCurrency(proposal.priceBreakdown.optionsTotal)}
                </Typography>
              </Box>
              {proposal.priceBreakdown.rush > 0 && (
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography variant="body2" color="warning.main">
                    Rush Fee:
                  </Typography>
                  <Typography variant="body2" color="warning.main">
                    {formatCurrency(proposal.priceBreakdown.rush)}
                  </Typography>
                </Box>
              )}
              {proposal.priceBreakdown.discount > 0 && (
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography variant="body2" color="success.main">
                    Discount:
                  </Typography>
                  <Typography variant="body2" color="success.main">
                    -{formatCurrency(proposal.priceBreakdown.discount)}
                  </Typography>
                </Box>
              )}
              {proposal.priceBreakdown.surcharge > 0 && (
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography variant="body2" color="error.main">
                    Surcharge:
                  </Typography>
                  <Typography variant="body2" color="error.main">
                    +{formatCurrency(proposal.priceBreakdown.surcharge)}
                  </Typography>
                </Box>
              )}
              <Divider />
              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <Typography variant="subtitle1" fontWeight="bold">
                  Total:
                </Typography>
                <Typography variant="subtitle1" fontWeight="bold">
                  {formatCurrency(proposal.priceBreakdown.finalTotal)}
                </Typography>
              </Box>
            </Stack>
          </Box>

          {/* Actions */}
          <Box sx={{ display: "flex", gap: 1, mt: 2 }}>
            {onEdit && (
              <Button
                variant="outlined"
                color="primary"
                onClick={() => onEdit(proposal.id)}
                fullWidth
              >
                Edit
              </Button>
            )}
            {onRespond && (
              <Button
                variant="contained"
                color="primary"
                onClick={() => onRespond(proposal.id)}
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

// src/components/dashboard/proposals/form/PriceBreakdownSection.tsx

/**
 * PriceBreakdownSection
 * ---------------------
 * Displays a real‑time summary of price components:
 *   base, optionGroups, addons, rush, discount, surcharge, total
 * Use useFormContext(watch) to read calculated fields.
 * No input elements.
 */
import React, { useMemo } from "react";
import { useFormContext } from "react-hook-form";
import { Box, Typography, Paper, Divider } from "@mui/material";
import { ProposalFormValues } from "@/types/proposal";

export default function PriceBreakdownSection() {
  const { watch } = useFormContext<ProposalFormValues>();
  const listing = JSON.parse(sessionStorage.getItem("currentListing") || "{}");
  const watched = watch();

  const priceBreakdown = useMemo(() => {
    let base = listing.basePrice || 0;
    let optionGroups = 0;
    let addons = 0;
    let rush = 0;
    let discount = 0;
    let surcharge = 0;

    // Calculate option groups total
    if (watched.generalOptions?.optionGroups) {
      Object.values(watched.generalOptions.optionGroups).forEach(
        (option: any) => {
          if (option?.price) optionGroups += option.price;
        }
      );
    }

    // Calculate addons total
    if (watched.generalOptions?.addons) {
      Object.values(watched.generalOptions.addons).forEach(
        (addonPrice: any) => {
          if (typeof addonPrice === "number") addons += addonPrice;
        }
      );
    }

    // Calculate subject options
    if (watched.subjectOptions) {
      Object.values(watched.subjectOptions).forEach((subject: any) => {
        subject?.instances?.forEach((instance: any) => {
          // Instance option groups
          if (instance?.optionGroups) {
            Object.values(instance.optionGroups).forEach((option: any) => {
              if (option?.price) optionGroups += option.price;
            });
          }
          // Instance addons
          if (instance?.addons) {
            Object.values(instance.addons).forEach((addonPrice: any) => {
              if (typeof addonPrice === "number") addons += addonPrice;
            });
          }
        });
      });
    }

    // Calculate rush fee if applicable
    if (watched.deadline && listing.deadline?.mode === "withRush") {
      const deadlineDate = new Date(watched.deadline);
      const minDate = new Date();
      minDate.setDate(minDate.getDate() + listing.deadline.min);

      if (deadlineDate < minDate) {
        const rushDays = Math.ceil(
          (minDate.getTime() - deadlineDate.getTime()) / (24 * 60 * 60 * 1000)
        );
        const rushFee = listing.deadline.rushFee;

        if (rushFee) {
          rush =
            rushFee.kind === "flat"
              ? rushFee.amount
              : rushFee.amount * rushDays;
        }
      }
    }

    const total = base + optionGroups + addons + rush - discount + surcharge;

    return {
      base,
      optionGroups,
      addons,
      rush,
      discount,
      surcharge,
      total,
    };
  }, [watched, listing]);

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        Price Breakdown
      </Typography>
      <Divider sx={{ mb: 2 }} />

      <Box sx={{ mb: 2 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
          <Typography>Base Price:</Typography>
          <Typography fontWeight="medium">
            {listing.currency} {priceBreakdown.base.toLocaleString()}
          </Typography>
        </Box>

        {priceBreakdown.optionGroups > 0 && (
          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
            <Typography>Selected Options:</Typography>
            <Typography fontWeight="medium">
              {listing.currency} {priceBreakdown.optionGroups.toLocaleString()}
            </Typography>
          </Box>
        )}

        {priceBreakdown.addons > 0 && (
          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
            <Typography>Additional Services:</Typography>
            <Typography fontWeight="medium">
              {listing.currency} {priceBreakdown.addons.toLocaleString()}
            </Typography>
          </Box>
        )}

        {priceBreakdown.rush > 0 && (
          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
            <Typography color="warning.main">Rush Fee:</Typography>
            <Typography color="warning.main" fontWeight="medium">
              {listing.currency} {priceBreakdown.rush.toLocaleString()}
            </Typography>
          </Box>
        )}

        {priceBreakdown.discount > 0 && (
          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
            <Typography color="success.main">Discount:</Typography>
            <Typography color="success.main" fontWeight="medium">
              -{listing.currency} {priceBreakdown.discount.toLocaleString()}
            </Typography>
          </Box>
        )}

        {priceBreakdown.surcharge > 0 && (
          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
            <Typography color="warning.main">Surcharge:</Typography>
            <Typography color="warning.main" fontWeight="medium">
              {listing.currency} {priceBreakdown.surcharge.toLocaleString()}
            </Typography>
          </Box>
        )}
      </Box>

      <Divider sx={{ mb: 2 }} />

      <Box sx={{ display: "flex", justifyContent: "space-between" }}>
        <Typography variant="h6">Total:</Typography>
        <Typography variant="h6" color="primary" fontWeight="bold">
          {listing.currency} {priceBreakdown.total.toLocaleString()}
        </Typography>
      </Box>
    </Paper>
  );
}

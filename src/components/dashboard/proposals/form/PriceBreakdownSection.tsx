// src/components/dashboard/proposals/form/PriceBreakdownSection.tsx

/**
 * PriceBreakdownSection
 * ---------------------
 * Displays a real‑time summary of price components:
 *   base, optionGroups, addons, rush, discount, surcharge, total
 * Use useFormContext(watch) to read calculated fields.
 * No input elements.
 *
 * Fixed to handle multi-subject discounts that apply correctly to additional subjects.
 */
import React, { useMemo } from "react";
import { useFormContext } from "react-hook-form";
import {
  Box,
  Typography,
  Paper,
  Divider,
  Card,
  CardContent,
  Tooltip,
  alpha,
  Fade,
  Chip,
} from "@mui/material";
import {
  Info as InfoIcon,
  PriceCheck as PriceCheckIcon,
  Discount as DiscountIcon,
  Bolt as BoltIcon,
  ErrorOutline as ErrorOutlineIcon,
} from "@mui/icons-material";
import { ProposalFormValues } from "@/types/proposal";
import { ICommissionListing } from "@/lib/db/models/commissionListing.model";

interface PriceBreakdownSectionProps {
  listing: ICommissionListing;
}

interface DiscountDetail {
  subjectTitle: string;
  discountPercentage: number;
  originalAmount: number;
  discountAmount: number;
  count: number;
}

export default function PriceBreakdownSection({
  listing,
}: PriceBreakdownSectionProps) {
  const { watch } = useFormContext<ProposalFormValues>();
  const watched = watch();

  const priceBreakdown = useMemo(() => {
    let base = listing.basePrice || 0;
    let optionGroups = 0;
    let addons = 0;
    let rush = 0;
    let discount = 0;
    let surcharge = 0;

    // Initialize arrays to track what contributes to each category
    const optionGroupDetails: { name: string; price: number }[] = [];
    const addonDetails: { name: string; price: number }[] = [];
    const discountDetails: DiscountDetail[] = [];
    let rushDetails = { days: 0, fee: 0 };

    // Calculate general option groups total
    if (watched.generalOptions?.optionGroups) {
      Object.entries(watched.generalOptions.optionGroups).forEach(
        ([groupId, option]) => {
          if (option?.price) {
            optionGroups += option.price;
            optionGroupDetails.push({
              name: `${option.selectedLabel}`,
              price: option.price,
            });
          }
        }
      );
    }

    // Calculate general addons total
    if (watched.generalOptions?.addons) {
      Object.entries(watched.generalOptions.addons).forEach(
        ([addonId, addonPrice]) => {
          if (typeof addonPrice === "number" && addonPrice > 0) {
            addons += addonPrice;

            // Find addon label from listing
            const addonLabel =
              listing.generalOptions?.addons?.find(
                (a) => a.id.toString() === addonId
              )?.label || `Addon ${addonId}`;

            addonDetails.push({
              name: addonLabel,
              price: addonPrice,
            });
          }
        }
      );
    }

    // Calculate subject options
    if (watched.subjectOptions) {
      Object.entries(watched.subjectOptions).forEach(([subjectId, subject]) => {
        // Find subject title from listing
        const subjectTitle =
          listing.subjectOptions?.find((s) => s.id.toString() === subjectId)
            ?.title || `Subject ${subjectId}`;

        const subjectInstances = subject?.instances || [];
        const subjectDiscount =
          listing.subjectOptions?.find((s) => s.id.toString() === subjectId)
            ?.discount || 0;

        // Calculate instance prices for all instances
        subjectInstances.forEach((instance, index) => {
          let instanceTotal = 0;
          const isDiscountApplicable = index > 0;

          // Instance option groups
          if (instance?.optionGroups) {
            Object.entries(instance.optionGroups).forEach(
              ([groupId, option]) => {
                if (option?.price) {
                  let price = option.price;

                  // Apply discount if this is not the first instance
                  if (isDiscountApplicable && subjectDiscount > 0) {
                    const discountedPrice = price;
                    const originalPrice =
                      discountedPrice / (1 - subjectDiscount / 100);
                    const appliedDiscount = originalPrice - discountedPrice;
                    discount += appliedDiscount;
                  }

                  optionGroups += price;

                  // Find option group label from listing
                  const optionGroupTitle =
                    listing.subjectOptions
                      ?.find((s) => s.id.toString() === subjectId)
                      ?.optionGroups?.find((g) => g.id.toString() === groupId)
                      ?.title || `Option ${groupId}`;

                  // For display purposes, show if discount applied or not
                  optionGroupDetails.push({
                    name: `${subjectTitle} #${
                      index + 1
                    } - ${optionGroupTitle}: ${option.selectedLabel}${
                      isDiscountApplicable && subjectDiscount > 0
                        ? " (discounted)"
                        : ""
                    }`,
                    price: price,
                  });

                  instanceTotal += price;
                }
              }
            );
          }

          // Instance addons
          if (instance?.addons) {
            Object.entries(instance.addons).forEach(([addonId, addonPrice]) => {
              if (typeof addonPrice === "number" && addonPrice > 0) {
                let price = addonPrice;

                // Apply discount if this is not the first instance
                if (isDiscountApplicable && subjectDiscount > 0) {
                  const discountedPrice = price;
                  const originalPrice =
                    discountedPrice / (1 - subjectDiscount / 100);
                  const appliedDiscount = originalPrice - discountedPrice;
                  discount += appliedDiscount;
                }

                addons += price;

                // Find addon label from listing
                const addonLabel =
                  listing.subjectOptions
                    ?.find((s) => s.id.toString() === subjectId)
                    ?.addons?.find((a) => a.id.toString() === addonId)?.label ||
                  `Addon ${addonId}`;

                addonDetails.push({
                  name: `${subjectTitle} #${index + 1} - ${addonLabel}${
                    isDiscountApplicable && subjectDiscount > 0
                      ? " (discounted)"
                      : ""
                  }`,
                  price: price,
                });

                instanceTotal += price;
              }
            });
          }
        });

        // Add discount details for display
        if (subjectInstances.length > 1 && subjectDiscount > 0) {
          // Store discount details for display
          discountDetails.push({
            subjectTitle,
            discountPercentage: subjectDiscount,
            originalAmount: 0, // We calculate this separately when applying discount
            discountAmount: 0, // We calculate this separately when applying discount
            count: subjectInstances.length - 1, // Count of discounted instances
          });
        }
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

          rushDetails = { days: rushDays, fee: rush };
        }
      }
    }

    const total = base + optionGroups + addons + rush + surcharge;

    return {
      base,
      optionGroups,
      optionGroupDetails,
      addons,
      addonDetails,
      rush,
      rushDetails,
      discount,
      discountDetails,
      surcharge,
      total,
    };
  }, [watched, listing]);

  // Format currency
  const formatCurrency = (amount: number) => {
    return `${listing.currency} ${amount.toLocaleString()}`;
  };

  // Check if price breakdown has details
  const hasDetails =
    priceBreakdown.optionGroupDetails.length > 0 ||
    priceBreakdown.addonDetails.length > 0 ||
    priceBreakdown.rush > 0 ||
    priceBreakdown.discount > 0 ||
    priceBreakdown.surcharge > 0;

  return (
    <Paper
      sx={{
        p: 3,
        mb: 3,
        borderRadius: 2,
        position: "sticky",
        top: 24,
        borderLeft: "4px solid",
        borderLeftColor: "primary.main",
        boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          mb: 2,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <PriceCheckIcon color="primary" sx={{ mr: 1 }} />
          <Typography variant="h6" fontWeight="medium" color="primary.main">
            Price Breakdown
          </Typography>
        </Box>
        <Chip
          label={formatCurrency(priceBreakdown.total)}
          color="primary"
          sx={{
            fontWeight: "bold",
            fontSize: "1rem",
            height: 32,
          }}
        />
      </Box>
      <Divider sx={{ mb: 2 }} />

      <Card
        variant="outlined"
        sx={{
          mb: 2,
          borderRadius: 2,
          transition: "all 0.2s",
        }}
      >
        <CardContent sx={{ py: 2 }}>
          {/* Base Price */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              mb: 1.5,
              alignItems: "center",
            }}
          >
            <Typography variant="body1">Base Price</Typography>
            <Typography variant="body1" fontWeight="medium">
              {formatCurrency(priceBreakdown.base)}
            </Typography>
          </Box>

          {/* Option Groups */}
          {priceBreakdown.optionGroups > 0 && (
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                mb: 1.5,
                alignItems: "center",
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <Typography variant="body1">Selected Options</Typography>
                <Tooltip
                  title={
                    <Box>
                      {priceBreakdown.optionGroupDetails.map((detail, i) => (
                        <Box key={i} sx={{ mb: 0.5 }}>
                          <Typography variant="body2">
                            {detail.name}: {formatCurrency(detail.price)}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  }
                  arrow
                >
                  <InfoIcon
                    fontSize="small"
                    sx={{ ml: 1, color: "text.secondary", cursor: "pointer" }}
                  />
                </Tooltip>
              </Box>
              <Typography variant="body1" fontWeight="medium">
                {formatCurrency(priceBreakdown.optionGroups)}
              </Typography>
            </Box>
          )}

          {/* Addons */}
          {priceBreakdown.addons > 0 && (
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                mb: 1.5,
                alignItems: "center",
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <Typography variant="body1">Additional Services</Typography>
                <Tooltip
                  title={
                    <Box>
                      {priceBreakdown.addonDetails.map((detail, i) => (
                        <Box key={i} sx={{ mb: 0.5 }}>
                          <Typography variant="body2">
                            {detail.name}: {formatCurrency(detail.price)}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  }
                  arrow
                >
                  <InfoIcon
                    fontSize="small"
                    sx={{ ml: 1, color: "text.secondary", cursor: "pointer" }}
                  />
                </Tooltip>
              </Box>
              <Typography variant="body1" fontWeight="medium">
                {formatCurrency(priceBreakdown.addons)}
              </Typography>
            </Box>
          )}

          {/* Rush Fee */}
          {priceBreakdown.rush > 0 && (
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                mb: 1.5,
                alignItems: "center",
                p: 1,
                bgcolor: alpha("#ff9800", 0.08),
                borderRadius: 1,
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <BoltIcon color="warning" fontSize="small" sx={{ mr: 1 }} />
                <Typography color="warning.main">Rush Fee</Typography>
                <Tooltip
                  title={
                    <Box>
                      <Typography variant="body2">
                        {priceBreakdown.rushDetails.days} day(s) rush
                      </Typography>
                    </Box>
                  }
                  arrow
                >
                  <InfoIcon
                    fontSize="small"
                    sx={{ ml: 1, color: "warning.main", cursor: "pointer" }}
                  />
                </Tooltip>
              </Box>
              <Typography color="warning.main" fontWeight="medium">
                {formatCurrency(priceBreakdown.rush)}
              </Typography>
            </Box>
          )}

          {/* Discount */}
          {priceBreakdown.discount > 0 && (
            <Fade in={priceBreakdown.discount > 0}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  mb: 1.5,
                  alignItems: "center",
                  p: 1,
                  bgcolor: alpha("#4caf50", 0.08),
                  borderRadius: 1,
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  <DiscountIcon
                    color="success"
                    fontSize="small"
                    sx={{ mr: 1 }}
                  />
                  <Typography color="success.main">Saved</Typography>
                  <Tooltip
                    title={
                      <Box>
                        {priceBreakdown.discountDetails.map((detail, i) => (
                          <Box key={i} sx={{ mb: 0.5 }}>
                            <Typography variant="body2">
                              {detail.subjectTitle}: {detail.discountPercentage}
                              % off for {detail.count} additional item(s)
                            </Typography>
                          </Box>
                        ))}
                        <Typography
                          variant="body2"
                          sx={{ mt: 1, fontStyle: "italic" }}
                        >
                          Discount applies to all items after the first one
                        </Typography>
                      </Box>
                    }
                    arrow
                  >
                    <InfoIcon
                      fontSize="small"
                      sx={{ ml: 1, color: "success.main", cursor: "pointer" }}
                    />
                  </Tooltip>
                </Box>
                <Typography color="success.main" fontWeight="medium">
                  {formatCurrency(priceBreakdown.discount)}
                </Typography>
              </Box>
            </Fade>
          )}

          {/* Surcharge */}
          {priceBreakdown.surcharge > 0 && (
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                mb: 1.5,
                alignItems: "center",
                p: 1,
                bgcolor: alpha("#f44336", 0.08),
                borderRadius: 1,
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <ErrorOutlineIcon
                  color="error"
                  fontSize="small"
                  sx={{ mr: 1 }}
                />
                <Typography color="error.main">Surcharge</Typography>
              </Box>
              <Typography color="error.main" fontWeight="medium">
                {formatCurrency(priceBreakdown.surcharge)}
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Total */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          p: 2,
          bgcolor: alpha("#000", 0.03),
          borderRadius: 2,
        }}
      >
        <Typography variant="h6">Total Price</Typography>
        <Typography variant="h6" color="primary.main" fontWeight="bold">
          {formatCurrency(priceBreakdown.total)}
        </Typography>
      </Box>

      {/* Payment Policy */}
      <Box
        sx={{
          mt: 2,
          p: 2,
          bgcolor: "background.default",
          borderRadius: 1,
          border: "1px solid",
          borderColor: "divider",
        }}
      >
        <Typography variant="caption" color="text.secondary">
          {listing.flow === "standard"
            ? "Full payment is due upon approval of this proposal."
            : "Payment will be processed according to the milestone schedule."}
        </Typography>
        {listing.cancelationFee && (
          <Typography
            variant="caption"
            color="text.secondary"
            display="block"
            sx={{ mt: 0.5 }}
          >
            Cancellation fee:{" "}
            {listing.cancelationFee.kind === "flat"
              ? `${formatCurrency(listing.cancelationFee.amount)}`
              : `${listing.cancelationFee.amount}% of total`}
          </Typography>
        )}
      </Box>
    </Paper>
  );
}

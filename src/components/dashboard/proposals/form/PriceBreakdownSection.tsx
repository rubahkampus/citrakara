// src/components/dashboard/proposals/form/PriceBreakdownSection.tsx
import React, { useMemo } from "react";
import { useFormContext } from "react-hook-form";
import {
  Box,
  Typography,
  Divider,
  Card,
  Tooltip,
  alpha,
  Chip,
  Grid,
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

// Constants - Indonesian text translations
const TEXT = {
  PRICE_BREAKDOWN: "Rincian Harga",
  BASE_PRICE: "Harga Dasar",
  SELECTED_OPTIONS: "Opsi Terpilih",
  ADDITIONAL_SERVICES: "Layanan Tambahan",
  RUSH_FEE: "Biaya Kilat",
  MULTI_ITEM_DISCOUNT: "Diskon Multi-Item",
  SURCHARGE: "Biaya Tambahan",
  TOTAL_PRICE: "Total Harga",
  DAYS_RUSH_FEE: "hari biaya kilat",
  FLAT_FEE: "Biaya tetap",
  PER_DAY: "per hari",
  OFF_FOR: "diskon untuk",
  ADDITIONAL_ITEMS: "item tambahan",
  DISCOUNT_NOTE: "Diskon berlaku untuk semua item setelah item pertama",
  FULL_PAYMENT_DUE: "Pembayaran penuh saat proposal disetujui.",
  MILESTONE_PAYMENT: "Pembayaran akan diproses sesuai jadwal milestone.",
  CANCELLATION_FEE: "Biaya pembatalan:",
  OF_TOTAL: "dari total",
};

// Types
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

// Component
export default function PriceBreakdownSection({
  listing,
}: PriceBreakdownSectionProps) {
  const { watch } = useFormContext<ProposalFormValues>();
  const watched = watch();

  // Format currency helper
  const formatCurrency = (amount: number) => {
    return `${listing.currency} ${amount.toLocaleString()}`;
  };

  // Price calculation
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
      const earliestDate = new Date(); // This should be the estimated earliest date from API
      // Adjust with listing.deadline.min days
      earliestDate.setDate(earliestDate.getDate() + listing.deadline.min);

      if (deadlineDate < earliestDate) {
        // Calculate rush days - days between chosen deadline and earliest date
        const timeDiff = Math.abs(
          earliestDate.getTime() - deadlineDate.getTime()
        );
        const rushDays = Math.ceil(timeDiff / (24 * 60 * 60 * 1000));

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

  // UI Rendering Components
  const renderPriceItem = (
    label: string,
    amount: number,
    tooltip?: React.ReactNode
  ) => (
    <Box
      sx={{
        display: "flex",
        justifyContent: "space-between",
        mb: 1.5,
        alignItems: "center",
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center" }}>
        <Typography variant="body1">{label}</Typography>
        {tooltip && (
          <Tooltip title={tooltip} arrow>
            <InfoIcon
              fontSize="small"
              sx={{ ml: 1, color: "text.secondary", cursor: "pointer" }}
            />
          </Tooltip>
        )}
      </Box>
      <Typography variant="body1" fontWeight="medium">
        {formatCurrency(amount)}
      </Typography>
    </Box>
  );

  type PaletteColor = "primary" | "secondary" | "error" | "warning" | "info" | "success";

  const renderHighlightedItem = (
    label: string,
    amount: number,
    color: PaletteColor,
    icon: React.ReactNode,
    tooltip?: React.ReactNode,
    isNegative: boolean = false
  ) => (
    <Box
      sx={{
        display: "flex",
        justifyContent: "space-between",
        mb: 1.5,
        alignItems: "center",
        p: 1,
        bgcolor: (theme) => alpha(theme.palette[color].main, 0.08),
        borderRadius: 1,
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center" }}>
        {icon}
        <Typography color={`${color}.main`}>{label}</Typography>
        {tooltip && (
          <Tooltip title={tooltip} arrow>
            <InfoIcon
              fontSize="small"
              sx={{ ml: 1, color: `${color}.main`, cursor: "pointer" }}
            />
          </Tooltip>
        )}
      </Box>
      <Typography color={`${color}.main`} fontWeight="medium">
        {isNegative ? "-" : ""}
        {formatCurrency(amount)}
      </Typography>
    </Box>
  );

  return (
    <Card
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
      {/* Header */}
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
            {TEXT.PRICE_BREAKDOWN}
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

      {/* Price Details */}
      <Grid container spacing={2}>
        {/* Left Column */}
        <Grid item xs={12} md={6}>
          {/* Base Price */}
          {renderPriceItem(TEXT.BASE_PRICE, priceBreakdown.base)}

          {/* Option Groups */}
          {priceBreakdown.optionGroups > 0 &&
            renderPriceItem(
              TEXT.SELECTED_OPTIONS,
              priceBreakdown.optionGroups,
              <Box>
                {priceBreakdown.optionGroupDetails.map((detail, i) => (
                  <Box key={i} sx={{ mb: 0.5 }}>
                    <Typography variant="body2">
                      {detail.name}: {formatCurrency(detail.price)}
                    </Typography>
                  </Box>
                ))}
              </Box>
            )}

          {/* Addons */}
          {priceBreakdown.addons > 0 &&
            renderPriceItem(
              TEXT.ADDITIONAL_SERVICES,
              priceBreakdown.addons,
              <Box>
                {priceBreakdown.addonDetails.map((detail, i) => (
                  <Box key={i} sx={{ mb: 0.5 }}>
                    <Typography variant="body2">
                      {detail.name}: {formatCurrency(detail.price)}
                    </Typography>
                  </Box>
                ))}
              </Box>
            )}
        </Grid>

        {/* Right Column */}
        <Grid item xs={12} md={6}>
          {/* Rush Fee */}
          {priceBreakdown.rush > 0 &&
            renderHighlightedItem(
              TEXT.RUSH_FEE,
              priceBreakdown.rush,
              "warning",
              <BoltIcon color="warning" fontSize="small" sx={{ mr: 1 }} />,
              <Box>
                <Typography variant="body2">
                  {priceBreakdown.rushDetails.days} {TEXT.DAYS_RUSH_FEE}
                </Typography>
                <Typography variant="body2">
                  {listing.deadline.rushFee?.kind === "flat"
                    ? TEXT.FLAT_FEE
                    : `${formatCurrency(
                        listing.deadline.rushFee?.amount || 0
                      )} ${TEXT.PER_DAY}`}
                </Typography>
              </Box>
            )}

          {/* Discount */}
          {priceBreakdown.discount > 0 &&
            renderHighlightedItem(
              TEXT.MULTI_ITEM_DISCOUNT,
              priceBreakdown.discount,
              "success",
              <DiscountIcon color="success" fontSize="small" sx={{ mr: 1 }} />,
              <Box>
                {priceBreakdown.discountDetails.map((detail, i) => (
                  <Box key={i} sx={{ mb: 0.5 }}>
                    <Typography variant="body2">
                      {detail.subjectTitle}: {detail.discountPercentage}%{" "}
                      {TEXT.OFF_FOR} {detail.count} {TEXT.ADDITIONAL_ITEMS}
                    </Typography>
                  </Box>
                ))}
                <Typography variant="body2" sx={{ mt: 1, fontStyle: "italic" }}>
                  {TEXT.DISCOUNT_NOTE}
                </Typography>
              </Box>,
              true
            )}

          {/* Surcharge */}
          {priceBreakdown.surcharge > 0 &&
            renderHighlightedItem(
              TEXT.SURCHARGE,
              priceBreakdown.surcharge,
              "error",
              <ErrorOutlineIcon color="error" fontSize="small" sx={{ mr: 1 }} />
            )}
        </Grid>
      </Grid>

      {/* Total */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          p: 2,
          mt: 2,
          bgcolor: alpha("#000", 0.03),
          borderRadius: 2,
        }}
      >
        <Typography variant="h6">{TEXT.TOTAL_PRICE}</Typography>
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
            ? TEXT.FULL_PAYMENT_DUE
            : TEXT.MILESTONE_PAYMENT}
        </Typography>
        {listing.cancelationFee && (
          <Typography
            variant="caption"
            color="text.secondary"
            display="block"
            sx={{ mt: 0.5 }}
          >
            {TEXT.CANCELLATION_FEE}{" "}
            {listing.cancelationFee.kind === "flat"
              ? `${formatCurrency(listing.cancelationFee.amount)}`
              : `${listing.cancelationFee.amount}% ${TEXT.OF_TOTAL}`}
          </Typography>
        )}
      </Box>
    </Card>
  );
}

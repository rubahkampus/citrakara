// src/components/dashboard/proposals/form/DeadlineSection.tsx

/**
 * DeadlineSection
 * ---------------
 * Renders the deadline picker according to the listing's deadline configuration.
 * Now fetches dynamic date estimates from the API to account for artist's current workload.
 *
 * Props:
 *   - listingDeadline: {
 *       mode: "standard" | "withDeadline" | "withRush",
 *       min: number,    // days after now (baseline)
 *       max: number,    // days after now (baseline)
 *       rushFee?: { kind: "flat" | "perDay"; amount: number }
 *     }
 *
 * Behavior:
 *   - Fetches dynamic date estimates from /api/proposal/estimate/[listingId]
 *   - mode === "standard": no input; display info text with dynamic dates
 *   - mode === "withDeadline": enforce dynamicEarliest ≤ deadline (no rush fee); can be after dynamicLatest
 *   - mode === "withRush": same as withDeadline for deadline > dynamicEarliest (no rush fee); ; if < dynamicEarliest, rush fees apply
 */
import React, { useEffect, useState } from "react";
import { Controller, useFormContext } from "react-hook-form";
import {
  TextField,
  Typography,
  Box,
  Paper,
  CircularProgress,
} from "@mui/material";
import { ProposalFormValues } from "@/types/proposal";
import { axiosClient } from "@/lib/utils/axiosClient";
import { ICommissionListing } from "@/lib/db/models/commissionListing.model";

interface DeadlineSectionProps {
  listing: ICommissionListing;
}

interface DateEstimate {
  earliestDate: string;
  latestDate: string;
}

export default function DeadlineSection({
  listing
}: DeadlineSectionProps) {
  const { control, setValue } = useFormContext<ProposalFormValues>();
  const [loading, setLoading] = useState(true);
  const [dateEstimate, setDateEstimate] = useState<DateEstimate | null>(null);
  const [error, setError] = useState<string | null>(null);

  const listingDeadline = listing.deadline
  
  // Fetch dynamic date estimates when component mounts
  useEffect(() => {
    const fetchDateEstimates = async () => {
      try {
        setLoading(true);
        const response = await axiosClient.get(
          `/api/proposal/estimate/${listing._id}`
        );
        setDateEstimate({
          earliestDate: new Date(response.data.earliestDate).toISOString(),
          latestDate: new Date(response.data.latestDate).toISOString(),
        });

        // For standard mode, auto-set the deadline to latestDate
        if (listingDeadline.mode === "standard") {
          setValue(
            "deadline",
            new Date(response.data.latestDate).toISOString().slice(0, 10)
          );
        }

        setError(null);
      } catch (err: any) {
        console.error("Error fetching date estimates:", err);
        setError(err.response?.data?.error || "Failed to fetch date estimates");

        // Fallback to calculate dates locally (not ideal, but prevents UI from breaking)
        const now = new Date();
        const minDate = new Date(
          now.getTime() + listingDeadline.min * 24 * 60 * 60 * 1000
        );
        const maxDate = new Date(
          now.getTime() + listingDeadline.max * 24 * 60 * 60 * 1000
        );

        setDateEstimate({
          earliestDate: minDate.toISOString(),
          latestDate: maxDate.toISOString(),
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDateEstimates();
  }, [
    listing._id,
    listingDeadline.min,
    listingDeadline.max,
    listingDeadline.mode,
    setValue,
  ]);

  if (loading) {
    return (
      <Paper sx={{ p: 3, mb: 3, display: "flex", justifyContent: "center" }}>
        <CircularProgress size={24} sx={{ mr: 2 }} />
        <Typography>Calculating available dates...</Typography>
      </Paper>
    );
  }

  if (error || !dateEstimate) {
    return (
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" color="error" gutterBottom>
          Error loading date estimates
        </Typography>
        <Typography color="text.secondary">
          {error || "Please try again later."}
        </Typography>
      </Paper>
    );
  }

  // Format dates for display and validation
  const earliestDate = new Date(dateEstimate.earliestDate);
  const latestDate = new Date(dateEstimate.latestDate);
  const earliestStr = earliestDate.toISOString().slice(0, 10);
  const latestStr = latestDate.toISOString().slice(0, 10);

  // Format dates for display in human-readable format
  const formatReadableDate = (date: Date) => {
    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  switch (listingDeadline.mode) {
    case "standard":
      return (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Deadline
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 1 }}>
            Based on the artist's current workload, your deadline will be
            automatically set to:
          </Typography>
          <Typography variant="body1" fontWeight="bold" sx={{ mb: 3 }}>
            {formatReadableDate(latestDate)}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            The earliest this commission could be started is{" "}
            {formatReadableDate(earliestDate)}.
          </Typography>
          {/* Hidden field to store the deadline value */}
          <Controller
            name="deadline"
            control={control}
            render={({ field }) => <input type="hidden" {...field} />}
          />
        </Paper>
      );

    case "withDeadline":
      return (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Deadline
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 2 }}>
            Based on the artist's current workload, choose a deadline between:
            <br />
            {formatReadableDate(earliestDate)} and{" "}
            {formatReadableDate(latestDate)}
          </Typography>
          <Controller
            name="deadline"
            control={control}
            rules={{
              required: "Deadline is required",
              validate: (val: string) => {
                if (!val) return "Deadline is required";
                const d = new Date(val);
                if (d < earliestDate)
                  return `Date cannot be before ${earliestStr}`;
                if (d > latestDate) return `Date cannot be after ${latestStr}`;
                return true;
              },
            }}
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                label="Desired Deadline"
                type="date"
                fullWidth
                InputLabelProps={{ shrink: true }}
                inputProps={{ min: earliestStr, max: latestStr }}
                error={!!fieldState.error}
                helperText={fieldState.error?.message}
                sx={{ mb: 3 }}
              />
            )}
          />
        </Paper>
      );

    case "withRush":
      return (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Deadline
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 2 }}>
            Standard delivery between {formatReadableDate(earliestDate)} and{" "}
            {formatReadableDate(latestDate)}.
            <br />
            You may request an earlier deadline with rush fees.
          </Typography>
          <Controller
            name="deadline"
            control={control}
            rules={{
              required: "Deadline is required",
              validate: (val: string) => {
                if (!val) return "Deadline is required";
                const d = new Date(val);
                if (d > latestDate) return `Date cannot be after ${latestStr}`;
                return true;
              },
            }}
            render={({ field, fieldState }) => {
              const isRush =
                field.value && new Date(field.value) < earliestDate;

              return (
                <Box>
                  <TextField
                    {...field}
                    label="Desired Deadline (rush optional)"
                    type="date"
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                    inputProps={{ max: latestStr }}
                    error={!!fieldState.error}
                    helperText={
                      fieldState.error?.message ||
                      `Must be on or before ${latestStr}. If before ${earliestStr}, rush fee applies.`
                    }
                    sx={{ mb: 2 }}
                  />
                  {isRush && listingDeadline.rushFee && (
                    <Typography color="warning.main" sx={{ mb: 2 }}>
                      Rush fee will apply: {listing.currency}{" "}
                      {listingDeadline.rushFee.kind === "flat"
                        ? listingDeadline.rushFee.amount.toLocaleString()
                        : `${listingDeadline.rushFee.amount.toLocaleString()} per day before ${formatReadableDate(
                            earliestDate
                          )}`}
                    </Typography>
                  )}
                </Box>
              );
            }}
          />
        </Paper>
      );

    default:
      return null;
  }
}

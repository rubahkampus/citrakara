// src/components/dashboard/proposals/form/DeadlineSection.tsx

/**
 * DeadlineSection
 * ---------------
 * Renders the deadline picker according to the listing's deadline configuration.
 *
 * Props:
 *   - listingDeadline: {
 *       mode: "standard" | "withDeadline" | "withRush",
 *       min: number,    // days after now
 *       max: number,    // days after now
 *       rushFee?: { kind: "flat" | "perDay"; amount: number }
 *     }
 *
 * Behavior:
 *   - mode === "standard": no input; display info text
 *   - mode === "withDeadline": enforce min ≤ deadline ≤ max
 *   - mode === "withRush": enforce deadline ≤ max; if < min, UI note that rush fees apply
 */
import React from "react";
import { Controller, useFormContext } from "react-hook-form";
import { TextField, Typography, Box, Paper } from "@mui/material";
import { ProposalFormValues } from "@/types/proposal";

interface DeadlineSectionProps {
  listingDeadline: {
    mode: "standard" | "withDeadline" | "withRush";
    min: number;
    max: number;
    rushFee?: { kind: "flat" | "perDay"; amount: number };
  };
}

export default function DeadlineSection({
  listingDeadline,
}: DeadlineSectionProps) {
  const { control } = useFormContext<ProposalFormValues>();
  const listing = JSON.parse(sessionStorage.getItem("currentListing") || "{}");

  // 1. Compute now, dynamicMinDate, dynamicMaxDate
  const now = new Date();
  const minDate = new Date(
    now.getTime() + listingDeadline.min * 24 * 60 * 60 * 1000
  );
  const maxDate = new Date(
    now.getTime() + listingDeadline.max * 24 * 60 * 60 * 1000
  );
  const minStr = minDate.toISOString().slice(0, 10);
  const maxStr = maxDate.toISOString().slice(0, 10);

  switch (listingDeadline.mode) {
    case "standard":
      return (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Deadline
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 3 }}>
            Deadline will be automatically set between {listingDeadline.min} and{" "}
            {listingDeadline.max} days from today.
          </Typography>
        </Paper>
      );

    case "withDeadline":
      return (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Deadline
          </Typography>
          <Controller
            name="deadline"
            control={control}
            rules={{
              required: "Deadline is required",
              validate: (val: string) => {
                if (!val) return "Deadline is required";
                const d = new Date(val);
                if (d < minDate) return `Date cannot be before ${minStr}`;
                if (d > maxDate) return `Date cannot be after ${maxStr}`;
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
                inputProps={{ min: minStr, max: maxStr }}
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
          <Controller
            name="deadline"
            control={control}
            rules={{
              required: "Deadline is required",
              validate: (val: string) => {
                if (!val) return "Deadline is required";
                const d = new Date(val);
                if (d > maxDate) return `Date cannot be after ${maxStr}`;
                return true;
              },
            }}
            render={({ field, fieldState }) => {
              const isRush = field.value && new Date(field.value) < minDate;

              return (
                <Box>
                  <TextField
                    {...field}
                    label="Desired Deadline (rush optional)"
                    type="date"
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                    inputProps={{ max: maxStr }}
                    error={!!fieldState.error}
                    helperText={
                      fieldState.error?.message ||
                      `Must be on or before ${maxStr}. If before ${minStr}, rush fee applies.`
                    }
                    sx={{ mb: 2 }}
                  />
                  {isRush && listingDeadline.rushFee && (
                    <Typography color="warning.main" sx={{ mb: 2 }}>
                      Rush fee will apply: {listing.currency}{" "}
                      {listingDeadline.rushFee.kind === "flat"
                        ? listingDeadline.rushFee.amount.toLocaleString()
                        : `${listingDeadline.rushFee.amount.toLocaleString()} per day`}
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

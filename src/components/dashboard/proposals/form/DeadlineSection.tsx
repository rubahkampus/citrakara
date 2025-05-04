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
 *
 * Implementation steps:
 *   1. Compute `now`, `dynamicMinDate`, `dynamicMaxDate` (Date objects)
 *   2. Format to YYYY-MM-DD for `min` / `max` attrs
 *   3. Use RHF Controller to render a `<TextField type="date">`
 *   4. Add validation rules (required, range checks)
 */
import React from "react";
import { Controller, useFormContext } from "react-hook-form";
import { TextField, Typography } from "@mui/material";
import { ProposalFormValues } from "@/types/proposal";

interface DeadlineSectionProps {
  listingDeadline: {
    mode: "standard" | "withDeadline" | "withRush";
    min: number;
    max: number;
    rushFee?: { kind: "flat" | "perDay"; amount: number };
  };
}

export default function DeadlineSection({ listingDeadline }: DeadlineSectionProps) {
  const { control } = useFormContext<ProposalFormValues>();

  // 1. Compute now, dynamicMinDate, dynamicMaxDate
  const now = new Date();
  const minDate = new Date(now.getTime() + listingDeadline.min * 24 * 60 * 60 * 1000);
  const maxDate = new Date(now.getTime() + listingDeadline.max * 24 * 60 * 60 * 1000);
  const minStr = minDate.toISOString().slice(0, 10);
  const maxStr = maxDate.toISOString().slice(0, 10);

  switch (listingDeadline.mode) {
    case "standard":
      return (
        <Typography color="text.secondary" sx={{ mb: 3 }}>
          Deadline will be automatically set between {listingDeadline.min} and{" "}
          {listingDeadline.max} days from today.
        </Typography>
      );

    case "withDeadline":
      return (
        <Controller
          name="deadline"
          control={control}
          rules={{
            required: "Deadline is required",
            validate: (val: string) => {
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
      );

    case "withRush":
      return (
        <Controller
          name="deadline"
          control={control}
          rules={{
            required: "Deadline is required",
            validate: (val: string) => {
              const d = new Date(val);
              if (d > maxDate) return `Date cannot be after ${maxStr}`;
              return true;
            },
          }}
          render={({ field, fieldState }) => (
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
              sx={{ mb: 3 }}
            />
          )}
        />
      );

    default:
      return null;
  }
}

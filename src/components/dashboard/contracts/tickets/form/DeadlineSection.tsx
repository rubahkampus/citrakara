// src/components/dashboard/contracts/tickets/form/DeadlineSection.tsx

import React, { useMemo } from "react";
import { useFormContext, Controller } from "react-hook-form";
import {
  Box,
  Typography,
  Paper,
  Divider,
  FormControl,
  FormHelperText,
  Switch,
  FormControlLabel,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { IContract } from "@/lib/db/models/contract.model";
import { ChangeTicketFormValues } from "../ChangeTicketForm";
import { addDays, isBefore, isAfter, startOfDay } from "date-fns";

interface DeadlineSectionProps {
  contract: IContract;
  disabled: boolean;
}

export default function DeadlineSection({
  contract,
  disabled,
}: DeadlineSectionProps) {
  const {
    control,
    watch,
    setValue,
    formState: { errors },
  } = useFormContext<ChangeTicketFormValues>();

  const includeDeadline = watch("includeDeadline");

  // Calculate minimum allowed date (baseDate + 24h or tomorrow + 24h if baseDate has passed)
  const minDate = useMemo(() => {
    const baseDate = new Date(contract.proposalSnapshot.baseDate);
    const minAllowedDate = addDays(baseDate, 1); // baseDate + 24 hours
    const tomorrow = addDays(new Date(), 1); // tomorrow
    const tomorrowPlus24h = addDays(tomorrow, 1); // tomorrow + 24 hours

    // If baseDate + 24h has already passed, use tomorrow + 24h as minimum
    return isAfter(minAllowedDate, new Date())
      ? minAllowedDate
      : tomorrowPlus24h;
  }, [contract.proposalSnapshot.baseDate]);

  // Check if deadline changes are allowed
  if (
    !contract.proposalSnapshot.listingSnapshot?.changeable?.includes("deadline")
  ) {
    return null;
  }

  // Toggle inclusion of deadline change
  const handleIncludeDeadline = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue("includeDeadline", e.target.checked);

    // If toggled on and no deadline is set, set a default value (min date + 7 days)
    if (e.target.checked && !watch("deadlineAt")) {
      setValue("deadlineAt", addDays(minDate, 7));
    }
  };

  return (
    <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
        }}
      >
        <Typography variant="h6" color="primary" fontWeight="medium">
          Deadline
        </Typography>
        <FormControlLabel
          control={
            <Switch
              checked={includeDeadline}
              onChange={handleIncludeDeadline}
              disabled={disabled}
            />
          }
          label="Include changes"
          sx={{ mr: 0 }}
        />
      </Box>
      <Divider sx={{ mb: 3 }} />

      {includeDeadline ? (
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Select a new deadline date for the contract. The deadline must be at
            least 24 hours from now to give the artist time to respond.
          </Typography>

          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Controller
              name="deadlineAt"
              control={control}
              rules={{
                required: "Deadline is required",
                validate: (value) => {
                  if (!value) return "Deadline is required";
                  if (isBefore(value, minDate)) {
                    return `Deadline must be after ${minDate.toLocaleDateString()}`;
                  }
                  return true;
                },
              }}
              render={({ field, fieldState }) => (
                <FormControl fullWidth error={!!fieldState.error}>
                  <DatePicker
                    label="New Deadline"
                    value={field.value}
                    onChange={field.onChange}
                    disablePast
                    minDate={minDate}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        error: !!fieldState.error,
                        helperText: fieldState.error?.message,
                      },
                    }}
                    disabled={disabled}
                  />
                  {!fieldState.error && (
                    <FormHelperText>
                      Current deadline:{" "}
                      {new Date(contract.deadlineAt).toLocaleDateString()}
                    </FormHelperText>
                  )}
                </FormControl>
              )}
            />
          </LocalizationProvider>

          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Note: The artist may apply a rush fee if the new deadline falls
              outside their standard timeframe.
            </Typography>
          </Box>
        </Box>
      ) : (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ fontStyle: "italic", mt: 2 }}
        >
          Switch the toggle to include changes to the deadline.
        </Typography>
      )}
    </Paper>
  );
}

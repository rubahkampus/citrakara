// In the DeadlineSection component, replace the current implementation with this solution

import React, { useState, useEffect, useMemo } from "react";
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
  // Get form context
  const {
    control,
    setValue,
    formState: { errors },
  } = useFormContext<ChangeTicketFormValues>();

  // NEW APPROACH: Use local state to control the toggle directly
  const [localIncludeDeadline, setLocalIncludeDeadline] = useState(false);

  // Calculate minimum allowed date
  const minDate = useMemo(() => {
    const baseDate = new Date(contract.proposalSnapshot.baseDate);
    const minAllowedDate = addDays(baseDate, 1);
    const tomorrow = addDays(new Date(), 1);
    const tomorrowPlus24h = addDays(tomorrow, 1);

    return isAfter(minAllowedDate, new Date())
      ? minAllowedDate
      : tomorrowPlus24h;
  }, [contract.proposalSnapshot.baseDate]);

  // Initialize the deadline value once on component mount
  useEffect(() => {
    setValue("deadlineAt", new Date(contract.deadlineAt), {
      shouldValidate: false,
    });
  }, [contract.deadlineAt, setValue]);

  // Check if deadline changes are allowed
  if (
    !contract.proposalSnapshot.listingSnapshot?.changeable?.includes("deadline")
  ) {
    return null;
  }

  // NEW APPROACH: Handle toggle with local state instead of form state
  const handleIncludeDeadline = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.checked;

    // Update local state
    setLocalIncludeDeadline(newValue);

    // Update form value
    setValue("includeDeadline", newValue, { shouldValidate: true });

    // If turning on, ensure deadlineAt has a valid value
    if (newValue) {
      setValue("deadlineAt", addDays(minDate, 7), { shouldValidate: true });
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
        {/* NEW APPROACH: Use local state for the switch */}
        <FormControlLabel
          control={
            <Switch
              checked={localIncludeDeadline}
              onChange={handleIncludeDeadline}
              disabled={disabled}
            />
          }
          label="Include changes"
          sx={{ mr: 0 }}
        />
      </Box>
      <Divider sx={{ mb: 3 }} />

      {/* NEW APPROACH: Use local state for conditional rendering */}
      {localIncludeDeadline ? (
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Pilih tanggal tenggat waktu baru untuk kontrak. Tenggat waktu harus
            setidaknya 24 jam dari sekarang untuk memberi waktu kepada seniman
            untuk merespons.
          </Typography>

          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Controller
              name="deadlineAt"
              control={control}
              rules={{
                required: "Tenggat waktu wajib diisi",
                validate: (value) => {
                  if (!value) return "Tenggat waktu wajib diisi";
                  if (isBefore(value, minDate)) {
                    return `Tenggat waktu harus setelah ${minDate.toLocaleDateString()}`;
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
                      Deadline saat ini:{" "}
                      {new Date(contract.deadlineAt).toLocaleDateString()}
                    </FormHelperText>
                  )}
                </FormControl>
              )}
            />
          </LocalizationProvider>

          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Catatan: Seniman dapat menerapkan biaya tambahan jika tenggat
              waktu baru berada di luar rentang waktu standar mereka.
            </Typography>
          </Box>
        </Box>
      ) : (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ fontStyle: "italic", mt: 2 }}
        >
          Alihkan toggle untuk menyertakan perubahan pada tenggat waktu.
        </Typography>
      )}
    </Paper>
  );
}

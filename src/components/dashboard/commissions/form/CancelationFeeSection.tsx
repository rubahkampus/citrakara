"use client";
import React from "react";
import {
  Box,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Typography,
  InputAdornment,
  Tooltip,
} from "@mui/material";
import InfoIcon from "@mui/icons-material/Info";
import { Controller, useFormContext, useWatch } from "react-hook-form";
import { CommissionFormValues } from "../CommissionFormPage";

// Constants for better organization
const CANCEL_FEE_TYPES = {
  FLAT: "flat",
  PERCENTAGE: "percentage",
};

const DEFAULT_VALUES = {
  step: {
    [CANCEL_FEE_TYPES.FLAT]: 1000,
    [CANCEL_FEE_TYPES.PERCENTAGE]: 0.1,
  },
};

const CancelationFeeSection: React.FC = () => {
  const { control } = useFormContext<CommissionFormValues>();
  const cancelKind = useWatch({ control, name: "cancelKind" });
  const currency = useWatch({ control, name: "currency" });

  // Helper function to get step value based on cancel kind
  const getStepValue = () => {
    return cancelKind === CANCEL_FEE_TYPES.PERCENTAGE
      ? DEFAULT_VALUES.step[CANCEL_FEE_TYPES.PERCENTAGE]
      : DEFAULT_VALUES.step[CANCEL_FEE_TYPES.FLAT];
  };

  // Helper function to sanitize value based on cancel kind
  const sanitizeValue = (value: string): number => {
    // Remove leading zeros
    let sanitizedValue = value;
    if (sanitizedValue.length > 1 && sanitizedValue.startsWith("0")) {
      sanitizedValue = sanitizedValue.replace(/^0+/, "");
    }

    // Convert to number and handle invalid input
    const numValue = sanitizedValue === "" ? 0 : parseFloat(sanitizedValue);

    // Apply constraints based on fee type
    let finalValue = numValue;
    if (isNaN(finalValue)) finalValue = 0;
    if (finalValue < 0) finalValue = 0;
    if (cancelKind === CANCEL_FEE_TYPES.PERCENTAGE && finalValue > 100)
      finalValue = 100;

    return finalValue;
  };

  return (
    <Box
      sx={{
        mb: 4,
        p: 3,
        border: "1px solid #e0e0e0",
        borderRadius: 2,
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)",
        transition: "all 0.3s ease",
        "&:hover": {
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
        },
      }}
    >
      <Typography variant="h6" fontWeight="bold" gutterBottom>
        Biaya Pembatalan
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Tentukan jenis dan jumlah biaya yang akan dikenakan jika klien
        membatalkan pesanan
      </Typography>

      <Grid container spacing={3}>
        {/* Fee Type */}
        <Grid item xs={12} sm={6}>
          <Controller
            control={control}
            name="cancelKind"
            defaultValue={CANCEL_FEE_TYPES.FLAT as "flat"}
            render={({ field }) => (
              <FormControl fullWidth>
                <InputLabel>Jenis Biaya</InputLabel>
                <Select
                  {...field}
                  label="Jenis Biaya"
                  value={field.value || CANCEL_FEE_TYPES.FLAT}
                >
                  <MenuItem value={CANCEL_FEE_TYPES.FLAT}>Biaya Tetap</MenuItem>
                  <MenuItem value={CANCEL_FEE_TYPES.PERCENTAGE}>
                    Persentase
                  </MenuItem>
                </Select>
                <FormHelperText>
                  Bagaimana biaya pembatalan dihitung
                </FormHelperText>
              </FormControl>
            )}
          />
        </Grid>

        {/* Fee Amount */}
        <Grid item xs={12} sm={6}>
          <Controller
            control={control}
            name="cancelAmount"
            defaultValue={0}
            rules={{
              min: 0,
              max: cancelKind === CANCEL_FEE_TYPES.PERCENTAGE ? 100 : undefined,
            }}
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                label="Jumlah"
                type="number"
                fullWidth
                error={!!fieldState.error}
                onChange={(e) => {
                  const finalValue = sanitizeValue(e.target.value);
                  field.onChange(finalValue);
                }}
                InputProps={{
                  inputProps: {
                    min: 0,
                    max:
                      cancelKind === CANCEL_FEE_TYPES.PERCENTAGE
                        ? 100
                        : undefined,
                    step: getStepValue(),
                  },
                  endAdornment: (
                    <InputAdornment position="end">
                      {cancelKind === CANCEL_FEE_TYPES.PERCENTAGE
                        ? "%"
                        : currency || "Rp"}
                    </InputAdornment>
                  ),
                  startAdornment: cancelKind !==
                    CANCEL_FEE_TYPES.PERCENTAGE && (
                    <InputAdornment position="start">
                      <Tooltip title="Jumlah yang dikenakan jika pesanan dibatalkan">
                        <InfoIcon fontSize="small" color="action" />
                      </Tooltip>
                    </InputAdornment>
                  ),
                }}
                helperText={
                  fieldState.error
                    ? cancelKind === CANCEL_FEE_TYPES.PERCENTAGE
                      ? "Harus antara 0-100%"
                      : "Harus berupa angka positif"
                    : cancelKind === CANCEL_FEE_TYPES.PERCENTAGE
                    ? "Persentase dari total harga pesanan"
                    : "Jumlah tetap untuk pembatalan"
                }
              />
            )}
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default CancelationFeeSection;

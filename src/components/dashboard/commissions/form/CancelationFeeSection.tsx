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
} from "@mui/material";
import { Controller, useFormContext, useWatch } from "react-hook-form";
import { CommissionFormValues } from "../CommissionFormPage";

const CancelationFeeSection: React.FC = () => {
  const { control } = useFormContext<CommissionFormValues>();
  const cancelKind = useWatch({ control, name: "cancelKind" });
  const currency = useWatch({ control, name: "currency" });

  return (
    <Box>
      <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ mb: 2 }}>
        Biaya Pembatalan
      </Typography>

      <Grid container spacing={3}>
        {/* Fee Type */}
        <Grid item xs={12} sm={6}>
          <Controller
            control={control}
            name="cancelKind"
            render={({ field }) => (
              <FormControl fullWidth>
                <InputLabel>Jenis Biaya</InputLabel>
                <Select {...field} label="Jenis Biaya">
                  <MenuItem value="flat">Biaya Tetap</MenuItem>
                  <MenuItem value="percentage">Persentase</MenuItem>
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
            rules={{
              min: 0,
              max: cancelKind === "percentage" ? 100 : undefined,
            }}
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                label="Jumlah"
                type="number"
                fullWidth
                error={!!fieldState.error}
                onChange={(e) => {
                  // Remove leading zeros
                  let value = e.target.value;
                  if (value.length > 1 && value.startsWith("0")) {
                    value = value.replace(/^0+/, "");
                  }

                  // Convert to number and handle invalid input
                  const numValue = value === "" ? 0 : parseFloat(value);

                  // Apply constraints based on fee type
                  let finalValue = numValue;
                  if (isNaN(finalValue)) finalValue = 0;
                  if (finalValue < 0) finalValue = 0;
                  if (cancelKind === "percentage" && finalValue > 100)
                    finalValue = 100;

                  field.onChange(finalValue);
                }}
                InputProps={{
                  inputProps: {
                    min: 0,
                    max: cancelKind === "percentage" ? 100 : undefined,
                    step: cancelKind === "percentage" ? 0.1 : 1000,
                  },
                  endAdornment: (
                    <InputAdornment position="end">
                      {cancelKind === "percentage" ? "%" : currency}
                    </InputAdornment>
                  ),
                }}
                helperText={
                  fieldState.error
                    ? cancelKind === "percentage"
                      ? "Harus antara 0-100%"
                      : "Harus berupa angka positif"
                    : cancelKind === "percentage"
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

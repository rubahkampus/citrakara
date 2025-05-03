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
        Cancellation Fee
      </Typography>

      <Grid container spacing={3}>
        {/* Fee Type */}
        <Grid item xs={12} sm={6}>
          <Controller
            control={control}
            name="cancelKind"
            render={({ field }) => (
              <FormControl fullWidth>
                <InputLabel>Fee Type</InputLabel>
                <Select {...field} label="Fee Type">
                  <MenuItem value="flat">Flat Fee</MenuItem>
                  <MenuItem value="percentage">Percentage</MenuItem>
                </Select>
                <FormHelperText>
                  How cancellation fees are calculated
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
                label="Amount"
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
                      ? "Must be between 0-100%"
                      : "Must be a positive number"
                    : cancelKind === "percentage"
                    ? "Percentage of total commission price"
                    : "Fixed amount for cancellation"
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

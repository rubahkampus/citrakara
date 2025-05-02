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
      <Typography variant="h6" fontWeight="bold" gutterBottom>
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
            render={({ field }) => (
              <TextField
                {...field}
                label="Amount"
                type="number"
                fullWidth
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      {cancelKind === "percentage" ? "%" : currency}
                    </InputAdornment>
                  ),
                }}
                helperText={
                  cancelKind === "percentage"
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

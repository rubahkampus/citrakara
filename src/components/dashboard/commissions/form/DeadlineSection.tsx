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
} from "@mui/material";
import { Controller, useFormContext } from "react-hook-form";
import { CommissionFormValues } from "../CommissionFormPage";

const DeadlineSection: React.FC = () => {
  const { control, watch } = useFormContext<CommissionFormValues>();
  const deadlineMode = watch("deadlineMode");

  return (
    <Box>
      <Typography variant="h6" fontWeight="bold" gutterBottom>
        Deadline Settings
      </Typography>

      <Grid container spacing={3}>
        {/* Deadline Mode */}
        <Grid item xs={12} sm={4}>
          <Controller
            control={control}
            name="deadlineMode"
            render={({ field }) => (
              <FormControl fullWidth>
                <InputLabel>Deadline Mode</InputLabel>
                <Select {...field} label="Deadline Mode">
                  <MenuItem value="standard">Standard</MenuItem>
                  <MenuItem value="withDeadline">With Deadline</MenuItem>
                  <MenuItem value="withRush">With Rush Option</MenuItem>
                </Select>
                <FormHelperText>How deadlines are handled</FormHelperText>
              </FormControl>
            )}
          />
        </Grid>

        {/* Min Days */}
        <Grid item xs={6} sm={4}>
          <Controller
            control={control}
            name="deadlineMin"
            render={({ field }) => (
              <TextField
                {...field}
                label="Minimum Days"
                type="number"
                fullWidth
                helperText="Shortest time to complete"
              />
            )}
          />
        </Grid>

        {/* Max Days */}
        <Grid item xs={6} sm={4}>
          <Controller
            control={control}
            name="deadlineMax"
            render={({ field }) => (
              <TextField
                {...field}
                label="Maximum Days"
                type="number"
                fullWidth
                helperText="Longest time to complete"
              />
            )}
          />
        </Grid>

        {/* Rush Fee Options (conditional) */}
        {deadlineMode === "withRush" && (
          <>
            <Grid item xs={6} sm={4}>
              <Controller
                control={control}
                name="rushKind"
                render={({ field }) => (
                  <FormControl fullWidth>
                    <InputLabel>Rush Fee Type</InputLabel>
                    <Select {...field} label="Rush Fee Type">
                      <MenuItem value="flat">Flat Fee</MenuItem>
                      <MenuItem value="perDay">Per Day</MenuItem>
                    </Select>
                    <FormHelperText>
                      How rush fees are calculated
                    </FormHelperText>
                  </FormControl>
                )}
              />
            </Grid>

            <Grid item xs={6} sm={4}>
              <Controller
                control={control}
                name="rushAmount"
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Rush Amount"
                    type="number"
                    fullWidth
                    helperText="Fee for rush orders"
                  />
                )}
              />
            </Grid>
          </>
        )}
      </Grid>
    </Box>
  );
};

export default DeadlineSection;

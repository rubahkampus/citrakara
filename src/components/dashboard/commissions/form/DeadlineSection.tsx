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
  Paper,
  Alert,
} from "@mui/material";
import InfoIcon from "@mui/icons-material/Info";
import { Controller, useFormContext } from "react-hook-form";
import { CommissionFormValues } from "../CommissionFormPage";

const DeadlineSection: React.FC = () => {
  const {
    control,
    setValue,
    formState: { errors },
    watch,
  } = useFormContext<CommissionFormValues>();

  // Get current values from the form using watch
  const deadlineMode = watch("deadlineMode");
  const deadlineMin = watch("deadlineMin");

  // This useEffect ensures rush values are initialized when switching to withRush mode
  React.useEffect(() => {
    if (deadlineMode === "withRush") {
      const currentRushKind = watch("rushKind");
      const currentRushAmount = watch("rushAmount");

      if (!currentRushKind) {
        setValue("rushKind", "flat");
      }

      if (!currentRushAmount && currentRushAmount !== 0) {
        setValue("rushAmount", 50000);
      }
    }
  }, [deadlineMode, watch, setValue]);

  // Helper to render mode explanation
  const renderModeExplanation = () => {
    switch (deadlineMode) {
      case "standard":
        return (
          <Alert severity="info" sx={{ mt: 2, mb: 2 }}>
            <Typography variant="body2">
              <strong>Standard mode:</strong> Client will receive delivery
              within the maximum time period + two weeks.
            </Typography>
          </Alert>
        );
      case "withDeadline":
        return (
          <Alert severity="info" sx={{ mt: 2, mb: 2 }}>
            <Typography variant="body2">
              <strong>Fixed Deadline mode:</strong> Client can choose a specific
              deadline date as long as it is beyond the minimum days.
            </Typography>
          </Alert>
        );
      case "withRush":
        return (
          <Alert severity="info" sx={{ mt: 2, mb: 2 }}>
            <Typography variant="body2">
              <strong>Rush Option mode:</strong> Client can request delivery
              faster than the minimum days by paying an additional rush fee.
            </Typography>
          </Alert>
        );
      default:
        return null;
    }
  };

  return (
    <Box sx={{ mb: 4 }}>
      <Typography variant="h6" fontWeight="bold" gutterBottom>
        Deadline Settings
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Define how delivery deadlines will be handled for this commission
      </Typography>

      <Paper variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
        <Grid container spacing={3}>
          {/* Deadline Mode */}
          <Grid item xs={12} sm={4}>
            <Controller
              control={control}
              name="deadlineMode"
              defaultValue="standard"
              rules={{ required: "Deadline mode is required" }}
              render={({ field }) => (
                <FormControl fullWidth error={!!errors.deadlineMode}>
                  <InputLabel>Deadline Mode</InputLabel>
                  <Select
                    {...field}
                    label="Deadline Mode"
                    value={field.value || "standard"} // Ensure controlled
                  >
                    <MenuItem value="standard">Standard</MenuItem>
                    <MenuItem value="withDeadline">Fixed Deadline</MenuItem>
                    <MenuItem value="withRush">Rush Option</MenuItem>
                  </Select>
                  <FormHelperText>
                    {errors.deadlineMode?.message ||
                      "How deadlines are handled"}
                  </FormHelperText>
                </FormControl>
              )}
            />
          </Grid>

          {/* Min Days */}
          <Grid item xs={6} sm={4}>
            <Controller
              control={control}
              name="deadlineMin"
              defaultValue={7}
              rules={{
                required: "Minimum days is required",
                min: { value: 1, message: "Minimum must be at least 1 day" },
              }}
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  label="Minimum Days"
                  type="number"
                  fullWidth
                  value={field.value === undefined ? 7 : field.value}
                  onChange={(e) => {
                    // Ensure positive integer
                    const value = parseInt(e.target.value);
                    const sanitizedValue =
                      isNaN(value) || value < 1 ? 1 : value;
                    field.onChange(sanitizedValue);

                    // Update max value if needed to maintain min <= max relationship
                    const currentMax = watch("deadlineMax");
                    if (currentMax < sanitizedValue) {
                      setValue("deadlineMax", sanitizedValue);
                    }
                  }}
                  InputProps={{
                    inputProps: { min: 1 },
                    endAdornment: (
                      <Tooltip title="Shortest time to complete an order">
                        <InputAdornment position="end">
                          <InfoIcon fontSize="small" color="action" />
                        </InputAdornment>
                      </Tooltip>
                    ),
                  }}
                  error={!!fieldState.error}
                  helperText={
                    fieldState.error?.message || "Shortest time to complete"
                  }
                />
              )}
            />
          </Grid>

          {/* Max Days */}
          <Grid item xs={6} sm={4}>
            <Controller
              control={control}
              name="deadlineMax"
              defaultValue={14}
              rules={{
                required: "Maximum days is required",
                min: {
                  value: 1,
                  message: "Must be at least 1 day",
                },
                validate: (value) =>
                  value >= (deadlineMin || 1) ||
                  "Must be greater than or equal to minimum days",
              }}
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  label="Maximum Days"
                  type="number"
                  fullWidth
                  value={field.value === undefined ? 14 : field.value}
                  onChange={(e) => {
                    // Ensure positive integer >= min
                    const value = parseInt(e.target.value);
                    const minValue = deadlineMin || 1;
                    const sanitizedValue = isNaN(value)
                      ? minValue
                      : value < minValue
                      ? minValue
                      : value;
                    field.onChange(sanitizedValue);
                  }}
                  InputProps={{
                    inputProps: { min: deadlineMin || 1 },
                    endAdornment: (
                      <Tooltip title="Longest time to complete an order">
                        <InputAdornment position="end">
                          <InfoIcon fontSize="small" color="action" />
                        </InputAdornment>
                      </Tooltip>
                    ),
                  }}
                  error={!!fieldState.error}
                  helperText={
                    fieldState.error?.message || "Longest time to complete"
                  }
                />
              )}
            />
          </Grid>

          {/* Mode explanation */}
          <Grid item xs={12}>
            {renderModeExplanation()}
          </Grid>

          {/* Rush Fee Options (conditional) */}
          {deadlineMode === "withRush" && (
            <>
              <Grid item xs={12}>
                <Typography
                  variant="subtitle2"
                  color="text.secondary"
                  sx={{ mt: 1, mb: 2 }}
                >
                  Rush Fee Settings (for expedited delivery)
                </Typography>
              </Grid>

              <Grid item xs={6} sm={6}>
                <Controller
                  control={control}
                  name="rushKind"
                  defaultValue="flat"
                  rules={{
                    required:
                      "Rush fee type is required when rush mode is enabled",
                  }}
                  render={({ field, fieldState }) => (
                    <FormControl fullWidth error={!!fieldState.error}>
                      <InputLabel>Rush Fee Type</InputLabel>
                      <Select
                        {...field}
                        label="Rush Fee Type"
                        value={field.value || "flat"} // Ensure controlled component
                      >
                        <MenuItem value="flat">Flat Fee</MenuItem>
                        <MenuItem value="perDay">Per Day</MenuItem>
                      </Select>
                      <FormHelperText>
                        {fieldState.error?.message ||
                          "How rush fees are calculated"}
                      </FormHelperText>
                    </FormControl>
                  )}
                />
              </Grid>

              <Grid item xs={6} sm={6}>
                <Controller
                  control={control}
                  name="rushAmount"
                  defaultValue={50000}
                  rules={{
                    required:
                      "Rush amount is required when rush mode is enabled",
                    min: { value: 0, message: "Must be a positive number" },
                  }}
                  render={({ field, fieldState }) => (
                    <TextField
                      {...field}
                      label="Rush Amount"
                      type="number"
                      fullWidth
                      value={field.value === undefined ? 50000 : field.value}
                      onChange={(e) => {
                        // Ensure non-negative number
                        const value = parseInt(e.target.value);
                        const sanitizedValue =
                          isNaN(value) || value < 0 ? 0 : value;
                        field.onChange(sanitizedValue);
                      }}
                      InputProps={{
                        inputProps: { min: 0 },
                        startAdornment: (
                          <InputAdornment position="start">Rp</InputAdornment>
                        ),
                      }}
                      error={!!fieldState.error}
                      helperText={
                        fieldState.error?.message ||
                        (watch("rushKind") === "flat"
                          ? "One-time fee for faster delivery"
                          : "Fee per day for each day under minimum")
                      }
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12}>
                <Alert severity="info" sx={{ mt: 1 }}>
                  <Typography variant="body2">
                    <strong>Flat fee:</strong> Client pays one fixed amount for
                    rush processing regardless of deadline.
                    <br />
                    <strong>Per day fee:</strong> Client pays this amount for
                    each day requested before the minimum deadline.
                  </Typography>
                </Alert>
              </Grid>
            </>
          )}
        </Grid>
      </Paper>
    </Box>
  );
};

export default DeadlineSection;

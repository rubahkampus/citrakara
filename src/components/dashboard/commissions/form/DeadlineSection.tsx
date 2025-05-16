"use client";
import React, { useEffect } from "react";
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
  Alert,
} from "@mui/material";
import InfoIcon from "@mui/icons-material/Info";
import { Controller, useFormContext } from "react-hook-form";
import { CommissionFormValues } from "../CommissionFormPage";

// Constants for better organization and maintenance
const DEADLINE_MODES = {
  STANDARD: "standard",
  WITH_DEADLINE: "withDeadline",
  WITH_RUSH: "withRush",
};

const RUSH_FEE_TYPES = {
  FLAT: "flat",
  PER_DAY: "perDay",
};

const DEFAULT_VALUES = {
  deadlineMin: 7,
  deadlineMax: 14,
  rushAmount: 50000,
};

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

  // Initialize rush values when switching to withRush mode
  useEffect(() => {
    if (deadlineMode === DEADLINE_MODES.WITH_RUSH) {
      const currentRushKind = watch("rushKind");
      const currentRushAmount = watch("rushAmount");

      if (!currentRushKind) {
        setValue("rushKind", RUSH_FEE_TYPES.FLAT as "flat");
      }

      if (!currentRushAmount && currentRushAmount !== 0) {
        setValue("rushAmount", DEFAULT_VALUES.rushAmount);
      }
    }
  }, [deadlineMode, watch, setValue]);

  // Helper to render mode explanation
  const renderModeExplanation = () => {
    switch (deadlineMode) {
      case DEADLINE_MODES.STANDARD:
        return (
          <Alert severity="info" sx={{ mt: 2, mb: 2 }}>
            <Typography variant="body2">
              <strong>Mode Standar:</strong> Klien akan menerima pesanan dalam
              periode waktu maksimum + dua minggu.
            </Typography>
          </Alert>
        );
      case DEADLINE_MODES.WITH_DEADLINE:
        return (
          <Alert severity="info" sx={{ mt: 2, mb: 2 }}>
            <Typography variant="body2">
              <strong>Mode Tenggat Tetap:</strong> Klien dapat memilih tanggal
              tenggat tertentu selama melebihi hari minimum.
            </Typography>
          </Alert>
        );
      case DEADLINE_MODES.WITH_RUSH:
        return (
          <Alert severity="info" sx={{ mt: 2, mb: 2 }}>
            <Typography variant="body2">
              <strong>Mode Opsi Percepatan:</strong> Klien dapat meminta pengiriman
              lebih cepat dari hari minimum dengan membayar biaya tambahan.
            </Typography>
          </Alert>
        );
      default:
        return null;
    }
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
        Pengaturan Deadline
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Tentukan bagaimana deadline pengiriman akan ditangani untuk komisi
        ini
      </Typography>

      <Grid container spacing={3}>
        {/* Deadline Mode */}
        <Grid item xs={12} sm={4}>
          <Controller
            control={control}
            name="deadlineMode"
            defaultValue={DEADLINE_MODES.STANDARD as "standard"}
            rules={{ required: "Mode deadline wajib diisi" }}
            render={({ field }) => (
              <FormControl fullWidth error={!!errors.deadlineMode}>
                <InputLabel>Mode Deadline</InputLabel>
                <Select
                  {...field}
                  label="Mode Tenggat"
                  value={field.value || DEADLINE_MODES.STANDARD}
                >
                  <MenuItem value={DEADLINE_MODES.STANDARD}>Standar</MenuItem>
                  <MenuItem value={DEADLINE_MODES.WITH_DEADLINE}>
                    Deadline Tetap
                  </MenuItem>
                  <MenuItem value={DEADLINE_MODES.WITH_RUSH}>
                    Percepatan Berbayar
                  </MenuItem>
                </Select>
                <FormHelperText>
                  {errors.deadlineMode?.message ||
                    "Cara deadline ditangani"}
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
            defaultValue={DEFAULT_VALUES.deadlineMin}
            rules={{
              required: "Hari minimum wajib diisi",
              min: { value: 1, message: "Minimum harus setidaknya 1 hari" },
            }}
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                label="Hari Minimum"
                type="number"
                fullWidth
                value={
                  field.value === undefined
                    ? DEFAULT_VALUES.deadlineMin
                    : field.value
                }
                onChange={(e) => {
                  // Ensure positive integer
                  const value = parseInt(e.target.value);
                  const sanitizedValue = isNaN(value) || value < 1 ? 1 : value;
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
                    <Tooltip title="Waktu tersingkat untuk menyelesaikan pesanan">
                      <InputAdornment position="end">
                        <InfoIcon fontSize="small" color="action" />
                      </InputAdornment>
                    </Tooltip>
                  ),
                }}
                error={!!fieldState.error}
                helperText={
                  fieldState.error?.message ||
                  "Waktu tersingkat untuk menyelesaikan"
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
            defaultValue={DEFAULT_VALUES.deadlineMax}
            rules={{
              required: "Hari maksimum wajib diisi",
              min: {
                value: 1,
                message: "Harus setidaknya 1 hari",
              },
              validate: (value) =>
                value >= (deadlineMin || 1) ||
                "Harus lebih besar atau sama dengan hari minimum",
            }}
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                label="Hari Maksimum"
                type="number"
                fullWidth
                value={
                  field.value === undefined
                    ? DEFAULT_VALUES.deadlineMax
                    : field.value
                }
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
                    <Tooltip title="Waktu terlama untuk menyelesaikan pesanan">
                      <InputAdornment position="end">
                        <InfoIcon fontSize="small" color="action" />
                      </InputAdornment>
                    </Tooltip>
                  ),
                }}
                error={!!fieldState.error}
                helperText={
                  fieldState.error?.message ||
                  "Waktu terlama untuk menyelesaikan"
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
        {deadlineMode === DEADLINE_MODES.WITH_RUSH && (
          <>
            <Grid item xs={12}>
              <Typography
                variant="subtitle2"
                color="text.secondary"
                sx={{ mt: 1, mb: 2 }}
              >
                Pengaturan Biaya Percepatan (untuk pengiriman dipercepat)
              </Typography>
            </Grid>

            <Grid item xs={6} sm={6}>
              <Controller
                control={control}
                name="rushKind"
                defaultValue={RUSH_FEE_TYPES.FLAT as "flat"}
                rules={{
                  required:
                    "Jenis biaya percepatan wajib diisi ketika mode percepatan diaktifkan",
                }}
                render={({ field, fieldState }) => (
                  <FormControl fullWidth error={!!fieldState.error}>
                    <InputLabel>Jenis Biaya Percepatan</InputLabel>
                    <Select
                      {...field}
                      label="Jenis Biaya Percepatan"
                      value={field.value || RUSH_FEE_TYPES.FLAT}
                    >
                      <MenuItem value={RUSH_FEE_TYPES.FLAT}>
                        Biaya Tetap
                      </MenuItem>
                      <MenuItem value={RUSH_FEE_TYPES.PER_DAY}>
                        Per Hari
                      </MenuItem>
                    </Select>
                    <FormHelperText>
                      {fieldState.error?.message ||
                        "Cara perhitungan biaya percepatan"}
                    </FormHelperText>
                  </FormControl>
                )}
              />
            </Grid>

            <Grid item xs={6} sm={6}>
              <Controller
                control={control}
                name="rushAmount"
                defaultValue={DEFAULT_VALUES.rushAmount}
                rules={{
                  required:
                    "Jumlah biaya percepatan wajib diisi ketika mode percepatan diaktifkan",
                  min: { value: 0, message: "Harus bernilai positif" },
                }}
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    label="Jumlah Biaya Percepatan"
                    type="number"
                    fullWidth
                    value={
                      field.value === undefined
                        ? DEFAULT_VALUES.rushAmount
                        : field.value
                    }
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
                      (watch("rushKind") === RUSH_FEE_TYPES.FLAT
                        ? "Biaya sekali bayar untuk pengiriman lebih cepat"
                        : "Biaya per hari untuk setiap hari di bawah minimum")
                    }
                  />
                )}
              />
            </Grid>

            <Grid item xs={12}>
              <Alert severity="info" sx={{ mt: 1 }}>
                <Typography variant="body2">
                  <strong>Biaya tetap:</strong> Klien membayar satu jumlah tetap
                  untuk pemrosesan percepatan terlepas dari deadline.
                  <br />
                  <strong>Biaya per hari:</strong> Klien membayar jumlah ini
                  untuk setiap hari yang diminta sebelum deadline minimum.
                </Typography>
              </Alert>
            </Grid>
          </>
        )}
      </Grid>
    </Box>
  );
};

export default DeadlineSection;

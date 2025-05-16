// src/components/dashboard/commissions/form/RevisionSection.tsx
"use client";
import React, { useEffect } from "react";
import {
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
  Typography,
  Box,
  Paper,
  Divider,
  Tooltip,
  FormHelperText,
} from "@mui/material";
import InfoIcon from "@mui/icons-material/Info";
import { Controller, useFormContext, useWatch } from "react-hook-form";
import { CommissionFormValues } from "../CommissionFormPage";

// Constants for better organization
const REVISION_TYPES = {
  NONE: "none",
  STANDARD: "standard",
  MILESTONE: "milestone",
};

const FLOW_TYPES = {
  STANDARD: "standard",
  MILESTONE: "milestone",
};

const DEFAULT_VALUES = {
  revFree: 2,
  revFee: 50000,
};

const RevisionSection: React.FC = () => {
  const { control, setValue, watch } = useFormContext<CommissionFormValues>();

  // Watch necessary fields
  const flow = useWatch({ name: "flow" });
  const revisionType = useWatch({ name: "revisionType" });
  const revLimit = useWatch({ name: "revLimit" });
  const revFree = useWatch({ name: "revFree" });
  const revExtraAllowed = useWatch({ name: "revExtraAllowed" });

  // Auto-select "standard" revisionType when flow changes
  useEffect(() => {
    // If switching back to standard flow, reset to "standard"
    if (
      flow !== FLOW_TYPES.MILESTONE &&
      revisionType === REVISION_TYPES.MILESTONE
    ) {
      console.log("Setting revisionType to standard");
      setValue("revisionType", REVISION_TYPES.STANDARD as "standard");
    }
  }, [flow, revisionType, setValue]);

  // Initialize revision policy settings for "standard" if not set
  useEffect(() => {
    if (revisionType === REVISION_TYPES.STANDARD && revLimit === undefined) {
      setValue("revLimit", false);
      setValue("revFree", DEFAULT_VALUES.revFree);
      setValue("revExtraAllowed", true);
      setValue("revFee", 0);
    }
  }, [revisionType, revLimit, setValue]);

  // Build options dynamically
  const revisionOptions = [
    { label: "Tidak Ada", value: REVISION_TYPES.NONE },
    { label: "Standar", value: REVISION_TYPES.STANDARD },
  ];

  if (flow === FLOW_TYPES.MILESTONE) {
    revisionOptions.push({
      label: "Per Milestone",
      value: REVISION_TYPES.MILESTONE,
    });
  }

  // Determine which form to show
  const showStandardRevisionForm = revisionType === REVISION_TYPES.STANDARD;

  // Check if "Paid Revisions Only" mode is active
  const isPaidOnly =
    revLimit === true && revFree === 0 && revExtraAllowed === true;

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
        Kebijakan Revisi
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Tentukan bagaimana revisi akan ditangani untuk komisi ini
      </Typography>

      <Grid container spacing={3}>
        {/* Revision Type Selector */}
        <Grid item xs={12} sm={4}>
          <Controller
            control={control}
            name="revisionType"
            defaultValue={REVISION_TYPES.STANDARD as "standard"}
            render={({ field }) => (
              <FormControl fullWidth>
                <InputLabel>Tipe Revisi</InputLabel>
                <Select {...field} label="Tipe Revisi">
                  {revisionOptions.map((opt) => (
                    <MenuItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </MenuItem>
                  ))}
                </Select>
                <FormHelperText>
                  Pilih bagaimana revisi akan dikelola
                </FormHelperText>
              </FormControl>
            )}
          />
        </Grid>

        {/* Standard Revision Form */}
        {showStandardRevisionForm && (
          <Grid item xs={12}>
            <Paper
              variant="outlined"
              sx={{
                p: 3,
                borderRadius: 2,
                transition: "all 0.2s ease",
                "&:hover": {
                  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
                },
              }}
            >
              <Grid container spacing={3}>
                {/* Unlimited & Paid Only Toggles */}
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={revLimit === false}
                          onChange={(e) => {
                            const isUnlimited = e.target.checked;
                            setValue("revLimit", !isUnlimited);
                            if (isUnlimited) {
                              setValue("revFree", 0);
                              setValue("revExtraAllowed", false);
                              setValue("revFee", 0);
                            } else {
                              setValue("revFree", DEFAULT_VALUES.revFree);
                              setValue("revExtraAllowed", true);
                            }
                          }}
                        />
                      }
                      label="Revisi Tidak Terbatas"
                    />
                    <Tooltip title="Izinkan klien meminta revisi tanpa batas">
                      <InfoIcon
                        fontSize="small"
                        color="action"
                        sx={{ ml: 1 }}
                      />
                    </Tooltip>
                  </Box>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={isPaidOnly}
                          onChange={(e) => {
                            const isPaidOnlyChecked = e.target.checked;
                            if (isPaidOnlyChecked) {
                              setValue("revLimit", true);
                              setValue("revFree", 0);
                              setValue("revExtraAllowed", true);
                              setValue("revFee", DEFAULT_VALUES.revFee);
                            } else {
                              setValue("revFree", DEFAULT_VALUES.revFree);
                              // Keep extraAllowed as true when unchecking paid-only mode
                              setValue("revExtraAllowed", true);
                            }
                          }}
                          disabled={revLimit === false}
                        />
                      }
                      label="Hanya Revisi Berbayar"
                    />
                    <Tooltip title="Semua revisi akan memerlukan pembayaran">
                      <InfoIcon
                        fontSize="small"
                        color="action"
                        sx={{ ml: 1 }}
                      />
                    </Tooltip>
                  </Box>
                </Grid>

                <Grid item xs={12}>
                  <Divider sx={{ my: 1 }} />
                </Grid>

                {/* Revision Fields */}
                <Grid item xs={12} sm={4}>
                  <Controller
                    control={control}
                    defaultValue={DEFAULT_VALUES.revFree}
                    name="revFree"
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Slot Revisi Gratis"
                        type="number"
                        fullWidth
                        InputProps={{
                          inputProps: { min: 0 },
                          endAdornment: (
                            <Tooltip title="Jumlah revisi yang diberikan tanpa biaya tambahan">
                              <InfoIcon
                                fontSize="small"
                                color="action"
                                sx={{ ml: 1 }}
                              />
                            </Tooltip>
                          ),
                        }}
                        disabled={revLimit === false || isPaidOnly}
                        helperText="Jumlah revisi gratis yang disediakan"
                      />
                    )}
                  />
                </Grid>

                <Grid item xs={12} sm={4}>
                  <Controller
                    control={control}
                    name="revExtraAllowed"
                    defaultValue={true}
                    render={({ field }) => (
                      <FormControlLabel
                        control={
                          <Checkbox
                            {...field}
                            checked={field.value === true}
                            disabled={revLimit === false || isPaidOnly}
                          />
                        }
                        label="Izinkan Revisi Berbayar (Revisi Tambahan)"
                      />
                    )}
                  />
                </Grid>

                <Grid item xs={12} sm={4}>
                  <Controller
                    control={control}
                    name="revFee"
                    defaultValue={0}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Biaya Per Revisi"
                        type="number"
                        fullWidth
                        InputProps={{
                          inputProps: { min: 0 },
                          startAdornment: (
                            <span style={{ marginRight: 8 }}>Rp</span>
                          ),
                        }}
                        disabled={
                          revLimit === false ||
                          (revLimit === true &&
                            revExtraAllowed === false &&
                            !isPaidOnly)
                        }
                        helperText="Biaya untuk setiap revisi tambahan"
                      />
                    )}
                  />
                </Grid>
              </Grid>
            </Paper>
          </Grid>
        )}

        {/* Milestone Message */}
        {revisionType === REVISION_TYPES.MILESTONE && (
          <Grid item xs={12}>
            <Paper
              sx={{
                p: 2,
                bgcolor: "info.lighter",
                borderRadius: 2,
                border: "1px solid rgba(41, 182, 246, 0.2)",
              }}
            >
              <Typography variant="body2">
                Kebijakan revisi akan didefinisikan secara terpisah untuk setiap
                milestone di bagian Milestone.
              </Typography>
            </Paper>
          </Grid>
        )}

        {/* No Revisions Message */}
        {revisionType === REVISION_TYPES.NONE && (
          <Grid item xs={12}>
            <Paper
              sx={{
                p: 2,
                bgcolor: "warning.lighter",
                borderRadius: 2,
                border: "1px solid rgba(255, 160, 0, 0.2)",
              }}
            >
              <Typography variant="body2">
                Tidak ada revisi yang akan ditawarkan kepada klien. Pastikan hal
                ini dijelaskan dalam deskripsi komisi.
              </Typography>
            </Paper>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default RevisionSection;

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
} from "@mui/material";
import InfoIcon from "@mui/icons-material/Info";
import { Controller, useFormContext, useWatch } from "react-hook-form";
import { CommissionFormValues } from "../CommissionFormPage";

const RevisionSection: React.FC = () => {
  const { control, setValue, watch, getValues } =
    useFormContext<CommissionFormValues>();

  // Watch necessary fields
  const flow = useWatch({ name: "flow" });
  const revisionType = useWatch({ name: "revisionType" });
  const revLimit = useWatch({ name: "revLimit" });
  const revFree = useWatch({ name: "revFree" });
  const revExtraAllowed = useWatch({ name: "revExtraAllowed" });

  // Auto-select "standard" revisionType when flow changes
  useEffect(() => {
    // If switching back to standard flow, reset to "standard"
    if (flow !== "milestone" && revisionType === "milestone") {
      console.log("Setting revisionType to standard");
      setValue("revisionType", "standard");
    }
  }, [flow, revisionType, setValue]);

  // Initialize revision policy settings for "standard" if not set
  useEffect(() => {
    if (revisionType === "standard" && revLimit === undefined) {
      setValue("revLimit", false);
      setValue("revFree", 2);
      setValue("revExtraAllowed", true);
      setValue("revFee", 0);
    }
  }, [revisionType, revLimit, setValue]);

  // Build options dynamically
  const revisionOptions = [
    { label: "None", value: "none" },
    { label: "Standard", value: "standard" },
  ];
  if (flow === "milestone") {
    revisionOptions.push({ label: "Milestone", value: "milestone" });
  }

  // Determine which form to show
  const showStandardRevisionForm = revisionType === "standard";


  return (
    <Box>
      <Grid container spacing={3}>
        {/* Revision Type Selector */}
        <Grid item xs={12} sm={4}>
          <Controller
            control={control}
            name="revisionType"
            render={({ field }) => (
              <FormControl fullWidth>
                <InputLabel>Revision Type</InputLabel>
                <Select {...field} label="Revision Type">
                  {revisionOptions.map((opt) => (
                    <MenuItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
          />
        </Grid>

        {/* Standard Revision Form */}
        {showStandardRevisionForm && (
          <Grid item xs={12}>
            <Paper variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
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
                              setValue("revFree", 2);
                              setValue("revExtraAllowed", true);
                            }
                          }}
                        />
                      }
                      label="Unlimited Revisions"
                    />
                    <Tooltip title="Allow clients to request unlimited revisions">
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
                          checked={
                            revLimit === true &&
                            revFree === 0 &&
                            revExtraAllowed === true
                          }
                          onChange={(e) => {
                            const isPaidOnly = e.target.checked;
                            if (isPaidOnly) {
                              setValue("revLimit", true);
                              setValue("revFree", 0);
                              setValue("revExtraAllowed", true);
                              setValue("revFee", 50000);
                            } else {
                              setValue("revFree", 2);
                              setValue("revExtraAllowed", true);
                            }
                          }}
                          disabled={revLimit === false}
                        />
                      }
                      label="Paid Revisions Only"
                    />
                    <Tooltip title="All revisions will require payment">
                      <InfoIcon
                        fontSize="small"
                        color="action"
                        sx={{ ml: 1 }}
                      />
                    </Tooltip>
                  </Box>
                </Grid>

                <Grid item xs={12}>
                  <Divider />
                </Grid>

                {/* Revision Fields */}
                <Grid item xs={12} sm={4}>
                  <Controller
                    control={control}
                    name="revFree"
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Revision Slots"
                        type="number"
                        fullWidth
                        InputProps={{ inputProps: { min: 0 } }}
                        disabled={
                          revLimit === false ||
                          (revLimit === true &&
                            revFree === 0 &&
                            revExtraAllowed === true)
                        }
                      />
                    )}
                  />
                </Grid>

                <Grid item xs={12} sm={4}>
                  <Controller
                    control={control}
                    name="revExtraAllowed"
                    render={({ field }) => (
                      <FormControlLabel
                        control={
                          <Checkbox
                            {...field}
                            checked={field.value === true}
                            disabled={revLimit === false}
                          />
                        }
                        label="Allow Paid Revisions"
                      />
                    )}
                  />
                </Grid>

                <Grid item xs={12} sm={4}>
                  <Controller
                    control={control}
                    name="revFee"
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Fee per Revision"
                        type="number"
                        fullWidth
                        InputProps={{
                          inputProps: { min: 0 },
                          startAdornment: (
                            <span style={{ marginRight: 4 }}>Rp</span>
                          ),
                        }}
                        disabled={
                          revLimit === false ||
                          (revLimit === true && revExtraAllowed === false)
                        }
                      />
                    )}
                  />
                </Grid>
              </Grid>
            </Paper>
          </Grid>
        )}

        {/* Milestone Message */}
        {revisionType === "milestone" && (
          <Grid item xs={12}>
            <Paper sx={{ p: 2, bgcolor: "info.lighter", borderRadius: 2 }}>
              <Typography variant="body2">
                Revision policies will be defined separately for each milestone
                in the Milestones section.
              </Typography>
            </Paper>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default RevisionSection;

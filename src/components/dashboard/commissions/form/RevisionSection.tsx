"use client";
import React from "react";
import {
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
} from "@mui/material";
import { Controller, useFormContext, useWatch } from "react-hook-form";
import { CommissionFormValues } from "../CommissionFormPage";

const RevisionSection: React.FC = () => {
  const { control } = useFormContext<CommissionFormValues>();
  const flow = useWatch({ name: "flow" });
  const revType = useWatch({ name: "revisionType" });

  const showStandardRevisionForm =
    flow === "standard" && revType === "standard";

  const revisionOptions =
    flow === "milestone"
      ? [
          { label: "None", value: "none" },
          { label: "Per Milestone", value: "milestone" },
        ]
      : [
          { label: "None", value: "none" },
          { label: "Standard", value: "standard" },
        ];

  return (
    <Grid container spacing={3}>
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

      {showStandardRevisionForm && (
        <>
          <Grid item xs={6} sm={2}>
            <Controller
              control={control}
              name="revLimit"
              render={({ field }) => (
                <FormControlLabel
                  control={<Checkbox {...field} checked={!!field.value} />}
                  label="Limited"
                />
              )}
            />
          </Grid>
          <Grid item xs={6} sm={2}>
            <Controller
              control={control}
              name="revFree"
              render={({ field }) => (
                <TextField {...field} type="number" fullWidth label="Free" />
              )}
            />
          </Grid>
          <Grid item xs={6} sm={2}>
            <Controller
              control={control}
              name="revExtraAllowed"
              render={({ field }) => (
                <FormControlLabel
                  control={<Checkbox {...field} checked={!!field.value} />}
                  label="Extra OK"
                />
              )}
            />
          </Grid>
          <Grid item xs={6} sm={2}>
            <Controller
              control={control}
              name="revFee"
              render={({ field }) => (
                <TextField {...field} type="number" fullWidth label="Fee" />
              )}
            />
          </Grid>
        </>
      )}
    </Grid>
  );
};

export default RevisionSection;

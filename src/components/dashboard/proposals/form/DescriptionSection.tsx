// src/components/dashboard/proposals/form/DescriptionSection.tsx

/**
 * DescriptionSection
 * ------------------
 * Renders `generalDescription` as a multiline text area.
 *
 * Implementation:
 *  - Use RHF `register` to bind to `generalDescription`
 *  - Validate: required, max length e.g. 500 chars
 *  - Render MUI `<TextField multiline>` with error/helperText
 */
import React from "react";
import { useFormContext } from "react-hook-form";
import { TextField, Typography, Paper } from "@mui/material";
import { ProposalFormValues } from "@/types/proposal";

export default function DescriptionSection() {
  const {
    register,
    formState: { errors },
  } = useFormContext<ProposalFormValues>();

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        Project Description
      </Typography>
      <TextField
        {...register("generalDescription", {
          required: "Description is required",
          maxLength: { value: 500, message: "Max 500 characters" },
        })}
        label="Describe your project"
        multiline
        rows={4}
        fullWidth
        placeholder="Provide details about your commission request. Be specific about what you want and any special requirements."
        error={!!errors.generalDescription}
        helperText={errors.generalDescription?.message}
        sx={{ mb: 3 }}
      />
    </Paper>
  );
}

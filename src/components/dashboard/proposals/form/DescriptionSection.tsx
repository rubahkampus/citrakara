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
import { TextField } from "@mui/material";
import { ProposalFormValues } from "@/types/proposal";

export default function DescriptionSection() {
  const {
    register,
    formState: { errors },
  } = useFormContext<ProposalFormValues>();

  return (
    <TextField
      {...register("generalDescription", {
        required: "Description is required",
        maxLength: { value: 500, message: "Max 500 characters" },
      })}
      label="Project Description"
      multiline
      rows={4}
      fullWidth
      error={!!errors.generalDescription}
      helperText={errors.generalDescription?.message}
      sx={{ mb: 3 }}
    />
  );
}

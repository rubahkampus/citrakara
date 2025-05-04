// src/components/dashboard/proposals/form/DescriptionSection.tsx
/**
 * DescriptionSection
 * ------------------
 * Renders a multiline text area for `generalDescription`.
 * Use RHF's register for validation (required, max length).
 * 
 * Example:
 *   <textarea {...register("generalDescription", { required: true })} />
 */
import React from "react";
import { useFormContext } from "react-hook-form";
import { TextField } from "@mui/material";
import { ProposalFormValues } from "@/types/proposal";

export default function DescriptionSection() {
  const { register, formState: { errors } } = useFormContext<ProposalFormValues>();
  return (
    <div>
      {/* TODO: <TextField multiline rows={4} {...register("generalDescription", { required: true })} label="Description" error={!!errors.generalDescription} helperText={errors.generalDescription && "Description is required"} /> */}
    </div>
  );
}

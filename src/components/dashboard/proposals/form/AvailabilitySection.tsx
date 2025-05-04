// src/components/dashboard/proposals/form/AvailabilitySection.tsx
/**
 * AvailabilitySection
 * -------------------
 * Renders three date inputs:
 *   - earliestDate
 *   - deadline
 *   - latestDate
 * Validates client-side: earliest <= deadline <= latest.
 * Use RHF's register or Controller with MUI TextField.
 * 
 * Example usage in form values:
 *   values.earliestDate = "2025-05-10";
 */
import React from "react";
import { useFormContext, Controller } from "react-hook-form";
import { TextField } from "@mui/material";
import { ProposalFormValues } from "@/types/proposal";

export default function AvailabilitySection() {
  const { control } = useFormContext<ProposalFormValues>();
  return (
    <div>
      {/* TODO: wrap each in Controller to render <TextField type="date" /> */}
      {/* <Controller name="earliestDate" control={control} render={({ field }) => <TextField {...field} label="Earliest Date" type="date" />} /> */}
    </div>
  );
}

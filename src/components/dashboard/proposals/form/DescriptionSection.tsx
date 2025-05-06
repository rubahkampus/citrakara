// /src/components/dashboard/proposals/form/DescriptionSection.tsx
import React from "react";
import { useFormContext, useController } from "react-hook-form";
import { TextField, Typography, Paper } from "@mui/material";
import { ProposalFormValues } from "@/types/proposal";

const DescriptionSection = React.memo(function DescriptionSection() {
  const { control } = useFormContext<ProposalFormValues>();
  const {
    field,
    fieldState: { error },
  } = useController({
    name: "generalDescription",
    control,
    defaultValue: "",
    rules: {
      required: "Description is required",
      maxLength: { value: 500, message: "Max 500 characters" },
    },
  });

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        Project Description
      </Typography>
      <TextField
        {...field}
        label="Describe your project"
        multiline
        rows={4}
        fullWidth
        placeholder="Provide details about your commission request. Be specific about what you want and any special requirements."
        error={!!error}
        helperText={error?.message}
        sx={{ mb: 3 }}
      />
    </Paper>
  );
});

export default DescriptionSection;

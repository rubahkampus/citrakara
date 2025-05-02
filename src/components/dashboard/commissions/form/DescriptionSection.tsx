"use client";
import React from "react";
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Stack,
  TextField,
} from "@mui/material";
import { useFormContext, useFieldArray } from "react-hook-form";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import { CommissionFormValues } from "../CommissionFormPage";

const DescriptionSection: React.FC = () => {
  const { register, control } = useFormContext<CommissionFormValues>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: "description",
  });

  return (
    <Box sx={{ mb: 4 }}>
      <Typography variant="h6" fontWeight="bold" gutterBottom>
      </Typography>
      <Stack spacing={2}>
        {fields.map((field, index) => (
          <Paper
            key={field.id}
            variant="outlined"
            sx={{ p: 2, position: "relative" }}
          >
            <Box></Box>
            <IconButton
              size="small"
              color="error"
              onClick={() => remove(index)}
              sx={{ position: "absolute", top: 25, right: 25 }}
            >
              <DeleteIcon />
            </IconButton>
            <Stack spacing={1}>
              <TextField
                label="Section Title"
                variant="outlined"
                sx={{width: "90%"}}
                {...register(`description.${index}.title`, {
                  required: "Title is required",
                })}
              />
              <TextField
                label="Detail"
                variant="outlined"
                fullWidth
                multiline
                minRows={3}
                {...register(`description.${index}.detail`, {
                  required: "Detail is required",
                })}
              />
            </Stack>
          </Paper>
        ))}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <IconButton
            color="primary"
            onClick={() => append({ title: "", detail: "" })}
          >
            <AddIcon />
          </IconButton>
          <Typography variant="button">Add Section</Typography>
        </Box>
      </Stack>
    </Box>
  );
};

export default DescriptionSection;
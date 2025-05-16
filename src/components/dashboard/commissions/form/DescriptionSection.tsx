"use client";

import React from "react";
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Stack,
  TextField,
  Tooltip,
  Divider,
  Button,
} from "@mui/material";
import { useFormContext, useFieldArray } from "react-hook-form";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import StickyNote2Icon from "@mui/icons-material/StickyNote2";
import { CommissionFormValues } from "../CommissionFormPage";
import { UseFormRegister } from "react-hook-form";

interface DescriptionFieldProps {
  index: number;
  register: UseFormRegister<CommissionFormValues>;
  onRemove: (index: number) => void;
}

const DescriptionField: React.FC<DescriptionFieldProps> = ({ index, register, onRemove }) => {
  return (
    <Paper
      elevation={0}
      variant="outlined"
      sx={{
        p: 3,
        position: "relative",
        borderRadius: 2,
        transition: "all 0.2s ease",
        "&:hover": {
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
          borderColor: "primary.light",
        },
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
        <StickyNote2Icon color="primary" sx={{ mr: 1, opacity: 0.7 }} />
        <Typography variant="subtitle1" fontWeight="medium">
          Bagian {index + 1}
        </Typography>
      </Box>

      <Divider sx={{ mb: 2 }} />

      <Tooltip title="Hapus Bagian" placement="left">
        <IconButton
          size="small"
          color="error"
          onClick={() => onRemove(index)}
          sx={{
            position: "absolute",
            top: 16,
            right: 16,
            "&:hover": {
              backgroundColor: "rgba(211, 47, 47, 0.1)",
            },
          }}
          aria-label="hapus bagian"
        >
          <DeleteIcon />
        </IconButton>
      </Tooltip>

      <Stack spacing={2}>
        <TextField
          label="Judul Bagian"
          variant="outlined"
          sx={{ width: "90%" }}
          {...register(`description.${index}.title`, {
            required: "Judul diperlukan",
          })}
          InputProps={{
            sx: { borderRadius: 1.5 },
          }}
        />
        <TextField
          label="Detail"
          variant="outlined"
          fullWidth
          multiline
          minRows={3}
          {...register(`description.${index}.detail`, {
            required: "Detail diperlukan",
          })}
          InputProps={{
            sx: { borderRadius: 1.5 },
          }}
          helperText="Tambahkan deskripsi detail untuk bagian ini"
        />
      </Stack>
    </Paper>
  );
};

const DescriptionSection: React.FC = () => {
  const { register, control } = useFormContext<CommissionFormValues>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: "description",
  });

  const handleAddSection = () => {
    append({ title: "", detail: "" });
  };

  return (
    <Box
      sx={{
        mb: 4,
        p: 3,
        border: "1px solid #e0e0e0",
        borderRadius: 2,
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)",
        transition: "box-shadow 0.3s ease",
        "&:hover": {
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
        },
      }}
    >
      <Typography variant="h5" fontWeight="bold" gutterBottom mb={2}>
        Deskripsi
      </Typography>

      {fields.length === 0 ? (
        <Box
          sx={{
            p: 4,
            border: "2px dashed #e0e0e0",
            borderRadius: 2,
            textAlign: "center",
            backgroundColor: "rgba(0,0,0,0.02)",
            mb: 2,
          }}
        >
          <Typography color="text.secondary" gutterBottom>
            Belum ada bagian deskripsi
          </Typography>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={handleAddSection}
            sx={{ mt: 1, textTransform: "none" }}
          >
            Tambah Bagian Deskripsi
          </Button>
        </Box>
      ) : (
        <Stack spacing={2} sx={{ mb: 2 }}>
          {fields.map((field, index) => (
            <DescriptionField
              key={field.id}
              index={index}
              register={register}
              onRemove={remove}
            />
          ))}
        </Stack>
      )}

      {fields.length > 0 && (
        <Box sx={{ display: "flex", alignItems: "center", mt: 2 }}>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={handleAddSection}
            size="medium"
            sx={{
              textTransform: "none",
              borderRadius: 1.5,
            }}
          >
            Tambah Bagian Baru
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default DescriptionSection;

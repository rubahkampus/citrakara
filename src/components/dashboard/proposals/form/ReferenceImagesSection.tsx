// src/components/dashboard/proposals/form/ReferenceImagesSection.tsx

/**
 * ReferenceImagesSection
 * ----------------------
 * Let users upload up to 5 reference images.
 *
 * Implementation:
 *  - Use a controlled field array or local state to manage `referenceImages`
 *  - On file selection: filter to images, limit to 5 total
 *  - Create previews via `URL.createObjectURL`
 *  - Allow removal of any image
 *  - Bind new files into `values.referenceImages: File[]`
 */
import React, { useEffect, useState } from "react";
import { useFormContext, useController } from "react-hook-form";
import {
  Grid,
  Card,
  CardMedia,
  IconButton,
  Button,
  Typography,
  Paper,
  Box,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import { ProposalFormValues } from "@/types/proposal";

const MAX_FILES = 5;

export default function ReferenceImagesSection() {
  const { control } = useFormContext<ProposalFormValues>();
  const {
    field: { value: samples = [], onChange: setSamples },
  } = useController({
    name: "referenceImages",
    control,
    defaultValue: [] as File[],
  });

  const [previews, setPreviews] = useState<string[]>([]);

  // Generate previews whenever samples change
  useEffect(() => {
    const urls = samples.map((f) =>
      typeof f === "string" ? f : URL.createObjectURL(f)
    );
    setPreviews(urls);

    // Cleanup URLs on unmount or when samples change
    return () => {
      urls.forEach((u, i) => {
        if (typeof samples[i] !== "string" && u.startsWith("blob:")) {
          URL.revokeObjectURL(u);
        }
      });
    };
  }, [samples]);

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const imgs = Array.from(files)
      .filter((f) => f.type.startsWith("image/"))
      .slice(0, MAX_FILES - samples.length);

    if (imgs.length === 0) return;

    const combined = [...samples, ...imgs];
    setSamples(combined as File[]);

    // Reset file input
    e.target.value = "";
  };

  const removeAt = (idx: number) => {
    const next = samples.filter((_, i) => i !== idx);
    setSamples(next as File[]);
  };

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        Reference Images
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Upload up to {MAX_FILES} reference images to help illustrate your
        commission
      </Typography>

      <Button
        variant="outlined"
        component="label"
        startIcon={<CloudUploadIcon />}
        fullWidth
        disabled={samples.length >= MAX_FILES}
        sx={{ mb: 3 }}
      >
        {samples.length === 0 ? "Upload Images" : "Upload More Images"}(
        {samples.length}/{MAX_FILES})
        <input
          type="file"
          hidden
          multiple
          accept="image/*"
          onChange={handleFiles}
        />
      </Button>

      {samples.length > 0 ? (
        <Grid container spacing={2}>
          {previews.map((src, i) => (
            <Grid item xs={6} sm={4} md={3} key={i}>
              <Card sx={{ position: "relative" }}>
                <CardMedia
                  component="img"
                  height={140}
                  image={src}
                  alt={`Reference ${i + 1}`}
                  sx={{ objectFit: "cover" }}
                />
                <IconButton
                  size="small"
                  onClick={() => removeAt(i)}
                  sx={{
                    position: "absolute",
                    top: 8,
                    right: 8,
                    bgcolor: "rgba(255, 255, 255, 0.9)",
                    "&:hover": { bgcolor: "rgba(255, 255, 255, 1)" },
                  }}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : (
        <Box
          sx={{
            p: 3,
            border: "2px dashed",
            borderColor: "divider",
            borderRadius: 1,
            textAlign: "center",
            bgcolor: "background.default",
          }}
        >
          <Typography color="text.secondary">
            No reference images uploaded yet
          </Typography>
        </Box>
      )}
    </Paper>
  );
}

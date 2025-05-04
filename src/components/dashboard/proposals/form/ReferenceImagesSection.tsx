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
import { Grid, Card, CardMedia, IconButton, Button, Typography } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import { ProposalFormValues } from "@/types/proposal";

const MAX_FILES = 5;

export default function ReferenceImagesSection() {
  const { control } = useFormContext<ProposalFormValues>();
  const {
    field: { value: samples = [], onChange: setSamples },
  } = useController({ name: "referenceImages", control, defaultValue: [] as File[] });

  const [previews, setPreviews] = useState<string[]>([]);

  // Generate previews whenever samples change
  useEffect(() => {
    const urls = samples.map((f) =>
      typeof f === "string" ? f : URL.createObjectURL(f)
    );
    setPreviews(urls);
    return () => {
      urls.forEach((u, i) => {
        if (!samples[i] || typeof samples[i] !== "string") {
          URL.revokeObjectURL(u);
        }
      });
    };
  }, [samples]);

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const imgs = Array.from(files).filter((f) => f.type.startsWith("image/"));
    const combined = [...samples, ...imgs].slice(0, MAX_FILES);
    setSamples(combined as any);
  };

  const removeAt = (idx: number) => {
    const next = samples.filter((_, i) => i !== idx);
    setSamples(next as any);
  };

  return (
    <div>
      <Typography variant="subtitle1" sx={{ mb: 1 }}>
        Reference Images (up to {MAX_FILES})
      </Typography>
      <Button variant="outlined" component="label" sx={{ mb: 2 }}>
        Upload Images
        <input type="file" hidden multiple accept="image/*" onChange={handleFiles} />
      </Button>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {previews.map((src, i) => (
          <Grid item xs={4} sm={2} key={i}>
            <Card>
              <CardMedia component="img" height="100" image={src} />
              <IconButton
                size="small"
                onClick={() => removeAt(i)}
                sx={{ position: "absolute", top: 4, right: 4, bgcolor: "#fff" }}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Card>
          </Grid>
        ))}
      </Grid>
    </div>
  );
}

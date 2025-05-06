// src/components/dashboard/proposals/form/ReferenceImagesSection.tsx

/**
 * ReferenceImagesSection
 * ----------------------
 * Let users upload up to 5 reference images.
 * 
 * Implementation:
 *  - Use a controlled field array or local state to manage `referenceImages`
 *  - Support both edit and create modes
 *    - Edit: Show existing images + newly added ones (up to MAX_FILES total)
 *    - Create: Just show newly added images
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
import { IProposal } from "@/lib/db/models/proposal.model";

const MAX_FILES = 5;

export default function ReferenceImagesSection() {
  const { control, getValues, formState } = useFormContext<ProposalFormValues>();
  const {
    field: { value: newFiles = [], onChange: setNewFiles },
  } = useController({
    name: "referenceImages",
    control,
    defaultValue: [] as File[],
  });

  // Local state for tracking existing reference images (for edit mode)
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [previews, setPreviews] = useState<{ url: string; isExisting: boolean }[]>([]);
  const [isEditMode, setIsEditMode] = useState(false);

  // On component mount, check if we're in edit mode by detecting initialData
  useEffect(() => {
    const formValues = getValues();
    
    // Check if we have a proposal ID, indicating edit mode
    if (formValues.id) {
      setIsEditMode(true);
      
      // Check if referenceImages is an array of strings (existing URLs)
      const initialData = formValues as unknown as IProposal;
      if (initialData.referenceImages && Array.isArray(initialData.referenceImages)) {
        const existingUrls = initialData.referenceImages.filter(
          (url): url is string => typeof url === 'string'
        );
        setExistingImages(existingUrls);
      }
    }
  }, [getValues]);

  // Generate previews whenever files or existing images change
  useEffect(() => {
    // Create previews for both existing images and new files
    const existingPreviews = existingImages.map(url => ({ 
      url, 
      isExisting: true 
    }));
    
    const newFilePreviews = newFiles.map(file => ({
      url: typeof file === 'string' ? file : URL.createObjectURL(file),
      isExisting: false
    }));
    
    const allPreviews = [...existingPreviews, ...newFilePreviews];
    setPreviews(allPreviews);

    // Cleanup blob URLs on unmount or when samples change
    return () => {
      newFilePreviews.forEach((preview) => {
        if (!preview.isExisting && preview.url.startsWith("blob:")) {
          URL.revokeObjectURL(preview.url);
        }
      });
    };
  }, [newFiles, existingImages]);

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    // Calculate how many more files we can add
    const totalCurrentFiles = existingImages.length + newFiles.length;
    const remainingSlots = MAX_FILES - totalCurrentFiles;
    
    if (remainingSlots <= 0) return;

    const imgs = Array.from(files)
      .filter((f) => f.type.startsWith("image/"))
      .slice(0, remainingSlots);

    if (imgs.length === 0) return;

    const combined = [...newFiles, ...imgs];
    setNewFiles(combined as File[]);

    // Reset file input
    e.target.value = "";
  };

  const removeImage = (idx: number) => {
    if (idx < existingImages.length) {
      // Remove an existing image
      const updatedExisting = existingImages.filter((_, i) => i !== idx);
      setExistingImages(updatedExisting);
    } else {
      // Remove a new file
      const newFileIdx = idx - existingImages.length;
      const updatedNewFiles = newFiles.filter((_, i) => i !== newFileIdx);
      setNewFiles(updatedNewFiles as File[]);
    }
  };

  const totalCount = existingImages.length + newFiles.length;

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
        disabled={totalCount >= MAX_FILES}
        sx={{ mb: 3 }}
      >
        {totalCount === 0 ? "Upload Images" : "Upload More Images"}(
        {totalCount}/{MAX_FILES})
        <input
          type="file"
          hidden
          multiple
          accept="image/*"
          onChange={handleFiles}
        />
      </Button>

      {previews.length > 0 ? (
        <Grid container spacing={2}>
          {previews.map((preview, i) => (
            <Grid item xs={6} sm={4} md={3} key={i}>
              <Card sx={{ position: "relative" }}>
                <CardMedia
                  component="img"
                  height={140}
                  image={preview.url}
                  alt={`Reference ${i + 1}`}
                  sx={{ objectFit: "cover" }}
                />
                <IconButton
                  size="small"
                  onClick={() => removeImage(i)}
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
                {preview.isExisting && (
                  <Box
                    sx={{
                      position: "absolute",
                      bottom: 0,
                      left: 0,
                      right: 0,
                      bgcolor: "rgba(0, 0, 0, 0.6)",
                      color: "white",
                      fontSize: "0.75rem",
                      padding: "2px 8px",
                      textAlign: "center"
                    }}
                  >
                    Existing
                  </Box>
                )}
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
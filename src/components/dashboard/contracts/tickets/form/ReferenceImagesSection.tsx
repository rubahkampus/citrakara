// src/components/dashboard/contracts/tickets/form/ReferenceImagesSection.tsx

import React, { useState, useEffect } from "react";
import { useFormContext, useController } from "react-hook-form";
import {
  Box,
  Typography,
  Paper,
  Divider,
  Button,
  IconButton,
  Grid,
  Card,
  CardMedia,
  Tooltip,
  Alert,
  FormControlLabel,
  Switch,
} from "@mui/material";
import {
  CloudUpload as CloudUploadIcon,
  Delete as DeleteIcon,
} from "@mui/icons-material";
import { IContract } from "@/lib/db/models/contract.model";
import { ChangeTicketFormValues } from "../ChangeTicketForm";

interface ReferenceImagesSectionProps {
  contract: IContract;
  disabled: boolean;
}

const MAX_FILES = 5;

// Unified type for handling both existing images and new files
type ImageItem = {
  id: string;
  url: string;
  file?: File;
  isExisting: boolean;
};

export default function ReferenceImagesSection({
  contract,
  disabled,
}: ReferenceImagesSectionProps) {
  const { control, setValue } = useFormContext<ChangeTicketFormValues>();

  // Local state for toggle to ensure reliable UI control
  const [includeReferenceImages, setIncludeReferenceImages] = useState(false);

  // Use controller to properly handle form state
  const { field } = useController({
    name: "referenceImages",
    control,
    defaultValue: [],
  });

  // Get latest contract terms for current reference images
  const latestTerms = contract.contractTerms[contract.contractTerms.length - 1];
  const currentReferenceImages = latestTerms.referenceImages || [];

  // Single source of truth for all images (both existing and new)
  const [imageItems, setImageItems] = useState<ImageItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Initialize on component mount
  useEffect(() => {
    // Initialize the toggle state in form
    setValue("includeReferenceImages", false, { shouldValidate: false });

    // Convert existing images from contract to ImageItems
    if (currentReferenceImages && currentReferenceImages.length > 0) {
      const existingImageItems = currentReferenceImages.map((url, index) => ({
        id: `existing-${index}`,
        url: url as string,
        isExisting: true,
      }));

      setImageItems(existingImageItems);
    }
  }, [currentReferenceImages, setValue]);

  // Update form value when imageItems change
  useEffect(() => {
    // Only update form values if toggle is on
    if (!includeReferenceImages) return;

    // For form submission, we need to include both new files and existing URLs
    const files = imageItems
      .filter((item) => !item.isExisting && item.file)
      .map((item) => item.file as File);

    const existingUrls = imageItems
      .filter((item) => item.isExisting)
      .map((item) => item.url);

    // Set form value
    setValue("referenceImages", [...existingUrls, ...files], {
      shouldValidate: true,
    });

    // Cleanup blob URLs on unmount
    return () => {
      imageItems.forEach((item) => {
        if (!item.isExisting && item.url.startsWith("blob:")) {
          URL.revokeObjectURL(item.url);
        }
      });
    };
  }, [imageItems, setValue, includeReferenceImages]);

  // Toggle handler for include reference images
  const handleIncludeReferenceImages = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const newValue = e.target.checked;
    setIncludeReferenceImages(newValue);
    setValue("includeReferenceImages", newValue, { shouldValidate: true });
  };

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList) return;

    setError(null);

    // Check remaining slots
    const remainingSlots = MAX_FILES - imageItems.length;
    if (remainingSlots <= 0) {
      setError(`You can only upload a maximum of ${MAX_FILES} images.`);
      return;
    }

    // Filter for images and limit to available slots
    const newFiles = Array.from(fileList)
      .filter((file) => file.type.startsWith("image/"))
      .slice(0, remainingSlots);

    if (newFiles.length === 0) return;

    // Check file sizes (5MB max)
    const MAX_SIZE = 5 * 1024 * 1024; // 5MB
    const oversizedFiles = newFiles.filter((file) => file.size > MAX_SIZE);

    if (oversizedFiles.length > 0) {
      setError(
        `Some files exceed the 5MB size limit. Please resize and try again.`
      );
      return;
    }

    // Create new ImageItems
    const newImageItems = newFiles.map((file) => ({
      id: `new-${Math.random().toString(36).substr(2, 9)}`,
      url: URL.createObjectURL(file),
      file,
      isExisting: false,
    }));

    // Add to existing items
    setImageItems((prev) => [...prev, ...newImageItems]);

    // Reset file input
    e.target.value = "";
  };

  const removeImage = (idToRemove: string) => {
    setImageItems((prev) => {
      const itemToRemove = prev.find((item) => item.id === idToRemove);

      // Revoke object URL if it's a blob
      if (
        itemToRemove &&
        !itemToRemove.isExisting &&
        itemToRemove.url.startsWith("blob:")
      ) {
        URL.revokeObjectURL(itemToRemove.url);
      }

      return prev.filter((item) => item.id !== idToRemove);
    });
  };

  // Check if reference images changes are allowed
  const isReferenceImagesChangeAllowed =
    contract.proposalSnapshot.listingSnapshot?.changeable?.includes(
      "referenceImages"
    );

  return (
    <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
        }}
      >
        <Typography variant="h6" color="primary" fontWeight="medium">
          Reference Images
        </Typography>
        <FormControlLabel
          control={
            <Switch
              checked={includeReferenceImages}
              onChange={handleIncludeReferenceImages}
              disabled={disabled}
            />
          }
          label="Include changes"
          sx={{ mr: 0 }}
        />
      </Box>
      <Divider sx={{ mb: 3 }} />

      {includeReferenceImages ? (
        <Box>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Upload up to {MAX_FILES} reference images to help the artist
            understand your vision.
            {!isReferenceImagesChangeAllowed &&
              " (Your contract does not specify this as changeable, but it's generally acceptable to provide additional references.)"}
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Button
            variant="outlined"
            component="label"
            startIcon={<CloudUploadIcon />}
            fullWidth
            disabled={disabled || imageItems.length >= MAX_FILES}
            sx={{ mb: 3 }}
          >
            {imageItems.length === 0 ? "Upload Images" : "Upload More Images"} (
            {imageItems.length}/{MAX_FILES})
            <input
              type="file"
              hidden
              multiple
              accept="image/*"
              onChange={handleFiles}
              disabled={disabled}
            />
          </Button>

          {imageItems.length > 0 ? (
            <Grid container spacing={2}>
              {imageItems.map((item) => (
                <Grid item xs={6} sm={4} md={3} key={item.id}>
                  <Card sx={{ position: "relative" }}>
                    <CardMedia
                      component="img"
                      height={140}
                      image={item.url}
                      alt="Reference image"
                      sx={{ objectFit: "cover" }}
                    />
                    {!disabled && (
                      <IconButton
                        size="small"
                        onClick={() => removeImage(item.id)}
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
                    )}
                    {item.isExisting && (
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
                          textAlign: "center",
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
        </Box>
      ) : (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ fontStyle: "italic", mt: 2 }}
        >
          Switch the toggle to include changes to reference images.
        </Typography>
      )}
    </Paper>
  );
}

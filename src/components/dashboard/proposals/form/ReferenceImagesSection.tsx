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

// Constants
const MAX_FILES = 5;

// Indonesian text translations
const TEXT = {
  REFERENCE_IMAGES: "Gambar Referensi",
  UPLOAD_DESCRIPTION: `Unggah hingga ${MAX_FILES} gambar referensi untuk membantu mengilustrasikan komisi Anda`,
  UPLOAD_IMAGES: "Unggah Gambar",
  UPLOAD_MORE_IMAGES: "Unggah Lebih Banyak Gambar",
  NO_IMAGES: "Belum ada gambar referensi yang diunggah",
  EXISTING: "Sudah Ada",
};

// Unified type for handling both existing images and new files
type ImageItem = {
  id: string;
  url: string;
  file?: File;
  isExisting: boolean;
};

export default function ReferenceImagesSection() {
  const { control, setValue, getValues } = useFormContext<ProposalFormValues>();
  const { field } = useController({
    name: "referenceImages",
    control,
    defaultValue: [],
  });

  // Single source of truth for all images (both existing and new)
  const [imageItems, setImageItems] = useState<ImageItem[]>([]);
  const [isEditMode, setIsEditMode] = useState(false);

  // Initialize on component mount
  useEffect(() => {
    initializeImages();
  }, []);

  // Initialize existing images if in edit mode
  const initializeImages = () => {
    const formValues = getValues();

    if (formValues.id) {
      setIsEditMode(true);

      // Get existing images from initial data
      const initialData = formValues as unknown as IProposal;

      if (
        initialData.referenceImages &&
        Array.isArray(initialData.referenceImages)
      ) {
        // Convert existing URL strings to ImageItems
        const existingImageItems = initialData.referenceImages
          .filter((url): url is string => typeof url === "string")
          .map((url, index) => ({
            id: `existing-${index}`,
            url,
            isExisting: true,
          }));

        setImageItems(existingImageItems);
      }
    }
  };

  // Update form value when imageItems change
  useEffect(() => {
    updateFormValues();

    // Cleanup blob URLs on unmount
    return () => {
      cleanupBlobUrls();
    };
  }, [imageItems]);

  // Update form values based on current image items
  const updateFormValues = () => {
    // For form submission, we need:
    // 1. New files as File objects
    // 2. Existing images as URLs (strings)

    const files = imageItems
      .filter((item) => !item.isExisting && item.file)
      .map((item) => item.file as File);

    const existingUrls = imageItems
      .filter((item) => item.isExisting)
      .map((item) => item.url);

    // In edit mode, we need to keep track of both new files and existing URLs
    if (isEditMode) {
      setValue("referenceImages", [...existingUrls, ...files]);
    } else {
      // In create mode, we only need the files
      setValue("referenceImages", files);
    }
  };

  // Cleanup blob URLs
  const cleanupBlobUrls = () => {
    imageItems.forEach((item) => {
      if (!item.isExisting && item.url.startsWith("blob:")) {
        URL.revokeObjectURL(item.url);
      }
    });
  };

  // Handle file uploads
  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList) return;

    // Check remaining slots
    const remainingSlots = MAX_FILES - imageItems.length;
    if (remainingSlots <= 0) return;

    // Filter for images and limit to available slots
    const newFiles = Array.from(fileList)
      .filter((file) => file.type.startsWith("image/"))
      .slice(0, remainingSlots);

    if (newFiles.length === 0) return;

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

  // Remove an image
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

  // Render upload button
  const renderUploadButton = () => (
    <Button
      variant="outlined"
      component="label"
      startIcon={<CloudUploadIcon />}
      fullWidth
      disabled={imageItems.length >= MAX_FILES}
      sx={{
        mb: 3,
        py: 1.5,
        borderRadius: 2,
        borderWidth: 2,
        "&:hover": {
          borderWidth: 2,
        },
      }}
    >
      {imageItems.length === 0 ? TEXT.UPLOAD_IMAGES : TEXT.UPLOAD_MORE_IMAGES} (
      {imageItems.length}/{MAX_FILES})
      <input
        type="file"
        hidden
        multiple
        accept="image/*"
        onChange={handleFiles}
      />
    </Button>
  );

  // Render image grid
  const renderImageGrid = () => (
    <Grid container spacing={2}>
      {imageItems.map((item) => (
        <Grid item xs={6} sm={4} md={3} key={item.id}>
          <Card
            sx={{
              position: "relative",
              overflow: "hidden",
              borderRadius: 2,
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              transition: "transform 0.2s ease-in-out",
              "&:hover": {
                transform: "translateY(-4px)",
                boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
              },
            }}
          >
            <CardMedia
              component="img"
              height={140}
              image={item.url}
              alt="Reference image"
              sx={{ objectFit: "cover" }}
            />
            <IconButton
              size="small"
              onClick={() => removeImage(item.id)}
              sx={{
                position: "absolute",
                top: 8,
                right: 8,
                bgcolor: "rgba(255, 255, 255, 0.9)",
                "&:hover": {
                  bgcolor: "rgba(255, 255, 255, 1)",
                  color: "error.main",
                },
                transition: "all 0.2s ease",
              }}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
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
                {TEXT.EXISTING}
              </Box>
            )}
          </Card>
        </Grid>
      ))}
    </Grid>
  );

  // Render empty state
  const renderEmptyState = () => (
    <Box
      sx={{
        p: 3,
        border: "2px dashed",
        borderColor: "divider",
        borderRadius: 2,
        textAlign: "center",
        bgcolor: "background.default",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "140px",
      }}
    >
      <CloudUploadIcon sx={{ fontSize: 40, color: "text.disabled", mb: 1 }} />
      <Typography color="text.secondary">{TEXT.NO_IMAGES}</Typography>
    </Box>
  );

  return (
    <Paper
      sx={{
        p: 3,
        mb: 3,
        borderRadius: 2,
        boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
      }}
    >
      <Typography
        variant="h6"
        gutterBottom
        sx={{
          fontWeight: 600,
          display: "flex",
          alignItems: "center",
          mb: 1,
        }}
      >
        {TEXT.REFERENCE_IMAGES}
      </Typography>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {TEXT.UPLOAD_DESCRIPTION}
      </Typography>

      {renderUploadButton()}

      {imageItems.length > 0 ? renderImageGrid() : renderEmptyState()}
    </Paper>
  );
}

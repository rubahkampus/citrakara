"use client";
import React, { useRef, useState, useEffect } from "react";
import {
  Box,
  Grid,
  IconButton,
  Typography,
  Tooltip,
  Button,
  Card,
  CardMedia,
  CardActionArea,
  CardContent,
} from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import DeleteIcon from "@mui/icons-material/Delete";
import StarBorderIcon from "@mui/icons-material/StarBorder";
import StarIcon from "@mui/icons-material/Star";
import { useFormContext, useController } from "react-hook-form";
import { CommissionFormValues } from "../CommissionFormPage";

const MAX_FILES = 6;

const SamplesSection: React.FC = () => {
  const fileInput = useRef<HTMLInputElement | null>(null);
  const { control } = useFormContext<CommissionFormValues>();

  // useController for samples array
  const {
    field: { value: samples = [], onChange: setSamples },
  } = useController({ name: "samples", control, defaultValue: [] });

  // useController for thumbnail index
  const {
    field: { value: thumbnailIdx = 0, onChange: setThumbnail },
  } = useController({ name: "thumbnailIdx", control, defaultValue: 0 });

  const [previews, setPreviews] = useState<string[]>([]);

  // generate previews
  useEffect(() => {
    const urls = samples.map((s) =>
      typeof s === "string" ? s : URL.createObjectURL(s)
    );
    setPreviews(urls);
    return () => {
      urls
        .filter((u) => u.startsWith("blob:"))
        .forEach((u) => URL.revokeObjectURL(u));
    };
  }, [samples]);

  // reset thumbnail if out of bounds
  useEffect(() => {
    if (samples.length && thumbnailIdx >= samples.length) {
      setThumbnail(0);
    }
  }, [samples.length, thumbnailIdx, setThumbnail]);

  // handle file input
  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const imgFiles = Array.from(files)
      .filter((f) => f.type.startsWith("image/"))
      .slice(0, MAX_FILES - samples.length);
    if (imgFiles.length === 0) return;
    setSamples([...samples, ...imgFiles]);
    if (samples.length === 0) {
      setThumbnail(0);
    }
    e.target.value = "";
  };

  const removeSample = (idx: number) => {
    const newSamples = samples.filter((_, i) => i !== idx);
    setSamples(newSamples);
    if (idx === thumbnailIdx) {
      setThumbnail(0);
    } else if (idx < thumbnailIdx) {
      setThumbnail(thumbnailIdx - 1);
    }
  };

  const pickThumbnail = (idx: number) => setThumbnail(idx);

  return (
    <Box sx={{ mb: 3, p: 2, border: "1px solid #e0e0e0", borderRadius: 1 }}>
      <Typography variant="h6" fontWeight="bold" gutterBottom>
        Samples & Thumbnail
      </Typography>
      {/* hidden file input */}
      <input
        type="file"
        multiple
        accept="image/*"
        style={{ display: "none" }}
        ref={fileInput}
        onChange={handleFiles}
      />

      <Box sx={{ mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
        <Button
          variant="contained"
          component="label" // Make the button behave like a label for the input
          startIcon={<CloudUploadIcon />}
          disabled={samples.length >= MAX_FILES}
        >
          {samples.length ? "Add More Samples" : "Upload Samples"}
          <input
            type="file"
            multiple
            accept="image/*"
            hidden
            onChange={handleFiles}
          />
        </Button>
        <Typography variant="body2" color="text.secondary">
          {samples.length}/{MAX_FILES} Images
        </Typography>
      </Box>

      <Grid container spacing={2}>
        {previews.map((src, i) => (
          <Grid item xs={6} sm={4} md={3} lg={2} key={i}>
            <Card sx={{ position: "relative" }}>
              <CardActionArea onClick={() => pickThumbnail(i)}>
                <CardMedia
                  component="img"
                  height={120}
                  image={src}
                  alt={`Sample ${i + 1}`}
                  sx={{ objectFit: "cover" }}
                />
              </CardActionArea>
              <CardContent
                sx={{
                  display: "flex",
                  flexDirection: "column", // Stack items vertically
                  justifyContent: "space-between",
                  alignItems: "center",
                  pt: 1,
                  pb: 1,
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    width: "100%",
                  }}
                >
                  <Tooltip
                    title={
                      i === thumbnailIdx
                        ? "Current Thumbnail"
                        : "Set as Thumbnail"
                    }
                  >
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        pickThumbnail(i);
                      }}
                      aria-label="set as thumbnail"
                    >
                      {i === thumbnailIdx ? (
                        <StarIcon fontSize="small" color="warning" />
                      ) : (
                        <StarBorderIcon fontSize="small" />
                      )}
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Remove Sample">
                    <IconButton
                      size="small"
                      color="error"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeSample(i);
                      }}
                      aria-label="remove sample"
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ mt: 1, mb: -2 }}
                >
                  {i === thumbnailIdx ? "Thumbnail" : ""}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default SamplesSection;

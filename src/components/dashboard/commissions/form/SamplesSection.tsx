"use client";

import React, { useRef, useEffect } from "react";
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

// Constants
const MAX_FILES = 6;

// Component for rendering a single sample card
type SampleCardProps = {
  src: string;
  index: number;
  isThumbnail: boolean;
  onSetThumbnail: (index: number) => void;
  onRemove: (index: number) => void;
};

const SampleCard: React.FC<SampleCardProps> = ({
  src,
  index,
  isThumbnail,
  onSetThumbnail,
  onRemove,
}) => (
  <Card sx={{ position: "relative", height: "100%", minWidth: "150px" }}>
    <CardActionArea onClick={() => onSetThumbnail(index)}>
      <CardMedia
        component="img"
        height={140}
        image={src}
        alt={`Sampel ${index + 1}`}
        sx={{
          objectFit: "cover",
          transition: "all 0.2s",
          "&:hover": {
            filter: "brightness(1.1)",
          },
        }}
      />
    </CardActionArea>
    <CardContent
      sx={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        alignItems: "center",
        p: 1,
      }}
    >
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          gap: 6,
          alignItems: "center",
          width: "100%",
        }}
      >
        <Tooltip
          title={isThumbnail ? "Thumbnail Saat Ini" : "Jadikan Thumbnail"}
        >
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              onSetThumbnail(index);
            }}
            aria-label="jadikan thumbnail"
            color={isThumbnail ? "warning" : "default"}
          >
            {isThumbnail ? (
              <StarIcon fontSize="small" />
            ) : (
              <StarBorderIcon fontSize="small" />
            )}
          </IconButton>
        </Tooltip>
        <Tooltip title="Hapus Sampel">
          <IconButton
            size="small"
            color="error"
            onClick={(e) => {
              e.stopPropagation();
              onRemove(index);
            }}
            aria-label="hapus sampel"
            sx={{
              "&:hover": {
                backgroundColor: "rgba(211, 47, 47, 0.1)",
              },
            }}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
      {isThumbnail && (
        <Typography
          variant="caption"
          color="primary"
          fontWeight="medium"
          sx={{ mt: 1, mb: -1 }}
        >
          Thumbnail
        </Typography>
      )}
    </CardContent>
  </Card>
);

const SamplesSection: React.FC = () => {
  const fileInput = useRef<HTMLInputElement | null>(null);
  const { control } = useFormContext<CommissionFormValues>();

  // Form controllers
  const {
    field: { value: samples = [], onChange: setSamples },
  } = useController({ name: "samples", control, defaultValue: [] });

  const {
    field: { value: thumbnailIdx = 0, onChange: setThumbnail },
  } = useController({ name: "thumbnailIdx", control, defaultValue: 0 });

  // Generate previews from uploaded files
  const previews = samples.map((s) =>
    typeof s === "string" ? s : URL.createObjectURL(s)
  );

  // Clean up blob URLs when component unmounts or samples change
  useEffect(() => {
    return () => {
      previews.forEach((url, i) => {
        if (typeof samples[i] !== "string" && url.startsWith("blob:")) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, [samples, previews]);

  // Reset thumbnail if necessary
  useEffect(() => {
    if (samples.length && thumbnailIdx >= samples.length) {
      setThumbnail(0);
    }
  }, [samples.length, thumbnailIdx, setThumbnail]);

  // File handlers
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

  return (
    <Box
      sx={{
        mb: 3,
        p: 3,
        pb: 5,
        border: "1px solid #e0e0e0",
        borderRadius: 2,
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)",
        transition: "box-shadow 0.3s ease",
        "&:hover": {
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
        },
      }}
    >
      <Typography variant="h5" fontWeight="bold" gutterBottom  mb={2}>
        Sampel & Thumbnail
      </Typography>

      <Box sx={{ mb: 3, display: "flex", alignItems: "center", gap: 2 }}>
        <Button
          variant="contained"
          startIcon={<CloudUploadIcon />}
          disabled={samples.length >= MAX_FILES}
          sx={{
            textTransform: "none",
            borderRadius: 1.5,
            px: 2,
            py: 1,
          }}
          component="label"
        >
          {samples.length ? "Tambah Sampel Lagi" : "Unggah Sampel"}
          <input
            type="file"
            multiple
            accept="image/*"
            hidden
            onChange={handleFiles}
          />
        </Button>
        <Typography
          variant="body2"
          color={samples.length >= MAX_FILES ? "error" : "text.secondary"}
          fontWeight={samples.length >= MAX_FILES ? "medium" : "normal"}
        >
          {samples.length}/{MAX_FILES} Gambar
        </Typography>
      </Box>

      {samples.length === 0 && (
        <Box
          sx={{
            p: 4,
            border: "2px dashed #e0e0e0",
            borderRadius: 2,
            textAlign: "center",
            backgroundColor: "rgba(0,0,0,0.02)",
          }}
        >
          <Typography color="text.secondary">
            Belum ada sampel yang diunggah
          </Typography>
        </Box>
      )}

      <Grid container spacing={2} gap={5}>
        {previews.map((src, i) => (
          <Grid item xs={6} sm={4} md={3} lg={2} key={i}>
            <SampleCard
              src={src}
              index={i}
              isThumbnail={i === thumbnailIdx}
              onSetThumbnail={setThumbnail}
              onRemove={removeSample}
            />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default SamplesSection;

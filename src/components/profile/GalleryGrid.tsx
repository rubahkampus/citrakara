// src/components/profile/GalleryGrid.tsx
"use client";

import { Box, Grid, Typography, useTheme } from "@mui/material";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { GalleryData } from "@/lib/stores";

// Types
interface GalleryGridProps {
  galleries: GalleryData[];
  username: string;
  setActiveGalleryId: (id: string) => void;
}

export default function GalleryGrid({
  galleries,
  username,
  setActiveGalleryId,
}: GalleryGridProps) {
  // Hooks
  const theme = useTheme();
  const router = useRouter();

  // UI Components
  const renderGalleryImage = (gallery: GalleryData) =>
    gallery.thumbnails.length > 0 ? (
      <Image
        src={gallery.thumbnails[0]}
        alt={gallery.name}
        layout="fill"
        objectFit="cover"
        unoptimized
      />
    ) : (
      <Box
        sx={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: theme.palette.divider,
        }}
      >
        <Typography variant="body2" color="text.secondary">
          Tidak Ada Gambar
        </Typography>
      </Box>
    );

  const renderGalleryInfo = (gallery: GalleryData) => (
    <Box
      sx={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        p: 1,
        background:
          "linear-gradient(0deg, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0) 100%)",
      }}
    >
      <Typography
        variant="body2"
        sx={{
          color: "white",
          fontWeight: "medium",
          fontSize: "0.875rem",
        }}
      >
        {gallery.name}
      </Typography>
      <Typography
        variant="caption"
        sx={{ color: "rgba(255,255,255,0.8)", fontSize: "0.75rem" }}
      >
        {gallery.postCount} {gallery.postCount === 1 ? "item" : "item"}
      </Typography>
    </Box>
  );

  const renderCommissionOverlay = (gallery: GalleryData) => {
    const isCommissionGallery =
      gallery._id === "g1" || gallery.name.toLowerCase() === "commissions";

    if (isCommissionGallery && gallery.postCount > 0) {
      return (
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            bgcolor: "rgba(0,0,0,0.6)",
            color: "white",
            borderRadius: 5,
            px: 1.5,
            py: 0.5,
            fontWeight: "bold",
            fontSize: "0.875rem",
          }}
        >
          +{gallery.postCount}
        </Box>
      );
    }

    return null;
  };

  // Main Render
  return (
    <Grid container spacing={2}>
      {galleries.map((gallery) => (
        <Grid item xs={6} sm={3} key={gallery._id}>
          <Box
            onClick={() => setActiveGalleryId(gallery._id)}
            sx={{
              position: "relative",
              paddingBottom: "100%", // 1:1 aspect
              overflow: "hidden",
              borderRadius: 1,
              cursor: "pointer",
              bgcolor: "background.paper",
              transition: "transform 0.15s, box-shadow 0.2s",
              "&:hover": {
                transform: "translateY(-2px)",
                boxShadow: 1,
              },
            }}
          >
            {renderGalleryImage(gallery)}
            {renderGalleryInfo(gallery)}
            {renderCommissionOverlay(gallery)}
          </Box>
        </Grid>
      ))}
    </Grid>
  );
}

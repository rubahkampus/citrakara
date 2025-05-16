// src/components/profile/GalleryPostGrid.tsx
"use client";

import { Box, Grid, Typography, useTheme } from "@mui/material";
import Image from "next/image";
import { useDialogStore } from "@/lib/stores";
import { GalleryPostData } from "@/lib/stores";

// Constants
const EMPTY_CONTAINER_HEIGHT = 120;
const LOADING_SKELETON_COUNT = 4;

// Types
interface GalleryPostGridProps {
  posts: GalleryPostData[];
  loading?: boolean;
}

export default function GalleryPostGrid({
  posts,
  loading = false,
}: GalleryPostGridProps) {
  // Hooks
  const theme = useTheme();
  const openDialog = useDialogStore((state) => state.open);

  // Helpers
  const sortByNewest = (postsToSort: GalleryPostData[]): GalleryPostData[] => {
    return [...postsToSort].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  };

  // Event handlers
  const handlePostClick = (post: GalleryPostData) => {
    openDialog("viewGalleryPost", post._id, post, false);
  };

  // UI Components
  const renderEmptyState = () => (
    <Box
      sx={{
        height: EMPTY_CONTAINER_HEIGHT,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "background.paper",
        border: "1px dashed",
        borderColor: "divider",
        borderRadius: 1,
      }}
    >
      <Typography color="text.secondary">
        Tidak ada karya ditemukan di galeri ini
      </Typography>
    </Box>
  );

  const renderLoadingSkeleton = () => (
    <Grid container spacing={2}>
      {Array.from({ length: LOADING_SKELETON_COUNT }).map((_, i) => (
        <Grid item xs={6} sm={3} key={i}>
          <Box
            sx={{
              pb: "100%",
              bgcolor: theme.palette.divider,
              borderRadius: 1,
            }}
          />
        </Grid>
      ))}
    </Grid>
  );

  const renderImagePlaceholder = () => (
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

  const renderPostImage = (post: GalleryPostData) =>
    post.images.length > 0 ? (
      <Image
        src={post.images[0]}
        alt={post.description || "Gambar galeri"}
        layout="fill"
        objectFit="cover"
        unoptimized
      />
    ) : (
      renderImagePlaceholder()
    );

  // Main Render
  if (!loading && posts.length === 0) {
    return renderEmptyState();
  }

  if (loading) {
    return renderLoadingSkeleton();
  }

  const sortedPosts = sortByNewest(posts);

  return (
    <Grid container spacing={2}>
      {sortedPosts.map((post) => (
        <Grid item xs={6} sm={3} key={post._id}>
          <Box
            onClick={() => handlePostClick(post)}
            sx={{
              position: "relative",
              paddingBottom: "100%", // Square aspect
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
            {renderPostImage(post)}
          </Box>
        </Grid>
      ))}
    </Grid>
  );
}

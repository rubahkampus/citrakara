// src/components/dialogs/GalleryPostDialog.tsx
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  IconButton,
  Box,
  Typography,
  useMediaQuery,
  useTheme,
  Slide,
  CircularProgress,
  Fade,
  Chip,
  Divider,
} from "@mui/material";
import {
  Close as CloseIcon,
  ArrowBack,
  ArrowForward,
  CalendarMonth,
} from "@mui/icons-material";
import { TransitionProps } from "@mui/material/transitions";
import Image from "next/image";
import React from "react";
import { axiosClient } from "@/lib/utils/axiosClient";

// Interface for gallery post
interface GalleryPost {
  _id: string;
  galleryId: string;
  userId: string;
  images: string[];
  description: string;
  createdAt: string;
  updatedAt: string;
}

const Transition = React.forwardRef(function Transition(
  props: TransitionProps & { children: React.ReactElement },
  ref: React.Ref<unknown>
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

interface GalleryPostDialogProps {
  open: boolean;
  onClose: () => void;
  postId?: string;
  mode?: "view" | "edit";
  isOwner?: boolean;
}

export default function GalleryPostDialog({
  open,
  onClose,
  postId,
  mode = "view",
  isOwner = false,
}: GalleryPostDialogProps) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("md"));
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  // State
  const [post, setPost] = useState<GalleryPost | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Fetch post data when dialog opens with a postId
  useEffect(() => {
    if (!postId || !open) return;

    const fetchPostDetails = async () => {
      try {
        setLoading(true);
        setError(null);
        setImageLoaded(false);

        const response = await axiosClient.get(`/api/gallery/post/${postId}`);
        setPost(response.data.post);
        setCurrentImageIndex(0);
      } catch (error: any) {
        console.error("Error fetching post details:", error);
        setError(error?.response?.data?.error || "Failed to load post details");
      } finally {
        setLoading(false);
      }
    };

    fetchPostDetails();
  }, [postId, open]);

  const handleClose = () => {
    onClose();
    setImageLoaded(false);
  };

  const handlePrev = () => {
    if (!post || post.images.length <= 1) return;
    setImageLoaded(false);
    setCurrentImageIndex((prev) =>
      prev === 0 ? post.images.length - 1 : prev - 1
    );
  };

  const handleNext = () => {
    if (!post || post.images.length <= 1) return;
    setImageLoaded(false);
    setCurrentImageIndex((prev) =>
      prev === post.images.length - 1 ? 0 : prev + 1
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullScreen={fullScreen}
      maxWidth="xl"
      TransitionComponent={Transition}
      PaperProps={{
        sx: {
          borderRadius: fullScreen ? 0 : 2,
          overflow: "hidden",
          bgcolor: "background.paper",
          maxHeight: "95vh",
          width: { lg: "90%" },
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.15)",
        },
      }}
    >
      <Box
        sx={{
          position: "absolute",
          top: 16,
          right: 16,
          zIndex: 10,
        }}
      >
        <IconButton
          onClick={handleClose}
          size="medium"
          sx={{
            bgcolor: "rgba(0,0,0,0.4)",
            color: "white",
            backdropFilter: "blur(4px)",
            transition: "all 0.2s ease",
            "&:hover": {
              bgcolor: "rgba(0,0,0,0.6)",
              transform: "scale(1.05)",
            },
          }}
        >
          <CloseIcon />
        </IconButton>
      </Box>

      <DialogContent
        sx={{
          p: 0,
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          height: fullScreen ? "100vh" : "auto",
        }}
      >
        {loading ? (
          <Box
            sx={{
              width: "100%",
              height: { xs: 350, sm: 450, md: 650 },
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              bgcolor: "black",
            }}
          >
            <CircularProgress size={40} sx={{ color: "white" }} />
            <Typography sx={{ color: "white", mt: 2, opacity: 0.8 }}>
              Loading gallery post...
            </Typography>
          </Box>
        ) : error ? (
          <Box
            sx={{
              width: "100%",
              height: { xs: 300, sm: 400, md: 550 },
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              bgcolor: "black",
              p: 3,
            }}
          >
            <Typography
              color="error"
              sx={{
                color: "white",
                textAlign: "center",
                maxWidth: "80%",
              }}
            >
              {error}
            </Typography>
          </Box>
        ) : post ? (
          <>
            {/* Image viewer */}
            <Box
              sx={{
                position: "relative",
                width: { xs: "100%", md: "70%" },
                height: { xs: 350, sm: 450, md: 650 },
                bgcolor: "#000",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
              }}
            >
              {post.images.length > 0 && (
                <>
                  {!imageLoaded && (
                    <CircularProgress
                      size={30}
                      sx={{
                        color: "white",
                        position: "absolute",
                        zIndex: 1,
                      }}
                    />
                  )}
                  <Fade in={imageLoaded} timeout={300}>
                    <Box
                      sx={{
                        height: "100%",
                        width: "100%",
                        position: "relative",
                      }}
                    >
                      <Image
                        src={post.images[currentImageIndex]}
                        alt={`Gallery image ${currentImageIndex + 1}`}
                        layout="fill"
                        objectFit="contain"
                        unoptimized={true}
                        onLoadingComplete={() => setImageLoaded(true)}
                      />
                    </Box>
                  </Fade>
                </>
              )}

              {/* Navigation arrows */}
              {post.images.length > 1 && imageLoaded && (
                <>
                  <IconButton
                    onClick={handlePrev}
                    size={isMobile ? "medium" : "large"}
                    sx={{
                      position: "absolute",
                      left: { xs: 8, sm: 16 },
                      bgcolor: "rgba(0,0,0,0.3)",
                      color: "white",
                      backdropFilter: "blur(4px)",
                      transition: "all 0.2s ease",
                      "&:hover": {
                        bgcolor: "rgba(0,0,0,0.5)",
                        transform: "scale(1.1)",
                      },
                    }}
                  >
                    <ArrowBack />
                  </IconButton>
                  <IconButton
                    onClick={handleNext}
                    size={isMobile ? "medium" : "large"}
                    sx={{
                      position: "absolute",
                      right: { xs: 8, sm: 16 },
                      bgcolor: "rgba(0,0,0,0.3)",
                      color: "white",
                      backdropFilter: "blur(4px)",
                      transition: "all 0.2s ease",
                      "&:hover": {
                        bgcolor: "rgba(0,0,0,0.5)",
                        transform: "scale(1.1)",
                      },
                    }}
                  >
                    <ArrowForward />
                  </IconButton>
                </>
              )}

              {/* Image counter */}
              {post.images.length > 1 && (
                <Chip
                  label={`${currentImageIndex + 1} / ${post.images.length}`}
                  size="small"
                  sx={{
                    position: "absolute",
                    bottom: 16,
                    right: 16,
                    bgcolor: "rgba(0,0,0,0.4)",
                    color: "white",
                    backdropFilter: "blur(4px)",
                    height: 28,
                    "& .MuiChip-label": {
                      px: 1.5,
                      py: 0.5,
                      fontSize: 13,
                      fontWeight: 500,
                    },
                  }}
                />
              )}
            </Box>

            {/* Image details */}
            <Box
              sx={{
                p: { xs: 3, md: 4 },
                width: { xs: "100%", md: "30%" },
                display: "flex",
                flexDirection: "column",
                gap: 3,
                overflow: "auto",
              }}
            >
              <Box>
                <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                  <CalendarMonth
                    sx={{ color: "text.secondary", fontSize: 18, mr: 1 }}
                  />
                  <Typography variant="body2" color="text.secondary">
                    {formatDate(post.createdAt)}
                  </Typography>
                </Box>

                <Divider sx={{ mb: 2 }} />

                <Typography
                  variant="body1"
                  sx={{
                    color: "text.primary",
                    lineHeight: 1.6,
                    whiteSpace: "pre-line",
                  }}
                >
                  {post.description || "No description provided"}
                </Typography>
              </Box>
            </Box>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

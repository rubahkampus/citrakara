// src/components/dashboard/galleries/DashboardGalleryDetailPage.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Typography,
  Grid,
  Paper,
  IconButton,
  Button,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  CardActions,
  Tooltip,
  Stack,
  Divider,
  Chip,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import {
  ArrowBack as ArrowBackIcon,
  Add as AddIcon,
  MoreVert as MoreVertIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Image as ImageIcon,
  Visibility as VisibilityIcon,
  CollectionsBookmark as GalleryIcon,
  CalendarToday as CalendarIcon,
} from "@mui/icons-material";
import { axiosClient } from "@/lib/utils/axiosClient";
import { KButton } from "@/components/KButton";
import { useDialogStore } from "@/lib/stores";

// Types
interface Gallery {
  _id: string;
  name: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

interface GalleryPost {
  _id: string;
  galleryId: string;
  userId: string;
  images: string[];
  description: string;
  createdAt: string;
  updatedAt: string;
}

interface DashboardGalleryDetailPageProps {
  username: string;
  gallery: Gallery;
  initialPosts: GalleryPost[];
}

// Component strings in Indonesian
const strings = {
  posts: "karya",
  addNewPost: "Tambah Karya Baru",
  loadError: "Gagal memuat karya. Silakan coba lagi.",
  deleteSuccess: "Karya berhasil dihapus",
  deleteError: "Gagal menghapus karya. Silakan coba lagi.",
  emptyGallery: "Galeri ini kosong. Unggah beberapa karya untuk memulai.",
  uploadArtwork: "Unggah Karya",
  noDescription: "Tidak ada deskripsi",
  viewPost: "Lihat Karya",
  editPost: "Edit Karya",
  deletePost: "Hapus Karya",
  deleteConfirmTitle: "Hapus Karya",
  deleteConfirmMessage:
    "Apakah Anda yakin ingin menghapus karya ini? Tindakan ini tidak dapat dibatalkan.",
  cancel: "Batal",
  delete: "Hapus",
  deleting: "Menghapus...",
  moreImages: "lainnya",
  backToGalleries: "Kembali ke galeri",
};

export default function DashboardGalleryDetailPage({
  username,
  gallery,
  initialPosts,
}: DashboardGalleryDetailPageProps) {
  const router = useRouter();
  const openDialog = useDialogStore((state) => state.open);

  // State
  const [posts, setPosts] = useState<GalleryPost[]>(initialPosts);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Dialog states
  const [dialogState, setDialogState] = useState({
    menu: {
      anchorEl: null as HTMLElement | null,
      activePostId: null as string | null,
    },
    delete: {
      open: false,
      loading: false,
    },
    postToModify: null as GalleryPost | null,
  });

  const isDefaultGallery =
    gallery.name === "General" || gallery.name === "Commissions";

  // Refresh posts data
  const refreshPosts = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axiosClient.get(
        `/api/gallery/${gallery._id}/posts`
      );
      setPosts(response.data.posts || []);
    } catch {
      setError(strings.loadError);
    } finally {
      setLoading(false);
    }
  };

  // Menu handlers
  // Method 1: Use useEffect to log state changes
  const handleMenuOpen = (
    e: React.MouseEvent<HTMLElement>,
    post: GalleryPost
  ) => {
    e.preventDefault();
    e.stopPropagation();
    setDialogState((prev) => ({
      ...prev,
      menu: {
        anchorEl: e.currentTarget,
        activePostId: post._id,
      },
      postToModify: post,
    }));
  };

  const handleMenuClose = () => {
    setDialogState((prev) => ({
      ...prev,
      menu: {
        anchorEl: null,
        activePostId: null,
      },
    }));
  };

  // Edit post via global dialog
  const handleEditClick = () => {
    if (dialogState.postToModify) {
      openDialog(
        "editGalleryPost",
        dialogState.postToModify._id,
        dialogState.postToModify,
        true
      );
    }
    handleMenuClose();
  };

  // Delete post dialog handlers
  const handleDeleteClick = () => {
    if (dialogState.postToModify) {
      setDialogState((prev) => ({
        ...prev,
        delete: {
          ...prev.delete,
          open: true,
        },
      }));
    }
    handleMenuClose();
  };

  const handleDeleteDialogClose = () => {
    setDialogState((prev) => ({
      ...prev,
      delete: {
        ...prev.delete,
        open: false,
      },
      postToModify: null,
    }));
  };

  const handleDeletePost = async () => {
    console.log(dialogState);
    if (!dialogState.postToModify) return;

    setDialogState((prev) => ({
      ...prev,
      delete: {
        ...prev.delete,
        loading: true,
      },
    }));

    setError(null);
    try {
      await axiosClient.delete(
        `/api/gallery/post/${dialogState.postToModify._id}`
      );
      setSuccess(strings.deleteSuccess);
      handleDeleteDialogClose();
      refreshPosts();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || strings.deleteError);
    } finally {
      setDialogState((prev) => ({
        ...prev,
        delete: {
          ...prev.delete,
          loading: false,
        },
      }));
    }
  };

  // Navigation handlers
  const handleViewPost = (post: GalleryPost) => {
    openDialog("viewGalleryPost", post._id, post, true);
  };

  const handleGoBack = () => {
    router.push(`/${username}/dashboard/galleries`);
  };

  const handleUploadClick = () => {
    openDialog("uploadArtwork", gallery._id);
  };

  // Format date to locale string
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("id-ID", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Render post card
  const renderPostCard = (post: GalleryPost) => (
    <Card
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        borderRadius: 2,
        overflow: "hidden",
        transition: "transform 0.2s ease, box-shadow 0.2s ease",
        "&:hover": {
          transform: "translateY(-4px)",
          boxShadow: 4,
        },
      }}
      elevation={2}
    >
      <Box sx={{ position: "relative" }}>
        <Tooltip title="Opsi">
          <IconButton
            sx={{
              position: "absolute",
              top: 8,
              right: 8,
              zIndex: 2,
              bgcolor: "rgba(255,255,255,0.9)",
              color: "text.primary",
              boxShadow: 1,
              "&:hover": { bgcolor: "rgba(255,255,255,1)" },
              padding: 1, // Increase padding to make it more clickable
            }}
            onClick={(e) => handleMenuOpen(e, post)}
            size="small"
          >
            <MoreVertIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Box
          onClick={() => handleViewPost(post)}
          sx={{
            height: 220,
            backgroundImage: `url(${post.images[0] || ""})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            cursor: "pointer",
            position: "relative",
            boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.05)",
          }}
        >
          {post.images.length > 1 && (
            <Chip
              label={`+${post.images.length - 1} ${strings.moreImages}`}
              size="small"
              sx={{
                position: "absolute",
                bottom: 8,
                right: 8,
                bgcolor: "rgba(0,0,0,0.7)",
                color: "white",
                fontSize: "0.7rem",
                height: 22,
              }}
            />
          )}
        </Box>
      </Box>
      <CardContent sx={{ flexGrow: 1, pb: 1 }}>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            overflow: "hidden",
            textOverflow: "ellipsis",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            minHeight: 40,
          }}
        >
          {post.description || <i>{strings.noDescription}</i>}
        </Typography>
        <Box sx={{ display: "flex", alignItems: "center", mt: 1, gap: 0.5 }}>
          <CalendarIcon sx={{ fontSize: 14, color: "text.secondary" }} />
          <Typography variant="caption" color="text.secondary">
            {formatDate(post.createdAt)}
          </Typography>
        </Box>
      </CardContent>
      <Box sx={{ mt: "auto" }}>
        <Divider />
        <CardActions>
          <Button
            size="small"
            onClick={() => handleViewPost(post)}
            startIcon={<VisibilityIcon fontSize="small" />}
          >
            {strings.viewPost}
          </Button>
        </CardActions>
      </Box>
    </Card>
  );

  // Empty state component
  const EmptyState = () => (
    <Paper
      sx={{
        p: 4,
        textAlign: "center",
        borderRadius: 2,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        py: 8,
      }}
      elevation={2}
    >
      <ImageIcon sx={{ fontSize: 60, color: "text.secondary", mb: 2 }} />
      <Typography variant="body1" color="text.secondary" gutterBottom>
        {strings.emptyGallery}
      </Typography>
      <Button
        variant="contained"
        startIcon={<AddIcon />}
        onClick={handleUploadClick}
        sx={{ mt: 2 }}
      >
        {strings.uploadArtwork}
      </Button>
    </Paper>
  );

  return (
    <Box maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <Tooltip title={strings.backToGalleries}>
            <IconButton
              onClick={handleGoBack}
              sx={{
                mr: 3,
                bgcolor: "background.paper",
                boxShadow: 1,
                "&:hover": { bgcolor: "background.paper", opacity: 0.9 },
              }}
              size="small"
            >
              <ArrowBackIcon />
            </IconButton>
          </Tooltip>
          <Stack direction="row" spacing={2} alignItems="center">
            <GalleryIcon color="primary"/>
            <Box>
              <Typography variant="h5" fontWeight="bold">
                {gallery.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {posts.length}{" "}
                {posts.length === 1 ? strings.posts : strings.posts}
              </Typography>
            </Box>
          </Stack>
        </Box>
        <Tooltip title={strings.addNewPost}>
          <KButton startIcon={<AddIcon />} onClick={handleUploadClick}>
            {strings.addNewPost}
          </KButton>
        </Tooltip>
      </Box>

      {/* Status alerts */}
      {error && (
        <Alert
          severity="error"
          sx={{ mb: 3 }}
          onClose={() => setError(null)}
          variant="filled"
        >
          {error}
        </Alert>
      )}
      {success && (
        <Alert
          severity="success"
          sx={{ mb: 3 }}
          onClose={() => setSuccess(null)}
          variant="filled"
        >
          {success}
        </Alert>
      )}

      {/* Posts grid */}
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress />
        </Box>
      ) : posts.length === 0 ? (
        <EmptyState />
      ) : (
        <Grid container spacing={3}>
          {posts.map((post) => (
            <Grid item xs={12} sm={6} md={4} key={post._id}>
              {renderPostCard(post)}
            </Grid>
          ))}
        </Grid>
      )}

      {/* Post action menu */}
      <Menu
        anchorEl={dialogState.menu.anchorEl}
        open={Boolean(dialogState.menu.anchorEl)}
        onClose={handleMenuClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        elevation={3}
        MenuListProps={{ dense: false }}
        slotProps={{ paper: { elevation: 4 } }}
        sx={{ mt: 0.5 }}
      >
        {dialogState.postToModify
          ? [
              // View post option - always available
              <MenuItem
                key="view"
                onClick={() =>
                  dialogState.postToModify &&
                  handleViewPost(dialogState.postToModify)
                }
                sx={{ minWidth: 140 }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <VisibilityIcon fontSize="small" />
                  <Typography variant="body2">{strings.viewPost}</Typography>
                </Box>
              </MenuItem>,

              // // Edit option - only for non-default galleries
              // !isDefaultGallery && (
              //   <MenuItem
              //     key="edit"
              //     onClick={handleEditClick}
              //     sx={{ minWidth: 140 }}
              //   >
              //     <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              //       <EditIcon fontSize="small" />
              //       <Typography variant="body2">{strings.editPost}</Typography>
              //     </Box>
              //   </MenuItem>
              // ),

              // Delete option - only for non-default galleries
              !isDefaultGallery && (
                <MenuItem
                  key="delete"
                  onClick={handleDeleteClick}
                  sx={{ color: "error.main" }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <DeleteIcon fontSize="small" />
                    <Typography variant="body2">
                      {strings.deletePost}
                    </Typography>
                  </Box>
                </MenuItem>
              ),
            ].filter(Boolean)
          : null}
      </Menu>

      {/* Delete confirmation dialog */}
      <Dialog
        open={dialogState.delete.open}
        onClose={handleDeleteDialogClose}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 2 },
          elevation: 4,
        }}
      >
        <DialogTitle>{strings.deleteConfirmTitle}</DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            {strings.deleteConfirmMessage}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={handleDeleteDialogClose}
            disabled={dialogState.delete.loading}
          >
            {strings.cancel}
          </Button>
          <Button
            onClick={handleDeletePost}
            variant="contained"
            color="error"
            disabled={dialogState.delete.loading}
          >
            {dialogState.delete.loading ? strings.deleting : strings.delete}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

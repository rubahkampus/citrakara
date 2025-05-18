// src/components/dashboard/galleries/DashboardGalleryPage.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Typography,
  Paper,
  Button,
  Grid,
  CircularProgress,
  Alert,
  IconButton,
  Card,
  CardContent,
  CardActions,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Divider,
  Tooltip,
  Stack,
  Breadcrumbs,
  Link,
} from "@mui/material";
import {
  Add as AddIcon,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Image as ImageIcon,
  CollectionsBookmark as GalleryIcon,
  PictureAsPdfRounded,
  Home,
  NavigateNext,
  Image,
  ArrowBack,
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

interface GalleryWithStats extends Gallery {
  postCount: number;
  thumbnails: string[];
}

interface DashboardGalleryPageProps {
  username: string;
  initialGalleries: Gallery[];
}

// Component strings in Indonesian
const strings = {
  uploadArt: "Unggah Karya",
  newGallery: "Galeri Baru",
  loadError: "Gagal memuat galeri. Silakan coba lagi.",
  createSuccess: "Galeri berhasil dibuat",
  renameSuccess: "Galeri berhasil diubah nama",
  deleteSuccess: "Galeri berhasil dihapus",
  createFailed: "Gagal membuat galeri",
  renameFailed: "Gagal mengubah nama",
  deleteFailed: "Gagal menghapus",
  noGalleries: "Anda belum memiliki galeri.",
  createFirstGallery: "Buat Galeri Pertama Anda",
  noImages: "Belum ada gambar",
  posts: "karya",
  viewGallery: "Lihat Galeri",
  rename: "Ubah Nama",
  delete: "Hapus",
  createDialogTitle: "Buat Galeri Baru",
  galleryNameLabel: "Nama Galeri",
  cancel: "Batal",
  create: "Buat",
  creating: "Membuat...",
  renameDialogTitle: "Ubah Nama Galeri",
  save: "Simpan",
  saving: "Menyimpan...",
  deleteDialogTitle: "Hapus Galeri",
  deleteConfirmation: "Apakah Anda yakin? Tindakan ini tidak dapat dibatalkan.",
  deleting: "Menghapus...",
};

export default function DashboardGalleryPage({
  username,
  initialGalleries,
}: DashboardGalleryPageProps) {
  const router = useRouter();
  const openDialog = useDialogStore((state) => state.open);

  // State
  const [galleries, setGalleries] = useState<GalleryWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Dialog states
  const [dialogState, setDialogState] = useState({
    create: {
      open: false,
      name: "",
      loading: false,
    },
    edit: {
      open: false,
      id: null as string | null,
      name: "",
      loading: false,
    },
    delete: {
      open: false,
      loading: false,
    },
    menu: {
      anchorEl: null as HTMLElement | null,
      activeGalleryId: null as string | null,
    },
  });

  // Check if gallery is a default gallery (can't be edited/deleted)
  const isDefaultGallery = (name: string) =>
    name === "General" || name === "Commissions";

  // Fetch galleries with stats
  useEffect(() => {
    const loadGalleries = async () => {
      setLoading(true);
      setError(null);
      try {
        const enriched = await Promise.all(
          initialGalleries.map(async (g) => {
            try {
              const resp = await axiosClient.get(`/api/gallery/${g._id}/posts`);
              const posts = resp.data.posts || [];
              return {
                ...g,
                postCount: posts.length,
                thumbnails: posts
                  .slice(0, 4)
                  .map((p: any) => p.images[0] || ""),
              };
            } catch {
              return { ...g, postCount: 0, thumbnails: [] };
            }
          })
        );
        setGalleries(enriched);
      } catch {
        setError(strings.loadError);
      } finally {
        setLoading(false);
      }
    };
    loadGalleries();
  }, [initialGalleries]);

  // Refresh galleries
  const refreshGalleries = async () => {
    setLoading(true);
    setError(null);
    try {
      const resp = await axiosClient.get("/api/gallery");
      const data: Gallery[] = resp.data.galleries;
      const enriched = await Promise.all(
        data.map(async (g) => {
          try {
            const pr = await axiosClient.get(`/api/gallery/${g._id}/posts`);
            const posts = pr.data.posts || [];
            return {
              ...g,
              postCount: posts.length,
              thumbnails: posts.slice(0, 4).map((p: any) => p.images[0] || ""),
            };
          } catch {
            return { ...g, postCount: 0, thumbnails: [] };
          }
        })
      );
      setGalleries(enriched);
    } catch {
      setError(strings.loadError);
    } finally {
      setLoading(false);
    }
  };

  // Menu handlers
  const handleMenuOpen = (
    e: React.MouseEvent<HTMLElement>,
    galleryId: string
  ) => {
    // Prevent default and stop propagation
    e.preventDefault();
    e.stopPropagation();

    // Log for debugging
    console.log("Menu opened for gallery:", galleryId);

    // Update state with the anchor element
    setDialogState((prev) => ({
      ...prev,
      menu: {
        anchorEl: e.currentTarget,
        activeGalleryId: galleryId,
      },
    }));
  };

  const handleMenuClose = (
    event?: {},
    reason?: "backdropClick" | "escapeKeyDown"
  ) => {
    setDialogState((prev) => ({
      ...prev,
      menu: {
        anchorEl: null,
        activeGalleryId: null,
      },
    }));
  };

  // Create gallery handlers
  const handleCreateDialogOpen = () => {
    setDialogState((prev) => ({
      ...prev,
      create: {
        ...prev.create,
        open: true,
        name: "",
      },
    }));
  };

  const handleCreateDialogClose = () => {
    setDialogState((prev) => ({
      ...prev,
      create: {
        ...prev.create,
        open: false,
      },
    }));
  };

  const handleCreateGallery = async () => {
    const { name } = dialogState.create;
    if (!name.trim()) return;

    setDialogState((prev) => ({
      ...prev,
      create: {
        ...prev.create,
        loading: true,
      },
    }));

    setError(null);
    try {
      await axiosClient.post("/api/gallery", { name: name.trim() });
      setSuccess(strings.createSuccess);
      handleCreateDialogClose();
      refreshGalleries();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || strings.createFailed);
    } finally {
      setDialogState((prev) => ({
        ...prev,
        create: {
          ...prev.create,
          loading: false,
        },
      }));
    }
  };

  // Edit gallery handlers
  const handleEditClick = (g: GalleryWithStats) => {
    setDialogState((prev) => ({
      ...prev,
      edit: {
        open: true,
        id: g._id,
        name: g.name,
        loading: false,
      },
    }));
    handleMenuClose();
  };

  const handleEditDialogClose = () => {
    setDialogState((prev) => ({
      ...prev,
      edit: {
        ...prev.edit,
        open: false,
        id: null,
      },
    }));
  };

  const handleEditGallery = async () => {
    const { id, name } = dialogState.edit;
    if (!id || !name.trim()) return;

    setDialogState((prev) => ({
      ...prev,
      edit: {
        ...prev.edit,
        loading: true,
      },
    }));

    setError(null);
    try {
      await axiosClient.patch(`/api/gallery/${id}`, {
        name: name.trim(),
      });
      setSuccess(strings.renameSuccess);
      handleEditDialogClose();
      refreshGalleries();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || strings.renameFailed);
    } finally {
      setDialogState((prev) => ({
        ...prev,
        edit: {
          ...prev.edit,
          loading: false,
        },
      }));
    }
  };

  // Delete gallery handlers
  const handleDeleteClick = () => {
    setDialogState((prev) => ({
      ...prev,
      delete: {
        open: true,
        loading: false,
      },
    }));
    handleMenuClose();
  };

  const handleDeleteDialogClose = () => {
    setDialogState((prev) => ({
      ...prev,
      delete: {
        ...prev.delete,
        open: false,
      },
    }));
  };

  const handleDeleteGallery = async () => {
    const { activeGalleryId } = dialogState.menu;
    if (!activeGalleryId) return;

    setDialogState((prev) => ({
      ...prev,
      delete: {
        ...prev.delete,
        loading: true,
      },
    }));

    setError(null);
    try {
      await axiosClient.delete(`/api/gallery/${activeGalleryId}`);
      setSuccess(strings.deleteSuccess);
      handleDeleteDialogClose();
      refreshGalleries();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || strings.deleteFailed);
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
  const handleUploadClick = () =>
    openDialog("uploadArtwork", undefined, username);

  const handleViewGallery = (id: string) =>
    router.push(`/${username}/dashboard/galleries/${id}`);

  // Render gallery item
  const renderGalleryCard = (gallery: GalleryWithStats) => (
    <Card
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        borderRadius: 2,
        overflow: "visible",
        transition: "transform 0.2s ease, box-shadow 0.2s ease",
        "&:hover": {
          transform: "translateY(-4px)",
          boxShadow: 4,
        },
      }}
      elevation={2}
    >
      {/* Parent container with relative positioning */}
      <Box sx={{ position: "relative" }}>
        {/* Menu Button - positioned absolutely, not inside clickable area */}
        <Tooltip title="Opsi">
          <IconButton
            sx={{
              position: "absolute",
              top: 8,
              right: 8,
              zIndex: 100, // Increased z-index for better layering
              bgcolor: "rgba(255,255,255,0.9)",
              boxShadow: 2, // Increased shadow for better visibility
              "&:hover": { bgcolor: "rgba(255,255,255,1)" },
              padding: 1, // Increased padding for better clickability
              width: 32, // Explicit width
              height: 32, // Explicit height
            }}
            onClick={(e) => handleMenuOpen(e, gallery._id)}
            size="small"
          >
            <MoreVertIcon fontSize="small" />
          </IconButton>
        </Tooltip>

        {/* Clickable gallery content */}
        <Box
          onClick={() => handleViewGallery(gallery._id)}
          sx={{ cursor: "pointer" }}
        >
          <Box
            sx={{
              height: 180,
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 1,
              p: 1.5,
            }}
          >
            {gallery.thumbnails.length > 0 ? (
              gallery.thumbnails.slice(0, 4).map((thumbnail, index) => (
                <Box
                  key={index}
                  sx={{
                    height: 86,
                    backgroundImage: `url(${thumbnail})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    borderRadius: 1,
                    boxShadow: 1,
                  }}
                />
              ))
            ) : (
              <Box
                sx={{
                  gridColumn: "1 / span 2",
                  gridRow: "1 / span 2",
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  bgcolor: "action.hover",
                  borderRadius: 1,
                }}
              >
                <ImageIcon
                  sx={{ fontSize: 40, color: "text.secondary", mb: 1 }}
                />
                <Typography variant="body2" color="text.secondary">
                  {strings.noImages}
                </Typography>
              </Box>
            )}
          </Box>
          <CardContent>
            <Typography gutterBottom variant="h6" fontWeight="medium" noWrap>
              {gallery.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {gallery.postCount} {strings.posts}
            </Typography>
          </CardContent>
        </Box>
      </Box>

      <Box sx={{ mt: "auto" }}>
        <Divider />
        <CardActions>
          <Button
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              handleViewGallery(gallery._id);
            }}
            startIcon={<GalleryIcon fontSize="small" />}
          >
            {strings.viewGallery}
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
      <GalleryIcon sx={{ fontSize: 60, color: "text.secondary", mb: 2 }} />
      <Typography color="text.secondary" gutterBottom>
        {strings.noGalleries}
      </Typography>
      <Button
        variant="contained"
        startIcon={<AddIcon />}
        onClick={handleCreateDialogOpen}
        sx={{ mt: 2 }}
      >
        {strings.createFirstGallery}
      </Button>
    </Paper>
  );

  return (
    <Box maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box
        sx={{
          mb: 3,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <Breadcrumbs separator={<NavigateNext fontSize="small" />}>
            <Link
              component={Link}
              href={`/${username}/dashboard`}
              underline="hover"
              color="inherit"
              sx={{ display: "flex", alignItems: "center" }}
            >
              <Home fontSize="small" sx={{ mr: 0.5 }} />
              Dashboard
            </Link>
            <Typography
              color="text.primary"
              sx={{ display: "flex", alignItems: "center" }}
            >
              <Image fontSize="small" sx={{ mr: 0.5 }} />
              Galeri
            </Typography>
          </Breadcrumbs>

          <Box display="flex" alignItems="center" mt={4} ml={-0.5}>
            <Image sx={{ mr: 1, color: "primary.main", fontSize: 32 }} />
            <Typography variant="h4" fontWeight="bold">
              Galeri Saya
            </Typography>
          </Box>
        </Box>

        <Button
          component={Link}
          href={`/${username}/dashboard`}
          variant="outlined"
          startIcon={<ArrowBack />}
          size="small"
          sx={{ mt: 1 }}
        >
          Kembali ke Profil
        </Button>
      </Box>

      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          mb: 3,
          mt: 3,
          alignItems: "center",
        }}
      >
        <Stack direction="row" spacing={2}>
          <Tooltip title={strings.uploadArt}>
            <KButton
              variantType="secondary"
              startIcon={<AddIcon />}
              onClick={handleUploadClick}
            >
              {strings.uploadArt}
            </KButton>
          </Tooltip>
          <Tooltip title={strings.newGallery}>
            <KButton startIcon={<AddIcon />} onClick={handleCreateDialogOpen}>
              {strings.newGallery}
            </KButton>
          </Tooltip>
        </Stack>
      </Box>

      {/* Status alerts */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert
          severity="success"
          sx={{ mb: 3 }}
          onClose={() => setSuccess(null)}
        >
          {success}
        </Alert>
      )}

      {/* Gallery grid */}
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress />
        </Box>
      ) : galleries.length === 0 ? (
        <EmptyState />
      ) : (
        <Grid container spacing={3}>
          {galleries.map((gallery) => (
            <Grid item xs={12} sm={6} md={4} key={gallery._id}>
              {renderGalleryCard(gallery)}
            </Grid>
          ))}
        </Grid>
      )}

      {/* Gallery action menu */}
      <Menu
        anchorEl={dialogState.menu.anchorEl}
        open={Boolean(dialogState.menu.anchorEl)}
        onClose={handleMenuClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        elevation={3}
        // Add these additional props to ensure proper rendering:
        MenuListProps={{
          dense: false,
          sx: { minWidth: 150 }, // Ensure a minimum width
        }}
        // Add slotProps to increase the elevation and fix styling:
        slotProps={{
          paper: {
            elevation: 4,
            sx: {
              mt: 1, // Add some margin to separate from the button
              borderRadius: 1,
              boxShadow: 3,
            },
          },
        }}
        // Make sure onClick still stops propagation
        onClick={(e) => e.stopPropagation()}
      >
        {dialogState.menu.activeGalleryId &&
          !isDefaultGallery(
            galleries.find((x) => x._id === dialogState.menu.activeGalleryId)!
              .name
          ) && (
            <>
              <MenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  handleEditClick(
                    galleries.find(
                      (x) => x._id === dialogState.menu.activeGalleryId
                    )!
                  );
                }}
                sx={{ minWidth: 140, p: 1.5 }} // Add padding and min width
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                  <EditIcon fontSize="small" color="primary" />
                  <Typography variant="body2">{strings.rename}</Typography>
                </Box>
              </MenuItem>
              {galleries.find(
                (x) => x._id === dialogState.menu.activeGalleryId
              )!.postCount === 0 && (
                <MenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteClick();
                  }}
                  sx={{ color: "error.main", minWidth: 140, p: 1.5 }} // Add padding and min width
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                    <DeleteIcon fontSize="small" />
                    <Typography variant="body2">{strings.delete}</Typography>
                  </Box>
                </MenuItem>
              )}
            </>
          )}
      </Menu>

      {/* Create gallery dialog */}
      <Dialog
        open={dialogState.create.open}
        onClose={handleCreateDialogClose}
        fullWidth
        maxWidth="xs"
        PaperProps={{ elevation: 4 }}
      >
        <DialogTitle>{strings.createDialogTitle}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label={strings.galleryNameLabel}
            fullWidth
            variant="outlined"
            value={dialogState.create.name}
            onChange={(e) =>
              setDialogState((prev) => ({
                ...prev,
                create: {
                  ...prev.create,
                  name: e.target.value,
                },
              }))
            }
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={handleCreateDialogClose}
            disabled={dialogState.create.loading}
          >
            {strings.cancel}
          </Button>
          <Button
            onClick={handleCreateGallery}
            variant="contained"
            disabled={
              !dialogState.create.name.trim() || dialogState.create.loading
            }
          >
            {dialogState.create.loading ? strings.creating : strings.create}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit gallery dialog */}
      <Dialog
        open={dialogState.edit.open}
        onClose={handleEditDialogClose}
        fullWidth
        maxWidth="xs"
        PaperProps={{ elevation: 4 }}
      >
        <DialogTitle>{strings.renameDialogTitle}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label={strings.galleryNameLabel}
            fullWidth
            variant="outlined"
            value={dialogState.edit.name}
            onChange={(e) =>
              setDialogState((prev) => ({
                ...prev,
                edit: {
                  ...prev.edit,
                  name: e.target.value,
                },
              }))
            }
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={handleEditDialogClose}
            disabled={dialogState.edit.loading}
          >
            {strings.cancel}
          </Button>
          <Button
            onClick={handleEditGallery}
            variant="contained"
            disabled={!dialogState.edit.name.trim() || dialogState.edit.loading}
          >
            {dialogState.edit.loading ? strings.saving : strings.save}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete confirmation dialog */}
      <Dialog
        open={dialogState.delete.open}
        onClose={handleDeleteDialogClose}
        fullWidth
        maxWidth="xs"
        PaperProps={{ elevation: 4 }}
      >
        <DialogTitle>{strings.deleteDialogTitle}</DialogTitle>
        <DialogContent>
          <Typography>{strings.deleteConfirmation}</Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={handleDeleteDialogClose}
            disabled={dialogState.delete.loading}
          >
            {strings.cancel}
          </Button>
          <Button
            onClick={handleDeleteGallery}
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

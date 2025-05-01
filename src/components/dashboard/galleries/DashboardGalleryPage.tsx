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
  CardActionArea,
  CardActions,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Divider,
} from "@mui/material";
import {
  Add as AddIcon,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from "@mui/icons-material";
import { axiosClient } from "@/lib/utils/axiosClient";
import { KButton } from "@/components/KButton";
import { useDialogStore } from "@/lib/stores";

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

export default function DashboardGalleryPage({
  username,
  initialGalleries,
}: DashboardGalleryPageProps) {
  const router = useRouter();
  const openDialog = useDialogStore((state) => state.open);

  const [galleries, setGalleries] = useState<GalleryWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Create gallery dialog state
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newGalleryName, setNewGalleryName] = useState("");
  const [createLoading, setCreateLoading] = useState(false);

  // Edit gallery dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editGalleryId, setEditGalleryId] = useState<string | null>(null);
  const [editGalleryName, setEditGalleryName] = useState("");
  const [editLoading, setEditLoading] = useState(false);

  // Menu state for gallery actions
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [activeGalleryId, setActiveGalleryId] = useState<string | null>(null);

  // Delete confirmation dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const isDefaultGallery = (name: string) =>
    name === "General" || name === "Commissions";

  // Fetch galleries with stats
  useEffect(() => {
    const load = async () => {
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
        setError("Failed to load galleries. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    load();
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
      setError("Failed to refresh galleries. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Handlers
  const handleMenuOpen = (
    e: React.MouseEvent<HTMLElement>,
    galleryId: string
  ) => {
    e.stopPropagation();
    setMenuAnchorEl(e.currentTarget);
    setActiveGalleryId(galleryId);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
    setActiveGalleryId(null);
  };

  const handleCreateDialogOpen = () => {
    setNewGalleryName("");
    setCreateDialogOpen(true);
  };

  const handleCreateDialogClose = () => setCreateDialogOpen(false);
  const handleEditClick = (g: GalleryWithStats) => {
    setEditGalleryId(g._id);
    setEditGalleryName(g.name);
    setEditDialogOpen(true);
    handleMenuClose();
  };
  const handleEditDialogClose = () => {
    setEditDialogOpen(false);
    setEditGalleryId(null);
  };
  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
    handleMenuClose();
  };
  const handleDeleteDialogClose = () => setDeleteDialogOpen(false);

  const handleCreateGallery = async () => {
    if (!newGalleryName.trim()) return;
    setCreateLoading(true);
    setError(null);
    try {
      await axiosClient.post("/api/gallery", { name: newGalleryName.trim() });
      setSuccess("Gallery created");
      handleCreateDialogClose();
      refreshGalleries();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || "Create failed");
    } finally {
      setCreateLoading(false);
    }
  };

  const handleEditGallery = async () => {
    if (!editGalleryId || !editGalleryName.trim()) return;
    setEditLoading(true);
    setError(null);
    try {
      await axiosClient.patch(`/api/gallery/${editGalleryId}`, {
        name: editGalleryName.trim(),
      });
      setSuccess("Gallery renamed");
      handleEditDialogClose();
      refreshGalleries();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || "Rename failed");
    } finally {
      setEditLoading(false);
    }
  };

  const handleDeleteGallery = async () => {
    if (!activeGalleryId) return;
    setDeleteLoading(true);
    setError(null);
    try {
      await axiosClient.delete(`/api/gallery/${activeGalleryId}`);
      setSuccess("Gallery deleted");
      handleDeleteDialogClose();
      refreshGalleries();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || "Delete failed");
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleUploadClick = () =>
    openDialog("uploadArtwork", undefined, username);
  const handleViewGallery = (id: string) =>
    router.push(`/${username}/dashboard/galleries/${id}`);

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 3 }}>
        <Typography variant="h5" fontWeight="bold">
          My Galleries
        </Typography>
        <Box sx={{ display: "flex", gap: 2 }}>
          <KButton
            variantType="secondary"
            startIcon={<AddIcon />}
            onClick={handleUploadClick}
          >
            Upload Art
          </KButton>
          <KButton startIcon={<AddIcon />} onClick={handleCreateDialogOpen}>
            New Gallery
          </KButton>
        </Box>
      </Box>
      {/* Status */}
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
      {/* Galleries */}
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
          <CircularProgress />
        </Box>
      ) : galleries.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: "center", borderRadius: 2 }}>
          <Typography color="text.secondary">
            You don't have any galleries yet.
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreateDialogOpen}
            sx={{ mt: 2 }}
          >
            Create Your First Gallery
          </Button>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {galleries.map((g) => (
            <Grid item xs={12} sm={6} md={4} key={g._id}>
              <Card
                sx={{
                  position: "relative",
                  display: "flex",
                  flexDirection: "column",
                  borderRadius: 2,
                  transition: "transform 0.2s ease, box-shadow 0.2s ease",
                  "&:hover": {
                    transform: "translateY(-4px)",
                    boxShadow: 3,
                  },
                }}
              >
                <IconButton
                  sx={{ position: "absolute", top: 8, right: 8 }}
                  onClick={(e) => handleMenuOpen(e, g._id)}
                >
                  <MoreVertIcon />
                </IconButton>
                <CardActionArea
                  onClick={() => handleViewGallery(g._id)}
                  sx={{ flexGrow: 1 }}
                >
                  <Box
                    sx={{
                      height: 180,
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: 1,
                      p: 1,
                    }}
                  >
                    {g.thumbnails.length > 0 ? (
                      g.thumbnails.slice(0, 4).map((thumbnail, index) => (
                        <Box
                          key={index}
                          sx={{
                            height: 86,
                            backgroundImage: `url(${thumbnail})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            borderRadius: 1
                          }}
                        />
                      ))
                    ) : (
                      <Box
                        sx={{
                          gridColumn: '1 / span 2',
                          gridRow: '1 / span 2',
                          height: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          bgcolor: 'action.hover',
                          borderRadius: 1
                        }}
                      >
                        <Typography variant="body2" color="text.secondary">
                          No images yet
                        </Typography>
                      </Box>
                    )}
                  </Box>
                  <CardContent>
                    <Typography gutterBottom variant="h6" noWrap>
                      {g.name}
                    </Typography>
                    <Typography color="text.secondary">
                      {g.postCount} {g.postCount === 1 ? "post" : "posts"}
                    </Typography>
                  </CardContent>
                </CardActionArea>
                <Divider />
                <CardActions>
                  <Button size="small" onClick={() => handleViewGallery(g._id)}>
                    View Gallery
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
      {/* Action menu */}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleMenuClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
      >
        {activeGalleryId &&
          !isDefaultGallery(
            galleries.find((x) => x._id === activeGalleryId)!.name
          ) && (
            <>
              <MenuItem
                onClick={() =>
                  handleEditClick(
                    galleries.find((x) => x._id === activeGalleryId)!
                  )
                }
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <EditIcon fontSize="small" /> Rename
                </Box>
              </MenuItem>
              {galleries.find((x) => x._id === activeGalleryId)!.postCount ===
                0 && (
                <MenuItem
                  onClick={handleDeleteClick}
                  sx={{ color: "error.main" }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <DeleteIcon fontSize="small" /> Delete
                  </Box>
                </MenuItem>
              )}
            </>
          )}
      </Menu>
      {/* Create dialog */}
      <Dialog
        open={createDialogOpen}
        onClose={handleCreateDialogClose}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>Create New Gallery</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Gallery Name"
            fullWidth
            variant="outlined"
            value={newGalleryName}
            onChange={(e) => setNewGalleryName(e.target.value)}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleCreateDialogClose} disabled={createLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleCreateGallery}
            variant="contained"
            disabled={!newGalleryName.trim() || createLoading}
          >
            {createLoading ? "Creating..." : "Create"}
          </Button>
        </DialogActions>
      </Dialog>
      {/* Edit dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={handleEditDialogClose}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>Rename Gallery</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Gallery Name"
            fullWidth
            variant="outlined"
            value={editGalleryName}
            onChange={(e) => setEditGalleryName(e.target.value)}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleEditDialogClose} disabled={editLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleEditGallery}
            variant="contained"
            disabled={!editGalleryName.trim() || editLoading}
          >
            {editLoading ? "Saving..." : "Save"}
          </Button>
        </DialogActions>
      </Dialog>
      {/* Delete confirmation */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteDialogClose}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>Delete Gallery</DialogTitle>
        <DialogContent>
          <Typography>Are you sure? This cannot be undone.</Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleDeleteDialogClose} disabled={deleteLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleDeleteGallery}
            variant="contained"
            color="error"
            disabled={deleteLoading}
          >
            {deleteLoading ? "Deleting..." : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

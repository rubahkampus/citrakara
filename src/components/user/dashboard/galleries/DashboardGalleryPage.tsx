// src/components/dashboard/galleries/DashboardGalleryPage.tsx
'use client';

import { useState, useEffect } from 'react';
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
  CardMedia,
  CardActionArea,
  CardActions,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Divider
} from '@mui/material';
import {
  Add as AddIcon,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { axiosClient } from '@/lib/utils/axiosClient';
import { KButton } from '@/components/KButton';
import { useUserDialogStore } from '@/lib/stores/userStore';
import { useProfilePageStore } from '@/lib/stores/profilePageStore';

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

export default function DashboardGalleryPage({ username, initialGalleries }: DashboardGalleryPageProps) {
  const { open: openDialog } = useUserDialogStore();
  const { openGalleryPostDialog } = useProfilePageStore();
  
  const [galleries, setGalleries] = useState<GalleryWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Create gallery dialog state
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newGalleryName, setNewGalleryName] = useState('');
  const [createLoading, setCreateLoading] = useState(false);
  
  // Edit gallery dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editGalleryId, setEditGalleryId] = useState<string | null>(null);
  const [editGalleryName, setEditGalleryName] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  
  // Menu state for gallery actions
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [activeGalleryId, setActiveGalleryId] = useState<string | null>(null);
  
  // Delete confirmation dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  
  // Initialize with gallery stats
  useEffect(() => {
    const fetchGalleriesWithStats = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Start with initial galleries from props
        const enrichedGalleries = await Promise.all(
          initialGalleries.map(async (gallery) => {
            try {
              // For each gallery, fetch posts to get count and thumbnails
              const postsResponse = await axiosClient.get(`/api/gallery/${gallery._id}/posts`);
              const posts = postsResponse.data.posts || [];
              
              return {
                ...gallery,
                postCount: posts.length,
                thumbnails: posts.slice(0, 4).map((post: any) => post.images[0] || '')
              };
            } catch (err) {
              // If posts fetch fails for a gallery, return empty stats
              return {
                ...gallery,
                postCount: 0,
                thumbnails: []
              };
            }
          })
        );
        
        setGalleries(enrichedGalleries);
      } catch (err) {
        setError('Failed to load galleries. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchGalleriesWithStats();
  }, [initialGalleries]);
  
  // Refresh galleries data
  const refreshGalleries = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axiosClient.get('/api/gallery');
      const updatedGalleries = await Promise.all(
        response.data.galleries.map(async (gallery: Gallery) => {
          try {
            const postsResponse = await axiosClient.get(`/api/gallery/${gallery._id}/posts`);
            const posts = postsResponse.data.posts || [];
            
            return {
              ...gallery,
              postCount: posts.length,
              thumbnails: posts.slice(0, 4).map((post: any) => post.images[0] || '')
            };
          } catch (err) {
            return {
              ...gallery,
              postCount: 0,
              thumbnails: []
            };
          }
        })
      );
      
      setGalleries(updatedGalleries);
    } catch (err) {
      setError('Failed to refresh galleries. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle gallery menu open
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, galleryId: string) => {
    event.stopPropagation();
    setMenuAnchorEl(event.currentTarget);
    setActiveGalleryId(galleryId);
  };
  
  // Handle gallery menu close
  const handleMenuClose = () => {
    setMenuAnchorEl(null);
    setActiveGalleryId(null);
  };
  
  // Handle create gallery dialog
  const handleCreateDialogOpen = () => {
    setNewGalleryName('');
    setCreateDialogOpen(true);
  };
  
  const handleCreateDialogClose = () => {
    setCreateDialogOpen(false);
  };
  
  // Handle edit gallery dialog
  const handleEditClick = (gallery: GalleryWithStats) => {
    setEditGalleryId(gallery._id);
    setEditGalleryName(gallery.name);
    setEditDialogOpen(true);
    handleMenuClose();
  };
  
  const handleEditDialogClose = () => {
    setEditDialogOpen(false);
    setEditGalleryId(null);
    setEditGalleryName('');
  };
  
  // Handle delete gallery dialog
  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
    handleMenuClose();
  };
  
  const handleDeleteDialogClose = () => {
    setDeleteDialogOpen(false);
  };
  
  // Check if gallery is a default gallery (cannot be deleted or renamed)
  const isDefaultGallery = (name: string) => {
    return name === 'General' || name === 'Commissions';
  };
  
  // Create a new gallery
  const handleCreateGallery = async () => {
    if (!newGalleryName.trim()) return;
    
    setCreateLoading(true);
    setError(null);
    
    try {
      await axiosClient.post('/api/gallery', { name: newGalleryName.trim() });
      setSuccess('Gallery created successfully');
      handleCreateDialogClose();
      refreshGalleries();
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create gallery. Please try again.');
    } finally {
      setCreateLoading(false);
    }
  };
  
  // Edit gallery name
  const handleEditGallery = async () => {
    if (!editGalleryId || !editGalleryName.trim()) return;
    
    setEditLoading(true);
    setError(null);
    
    try {
      await axiosClient.patch(`/api/gallery/${editGalleryId}`, { name: editGalleryName.trim() });
      setSuccess('Gallery renamed successfully');
      handleEditDialogClose();
      refreshGalleries();
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to rename gallery. Please try again.');
    } finally {
      setEditLoading(false);
    }
  };
  
  // Delete gallery
  const handleDeleteGallery = async () => {
    if (!activeGalleryId) return;
    
    setDeleteLoading(true);
    setError(null);
    
    try {
      await axiosClient.delete(`/api/gallery/${activeGalleryId}`);
      setSuccess('Gallery deleted successfully');
      handleDeleteDialogClose();
      refreshGalleries();
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete gallery. Please try again.');
    } finally {
      setDeleteLoading(false);
    }
  };
  
  // Open upload dialog
  const handleUploadClick = () => {
    openDialog('uploadArtwork');
  };
  
  // View gallery (navigate to gallery details)
  const handleViewGallery = (galleryId: string) => {
    // Here we could navigate to a detailed view, but for now just show posts
    window.location.href = `/${username}/dashboard/galleries/${galleryId}`;
  };
  
  return (
    <Box>
      {/* Header section */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight="bold">
          My Galleries
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          <KButton 
            variantType="secondary"
            startIcon={<AddIcon />}
            onClick={handleUploadClick}
          >
            Upload Art
          </KButton>
          
          <KButton 
            startIcon={<AddIcon />}
            onClick={handleCreateDialogOpen}
          >
            New Gallery
          </KButton>
        </Box>
      </Box>
      
      {/* Status messages */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}
      
      {/* Galleries list */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : galleries.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 2 }}>
          <Typography variant="body1" color="text.secondary" gutterBottom>
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
          {galleries.map((gallery) => (
            <Grid item xs={12} sm={6} md={4} key={gallery._id}>
              <Card sx={{ 
                position: 'relative', 
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                borderRadius: 2,
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 3
                }
              }}>
                {/* Menu button (top right corner) */}
                <IconButton
                  sx={{ position: 'absolute', top: 8, right: 8, zIndex: 1 }}
                  onClick={(e) => handleMenuOpen(e, gallery._id)}
                >
                  <MoreVertIcon />
                </IconButton>
                
                {/* Gallery content */}
                <CardActionArea 
                  onClick={() => handleViewGallery(gallery._id)}
                  sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}
                >
                  {/* Gallery thumbnail grid */}
                  <Box sx={{ height: 180, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, p: 1 }}>
                    {gallery.thumbnails.length > 0 ? (
                      gallery.thumbnails.slice(0, 4).map((thumbnail, index) => (
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
                    
                    {/* Fill in empty slots with blank boxes */}
                    {gallery.thumbnails.length > 0 && gallery.thumbnails.length < 4 && 
                      Array.from({ length: 4 - gallery.thumbnails.length }).map((_, index) => (
                        <Box
                          key={`empty-${index}`}
                          sx={{
                            height: 86,
                            bgcolor: 'action.hover',
                            borderRadius: 1
                          }}
                        />
                      ))
                    }
                  </Box>
                  
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Typography gutterBottom variant="h6" component="div" noWrap>
                      {gallery.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {gallery.postCount} {gallery.postCount === 1 ? 'post' : 'posts'}
                    </Typography>
                  </CardContent>
                </CardActionArea>
                
                <Divider />
                
                <CardActions>
                  <Button 
                    size="small" 
                    onClick={() => handleViewGallery(gallery._id)}
                    sx={{ fontWeight: 'medium' }}
                  >
                    View Gallery
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
      
      {/* Gallery action menu */}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleMenuClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        {activeGalleryId && !isDefaultGallery(galleries.find(g => g._id === activeGalleryId)?.name || '') && (
          <MenuItem 
            onClick={() => handleEditClick(galleries.find(g => g._id === activeGalleryId)!)}
            sx={{ minWidth: 120 }}
          >
            <ListItemWithIcon icon={<EditIcon fontSize="small" />} text="Rename" />
          </MenuItem>
        )}
        
        {activeGalleryId && !isDefaultGallery(galleries.find(g => g._id === activeGalleryId)?.name || '') && 
         (galleries.find(g => g._id === activeGalleryId)?.postCount === 0) && (
          <MenuItem 
            onClick={handleDeleteClick}
            sx={{ color: 'error.main' }}
          >
            <ListItemWithIcon icon={<DeleteIcon fontSize="small" />} text="Delete" />
          </MenuItem>
        )}
      </Menu>
      
      {/* Create gallery dialog */}
      <Dialog
        open={createDialogOpen}
        onClose={handleCreateDialogClose}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 2 } }}
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
            helperText="Give your gallery a descriptive name"
            sx={{ mt: 1 }}
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
            {createLoading ? 'Creating...' : 'Create Gallery'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Edit gallery dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={handleEditDialogClose}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 2 } }}
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
            sx={{ mt: 1 }}
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
            {editLoading ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Delete confirmation dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteDialogClose}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 2 } }}
      >
        <DialogTitle>Delete Gallery</DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            Are you sure you want to delete this gallery? This action cannot be undone.
          </Typography>
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
            {deleteLoading ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

// Helper component for menu items with icons
function ListItemWithIcon({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      {icon}
      <Typography variant="body2">{text}</Typography>
    </Box>
  );
}
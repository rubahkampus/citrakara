// src/components/dashboard/galleries/DashboardGalleryDetailPage.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
  TextField,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  CardActions
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Add as AddIcon,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { axiosClient } from '@/lib/utils/axiosClient';
import { KButton } from '@/components/KButton';
import { useUserDialogStore } from '@/lib/stores/userStore';
import { useGalleryPostStore } from '@/lib/stores/galleryPostStore';

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

export default function DashboardGalleryDetailPage({ 
  username, 
  gallery, 
  initialPosts 
}: DashboardGalleryDetailPageProps) {
  const router = useRouter();
  const { open: openDialog } = useUserDialogStore();
  const { openDialog: openGalleryPostDialog } = useGalleryPostStore();
  
  const [posts, setPosts] = useState<GalleryPost[]>(initialPosts);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Menu state for post actions
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [activePostId, setActivePostId] = useState<string | null>(null);
  const [activePostIdToBeModified, setActivePostIdToBeModified] = useState<string | null>(null);
  
  // Delete confirmation dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  
  // Edit post dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editPostDescription, setEditPostDescription] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  
  // Check if gallery is a default gallery
  const isDefaultGallery = gallery.name === 'General' || gallery.name === 'Commissions';
  
  // Refresh posts data
  const refreshPosts = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axiosClient.get(`/api/gallery/${gallery._id}/posts`);
      setPosts(response.data.posts || []);
    } catch (err) {
      setError('Failed to load posts. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle post menu open
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, postId: string) => {
    event.stopPropagation();
    setMenuAnchorEl(event.currentTarget);
    setActivePostId(postId);
  };
  
  // Handle post menu close
  const handleMenuClose = () => {
    setMenuAnchorEl(null);
    setActivePostId(null);
  };
  
  // Handle edit post dialog
  const handleEditClick = (post: GalleryPost) => {
    setActivePostIdToBeModified(post._id);
    setEditPostDescription(post.description || '');
    setEditDialogOpen(true);
    handleMenuClose();
  };
  
  const handleEditDialogClose = () => {
    setEditDialogOpen(false);
    setEditPostDescription('');
    setActivePostIdToBeModified(null);
  };
  
  // Handle delete post dialog
  const handleDeleteClick = (post: GalleryPost) => {
    setActivePostIdToBeModified(post._id);
    setDeleteDialogOpen(true);
    handleMenuClose();
  };
  
  const handleDeleteDialogClose = () => {
    setDeleteDialogOpen(false);
    setActivePostIdToBeModified(null);
  };
  
  // Edit post description
  const handleSavePostDescription = async () => {
    if (!activePostIdToBeModified) return;
    
    setEditLoading(true);
    setError(null);
    
    try {
      await axiosClient.patch(`/api/gallery/post/${activePostIdToBeModified}`, { description: editPostDescription.trim() });
      setSuccess('Post updated successfully');
      handleEditDialogClose();
      refreshPosts();
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
      setActivePostIdToBeModified(null);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update post. Please try again.');
    } finally {
      setEditLoading(false);
    }
  };
  
  // Delete post
  const handleDeletePost = async () => {
    if (!activePostIdToBeModified) return;
    
    setDeleteLoading(true);
    setError(null);
    
    try {
      await axiosClient.delete(`/api/gallery/post/${activePostIdToBeModified}`);
      setSuccess('Post deleted successfully');
      handleDeleteDialogClose();
      refreshPosts();
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
      setActivePostIdToBeModified(null);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete post. Please try again.');
    } finally {
      setDeleteLoading(false);
    }
  };
  
  // View post (using shared dialog with profile page)
  const handleViewPost = (postId: string) => {
    openGalleryPostDialog(postId);
  };
  
  // Go back to galleries
  const handleGoBack = () => {
    router.push(`/${username}/dashboard/galleries`);
  };
  
  // Open upload dialog
  const handleUploadClick = () => {
    // Set the gallery ID in localStorage so the upload form can use it as default
    localStorage.setItem('defaultGalleryId', gallery._id);
    openDialog('uploadArtwork');
  };
  
  return (
    <Box>
      {/* Header section */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton onClick={handleGoBack} sx={{ mr: 1 }}>
            <ArrowBackIcon />
          </IconButton>
          <Box>
            <Typography variant="h5" fontWeight="bold">
              {gallery.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {posts.length} {posts.length === 1 ? 'post' : 'posts'}
            </Typography>
          </Box>
        </Box>
        
        <KButton 
          startIcon={<AddIcon />}
          onClick={handleUploadClick}
        >
          Add New Post
        </KButton>
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
      
      {/* Posts grid */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : posts.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 2 }}>
          <Typography variant="body1" color="text.secondary" gutterBottom>
            This gallery is empty. Upload some artwork to get started.
          </Typography>
          <Button 
            variant="contained" 
            startIcon={<AddIcon />}
            onClick={handleUploadClick}
            sx={{ mt: 2 }}
          >
            Upload Artwork
          </Button>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {posts.map((post) => (
            <Grid item xs={12} sm={6} md={4} key={post._id}>
              <Card sx={{ 
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                borderRadius: 2,
                overflow: 'hidden',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 3
                }
              }}>
                {/* Menu button (top right corner) */}
                <Box sx={{ position: 'relative' }}>
                  <IconButton
                    sx={{ position: 'absolute', top: 8, right: 8, zIndex: 1, bgcolor: 'rgba(0,0,0,0.4)', color: 'white', '&:hover': { bgcolor: 'rgba(0,0,0,0.6)' } }}
                    onClick={(e) => handleMenuOpen(e, post._id)}
                  >
                    <MoreVertIcon />
                  </IconButton>
                  
                  {/* Image */}
                  <Box
                    onClick={() => handleViewPost(post._id)}
                    sx={{
                      height: 220,
                      backgroundImage: `url(${post.images[0] || ''})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      cursor: 'pointer',
                      position: 'relative',
                      '&::after': {
                        content: post.images.length > 1 ? '"+' + (post.images.length - 1) + '"' : '""',
                        position: 'absolute',
                        bottom: 8,
                        right: 8,
                        bgcolor: 'rgba(0,0,0,0.6)',
                        color: 'white',
                        px: 1,
                        py: 0.5,
                        borderRadius: 1,
                        fontSize: '0.75rem',
                        fontWeight: 'bold'
                      }
                    }}
                  />
                </Box>
                
                {/* Content */}
                <CardContent sx={{ flexGrow: 1, pb: 1 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ 
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    minHeight: 40
                  }}>
                    {post.description || <i>No description</i>}
                  </Typography>
                  
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                    {new Date(post.createdAt).toLocaleDateString()}
                  </Typography>
                </CardContent>
                
                {/* Actions */}
                <CardActions>
                  <Button 
                    size="small" 
                    onClick={() => handleViewPost(post._id)}
                    sx={{ fontWeight: 'medium' }}
                  >
                    View Post
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
      
      {/* Post action menu */}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleMenuClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        {activePostId && (
          <>
            <MenuItem 
              onClick={() => handleEditClick(posts.find(p => p._id === activePostId)!)}
              sx={{ minWidth: 140 }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <EditIcon fontSize="small" />
                <Typography variant="body2">Edit Description</Typography>
              </Box>
            </MenuItem>
            
            <MenuItem 
              onClick={() => handleDeleteClick(posts.find(p => p._id === activePostId)!)}
              sx={{ color: 'error.main' }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <DeleteIcon fontSize="small" />
                <Typography variant="body2">Delete Post</Typography>
              </Box>
            </MenuItem>
          </>
        )}
      </Menu>
      
      {/* Edit post dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={handleEditDialogClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 2 } }}
      >
        <DialogTitle>Edit Post Description</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Description"
            fullWidth
            multiline
            rows={4}
            variant="outlined"
            value={editPostDescription}
            onChange={(e) => setEditPostDescription(e.target.value)}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleEditDialogClose} disabled={editLoading}>
            Cancel
          </Button>
          <Button 
            onClick={handleSavePostDescription} 
            variant="contained" 
            disabled={editLoading}
          >
            {editLoading ? 'Saving...' : 'Save Changes'}
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
        <DialogTitle>Delete Post</DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            Are you sure you want to delete this post? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleDeleteDialogClose} disabled={deleteLoading}>
            Cancel
          </Button>
          <Button 
            onClick={handleDeletePost} 
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
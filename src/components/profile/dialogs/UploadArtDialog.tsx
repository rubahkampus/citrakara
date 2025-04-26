// src/components/profile/dialogs/UploadArtDialog.tsx - continuation
'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Divider,
  Button,
  Paper,
  FormHelperText,
  CircularProgress,
  Alert,
  useMediaQuery,
  useTheme
} from '@mui/material';
import { Close as CloseIcon, CloudUpload, AddPhotoAlternate, Delete } from '@mui/icons-material';
import { KButton } from '@/components/KButton';
import { useUserDialogStore } from '@/lib/stores/userDialogStore';
import { axiosClient } from '@/lib/utils/axiosClient';

interface Gallery {
  _id: string;
  name: string;
}

export default function UploadArtDialog() {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const { openDialog, close } = useUserDialogStore();
  
  const [selectedGallery, setSelectedGallery] = useState('');
  const [description, setDescription] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [galleries, setGalleries] = useState<Gallery[]>([]);
  const [galleriesLoading, setGalleriesLoading] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Load galleries and check for default selection
  useEffect(() => {
    if (openDialog !== 'uploadArtwork') return;
    
    const fetchGalleries = async () => {
      setGalleriesLoading(true);
      
      try {
        const response = await axiosClient.get('/api/gallery');
        setGalleries(response.data.galleries || []);
        
        // Check for default gallery from localStorage (set from gallery detail page)
        const defaultGalleryId = localStorage.getItem('defaultGalleryId');
        if (defaultGalleryId) {
          setSelectedGallery(defaultGalleryId);
          localStorage.removeItem('defaultGalleryId'); // Clear it after use
        } else if (response.data.galleries && response.data.galleries.length > 0) {
          // Otherwise default to first gallery
          setSelectedGallery(response.data.galleries[0]._id);
        }
      } catch (error) {
        console.error('Error fetching galleries:', error);
        setError('Failed to load galleries');
      } finally {
        setGalleriesLoading(false);
      }
    };
    
    fetchGalleries();
  }, [openDialog]);
  
  const handleAddImages = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;
    
    // Validate files
    const newFiles: File[] = [];
    const invalidFiles: string[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // Check file type
      if (!file.type.startsWith('image/')) {
        invalidFiles.push(`${file.name} (not an image)`);
        continue;
      }
      
      // Check file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        invalidFiles.push(`${file.name} (exceeds 5MB limit)`);
        continue;
      }
      
      newFiles.push(file);
    }
    
    // Show error for invalid files
    if (invalidFiles.length > 0) {
      setError(`The following files couldn't be added: ${invalidFiles.join(', ')}`);
    } else {
      setError(null);
    }
    
    // Add new files and create previews
    if (newFiles.length > 0) {
      const updatedImages = [...images, ...newFiles];
      setImages(updatedImages);
      
      // Create preview URLs
      const newPreviews = newFiles.map(file => URL.createObjectURL(file));
      setPreviewUrls([...previewUrls, ...newPreviews]);
    }
    
    // Clear the input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  const handleRemoveImage = (index: number) => {
    // Create new arrays without the removed item
    const newImages = [...images];
    const newPreviews = [...previewUrls];
    
    // Revoke the object URL to avoid memory leaks
    URL.revokeObjectURL(newPreviews[index]);
    
    // Remove the item
    newImages.splice(index, 1);
    newPreviews.splice(index, 1);
    
    // Update state
    setImages(newImages);
    setPreviewUrls(newPreviews);
  };
  
  const handleClose = () => {
    // Clean up preview URLs
    previewUrls.forEach(url => URL.revokeObjectURL(url));
    
    // Reset state
    setSelectedGallery('');
    setDescription('');
    setImages([]);
    setPreviewUrls([]);
    setError(null);
    setSuccess(null);
    
    // Close dialog
    close();
  };
  
  const handleSubmit = async () => {
    // Validate
    if (!selectedGallery) {
      setError('Please select a gallery');
      return;
    }
    
    if (images.length === 0) {
      setError('Please add at least one image');
      return;
    }
    
    // Prepare form data
    const formData = new FormData();
    formData.append('galleryId', selectedGallery);
    formData.append('description', description);
    
    // Add all images
    images.forEach(image => {
      formData.append('images[]', image);
    });
    
    setLoading(true);
    setError(null);
    
    try {
      await axiosClient.post('/api/gallery/post', formData);
      setSuccess('Artwork uploaded successfully');
      
      // Auto close after success
      setTimeout(() => {
        handleClose();
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to upload artwork. Please try again.');
      setLoading(false);
    }
  };
  
  return (
    <Dialog
      open={openDialog === 'uploadArtwork'}
      onClose={handleClose}
      fullScreen={fullScreen}
      fullWidth
      maxWidth="md"
      PaperProps={{
        sx: { borderRadius: fullScreen ? 0 : 2 }
      }}
    >
      <DialogTitle sx={{ py: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6" fontWeight="bold">Upload New Artwork</Typography>
        <IconButton onClick={handleClose} edge="end">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <Divider />
      
      <DialogContent sx={{ py: 3 }}>
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
        
        {/* Gallery Selection */}
        <FormControl fullWidth margin="normal">
          <InputLabel id="gallery-select-label">Gallery</InputLabel>
          <Select
            labelId="gallery-select-label"
            value={selectedGallery}
            onChange={(e) => setSelectedGallery(e.target.value)}
            label="Gallery"
            disabled={galleriesLoading}
          >
            {galleriesLoading ? (
              <MenuItem value="">
                <CircularProgress size={20} sx={{ mr: 1 }} />
                Loading galleries...
              </MenuItem>
            ) : galleries.length === 0 ? (
              <MenuItem value="" disabled>
                No galleries available
              </MenuItem>
            ) : (
              galleries.map((gallery) => (
                <MenuItem key={gallery._id} value={gallery._id}>
                  {gallery.name}
                </MenuItem>
              ))
            )}
          </Select>
        </FormControl>
        
        {/* Description */}
        <TextField
          label="Description"
          multiline
          rows={3}
          fullWidth
          margin="normal"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe your artwork (optional)"
        />
        
        {/* Image Upload */}
        <Typography variant="subtitle1" fontWeight="medium" sx={{ mt: 3, mb: 1 }}>
          Images
        </Typography>
        
        {/* Image preview grid */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2 }}>
          {/* Preview of uploaded images */}
          {previewUrls.map((url, index) => (
            <Paper
              key={index}
              sx={{
                width: 150,
                height: 150,
                overflow: 'hidden',
                position: 'relative',
                borderRadius: 2,
              }}
            >
              <Box
                component="img"
                src={url}
                alt={`Preview ${index + 1}`}
                sx={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />
              <IconButton
                onClick={() => handleRemoveImage(index)}
                sx={{
                  position: 'absolute',
                  top: 4,
                  right: 4,
                  bgcolor: 'rgba(0,0,0,0.5)',
                  color: 'white',
                  '&:hover': {
                    bgcolor: 'rgba(0,0,0,0.7)',
                  },
                  p: 0.5,
                }}
              >
                <Delete fontSize="small" />
              </IconButton>
            </Paper>
          ))}
          
          {/* Upload button */}
          <Paper
            onClick={() => fileInputRef.current?.click()}
            sx={{
              width: 150,
              height: 150,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              border: '2px dashed',
              borderColor: 'divider',
              borderRadius: 2,
              p: 2,
              '&:hover': {
                borderColor: 'primary.main',
                bgcolor: 'action.hover',
              },
            }}
          >
            <AddPhotoAlternate
              sx={{ fontSize: 40, color: 'text.secondary', mb: 1 }}
            />
            <Typography variant="body2" color="text.secondary" align="center">
              Click to add image
            </Typography>
          </Paper>
        </Box>
        
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          style={{ display: 'none' }}
          onChange={handleAddImages}
        />
        
        {/* Upload instructions */}
        <Typography variant="caption" color="text.secondary">
          Supported formats: JPG, PNG, GIF, WebP. Maximum size: 5MB per image.
        </Typography>
      </DialogContent>
      
      <Divider />
      
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <KButton
          onClick={handleSubmit}
          disabled={loading || images.length === 0 || !selectedGallery}
          loading={loading}
        >
          {loading ? 'Uploading...' : 'Upload Artwork'}
        </KButton>
      </DialogActions>
    </Dialog>
  );
}
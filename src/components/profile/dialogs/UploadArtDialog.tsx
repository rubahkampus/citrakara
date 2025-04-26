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
  useMediaQuery,
  useTheme
} from '@mui/material';
import { Close as CloseIcon, CloudUpload, AddPhotoAlternate, Delete } from '@mui/icons-material';
import { KButton } from '@/components/KButton';
import { useUserDialogStore } from '@/lib/stores/userDialogStore';
import { axiosClient } from '@/lib/utils/axiosClient';

// Mock gallery data
const mockGalleries = [
  { id: 'g1', name: 'Commissions' },
  { id: 'g2', name: 'Personal Artwork' },
  { id: 'g3', name: 'Sketches' },
  { id: 'g4', name: 'Fanart' },
];

export default function UploadArtDialog() {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const { openDialog, close } = useUserDialogStore(); // Keep destructuring consistent
  const [selectedGallery, setSelectedGallery] = useState('');
  const [description, setDescription] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [galleries, setGalleries] = useState<{id: string, name: string}[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // For real data, uncomment this and comment out the useEffect below
  /*
  useEffect(() => {
    const fetchGalleries = async () => {
      try {
        const response = await axiosClient.get('/api/gallery');
        setGalleries(response.data.galleries);
        // Set default gallery to first one if available
        if (response.data.galleries.length > 0) {
          setSelectedGallery(response.data.galleries[0].id);
        }
      } catch (error) {
        console.error('Error fetching galleries:', error);
        setError('Failed to load galleries');
      }
    };
    
    fetchGalleries();
  }, []);
  */
  
  // Mock data
  useEffect(() => {
    setGalleries(mockGalleries);
    // Set default gallery to first one
    if (mockGalleries.length > 0) {
      setSelectedGallery(mockGalleries[0].id);
    }
  }, []);
  
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
    setSelectedGallery(galleries[0]?.id || '');
    setDescription('');
    setImages([]);
    setPreviewUrls([]);
    setError(null);
    
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
    
    // For real API, uncomment this and comment out the setTimeout below
    /*
    try {
      const response = await axiosClient.post('/api/gallery/post', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      // Success
      handleClose();
      // You might want to show a success message or refresh the gallery
    } catch (error) {
      console.error('Error uploading artwork:', error);
      setError('Failed to upload artwork. Please try again.');
    } finally {
      setLoading(false);
    }
    */
    
    // Mock upload
    setTimeout(() => {
      console.log('Uploaded to gallery:', selectedGallery);
      console.log('Description:', description);
      console.log('Images:', images.map(img => img.name));
      
      setLoading(false);
      handleClose();
    }, 1500);
  };
  
  return (
    <Dialog
      open={openDialog === 'uploadArtwork'} // Using the state property correctly here
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
        {/* Gallery Selection */}
        <FormControl fullWidth margin="normal">
          <InputLabel id="gallery-select-label">Gallery</InputLabel>
          <Select
            labelId="gallery-select-label"
            value={selectedGallery}
            onChange={(e) => setSelectedGallery(e.target.value)}
            label="Gallery"
          >
            {galleries.map((gallery) => (
              <MenuItem key={gallery.id} value={gallery.id}>
                {gallery.name}
              </MenuItem>
            ))}
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
        
        {/* Error message */}
        {error && (
          <Typography color="error" variant="body2" sx={{ mt: 2 }}>
            {error}
          </Typography>
        )}
      </DialogContent>
      
      <Divider />
      
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <KButton
          onClick={handleSubmit}
          disabled={loading || images.length === 0}
          loading={loading}
        >
          {loading ? 'Uploading...' : 'Upload Artwork'}
        </KButton>
      </DialogActions>
    </Dialog>
  );
}
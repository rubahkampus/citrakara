// src/components/profile/dialogs/GalleryPostDialog.tsx
'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  IconButton,
  Box,
  Typography,
  useMediaQuery,
  useTheme,
  Slide
} from '@mui/material';
import { Close as CloseIcon, ArrowBack, ArrowForward } from '@mui/icons-material';
import { TransitionProps } from '@mui/material/transitions';
import Image from 'next/image';
import React from 'react';
import { GalleryPostData, useProfilePageStore } from '@/lib/stores/profilePageStore';
import { axiosClient } from '@/lib/utils/axiosClient';

// Mock data for post details
const mockPostsDetails: Record<string, GalleryPostData> = {
  'p1': { 
    id: 'p1', 
    galleryId: 'g1', 
    images: ['/placeholders/art1.jpg', '/placeholders/art1-2.jpg'], 
    description: 'Detailed commission artwork featuring a character in a fantasy setting.',
    createdAt: '2023-10-01' 
  },
  'p2': { 
    id: 'p2', 
    galleryId: 'g1', 
    images: ['/placeholders/art2.jpg'], 
    description: 'Another commission piece with vibrant colors and dynamic poses.',
    createdAt: '2023-09-28' 
  },
  'p3': { 
    id: 'p3', 
    galleryId: 'g2', 
    images: ['/placeholders/art4.jpg'], 
    description: 'Album X artwork with experimental techniques.',
    createdAt: '2023-09-25' 
  }
};

const Transition = React.forwardRef(function Transition(
  props: TransitionProps & { children: React.ReactElement },
  ref: React.Ref<unknown>,
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

export default function GalleryPostDialog() {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('md'));
  const { isGalleryPostDialogOpen, activePostId, closeGalleryPostDialog } = useProfilePageStore();
  const [post, setPost] = useState<GalleryPostData | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  // For real data, uncomment this and comment out the useEffect below
  /*
  useEffect(() => {
    if (!activePostId || !isGalleryPostDialogOpen) return;
    
    const fetchPostDetails = async () => {
      try {
        setLoading(true);
        const response = await axiosClient.get(`/api/gallery/post/${activePostId}`);
        setPost(response.data.post);
        setCurrentImageIndex(0);
      } catch (error) {
        console.error('Error fetching post details:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchPostDetails();
  }, [activePostId, isGalleryPostDialogOpen]);
  */
  
  // Mock data loading
  useEffect(() => {
    if (!activePostId || !isGalleryPostDialogOpen) return;
    
    setLoading(true);
    // Simulate API request
    setTimeout(() => {
      setPost(mockPostsDetails[activePostId] || null);
      setCurrentImageIndex(0);
      setLoading(false);
    }, 500);
  }, [activePostId, isGalleryPostDialogOpen]);
  
  const handleClose = () => {
    closeGalleryPostDialog();
  };
  
  const handlePrev = () => {
    if (!post || post.images.length <= 1) return;
    setCurrentImageIndex((prev) => (prev === 0 ? post.images.length - 1 : prev - 1));
  };
  
  const handleNext = () => {
    if (!post || post.images.length <= 1) return;
    setCurrentImageIndex((prev) => (prev === post.images.length - 1 ? 0 : prev + 1));
  };
  
  if (!post) return null;
  
  return (
    <Dialog
      open={isGalleryPostDialogOpen}
      onClose={handleClose}
      fullScreen={fullScreen}
      maxWidth="lg"
      TransitionComponent={Transition}
      PaperProps={{
        sx: {
          borderRadius: fullScreen ? 0 : 3,
          overflow: 'hidden',
          bgcolor: 'background.paper',
          maxHeight: '90vh',
        }
      }}
    >
      <Box sx={{ 
        position: 'absolute', 
        top: 8, 
        right: 8, 
        zIndex: 10 
      }}>
        <IconButton 
          onClick={handleClose}
          sx={{
            bgcolor: 'rgba(0,0,0,0.5)',
            color: 'white',
            '&:hover': {
              bgcolor: 'rgba(0,0,0,0.7)',
            }
          }}
        >
          <CloseIcon />
        </IconButton>
      </Box>
      
      <DialogContent sx={{ p: 0, display: 'flex', flexDirection: { xs: 'column', sm: 'row' } }}>
        {/* Image viewer */}
        <Box sx={{ 
          position: 'relative',
          width: { xs: '100%', sm: '70%' },
          height: { xs: 300, sm: 600 },
          bgcolor: 'black',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          {post.images.length > 0 && (
            <Image
              src={post.images[currentImageIndex]}
              alt="Gallery image"
              layout="fill"
              objectFit="contain"
              unoptimized={true}
            />
          )}
          
          {/* Navigation arrows */}
          {post.images.length > 1 && (
            <>
              <IconButton
                onClick={handlePrev}
                sx={{
                  position: 'absolute',
                  left: 16,
                  bgcolor: 'rgba(0,0,0,0.5)',
                  color: 'white',
                  '&:hover': {
                    bgcolor: 'rgba(0,0,0,0.7)',
                  }
                }}
              >
                <ArrowBack />
              </IconButton>
              <IconButton
                onClick={handleNext}
                sx={{
                  position: 'absolute',
                  right: 16,
                  bgcolor: 'rgba(0,0,0,0.5)',
                  color: 'white',
                  '&:hover': {
                    bgcolor: 'rgba(0,0,0,0.7)',
                  }
                }}
              >
                <ArrowForward />
              </IconButton>
              
              {/* Image counter */}
              <Box sx={{ 
                position: 'absolute',
                bottom: 16,
                right: 16,
                bgcolor: 'rgba(0,0,0,0.5)',
                color: 'white',
                px: 1.5,
                py: 0.5,
                borderRadius: 1,
                fontSize: 14
              }}>
                {currentImageIndex + 1} / {post.images.length}
              </Box>
            </>
          )}
        </Box>
        
        {/* Image details */}
        <Box sx={{ 
          p: 3,
          width: { xs: '100%', sm: '30%' },
          display: 'flex',
          flexDirection: 'column',
          gap: 2
        }}>
          <Box>
            <Typography variant="subtitle1" fontWeight="bold">Description</Typography>
            <Typography variant="body2" color="text.secondary">
              {post.description || "No description provided"}
            </Typography>
          </Box>
          
          <Box>
            <Typography variant="subtitle1" fontWeight="bold">Uploaded</Typography>
            <Typography variant="body2" color="text.secondary">
              {new Date(post.createdAt).toLocaleDateString()}
            </Typography>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
}


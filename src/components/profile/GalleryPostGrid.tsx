// src/components/profile/GalleryPostGrid.tsx
'use client';

import { Box, Grid, Typography, useTheme } from '@mui/material';
import { GalleryPostData } from '@/lib/stores/profilePageStore';
import { useGalleryPostStore } from '@/lib/stores/galleryPostStore';
import Image from 'next/image';

interface GalleryPostGridProps {
  posts: GalleryPostData[];
  loading?: boolean;
}

export default function GalleryPostGrid({ posts, loading = false }: GalleryPostGridProps) {
  const theme = useTheme();
  const { openDialog } = useGalleryPostStore();
  
  if (posts.length === 0) {
    return (
      <Box 
        sx={{ 
          height: 120, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          bgcolor: 'background.paper',
          border: '1px dashed',
          borderColor: 'divider',
          borderRadius: 1,
        }}
      >
        <Typography color="text.secondary">
          No artwork found in this gallery
        </Typography>
      </Box>
    );
  }
  
  // Sort posts by date (newest first)
  const sortedPosts = [...posts].sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  
  return (
    <Grid container spacing={2}>
      {sortedPosts.map((post) => (
        <Grid item xs={6} sm={3} key={post.id}>
          <Box
            onClick={() => openDialog(post.id)}
            sx={{
              position: 'relative',
              paddingBottom: '100%', // Square aspect ratio
              overflow: 'hidden',
              borderRadius: 1,
              cursor: 'pointer',
              bgcolor: 'background.paper',
              transition: 'transform 0.15s',
              '&:hover': {
                transform: 'translateY(-2px)',
              },
            }}
          >
            {post.images.length > 0 ? (
              <Image
                src={post.images[0]}
                alt={post.description || 'Gallery image'}
                layout="fill"
                objectFit="cover"
                unoptimized={true} // For placeholder images
              />
            ) : (
              <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: theme.palette.divider,
                }}
              >
                <Typography variant="body2" color="text.secondary">
                  No Image
                </Typography>
              </Box>
            )}
          </Box>
        </Grid>
      ))}
    </Grid>
  );
}
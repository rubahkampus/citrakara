// src/components/profile/GalleryGrid.tsx
'use client';

import { Box, Grid, Typography, useTheme } from '@mui/material';
import Image from 'next/image';
import { GalleryData } from '@/lib/stores/profilePageStore';

interface GalleryGridProps {
  galleries: GalleryData[];
  onGalleryClick: (galleryId: string) => void;
}

export default function GalleryGrid({ galleries, onGalleryClick }: GalleryGridProps) {
  const theme = useTheme();
  
  return (
    <Grid container spacing={2}>
      {galleries.map((gallery) => (
        <Grid item xs={6} sm={3} key={gallery.id}>
          <Box
            onClick={() => onGalleryClick(gallery.id)}
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
            {gallery.thumbnails.length > 0 ? (
              <Image
                src={gallery.thumbnails[0]}
                alt={gallery.name}
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
                  No Images
                </Typography>
              </Box>
            )}
            
            {/* Label overlay at bottom */}
            <Box
              sx={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                p: 1,
                background: 'linear-gradient(0deg, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0) 100%)',
              }}
            >
              <Typography 
                variant="body2" 
                sx={{ 
                  color: 'white',
                  fontWeight: 'medium',
                  fontSize: '0.875rem'
                }}
              >
                {gallery.name}
              </Typography>
              <Typography 
                variant="caption" 
                sx={{ 
                  color: 'rgba(255,255,255,0.8)',
                  fontSize: '0.75rem'
                }}
              >
                {gallery.postCount} {gallery.postCount === 1 ? 'item' : 'items'}
              </Typography>
            </Box>
            
            {/* Special overlay for Commissions gallery */}
            {(gallery.id === 'g1' || gallery.name.toLowerCase() === 'commissions') && gallery.postCount > 0 && (
              <Box
                sx={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  bgcolor: 'rgba(0,0,0,0.6)',
                  color: 'white',
                  borderRadius: 5,
                  px: 1.5,
                  py: 0.5,
                  fontWeight: 'bold',
                  fontSize: '0.875rem',
                }}
              >
                +{gallery.postCount}
              </Box>
            )}
          </Box>
        </Grid>
      ))}
    </Grid>
  );
}


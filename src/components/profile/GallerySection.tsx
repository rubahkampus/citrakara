// src/components/profile/GallerySection.tsx
'use client';

import { useState, useEffect } from 'react';
import { Box, Typography, Grid, Skeleton } from '@mui/material';
import { useRouter } from 'next/navigation';
import { KButton } from '@/components/KButton';
import GalleryGrid from './GalleryGrid';
import GalleryPostGrid from './GalleryPostGrid';
import { GalleryData, GalleryPostData, useProfilePageStore } from '@/lib/stores/profilePageStore';
import { useUserDialogStore } from '@/lib/stores/userDialogStore';
import { axiosClient } from '@/lib/utils/axiosClient';

// Mock data
const mockGalleries: GalleryData[] = [
  { id: 'g1', name: 'Commissions', thumbnails: ['/placeholders/art1.jpg', '/placeholders/art2.jpg', '/placeholders/art3.jpg'], postCount: 17 },
  { id: 'g2', name: 'Album X', thumbnails: ['/placeholders/art4.jpg'], postCount: 5 },
  { id: 'g3', name: 'Album X', thumbnails: ['/placeholders/art5.jpg'], postCount: 8 },
  { id: 'g4', name: 'Album X', thumbnails: ['/placeholders/art6.jpg'], postCount: 3 },
];

const mockPosts: GalleryPostData[] = [
  { id: 'p1', galleryId: 'g1', images: ['/placeholders/art1.jpg'], description: 'Commission artwork', createdAt: '2023-10-01' },
  { id: 'p2', galleryId: 'g1', images: ['/placeholders/art2.jpg'], description: 'Another commission', createdAt: '2023-09-28' },
  { id: 'p3', galleryId: 'g2', images: ['/placeholders/art4.jpg'], description: 'Album X artwork', createdAt: '2023-09-25' },
  { id: 'p4', galleryId: 'g3', images: ['/placeholders/art5.jpg'], description: 'Album Y artwork', createdAt: '2023-09-20' },
  { id: 'p5', galleryId: 'g4', images: ['/placeholders/art6.jpg'], description: 'Album Z artwork', createdAt: '2023-09-15' },
  { id: 'p6', galleryId: 'g1', images: ['/placeholders/art3.jpg'], description: 'Commission piece', createdAt: '2023-09-10' },
];

interface GallerySectionProps {
  username: string;
  isOwner: boolean;
}

export default function GallerySection({ username, isOwner }: GallerySectionProps) {
  const router = useRouter();
  const { open } = useUserDialogStore();
  const { activeView, activeGalleryId, setActiveView, setActiveGalleryId } = useProfilePageStore();
  
  const [galleries, setGalleries] = useState<GalleryData[]>([]);
  const [posts, setPosts] = useState<GalleryPostData[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  // For real data, uncomment this and comment out the useEffect below
  /*
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch user galleries
        const galleriesResponse = await axiosClient.get(`/api/gallery/user/${username}`);
        setGalleries(galleriesResponse.data.galleries);
        
        // Fetch posts (either for specific gallery or all)
        const postsUrl = activeGalleryId 
          ? `/api/gallery/${activeGalleryId}/posts`
          : `/api/gallery/user/${username}/posts`;
        
        const postsResponse = await axiosClient.get(postsUrl);
        setPosts(postsResponse.data.posts);
      } catch (error) {
        console.error('Error fetching gallery data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [username, activeGalleryId]);
  */

  // Mock data loading - replace with real API calls
  useEffect(() => {
    setLoading(true);
    // Simulate API request
    setTimeout(() => {
      setGalleries(mockGalleries);
      
      if (activeGalleryId) {
        // Filter posts for the specific gallery
        setPosts(mockPosts.filter(post => post.galleryId === activeGalleryId));
      } else {
        // Show all posts
        setPosts(mockPosts);
      }
      setLoading(false);
    }, 300);
  }, [activeGalleryId]);
  
  const navigateToManageGalleries = () => {
    router.push(`/${username}/dashboard/galleries`);
  };
  
  const handleUploadArtClick = () => {
    open('uploadArtwork');
  };
  
  const displayedGalleries = expanded ? galleries : galleries.slice(0, 4);
  
  const toggleExpanded = () => {
    setExpanded(!expanded);
  };
  
  const handleBackToOverview = () => {
    setActiveView('overview');
    setActiveGalleryId(null);
  };

  return (
    <Box>
      {/* Action Buttons */}
      {isOwner && (
        <Box sx={{ 
          display: 'flex', 
          gap: 2, 
          mb: 2,
          justifyContent: 'center'
        }}>
          <KButton
            variant="contained"
            color="primary"
            onClick={handleUploadArtClick}
            sx={{ px: 2, py: 1 }}
          >
            Upload New Art +
          </KButton>
          <KButton
            variant="outlined"
            onClick={navigateToManageGalleries}
            sx={{ px: 2, py: 1 }}
          >
            Manage Galleries
          </KButton>
        </Box>
      )}

      {/* Gallery Content */}
      {loading ? (
        // Loading state
        <Grid container spacing={2}>
          {Array.from(new Array(4)).map((_, index) => (
            <Grid item xs={6} sm={3} key={index}>
              <Skeleton 
                variant="rectangular" 
                height={0}
                sx={{ 
                  paddingBottom: '100%',
                  borderRadius: 1 
                }} 
              />
            </Grid>
          ))}
        </Grid>
      ) : activeGalleryId ? (
        // Specific gallery view
        <Box>
          <Box sx={{ mb: 2 }}>
            <Typography 
              variant="body2" 
              color="primary"
              sx={{ 
                cursor: 'pointer', 
                display: 'inline-flex',
                alignItems: 'center',
              }}
              onClick={handleBackToOverview}
            >
              ← Back to all galleries
            </Typography>
          </Box>
          
          <Typography 
            variant="h6" 
            fontWeight="medium" 
            sx={{ mb: 2 }}
          >
            {galleries.find(g => g.id === activeGalleryId)?.name || 'Gallery'}
          </Typography>
          
          <GalleryPostGrid posts={posts} />
        </Box>
      ) : (
        // Overview galleries
        <>
          <GalleryGrid 
            galleries={displayedGalleries} 
            onGalleryClick={(galleryId) => setActiveGalleryId(galleryId)} 
          />
          
          {/* See More button */}
          {galleries.length > 4 && (
            <Box sx={{ textAlign: 'center', mt: 2, mb: 3 }}>
              <KButton 
                variant="text"
                onClick={toggleExpanded}
              >
                {expanded ? 'Show Less' : 'See More...'}
              </KButton>
            </Box>
          )}
          
          {/* Recent uploads section */}
          {posts.length > 0 && (
            <Box sx={{ mt: 4 }}>
              <Typography 
                variant="h6" 
                fontWeight="medium" 
                sx={{ mb: 2 }}
              >
                Recent Uploads
              </Typography>
              <GalleryPostGrid posts={posts.slice(0, 6)} />
            </Box>
          )}
        </>
      )}
    </Box>
  );
}
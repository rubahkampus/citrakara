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
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  // Fetch galleries and posts based on the active gallery
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch user galleries
        const galleriesResponse = await axiosClient.get(`/api/user/${username}/galleries`);
        
        // Transform the gallery data to match the GalleryData interface
        const transformedGalleries: GalleryData[] = galleriesResponse.data.galleries.map((gallery: any) => ({
          id: gallery._id,
          name: gallery.name,
          thumbnails: [],  // We'll fill these in below
          postCount: 0     // We'll fill this in below
        }));
        
        // Fetch all posts for this user to extract thumbnails and count for each gallery
        const allPostsResponse = await axiosClient.get(`/api/user/${username}/posts`);
        const allPosts = allPostsResponse.data.posts || [];
        
        // Group posts by gallery
        const postsByGallery: Record<string, any[]> = {};
        allPosts.forEach((post: any) => {
          if (!postsByGallery[post.galleryId]) {
            postsByGallery[post.galleryId] = [];
          }
          postsByGallery[post.galleryId].push(post);
        });
        
        // Update galleries with thumbnails and post counts
        const enrichedGalleries = transformedGalleries.map(gallery => ({
          ...gallery,
          thumbnails: (postsByGallery[gallery.id] || [])
            .slice(0, 4)
            .map((post: any) => post.images[0] || ''),
          postCount: (postsByGallery[gallery.id] || []).length
        }));
        
        setGalleries(enrichedGalleries);
        
        // Fetch posts for specific gallery or all posts if no gallery selected
        if (activeGalleryId) {
          const galleryPostsResponse = await axiosClient.get(`/api/gallery/${activeGalleryId}/posts`);
          const galleryPosts = galleryPostsResponse.data.posts || [];
          
          // Transform to match GalleryPostData interface
          setPosts(galleryPosts.map((post: any) => ({
            id: post._id,
            galleryId: post.galleryId,
            images: post.images,
            description: post.description || '',
            createdAt: post.createdAt
          })));
        } else {
          // Show recent posts from all galleries
          const recentPosts = allPosts
            .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, 12);
            
          setPosts(recentPosts.map((post: any) => ({
            id: post._id,
            galleryId: post.galleryId,
            images: post.images,
            description: post.description || '',
            createdAt: post.createdAt
          })));
        }
      } catch (error) {
        console.error('Error fetching gallery data:', error);
        setError('Failed to load galleries. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [username, activeGalleryId]);
  
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
      {/* Error Message */}
      {error && (
        <Box 
          sx={{ 
            p: 2, 
            mb: 3, 
            bgcolor: 'error.light', 
            color: 'error.contrastText',
            borderRadius: 1 
          }}
        >
          <Typography>{error}</Typography>
        </Box>
      )}
      
      {/* Action Buttons */}
      {isOwner && (
        <Box sx={{ 
          display: 'flex', 
          gap: 2, 
          mb: 2,
          justifyContent: 'flex-start',
        }}>
          <KButton
            variant="contained"
            color="primary"
            onClick={handleUploadArtClick}
            sx={{ px: 2, py: 1 }}
          >
            Upload New Art
          </KButton>
          <KButton
            variantType='ghost'
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
          {galleries.length === 0 ? (
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
                mb: 3
              }}
            >
              <Typography color="text.secondary">
                No galleries found
              </Typography>
            </Box>
          ) : (
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
            </>
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
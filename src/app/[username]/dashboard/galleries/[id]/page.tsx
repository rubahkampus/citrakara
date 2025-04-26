// src/app/[username]/dashboard/galleries/[id]/page.tsx
import { findGalleryById } from '@/lib/db/repositories/gallery.repository';
import { listGalleryPosts } from '@/lib/services/galleryPost.service';
import DashboardGalleryDetailPage from '@/components/dashboard/galleries/DashboardGalleryDetailPage';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { Box, Skeleton, Typography } from '@mui/material';

interface Props {
  params: { username: string; id: string };
}

function GalleryDetailLoading() {
  return (
    <Box>
      <Skeleton variant="text" width="40%" height={40} sx={{ mb: 2 }} />
      <Skeleton variant="text" width="20%" height={24} sx={{ mb: 3 }} />
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' }, gap: 2 }}>
        {Array.from(new Array(6)).map((_, i) => (
          <Skeleton key={i} variant="rectangular" height={200} sx={{ borderRadius: 1 }} />
        ))}
      </Box>
    </Box>
  );
}

export default async function GalleryDetailPage({ params }: Props) {
  const { username, id } = await params;
  
  // Fetch gallery with posts
  const gallery = await findGalleryById(id).catch(() => null);
  
  // If gallery doesn't exist, return 404
  if (!gallery) {
    return notFound();
  }
  
  // Fetch posts for this gallery
  const posts = await listGalleryPosts(id).catch(() => []);
  
  // Serialize for client component
  const serializedGallery = JSON.parse(JSON.stringify(gallery));
  const serializedPosts = JSON.parse(JSON.stringify(posts));
  
  return (
    <Suspense fallback={<GalleryDetailLoading />}>
      <DashboardGalleryDetailPage 
        username={username} 
        gallery={serializedGallery} 
        initialPosts={serializedPosts} 
      />
    </Suspense>
  );
}
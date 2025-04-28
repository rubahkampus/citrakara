// src/app/[username]/dashboard/galleries/page.tsx
import { getGalleriesByUsername, getUserGalleries } from '@/lib/services/gallery.service';
import { listGalleryPosts } from '@/lib/services/galleryPost.service';
import DashboardGalleryPage from '@/components/dashboard/galleries/DashboardGalleryPage';
import { Suspense } from 'react';
import { Box, Skeleton, Typography } from '@mui/material';

interface Props {
  params: { username: string };
}

function GalleriesLoading() {
  return (
    <Box>
      <Skeleton variant="text" width="50%" height={40} sx={{ mb: 2 }} />
      <Skeleton variant="rectangular" height={60} sx={{ mb: 2, borderRadius: 1 }} />
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
        {Array.from(new Array(4)).map((_, i) => (
          <Skeleton key={i} variant="rectangular" height={120} sx={{ borderRadius: 1 }} />
        ))}
      </Box>
    </Box>
  );
}

export default async function GalleriesPage({ params }: Props) {
  const { username } = await params;
  
  // Fetch galleries with a basic error handling
  const galleries = await getGalleriesByUsername(username).catch(() => []);
  
  // Serialize for client component
  const serializedGalleries = JSON.parse(JSON.stringify(galleries));
  
  return (
    <Suspense fallback={<GalleriesLoading />}>
      <DashboardGalleryPage 
        username={username} 
        initialGalleries={serializedGalleries} 
      />
    </Suspense>
  );
}
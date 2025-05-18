// src/app/[username]/dashboard/galleries/[id]/page.tsx
import { Suspense } from 'react';
import { Box, Skeleton, Typography } from '@mui/material';
import DashboardGalleryDetailPage from '@/components/dashboard/galleries/DashboardGalleryDetailPage';
import { findGalleryById } from '@/lib/db/repositories/gallery.repository';
import { listGalleryPosts } from '@/lib/services/galleryPost.service';
import { notFound } from 'next/navigation';

function GalleryDetailLoading() {
  return (
    <Box>
      <Skeleton width="40%" height={40} sx={{ mb: 2 }} />
      <Skeleton width="20%" height={24} sx={{ mb: 3 }} />
      <Box display="grid" gridTemplateColumns={{ xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' }} gap={2}>
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} height={200} variant="rectangular" sx={{ borderRadius: 1 }} />
        ))}
      </Box>
    </Box>
  );
}

interface Props {
  params: { id: string; username: string };
}

export default async function GalleryDetailPage({ params }: Props) {
  const param = await params
  const id = param.id
  const username = param.username
  const gallery = await findGalleryById(id).catch(() => null);
  if (!gallery) return notFound();

  const posts = await listGalleryPosts(id).catch(() => []);
  return (
    <Suspense fallback={<GalleryDetailLoading />}>
      <DashboardGalleryDetailPage
        username={username}
        gallery={JSON.parse(JSON.stringify(gallery))}
        initialPosts={JSON.parse(JSON.stringify(posts))}
      />
    </Suspense>
  );
}

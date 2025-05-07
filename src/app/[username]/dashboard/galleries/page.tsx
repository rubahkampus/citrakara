// src/app/[username]/dashboard/galleries/page.tsx
import { Suspense } from "react";
import { Box, Skeleton, Typography } from "@mui/material";
import DashboardGalleryPage from "@/components/dashboard/galleries/DashboardGalleryPage";
import { getGalleriesByUsername } from "@/lib/services/gallery.service";

function GalleriesLoading() {
  return (
    <Box>
      <Skeleton width="50%" height={40} sx={{ mb: 2 }} />
      <Skeleton height={60} variant="rectangular" sx={{ mb: 2 }} />
      <Box
        display="grid"
        gridTemplateColumns={{ xs: "1fr", sm: "1fr 1fr" }}
        gap={2}
      >
        {[...Array(4)].map((_, i) => (
          <Skeleton
            key={i}
            height={120}
            variant="rectangular"
            sx={{ borderRadius: 1 }}
          />
        ))}
      </Box>
    </Box>
  );
}

interface Props {
  params: { username: string };
}

export default async function GalleriesPage({ params }: Props) {
  const param = await params;
  const username = param.username;
  const galleries = await getGalleriesByUsername(username).catch(() => []);
  return (
    <Suspense fallback={<GalleriesLoading />}>
      <DashboardGalleryPage
        username={username}
        initialGalleries={JSON.parse(JSON.stringify(galleries))}
      />
    </Suspense>
  );
}

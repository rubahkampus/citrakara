// src/components/profile/GallerySection.tsx
"use client";

import { useState, useEffect } from "react";
import { Box, Typography, Grid, Skeleton } from "@mui/material";
import { useRouter } from "next/navigation";
import { useDialogStore } from "@/lib/stores";
import { KButton } from "@/components/KButton";
import GalleryGrid from "./GalleryGrid";
import GalleryPostGrid from "./GalleryPostGrid";
import { GalleryData, GalleryPostData } from "@/lib/stores";
import { axiosClient } from "@/lib/utils/axiosClient";

// Constants
const INITIAL_GALLERIES_DISPLAY = 4;
const INITIAL_POSTS_DISPLAY = 6;
const MAX_RECENT_POSTS = 12;
const MAX_GALLERY_THUMBNAILS = 4;

// Types
interface GallerySectionProps {
  username: string;
  isOwner: boolean;
}

interface FetchDataResult {
  galleries: GalleryData[];
  posts: GalleryPostData[];
}

export default function GallerySection({
  username,
  isOwner,
}: GallerySectionProps) {
  // Hooks
  const router = useRouter();
  const openDialog = useDialogStore((state) => state.open);

  // State
  const [galleries, setGalleries] = useState<GalleryData[]>([]);
  const [posts, setPosts] = useState<GalleryPostData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [activeGalleryId, setActiveGalleryId] = useState<string | null>(null);

  // Helpers
  const fetchGalleriesAndPosts = async (): Promise<FetchDataResult> => {
    try {
      // Fetch all galleries
      const galRes = await axiosClient.get(`/api/user/${username}/galleries`);
      const rawGalleries = galRes.data.galleries || [];

      // Fetch all posts
      const allPostsRes = await axiosClient.get(`/api/user/${username}/posts`);
      const allPosts = allPostsRes.data.posts || [];

      // Group posts by gallery
      const postsByGallery: Record<string, any[]> = {};
      allPosts.forEach((p: any) => {
        if (!postsByGallery[p.galleryId]) postsByGallery[p.galleryId] = [];
        postsByGallery[p.galleryId].push(p);
      });

      // Enrich galleries with thumbnails and post counts
      const enrichedGalleries: GalleryData[] = rawGalleries.map((g: any) => ({
        _id: g._id,
        name: g.name,
        thumbnails: (postsByGallery[g._id] || [])
          .slice(0, MAX_GALLERY_THUMBNAILS)
          .map((p: any) => p.images[0] || ""),
        postCount: (postsByGallery[g._id] || []).length,
      }));

      // Determine which posts to display
      let postsToDisplay: GalleryPostData[] = [];

      if (activeGalleryId) {
        // Get posts for specific gallery
        const resp = await axiosClient.get(
          `/api/gallery/${activeGalleryId}/posts`
        );
        const galleryPosts = resp.data.posts || [];
        postsToDisplay = galleryPosts.map(mapPostToGalleryPostData);
      } else {
        // Get recent posts from all galleries
        const recentPosts = allPosts
          .sort(
            (a: any, b: any) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )
          .slice(0, MAX_RECENT_POSTS);
        postsToDisplay = recentPosts.map(mapPostToGalleryPostData);
      }

      return {
        galleries: enrichedGalleries,
        posts: postsToDisplay,
      };
    } catch (error) {
      console.error(error);
      throw new Error("Gagal memuat galeri. Silakan coba lagi.");
    }
  };

  const mapPostToGalleryPostData = (post: any) => ({
    _id: post._id,
    galleryId: post.galleryId,
    images: post.images,
    description: post.description || "",
    createdAt: post.createdAt,
  });

  // Effects
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);

      try {
        const result = await fetchGalleriesAndPosts();
        setGalleries(result.galleries);
        setPosts(result.posts);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [username, activeGalleryId]);

  // Event handlers
  const handleUploadArt = () => {
    openDialog("uploadArtwork", undefined, undefined, isOwner);
  };

  const handleManage = () => {
    router.push(`/${username}/dashboard/galleries`);
  };

  const toggleExpanded = () => setExpanded((ex) => !ex);

  const backToOverview = () => setActiveGalleryId(null);

  // Derived state
  const displayedGalleries = expanded
    ? galleries
    : galleries.slice(0, INITIAL_GALLERIES_DISPLAY);
  const activeGallery = galleries.find((g) => g._id === activeGalleryId);

  // UI Components
  const renderActionButtons = () => (
    <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
      <KButton onClick={handleUploadArt} sx={{ px: 4, py: 1 }}>
        Unggah Karya Baru
      </KButton>
      <KButton variantType="ghost" onClick={handleManage} sx={{ px: 4, py: 1 }}>
        Kelola Galeri
      </KButton>
    </Box>
  );

  const renderLoadingSkeleton = () => (
    <Grid container spacing={2}>
      {Array.from({ length: INITIAL_GALLERIES_DISPLAY }).map((_, i) => (
        <Grid item xs={6} sm={3} key={i}>
          <Skeleton
            variant="rectangular"
            sx={{ pb: "100%", borderRadius: 1 }}
          />
        </Grid>
      ))}
    </Grid>
  );

  const renderGalleryView = () => (
    <Box>
      <Box sx={{ mb: 2 }}>
        <Typography
          variant="body2"
          color="primary"
          onClick={backToOverview}
          sx={{ cursor: "pointer", "&:hover": { textDecoration: "underline" } }}
        >
          ← Kembali ke semua galeri
        </Typography>
      </Box>
      <Typography variant="h6" fontWeight="medium" sx={{ mb: 2 }}>
        {activeGallery?.name || "Galeri"}
      </Typography>
      <GalleryPostGrid posts={posts} />
    </Box>
  );

  const renderEmptyGalleries = () => (
    <Box
      sx={{
        height: 120,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "background.paper",
        border: "1px dashed",
        borderColor: "divider",
        borderRadius: 1,
        mb: 3,
      }}
    >
      <Typography color="text.secondary">Tidak ada galeri ditemukan</Typography>
    </Box>
  );

  const renderGalleriesOverview = () => (
    <>
      {galleries.length === 0 ? (
        renderEmptyGalleries()
      ) : (
        <>
          <GalleryGrid
            galleries={displayedGalleries}
            username={username}
            setActiveGalleryId={setActiveGalleryId}
          />
          {galleries.length > INITIAL_GALLERIES_DISPLAY && (
            <Box sx={{ textAlign: "center", mt: 2, mb: 3 }}>
              <KButton
                variant="text"
                onClick={toggleExpanded}
                sx={{ "&:hover": { bgcolor: "action.hover" } }}
              >
                {expanded ? "Tampilkan Lebih Sedikit" : "Lihat Lebih Banyak..."}
              </KButton>
            </Box>
          )}
        </>
      )}

      {posts.length > 0 && (
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" fontWeight="medium" sx={{ mb: 2 }}>
            Unggahan Terbaru
          </Typography>
          <GalleryPostGrid posts={posts.slice(0, INITIAL_POSTS_DISPLAY)} />
        </Box>
      )}
    </>
  );

  // Main Render
  return (
    <Box>
      {error && (
        <Box
          sx={{
            p: 2,
            mb: 3,
            bgcolor: "error.light",
            color: "error.contrastText",
            borderRadius: 1,
          }}
        >
          <Typography>{error}</Typography>
        </Box>
      )}

      {isOwner && renderActionButtons()}

      {loading
        ? renderLoadingSkeleton()
        : activeGalleryId
        ? renderGalleryView()
        : renderGalleriesOverview()}
    </Box>
  );
}

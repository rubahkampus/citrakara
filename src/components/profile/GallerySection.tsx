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

interface GallerySectionProps {
  username: string;
  isOwner: boolean;
}

export default function GallerySection({
  username,
  isOwner,
}: GallerySectionProps) {
  const router = useRouter();
  const openDialog = useDialogStore((state) => state.open);
  const [galleries, setGalleries] = useState<GalleryData[]>([]);
  const [posts, setPosts] = useState<GalleryPostData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [activeGalleryId, setActiveGalleryId] = useState<string | null>(null);

  // Fetch galleries and posts when username or activeGalleryId changes
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Fetch all galleries
        const galRes = await axiosClient.get(`/api/user/${username}/galleries`);
        const rawGalleries = galRes.data.galleries || [];

        // Fetch all posts
        const allPostsRes = await axiosClient.get(
          `/api/user/${username}/posts`
        );
        const allPosts = allPostsRes.data.posts || [];

        // Group posts by gallery
        const postsByGallery: Record<string, any[]> = {};
        allPosts.forEach((p: any) => {
          if (!postsByGallery[p.galleryId]) postsByGallery[p.galleryId] = [];
          postsByGallery[p.galleryId].push(p);
        });

        // Enrich galleries
        const enriched: GalleryData[] = rawGalleries.map((g: any) => ({
          _id: g._id,
          name: g.name,
          thumbnails: (postsByGallery[g._id] || [])
            .slice(0, 4)
            .map((p: any) => p.images[0] || ""),
          postCount: (postsByGallery[g._id] || []).length,
        }));
        setGalleries(enriched);

        // Determine posts to display
        if (activeGalleryId) {
          const resp = await axiosClient.get(
            `/api/gallery/${activeGalleryId}/posts`
          );
          const galleryPosts = resp.data.posts || [];
          setPosts(
            galleryPosts.map((p: any) => ({
              _id: p._id,
              galleryId: p.galleryId,
              images: p.images,
              description: p.description || "",
              createdAt: p.createdAt,
            }))
          );
        } else {
          // Recent posts from all galleries
          const recent = allPosts
            .sort(
              (a: any, b: any) =>
                new Date(b.createdAt).getTime() -
                new Date(a.createdAt).getTime()
            )
            .slice(0, 12);
          setPosts(
            recent.map((p: any) => ({
              _id: p._id,
              galleryId: p.galleryId,
              images: p.images,
              description: p.description || "",
              createdAt: p.createdAt,
            }))
          );
        }
      } catch (e) {
        console.error(e);
        setError("Failed to load galleries. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [username, activeGalleryId]);

  const handleUploadArt = () => {
    openDialog("uploadArtwork", undefined, undefined, isOwner);
  };

  const handleManage = () => {
    // Redirect to dashboard galleries page
    router.push(`/${username}/dashboard/galleries`);
  };

  const toggleExpanded = () => setExpanded((ex) => !ex);

  const backToOverview = () => setActiveGalleryId(null);

  const displayedGalleries = expanded ? galleries : galleries.slice(0, 4);

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

      {isOwner && (
        <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
          <KButton onClick={handleUploadArt} sx={{ px: 4, py: 1 }}>Upload New Art</KButton>
          <KButton variantType="ghost" onClick={handleManage} sx={{ px: 4, py: 1 }}>
            Manage Galleries
          </KButton>
        </Box>
      )}

      {loading ? (
        <Grid container spacing={2}>
          {Array.from({ length: 4 }).map((_, i) => (
            <Grid item xs={6} sm={3} key={i}>
              <Skeleton
                variant="rectangular"
                sx={{ pb: "100%", borderRadius: 1 }}
              />
            </Grid>
          ))}
        </Grid>
      ) : activeGalleryId ? (
        <Box>
          <Box sx={{ mb: 2 }}>
            <Typography
              variant="body2"
              color="primary"
              onClick={backToOverview}
              sx={{ cursor: "pointer" }}
            >
              ← Back to all galleries
            </Typography>
          </Box>
          <Typography variant="h6" fontWeight="medium" sx={{ mb: 2 }}>
            {galleries.find((g) => g._id === activeGalleryId)?.name ||
              "Gallery"}
          </Typography>
          <GalleryPostGrid posts={posts} />
        </Box>
      ) : (
        <>
          {galleries.length === 0 ? (
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
              <Typography color="text.secondary">No galleries found</Typography>
            </Box>
          ) : (
            <>
              <GalleryGrid
                galleries={displayedGalleries}
                username={username}
                setActiveGalleryId={setActiveGalleryId}
              />
              {galleries.length > 4 && (
                <Box sx={{ textAlign: "center", mt: 2, mb: 3 }}>
                  <KButton variant="text" onClick={toggleExpanded}>
                    {expanded ? "Show Less" : "See More..."}
                  </KButton>
                </Box>
              )}
            </>
          )}

          {posts.length > 0 && (
            <Box sx={{ mt: 4 }}>
              <Typography variant="h6" fontWeight="medium" sx={{ mb: 2 }}>
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

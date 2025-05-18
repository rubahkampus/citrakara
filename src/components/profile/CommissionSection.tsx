// src/components/profile/CommissionSection.tsx
"use client";

import { useState, useEffect } from "react";
import { Box, Typography, Grid, Skeleton } from "@mui/material";
import { useDialogStore } from "@/lib/stores";
import { KButton } from "@/components/KButton";
import CommissionCard from "./CommissionCard";
import { axiosClient } from "@/lib/utils/axiosClient";
import { useRouter } from "next/navigation";
import { ICommissionListing } from "@/lib/db/models/commissionListing.model";

// Constants
const LOADING_SKELETON_COUNT = 2;
const EMPTY_CONTAINER_HEIGHT = 150;

// Types
interface CommissionSectionProps {
  username: string;
  isOwner: boolean;
  isAuthenticated?: boolean;
}

export default function CommissionSection({
  username,
  isOwner,
  isAuthenticated = false,
}: CommissionSectionProps) {
  // Hooks
  const router = useRouter();
  const openDialog = useDialogStore((state) => state.open);

  // State
  const [commissions, setCommissions] = useState<ICommissionListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bookmarkedCommissions, setBookmarkedCommissions] = useState<string[]>(
    []
  );
  const [bookmarksLoading, setBookmarksLoading] = useState(false);

  // Helpers
  const fetchCommissions = async () => {
    try {
      const response = await axiosClient.get(
        `/api/commission/user/${username}`
      );
      return response.data.listings || [];
    } catch (err: any) {
      throw new Error(err.response?.data?.error || "Gagal memuat komisi");
    }
  };

  const fetchBookmarkedCommissions = async () => {
    if (!isAuthenticated) return [];

    setBookmarksLoading(true);
    try {
      const response = await axiosClient.get(
        `/api/user/bookmarks?type=commissions`
      );

      if (response.data?.bookmarks) {
        // Extract commission IDs
        return response.data.bookmarks.map((item: any) => item._id.toString());
      }
      return [];
    } catch (err) {
      console.error("Error fetching bookmarks:", err);
      return [];
    } finally {
      setBookmarksLoading(false);
    }
  };

  // Effects
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);

      try {
        const [listings, bookmarkedIds] = await Promise.all([
          fetchCommissions(),
          isAuthenticated ? fetchBookmarkedCommissions() : [],
        ]);

        setCommissions(listings);
        setBookmarkedCommissions(bookmarkedIds);
      } catch (err) {
        setError((err as Error).message);
        setCommissions([]);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [username, isAuthenticated]);

  // Event handlers
  const handleCreate = () => {
    router.push(`/${username}/dashboard/commissions/new`);
  };

  const handleManage = () => {
    router.push(`/${username}/dashboard/commissions`);
  };

  // Check if a commission is bookmarked
  const isCommissionBookmarked = (commissionId: string) => {
    return bookmarkedCommissions.includes(commissionId);
  };

  // UI Components
  const renderActionButtons = () => (
    <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
      <KButton
        onClick={handleCreate}
        sx={{
          px: 4,
          py: 1,
          "&:hover": {
            bgcolor: "primary.dark",
          },
        }}
      >
        Buat Komisi Baru
      </KButton>
      <KButton
        variantType="ghost"
        onClick={handleManage}
        sx={{
          px: 4,
          py: 1,
          "&:hover": {
            bgcolor: "action.hover",
          },
        }}
      >
        Kelola Komisi
      </KButton>
    </Box>
  );

  const renderLoadingSkeleton = () => (
    <Box>
      {[...Array(LOADING_SKELETON_COUNT)].map((_, i) => (
        <Skeleton
          key={i}
          variant="rectangular"
          height={140}
          sx={{ mb: 2, borderRadius: 1 }}
        />
      ))}
    </Box>
  );

  const renderErrorMessage = () => (
    <Box
      sx={{
        height: EMPTY_CONTAINER_HEIGHT,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "error.light",
        borderRadius: 1,
        border: "1px solid",
        borderColor: "error.main",
        color: "error.contrastText",
        p: 2,
      }}
    >
      <Typography>{error}</Typography>
    </Box>
  );

  const renderEmptyCommissions = () => (
    <Box
      sx={{
        height: EMPTY_CONTAINER_HEIGHT,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "background.paper",
        borderRadius: 1,
        border: "1px dashed",
        borderColor: "divider",
      }}
    >
      <Typography color="text.secondary">Tidak ada komisi tersedia</Typography>
    </Box>
  );

  const renderCommissionsList = () => (
    <Grid container spacing={2}>
      {commissions.map((commission) => (
        <Grid item xs={12} key={commission._id.toString()}>
          <CommissionCard
            commission={commission}
            isOwner={isOwner}
            username={username}
            isAuthenticated={isAuthenticated}
            initialBookmarkStatus={isCommissionBookmarked(
              commission._id.toString()
            )}
          />
        </Grid>
      ))}
    </Grid>
  );

  // Main Render
  return (
    <Box>
      {isOwner && renderActionButtons()}

      {loading
        ? renderLoadingSkeleton()
        : error
        ? renderErrorMessage()
        : commissions.length === 0
        ? renderEmptyCommissions()
        : renderCommissionsList()}
    </Box>
  );
}

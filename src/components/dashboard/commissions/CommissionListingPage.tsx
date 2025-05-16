// src/components/dashboard/commissions/CommissionListingPage.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Grid,
  Paper,
  Typography,
  Alert,
  Button,
  Breadcrumbs,
  Link,
} from "@mui/material";
import {
  Add as AddIcon,
  ArrowBack,
  BookmarksOutlined,
  BrushRounded,
  Home,
  NavigateNext,
} from "@mui/icons-material";
import { KButton } from "@/components/KButton";
import { axiosClient } from "@/lib/utils/axiosClient";
import { ICommissionListing } from "@/lib/db/models/commissionListing.model";
import { CommissionListingItem } from "./CommissionListingItem";

interface CommissionListingPageProps {
  username: string;
  listings: ICommissionListing[];
  error: string | null;
}

export default function CommissionListingPage({
  username,
  listings,
  error: initialError,
}: CommissionListingPageProps) {
  const router = useRouter();
  const [localListings, setLocalListings] = useState(listings);
  const [error, setError] = useState<string | null>(initialError);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState<Record<string, boolean>>({});

  const handleCreateNew = () => {
    router.push(`/${username}/dashboard/commissions/new`);
  };

  const handleToggleActive = async (listingId: string, newStatus: boolean) => {
    setLoading((prev) => ({ ...prev, [listingId]: true }));

    try {
      await axiosClient.patch(`/api/commission/listing/${listingId}`, {
        active: newStatus,
      });

      setLocalListings((prev) =>
        prev.map((l) =>
          l._id.toString() === listingId
            ? ({ ...l, isActive: newStatus } as ICommissionListing)
            : l
        )
      );

      setSuccess(
        `Commission ${newStatus ? "activated" : "deactivated"} successfully`
      );
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(
        err.response?.data?.error || "Failed to update commission status"
      );
    } finally {
      setLoading((prev) => ({ ...prev, [listingId]: false }));
    }
  };

  const handleDeleteCommission = async (listingId: string) => {
    setLoading((prev) => ({ ...prev, [listingId]: true }));

    try {
      await axiosClient.delete(`/api/commission/listing/${listingId}`);
      setLocalListings((prev) =>
        prev.filter((l) => l._id.toString() !== listingId)
      );
      setSuccess("Commission deleted successfully");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to delete commission");
    } finally {
      setLoading((prev) => ({ ...prev, [listingId]: false }));
    }
  };

  return (
    <Box>
      {/* Header with action button */}
      <Box
        sx={{
          mb: 3,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <Breadcrumbs separator={<NavigateNext fontSize="small" />}>
            <Link
              component={Link}
              href={`/${username}/dashboard`}
              underline="hover"
              color="inherit"
              sx={{ display: "flex", alignItems: "center" }}
            >
              <Home fontSize="small" sx={{ mr: 0.5 }} />
              Dashboard
            </Link>
            <Typography
              color="text.primary"
              sx={{ display: "flex", alignItems: "center" }}
            >
              <BrushRounded fontSize="small" sx={{ mr: 0.5 }} />
              Komisi
            </Typography>
          </Breadcrumbs>

          <Box display="flex" alignItems="center" mt={4} ml={-0.5}>
            <BrushRounded sx={{ mr: 1, color: "primary.main", fontSize: 32 }} />
            <Typography variant="h4" fontWeight="bold">
              Komisi Saya
            </Typography>
          </Box>
        </Box>

        <Button
          component={Link}
          href={`/${username}/dashboard`}
          variant="outlined"
          startIcon={<ArrowBack />}
          size="small"
          mt={-1}
        >
          Kembali ke Profil
        </Button>
      </Box>

      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <KButton startIcon={<AddIcon />} onClick={handleCreateNew} sx={{px: 5}}>
          Buat Komisi Baru
        </KButton>
      </Box>

      {/* Notifications */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert
          severity="success"
          sx={{ mb: 3 }}
          onClose={() => setSuccess(null)}
        >
          {success}
        </Alert>
      )}

      {/* Commission listings */}
      {localListings.length === 0 ? (
        <Paper
          sx={{
            p: 4,
            textAlign: "center",
            borderRadius: 2,
            border: "1px solid",
            borderColor: "divider",
            bgcolor: "background.paper",
            boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
          }}
        >
          <Typography variant="body1" color="text.secondary" gutterBottom>
            Kamu belum punya daftar komisi saat ini.
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleCreateNew}
            sx={{ mt: 2 }}
          >
            Buat Listing Komisi Pertamamu
          </Button>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {localListings.map((listing) => (
            <Grid item xs={12} sm={6} lg={4} key={listing._id.toString()}>
              <CommissionListingItem
                listing={listing}
                username={username}
                isOwner={true}
                onStatusToggle={handleToggleActive}
                onDelete={handleDeleteCommission}
                loading={loading[listing._id.toString()]}
              />
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
}

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

interface CommissionSectionProps {
  username: string;
  isOwner: boolean;
}

export default function CommissionSection({
  username,
  isOwner,
}: CommissionSectionProps) {
  const openDialog = useDialogStore((state) => state.open);
  const [commissions, setCommissions] = useState<ICommissionListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();

  useEffect(() => {
    const fetchCommissions = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await axiosClient.get(
          `/api/commission/user/${username}`
        );
        setCommissions(response.data.listings || []);
      } catch (err: any) {
        setError(err.response?.data?.error || "Failed to load commissions");
        setCommissions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCommissions();
  }, [username]);

  const handleCreate = () => {
    router.push(`/${username}/dashboard/commissions/new`);
  };

  const handleManage = () => {
    // Navigate to commissions dashboard page
    router.push(`/${username}/dashboard/commissions`);
  };

  return (
    <Box>
      {isOwner && (
        <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
          <KButton onClick={handleCreate} sx={{ px: 4, py: 1 }}>
            Create New Commission
          </KButton>
          <KButton
            variantType="ghost"
            onClick={handleManage}
            sx={{ px: 4, py: 1 }}
          >
            Manage Commissions
          </KButton>
        </Box>
      )}

      {loading ? (
        <Box>
          {[...Array(2)].map((_, i) => (
            <Skeleton
              key={i}
              variant="rectangular"
              height={140}
              sx={{ mb: 2, borderRadius: 1 }}
            />
          ))}
        </Box>
      ) : error ? (
        <Box
          sx={{
            height: 150,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            bgcolor: "error.light",
            borderRadius: 1,
            border: "1px solid",
            borderColor: "error.main",
            color: "error.contrastText",
          }}
        >
          <Typography>{error}</Typography>
        </Box>
      ) : commissions.length === 0 ? (
        <Box
          sx={{
            height: 150,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            bgcolor: "background.paper",
            borderRadius: 1,
            border: "1px dashed",
            borderColor: "divider",
          }}
        >
          <Typography color="text.secondary">
            No commissions available
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={2}>
          {commissions.map((c) => (
            <Grid item xs={12} key={c._id.toString()}>
              <CommissionCard
                commission={c}
                isOwner={isOwner}
                username={username}
              />
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
}

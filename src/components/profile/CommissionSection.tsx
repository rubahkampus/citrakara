// src/components/profile/CommissionSection.tsx
"use client";

import { useState, useEffect } from "react";
import { Box, Typography, Grid, Skeleton } from "@mui/material";
import { useDialogStore } from "@/lib/stores";
import { KButton } from "@/components/KButton";
import CommissionCard from "./CommissionCard";
import { axiosClient } from "@/lib/utils/axiosClient";
import { useRouter } from "next/router";
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

  const router = useRouter();

  useEffect(() => {
    // Replace with real API when ready
    setLoading(true);
    axiosClient
      .get(`/api/commission/user/${username}`)
      .then((res) => setCommissions(res.data.listings))
      .catch(() => {
        // fallback to mock or empty
        setCommissions([]);
      })
      .finally(() => setLoading(false));
  }, [username]);

  const handleCreate = () => {
    // Fixed route path
    router.push(`/${username}/dashboard/commissions/new`);
    // Log for debugging purposes
    console.log("Navigating to create commission page");
  };

  const handleManage = () => {
    openDialog("viewCommission", undefined, undefined, isOwner);
  };

  const handleClick = (commission: ICommissionListing) => {
    openDialog(
      "viewCommission",
      commission._id.toString(),
      commission,
      isOwner
    );
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
        <Grid container spacing={0}>
          {commissions.map((c) => (
            <Grid item xs={12} key={c._id.toString()}>
              <CommissionCard commission={c} isOwner={isOwner} />
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
}

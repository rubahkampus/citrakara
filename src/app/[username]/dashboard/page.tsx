// src/app/[username]/dashboard/page.tsx
import { Suspense } from "react";
import { Paper, Box, Skeleton, Typography } from "@mui/material";
import DashboardProfileRenderer from "@/components/dashboard/DashboardProfileRenderer";
import { getUserPublicProfile } from "@/lib/services/user.service";
import { getWalletSummary } from "@/lib/services/wallet.service";
import { notFound } from "next/navigation";
import { getAuthSession, isUserOwner, Session } from "@/lib/utils/session";

function ProfileLoading() {
  return (
    <Paper sx={{ p: 3, borderRadius: 2 }}>
      <Box display="flex" alignItems="center" gap={2}>
        <Skeleton variant="circular" width={80} height={80} />
        <Box>
          <Skeleton width={200} height={32} />
          <Skeleton width={150} height={24} />
        </Box>
      </Box>
      <Box
        mt={4}
        display="grid"
        gridTemplateColumns={{ xs: "1fr", sm: "1fr 1fr" }}
        gap={3}
      >
        <Skeleton height={100} />
        <Skeleton height={100} />
      </Box>
    </Paper>
  );
}

interface Props {
  params: { username: string };
}

export default async function DashboardPage({ params }: Props) {
  const param = await params
  const username = param.username;
  const session = await getAuthSession();

  // Check if the current user is the owner of this profile
  const isOwner = isUserOwner(session as Session, username);

  if (!isOwner) {
    return notFound();
  }

  const [profile, walletSummary] = await Promise.all([
    getUserPublicProfile(username),
    getWalletSummary((session as Session).id).catch(() => ({
      available: 0,
      escrowed: 0,
      total: 0,
    })),
  ]);

  if (!profile) {
    return (
      <Paper sx={{ p: 4, borderRadius: 2, textAlign: "center" }}>
        <Typography variant="h5" color="error">
          Profile not found
        </Typography>
      </Paper>
    );
  }

  // Convert cents to dollars/currency units for display
  const formattedBalance = Math.round(walletSummary.available / 100);
  const serializedProfile = JSON.parse(JSON.stringify(profile));

  return (
    <Suspense fallback={<ProfileLoading />}>
      <DashboardProfileRenderer
        profile={serializedProfile}
        saldo={formattedBalance}
        tosSummary=""
        isOwner={isOwner}
      />
    </Suspense>
  );
}

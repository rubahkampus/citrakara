// src/app/[username]/dashboard/wallet/page.tsx
import { Suspense } from "react";
import { Box, Typography, Alert } from "@mui/material";
import { getAuthSession, isUserOwner, Session } from "@/lib/utils/session";
import { getWalletSummary } from "@/lib/services/wallet.service";
import DashboardLoadingSkeleton from "@/components/dashboard/DashboardLoadingSkeleton";

// This component would be created in src/components/dashboard/wallet/
import WalletDashboardPage from "@/components/dashboard/wallet/WalletDashboardPage";

interface WalletPageProps {
  params: { username: string };
}

export default async function WalletPage({ params }: WalletPageProps) {
  const param = await params;
  const { username } = param;
  const session = await getAuthSession();

  if (!session || !isUserOwner(session as Session, username)) {
    return <Alert severity="error">You do not have access to this page</Alert>;
  }

  let walletSummary;
  try {
    walletSummary = await getWalletSummary((session as Session).id);
  } catch (err) {
    console.error("Error fetching wallet:", err);
    return <Alert severity="error">Failed to load wallet data</Alert>;
  }

  return (
    <Box>
      <Typography variant="h5" fontWeight="bold" sx={{ mb: 3 }}>
        My Wallet
      </Typography>

      <Suspense fallback={<DashboardLoadingSkeleton />}>
        {/* This component would be implemented separately */}
        <WalletDashboardPage
          username={username}
          walletSummary={walletSummary}
        />
      </Suspense>
    </Box>
  );
}

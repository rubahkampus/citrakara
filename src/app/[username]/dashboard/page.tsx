// src/app/[username]/dashboard/page.tsx
import { getUserWalletBalance } from '@/lib/services/wallet.service';
import { getUserTosEntries } from '@/lib/services/tos.service'; 
import { getUserPublicProfile } from '@/lib/services/user.service';
import DashboardProfileRenderer from '@/components/dashboard/DashboardProfileRenderer';
import { Suspense } from 'react';
import { Skeleton, Box, Typography, Paper } from '@mui/material';
import { WalletBalanceResponse } from '@/types/wallet';

interface Props {
  params: { username: string };
}

// Loading component for the profile section
function ProfileLoading() {
  return (
    <Paper sx={{ p: 3, borderRadius: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Skeleton variant="circular" width={80} height={80} />
        <Box>
          <Skeleton variant="text" width={200} height={32} />
          <Skeleton variant="text" width={150} height={24} />
        </Box>
      </Box>
      <Box sx={{ mt: 4, display: 'grid', gridTemplateColumns: {xs: '1fr', sm: '1fr 1fr'}, gap: 3 }}>
        <Skeleton variant="rectangular" height={100} />
        <Skeleton variant="rectangular" height={100} />
      </Box>
    </Paper>
  );
}

export default async function DashboardPage({ params }: Props) {
  const { username } = params;
  
  // Parallel data fetching for better performance
  const [profile, walletData, tosEntries] = await Promise.all([
    getUserPublicProfile(username),
    getUserWalletBalance(username).catch((): WalletBalanceResponse => ({ 
      saldoAvailable: 0, 
      saldoEscrowed: 0, 
      available: 0,
      escrowed: 0,
      total: 0 
    })),
    getUserTosEntries(username).catch(() => [])
  ]);

  // Handle case where profile might not exist
  if (!profile) {
    return (
      <Paper sx={{ p: 4, borderRadius: 2, textAlign: 'center' }}>
        <Typography variant="h5" color="error">
          Profile not found
        </Typography>
      </Paper>
    );
  }
  
  // Format wallet balance (convert from cents to IDR)
  const formattedBalance = Math.round((walletData.saldoAvailable || 0) / 100);
  
  // TOS summary text based on entries
  const tosSummary = tosEntries && tosEntries.length > 0 
    ? `${tosEntries.length} TOS template${tosEntries.length > 1 ? 's' : ''} created`
    : 'Belum membuat TOS';

  // Serialize data for client component
  const serializedProfile = JSON.parse(JSON.stringify(profile));
  
  return (
    <Suspense fallback={<ProfileLoading />}>
      <DashboardProfileRenderer
        profile={serializedProfile}
        saldo={formattedBalance}
        tosSummary={tosSummary}
      />
    </Suspense>
  );
}
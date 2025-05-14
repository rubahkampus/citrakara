// src/app/[username]/dashboard/wallet/contracts/page.tsx
import { Suspense } from "react";
import { Box, Typography, Alert } from "@mui/material";
import { getAuthSession, isUserOwner, Session } from "@/lib/utils/session";
import { getUserContracts } from "@/lib/services/contract.service";
import DashboardLoadingSkeleton from "@/components/dashboard/DashboardLoadingSkeleton";

// This component would be created in src/components/dashboard/wallet/
import ClaimableContractsPage from "@/components/dashboard/wallet/ClaimableContractsPage";

interface ClaimableContractsPageProps {
  params: { username: string };
}

export default async function WalletClaimableContractsPage({
  params,
}: ClaimableContractsPageProps) {
  const param = await params
  const { username } = param;
  const session = await getAuthSession();

  if (!session || !isUserOwner(session as Session, username)) {
    return <Alert severity="error">You do not have access to this page</Alert>;
  }

  let contracts;
  try {
    contracts = await getUserContracts((session as Session).id);
  } catch (err) {
    console.error("Error fetching contracts:", err);
    return <Alert severity="error">Failed to load contract data</Alert>;
  }

  console.log(contracts)

  // Filter for contracts that have claimable funds
  const asArtist = contracts.asArtist.filter(
    (contract) =>
      [
        "completed",
        "completedLate",
        "cancelledClient",
        "cancelledClientLate",
        "cancelledArtist",
        "cancelledArtistLate",
      ].includes(contract.status) && contract.finance.totalOwnedByArtist > 0
  );

  const asClient = contracts.asClient.filter(
    (contract) =>
      [
        "completedLate",
        "cancelledClient",
        "cancelledClientLate",
        "cancelledArtist",
        "cancelledArtistLate",
        "notCompleted",
      ].includes(contract.status) && contract.finance.totalOwnedByClient > 0
  );

  // Serialize for client components
  const serializedAsArtist = JSON.parse(JSON.stringify(asArtist));
  const serializedAsClient = JSON.parse(JSON.stringify(asClient));

  console.log(serializedAsArtist)
  console.log(serializedAsClient)

  return (
    <Box>
      <Typography variant="h5" fontWeight="bold" sx={{ mb: 3 }}>
        Claimable Contracts
      </Typography>

      <Suspense fallback={<DashboardLoadingSkeleton />}>
        {/* This component would be implemented separately */}
        <ClaimableContractsPage
          username={username}
          asArtist={serializedAsArtist}
          asClient={serializedAsClient}
          userId={(session as Session).id}
        />
        <Box>
          <Typography variant="h6">Claimable as Artist</Typography>
          {asArtist.length === 0 ? (
            <Typography>No contracts with claimable funds as artist</Typography>
          ) : (
            <Typography>
              Found {asArtist.length} contracts with claimable funds as artist
            </Typography>
          )}

          <Typography variant="h6" sx={{ mt: 3 }}>
            Claimable as Client
          </Typography>
          {asClient.length === 0 ? (
            <Typography>No contracts with claimable funds as client</Typography>
          ) : (
            <Typography>
              Found {asClient.length} contracts with claimable funds as client
            </Typography>
          )}
        </Box>
      </Suspense>
    </Box>
  );
}

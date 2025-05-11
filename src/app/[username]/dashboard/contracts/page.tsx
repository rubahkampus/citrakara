// src/app/[username]/dashboard/contracts/page.tsx
import { Suspense } from "react";
import { Box, Typography, Alert } from "@mui/material";
import { getAuthSession, isUserOwner, Session } from "@/lib/utils/session";
import { getUserContracts } from "@/lib/services/contract.service";
import DashboardLoadingSkeleton from "@/components/dashboard/DashboardLoadingSkeleton";

// This component would be created in src/components/dashboard/contracts/
import ContractListingPage from "@/components/dashboard/contracts/ContractListingPage";

interface ContractsPageProps {
  params: { username: string };
}

export default async function ContractsPage({ params }: ContractsPageProps) {
  const param = params
  const username = param.username;
  const session = await getAuthSession();

  if (!session || !isUserOwner(session as Session, username)) {
    return <Alert severity="error">You do not have access to this page</Alert>;
  }

  let contracts;
  try {
    contracts = await getUserContracts((session as Session).id);
  } catch (err) {
    console.error("Error fetching contracts:", err);
    return <Alert severity="error">Failed to load your contracts</Alert>;
  }

  const asArtist = contracts?.asArtist ?? [];
  const asClient = contracts?.asClient ?? [];

  // Serialize for client components
  const serializedAsArtist = JSON.parse(JSON.stringify(asArtist));
  const serializedAsClient = JSON.parse(JSON.stringify(asClient));

  return (
    <Box>
      <Typography variant="h5" fontWeight="bold" sx={{ mb: 3 }}>
        My Contracts
      </Typography>

      <Suspense fallback={<DashboardLoadingSkeleton />}>
        {/* This component would be implemented separately */}
        <ContractListingPage
          username={username}
          asArtist={serializedAsArtist}
          asClient={serializedAsClient}
        />
        <Typography>Contract listing component would be here</Typography>
      </Suspense>
    </Box>
  );
}

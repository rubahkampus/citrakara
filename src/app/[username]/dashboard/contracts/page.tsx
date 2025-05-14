import { Suspense } from "react";
import { Box, Typography, Alert, Container, Paper } from "@mui/material";
import { getAuthSession, isUserOwner, Session } from "@/lib/utils/session";
import { getUserContracts } from "@/lib/services/contract.service";
import DashboardLoadingSkeleton from "@/components/dashboard/DashboardLoadingSkeleton";

// Import the components we created
import ContractListingPage from "@/components/dashboard/contracts/ContractListingPage";
import ContractListingSkeleton from "@/components/dashboard/contracts/ContractListingSkeleton";

interface ContractsPageProps {
  params: { username: string };
}

export default async function ContractsPage({ params }: ContractsPageProps) {
  const param = await params;
  const username = await param.username;
  const session = await getAuthSession();

  if (!session || !isUserOwner(session as Session, username)) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert
          severity="error"
          sx={{
            borderRadius: 1,
            boxShadow: "0 1px 3px rgba(0,0,0,0.12)",
          }}
        >
          You do not have access to this page. Please log in with the correct
          account.
        </Alert>
      </Container>
    );
  }

  let contracts;
  let error = null;

  try {
    contracts = await getUserContracts((session as Session).id);
  } catch (err) {
    console.error("Error fetching contracts:", err);
    error = "Failed to load your contracts. Please try refreshing the page.";
  }

  const asArtist = contracts?.asArtist ?? [];
  const asClient = contracts?.asClient ?? [];

  // Serialize for client components
  const serializedAsArtist = JSON.parse(JSON.stringify(asArtist));
  const serializedAsClient = JSON.parse(JSON.stringify(asClient));

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Typography
        variant="h5"
        fontWeight="bold"
        sx={{
          mb: 4,
          borderBottom: "1px solid",
          borderColor: "divider",
          pb: 2,
        }}
      >
        My Contracts
      </Typography>

      <Suspense fallback={<ContractListingSkeleton />}>
        <ContractListingPage
          username={username}
          asArtist={serializedAsArtist}
          asClient={serializedAsClient}
          error={error ?? undefined}
        />
      </Suspense>
    </Container>
  );
}

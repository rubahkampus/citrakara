// src/app/[username]/dashboard/contracts/[contractId]/page.tsx
import { Suspense } from "react";
import { Box, Alert } from "@mui/material";
import { getAuthSession, isUserOwner, Session } from "@/lib/utils/session";
import { getContractById } from "@/lib/services/contract.service";
import DashboardLoadingSkeleton from "@/components/dashboard/DashboardLoadingSkeleton";

// This component would be created in src/components/dashboard/contracts/
// import ContractDetailsPage from "@/components/dashboard/contracts/ContractDetailsPage";

interface ContractDetailsPageProps {
  params: {
    username: string;
    contractId: string;
  };
}

export default async function ContractDetailsPage({
  params,
}: ContractDetailsPageProps) {
  const { username, contractId } = params;
  const session = await getAuthSession();

  if (!session || !isUserOwner(session as Session, username)) {
    return <Alert severity="error">You do not have access to this page</Alert>;
  }

  let contract;
  try {
    contract = await getContractById(contractId, (session as Session).id);
  } catch (err) {
    console.error("Error fetching contract:", err);
    return <Alert severity="error">Failed to load contract details</Alert>;
  }

  // Serialize for client components
  const serializedContract = JSON.parse(JSON.stringify(contract));

  return (
    <Box>
      <Suspense fallback={<DashboardLoadingSkeleton />}>
        {/* This component would be implemented separately */}
        {/* <ContractDetailsPage
          username={username}
          contract={serializedContract}
          userId={session.id}
        /> */}
        <Box>Contract details for {contractId} would be displayed here</Box>
      </Suspense>
    </Box>
  );
}

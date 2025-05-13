// src/app/[username]/dashboard/contracts/[contractId]/page.tsx
import { Suspense } from "react";
import { Box, Alert, Typography, Paper, CircularProgress } from "@mui/material";
import { getAuthSession, isUserOwner, Session } from "@/lib/utils/session";
import { getContractById } from "@/lib/services/contract.service";
import DashboardLoadingSkeleton from "@/components/dashboard/DashboardLoadingSkeleton";
// Import the model registration function
import { ensureModelsRegistered } from "@/lib/db/models";

// This component would be created in src/components/dashboard/contracts/
import ContractDetailsPageWrapper from "@/components/dashboard/contracts/ContractDetailsPage";

interface ContractDetailsPageProps {
  params: {
    username: string;
    contractId: string;
  };
}

export default async function ContractDetailsPage({
  params,
}: ContractDetailsPageProps) {
  const param = await params
  const { username, contractId } = param;

  // Ensure all models are registered at the page level
  ensureModelsRegistered();

  const session = await getAuthSession();

  if (!session || !isUserOwner(session as Session, username)) {
    return <Alert severity="error">You do not have access to this page</Alert>;
  }

  let contract;
  let error = null;

  try {
    contract = await getContractById(contractId, (session as Session).id);
  } catch (err) {
    console.error("Error fetching contract:", err);
    error = err;
  }

  if (error) {
    return (
      <Alert severity="error">
        Failed to load contract details.{" "}
        {typeof error === "object" && "message" in error
          ? String((error as any).message)
          : "Unknown error occurred."}
      </Alert>
    );
  }

  if (!contract) {
    return <Alert severity="error">Contract not found</Alert>;
  }

  // Serialize for client components
  const serializedContract = JSON.parse(JSON.stringify(contract));

  return (
    <Box>
      <Suspense fallback={<DashboardLoadingSkeleton />}>
        {/* This component would be implemented separately */}
        <ContractDetailsPageWrapper
          username={username}
          contract={serializedContract}
          userId={(session as Session).id}
        />
      </Suspense>
    </Box>
  );
}

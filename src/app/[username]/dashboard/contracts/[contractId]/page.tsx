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

        {/* Basic contract information display */}
        <Box>
          <Typography variant="h5" gutterBottom>
            Contract Details
          </Typography>
          <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6">Contract #{contractId}</Typography>
            <Box sx={{ mt: 2 }}>
              <Typography>
                <strong>Status:</strong> {contract.status}
              </Typography>
              <Typography>
                <strong>Created:</strong>{" "}
                {new Date(contract.createdAt).toLocaleDateString()}
              </Typography>
              <Typography>
                <strong>Deadline:</strong>{" "}
                {new Date(contract.deadlineAt).toLocaleDateString()}
              </Typography>
              <Typography>
                <strong>Total Amount:</strong> {contract.finance.total}
              </Typography>
            </Box>
          </Paper>

          <Typography variant="h6" gutterBottom>
            Tickets
          </Typography>
          <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
            <Typography>
              Cancel Tickets: {contract.cancelTickets?.length || 0}
            </Typography>
            <Typography>
              Revision Tickets: {contract.revisionTickets?.length || 0}
            </Typography>
            <Typography>
              Change Tickets: {contract.changeTickets?.length || 0}
            </Typography>
            <Typography>
              Resolution Tickets: {contract.resolutionTickets?.length || 0}
            </Typography>
          </Paper>

          <Typography variant="h6" gutterBottom>
            Contract Terms
          </Typography>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="body1">
              {contract.contractTerms[0]?.generalDescription ||
                "No description available"}
            </Typography>
          </Paper>
        </Box>
      </Suspense>
    </Box>
  );
}

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
import { processContractExpirations } from "@/lib/services/contract.service";

interface ContractDetailsPageProps {
  params: {
    username: string;
    contractId: string;
  };
}

export default async function ContractDetailsPage({
  params,
}: ContractDetailsPageProps) {
  const param = await params;
  const { username, contractId } = param;

  // Ensure all models are registered at the page level
  ensureModelsRegistered();

  const session = await getAuthSession();

  if (!session || !isUserOwner(session as Session, username)) {
    return <Alert severity="error">You do not have access to this page</Alert>;
  }

  // Process any expired uploads for this specific contract
  let processResult;
  try {
    console.log(`🔄 Processing expirations for contract ${contractId}...`);
    processResult = await processContractExpirations(
      contractId,
      (session as Session).id
    );

    // Log detailed results
    console.log(`📊 Expiration processing results for contract ${contractId}:`);
    console.log(`   User role: ${processResult.summary.userRole}`);

    // Log upload processing results
    const { uploads } = processResult;
    if (uploads.summary.totalProcessed > 0) {
      console.log(
        `✅ Auto-accepted ${uploads.summary.totalProcessed} expired uploads:`
      );

      if (uploads.milestones.processed.length > 0) {
        console.log(
          `   📝 Milestone uploads (${uploads.milestones.processed.length}):`
        );
        uploads.milestones.processed.forEach((milestone) => {
          console.log(
            `      - Upload ${milestone.uploadId} for milestone ${milestone.milestoneIdx}`
          );
        });
      }

      if (uploads.finals.processed.length > 0) {
        console.log(
          `   🎯 Final uploads (${uploads.finals.processed.length}):`
        );
        uploads.finals.processed.forEach((final) => {
          console.log(
            `      - Upload ${final.uploadId} with ${final.workProgress}% progress`
          );
        });
      }

      if (uploads.revisions.processed.length > 0) {
        console.log(
          `   🔄 Revision uploads (${uploads.revisions.processed.length}):`
        );
        uploads.revisions.processed.forEach((revision) => {
          console.log(
            `      - Upload ${revision.uploadId} for ticket ${revision.revisionTicketId}`
          );
        });
      }
    } else {
      console.log(`✨ No expired uploads found for contract ${contractId}`);
    }

    // Log upload processing errors
    if (uploads.summary.totalErrors > 0) {
      console.error(
        `❌ ${uploads.summary.totalErrors} errors occurred during upload processing:`
      );

      [
        ...uploads.milestones.errors,
        ...uploads.finals.errors,
        ...uploads.revisions.errors,
      ].forEach((error) => {
        console.error(`   - Upload ${error.uploadId}: ${error.error}`);
      });
    }

    // Log grace period processing results
    const { gracePeriod } = processResult;
    if (gracePeriod.wasPastGrace) {
      if (gracePeriod.processed) {
        console.log(
          `⏰ Contract ${contractId} was past grace period and marked as not completed`
        );
        if (gracePeriod.refundAmount) {
          console.log(
            `   💰 Refunded ${gracePeriod.refundAmount} cents to client`
          );
        }
      } else if (gracePeriod.error) {
        console.error(
          `❌ Failed to process grace period for contract ${contractId}: ${gracePeriod.error}`
        );
      }
    } else {
      console.log(`✅ Contract ${contractId} is within grace period`);
    }

    // Summary
    console.log(`📋 Summary for contract ${contractId}:`);
    console.log(
      `   - Uploads processed: ${processResult.summary.totalUploadsProcessed}`
    );
    console.log(
      `   - Contract processed: ${
        processResult.summary.contractProcessed ? "Yes" : "No"
      }`
    );
    console.log(`   - Total errors: ${processResult.summary.totalErrors}`);
  } catch (error) {
    console.error(
      `❌ Error processing expirations for contract ${contractId}:`,
      error
    );

    // Log the full error details for debugging
    if (error instanceof Error) {
      console.error(`   Error message: ${error.message}`);
      console.error(`   Error stack:`, error.stack);
    }
  }

  let contract;
  let error = null;

  try {
    console.log(`📖 Fetching contract details for ${contractId}...`);
    contract = await getContractById(contractId, (session as Session).id);
    console.log(`✅ Successfully loaded contract ${contractId}`);
  } catch (err) {
    console.error(`❌ Error fetching contract ${contractId}:`, err);
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
      {/* Optional: Show processing results in UI for debugging */}
      {processResult && process.env.NODE_ENV === "development" && (
        <Paper sx={{ p: 2, mb: 2, bgcolor: "grey.50" }}>
          <Typography variant="h6" gutterBottom>
            🔧 Development: Expiration Processing Results
          </Typography>
          <Typography variant="body2">
            Uploads processed: {processResult.summary.totalUploadsProcessed} |
            Contract processed:{" "}
            {processResult.summary.contractProcessed ? "Yes" : "No"} | Errors:{" "}
            {processResult.summary.totalErrors} | User role:{" "}
            {processResult.summary.userRole}
          </Typography>
        </Paper>
      )}

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

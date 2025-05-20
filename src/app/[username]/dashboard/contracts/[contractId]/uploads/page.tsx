// src/app/[username]/dashboard/contracts/[contractId]/uploads/page.tsx
import { Suspense } from "react";
import { Box, Typography, Alert } from "@mui/material";
import { getAuthSession, isUserOwner, Session } from "@/lib/utils/session";
import { getContractById } from "@/lib/services/contract.service";
import { getContractUploads } from "@/lib/services/upload.service";
import DashboardLoadingSkeleton from "@/components/dashboard/DashboardLoadingSkeleton";

// This component would be created in src/components/dashboard/contracts/
import UploadsListPageWrapper from "@/components/dashboard/contracts/UploadListPage";

interface UploadsListPageProps {
  params: {
    username: string;
    contractId: string;
  };
}

export default async function UploadsListPage({
  params,
}: UploadsListPageProps) {
  const param = await params;
  const { username, contractId } = param;
  const session = await getAuthSession();

  if (!session || !isUserOwner(session as Session, username)) {
    return <Alert severity="error">You do not have access to this page</Alert>;
  }

  let contract;
  try {
    contract = await getContractById(contractId, (session as Session).id);
  } catch (err) {
    console.error("Error fetching contract:", err);
    return <Alert severity="error">Failed to load contract data</Alert>;
  }

  let uploads;
  try {
    uploads = await getContractUploads(contractId);
  } catch (err) {
    console.error("Error fetching uploads:", err);
    return <Alert severity="error">Failed to load uploads</Alert>;
  }

  // Serialize for client components
  const serializedContract = JSON.parse(JSON.stringify(contract));
  const serializedUploads = JSON.parse(JSON.stringify(uploads));

  const isArtist = contract.artistId.toString() === (session as Session).id;
  const isClient = contract.clientId.toString() === (session as Session).id;

  return (
    <Box>
      <Suspense fallback={<DashboardLoadingSkeleton />}>
        {/* This component would be implemented separately */}
        <UploadsListPageWrapper
          username={username}
          contractId={contractId}
          uploads={serializedUploads}
          isArtist={isArtist}
          isClient={isClient}
          contractStatus={contract.status}
          contractFlow={contract.proposalSnapshot.listingSnapshot.flow}
          currentMilestoneIndex={contract?.currentMilestoneIndex}
        />
      </Suspense>
    </Box>
  );
}

// src/app/[username]/dashboard/contracts/[contractId]/uploads/page.tsx
import { Suspense } from "react";
import { Box, Typography, Alert } from "@mui/material";
import { getAuthSession, isUserOwner, Session } from "@/lib/utils/session";
import { getContractById } from "@/lib/services/contract.service";
import { getContractUploads } from "@/lib/services/upload.service";
import DashboardLoadingSkeleton from "@/components/dashboard/DashboardLoadingSkeleton";

// This component would be created in src/components/dashboard/contracts/
// import UploadsListPage from "@/components/dashboard/contracts/UploadsListPage";

interface UploadsListPageProps {
  params: { 
    username: string;
    contractId: string;
  };
}

export default async function UploadsListPage({ params }: UploadsListPageProps) {
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
      <Typography variant="h5" fontWeight="bold" sx={{ mb: 3 }}>
        Contract Uploads
      </Typography>

      <Suspense fallback={<DashboardLoadingSkeleton />}>
        {/* This component would be implemented separately */}
        {/* <UploadsListPage
          username={username}
          contractId={contractId}
          uploads={serializedUploads}
          isArtist={isArtist}
          isClient={isClient}
          contractStatus={contract.status}
        /> */}
        <Box>
          <Typography>Upload listings for contract {contractId} would be displayed here.</Typography>
          <Typography>
            There are {uploads.progressStandard.length} standard progress uploads, 
            {uploads.progressMilestone.length} milestone progress uploads,
            {uploads.revision.length} revision uploads, and
            {uploads.final.length} final uploads.
          </Typography>
        </Box>
      </Suspense>
    </Box>
  );
}
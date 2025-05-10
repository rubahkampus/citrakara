// src/app/[username]/dashboard/contracts/[contractId]/uploads/[uploadType]/new/page.tsx
import { Box, Alert, Typography } from "@mui/material";
import { getAuthSession, isUserOwner, Session } from "@/lib/utils/session";
import { getContractById } from "@/lib/services/contract.service";

// These components would be created in src/components/dashboard/contracts/uploads/
// import ProgressUploadForm from "@/components/dashboard/contracts/uploads/ProgressUploadForm";
// import RevisionUploadForm from "@/components/dashboard/contracts/uploads/RevisionUploadForm";
// import FinalUploadForm from "@/components/dashboard/contracts/uploads/FinalUploadForm";

interface CreateUploadPageProps {
  params: {
    username: string;
    contractId: string;
    uploadType: "progress" | "milestone" | "revision" | "final";
  };
  searchParams: {
    ticketId?: string; // For revision uploads
    milestoneIdx?: string; // For milestone uploads
  };
}

export default async function CreateUploadPage({
  params,
  searchParams,
}: CreateUploadPageProps) {
  const { username, contractId, uploadType } = params;
  const { ticketId, milestoneIdx } = searchParams;
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

  // Verify user has permission to create this upload type
  const isArtist = contract.artistId.toString() === (session as Session).id;
  if (!isArtist) {
    return <Alert severity="error">Only artists can create uploads</Alert>;
  }

  // Check if contract allows this upload type
  if (
    uploadType === "milestone" &&
    contract.proposalSnapshot.listingSnapshot.flow !== "milestone"
  ) {
    return (
      <Alert severity="error">This contract does not use milestone flow</Alert>
    );
  }

  if (
    uploadType === "progress" &&
    contract.proposalSnapshot.listingSnapshot.flow !== "standard"
  ) {
    return (
      <Alert severity="error">This contract does not use standard flow</Alert>
    );
  }

  if (uploadType === "revision" && !ticketId) {
    return <Alert severity="error">Revision ticket ID is required</Alert>;
  }

  if (uploadType === "milestone" && !milestoneIdx) {
    return <Alert severity="error">Milestone index is required</Alert>;
  }

  // Serialize for client components
  const serializedContract = JSON.parse(JSON.stringify(contract));

  return (
    <Box>
      <Typography variant="h5" fontWeight="bold" sx={{ mb: 3 }}>
        {uploadType === "progress" && "Upload Progress"}
        {uploadType === "milestone" && "Upload Milestone Progress"}
        {uploadType === "revision" && "Upload Revision"}
        {uploadType === "final" && "Upload Final Delivery"}
      </Typography>

      {/* These would be implemented separately */}
      {uploadType === "progress" && (
        <Box>Progress upload form would be displayed here</Box>
        // <ProgressUploadForm
        //   contract={serializedContract}
        //   userId={session.id}
        // />
      )}

      {uploadType === "milestone" && (
        <Box>
          Milestone upload form would be displayed here for milestone{" "}
          {milestoneIdx}
        </Box>
        // <MilestoneUploadForm
        //   contract={serializedContract}
        //   userId={session.id}
        //   milestoneIdx={parseInt(milestoneIdx || "0")}
        // />
      )}

      {uploadType === "revision" && (
        <Box>
          Revision upload form would be displayed here for ticket {ticketId}
        </Box>
        // <RevisionUploadForm
        //   contract={serializedContract}
        //   userId={session.id}
        //   ticketId={ticketId}
        // />
      )}

      {uploadType === "final" && (
        <Box>Final upload form would be displayed here</Box>
        // <FinalUploadForm
        //   contract={serializedContract}
        //   userId={session.id}
        //   cancelTicketId={searchParams.cancelTicketId}
        // />
      )}
    </Box>
  );
}

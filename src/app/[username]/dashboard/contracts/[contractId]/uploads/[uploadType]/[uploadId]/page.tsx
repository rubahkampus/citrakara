// src/app/[username]/dashboard/contracts/[contractId]/uploads/[uploadType]/[uploadId]/page.tsx
import { Box, Alert, Typography, Button } from "@mui/material";
import { getAuthSession, isUserOwner, Session } from "@/lib/utils/session";
import { getContractById } from "@/lib/services/contract.service";
import {
  findProgressUploadStandardById,
  findProgressUploadMilestoneById,
  findRevisionUploadById,
  findFinalUploadById,
} from "@/lib/db/repositories/upload.repository";
import {
  IFinalUpload,
  IProgressUploadMilestone,
  IRevisionUpload,
} from "@/lib/db/models/upload.model";

// These components would be created in src/components/dashboard/contracts/uploads/
// import ProgressUploadDetails from "@/components/dashboard/contracts/uploads/ProgressUploadDetails";
// import MilestoneUploadDetails from "@/components/dashboard/contracts/uploads/MilestoneUploadDetails";
// import RevisionUploadDetails from "@/components/dashboard/contracts/uploads/RevisionUploadDetails";
// import FinalUploadDetails from "@/components/dashboard/contracts/uploads/FinalUploadDetails";
// import UploadReviewForm from "@/components/dashboard/contracts/uploads/UploadReviewForm";

interface UploadDetailsPageProps {
  params: {
    username: string;
    contractId: string;
    uploadType: "progress" | "milestone" | "revision" | "final";
    uploadId: string;
  };
  searchParams: {
    review?: string; // If "true", show the review form instead of just details
  };
}

export default async function UploadDetailsPage({
  params,
  searchParams,
}: UploadDetailsPageProps) {
  const { username, contractId, uploadType, uploadId } = params;
  const showReview = searchParams.review === "true";
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

  const isArtist = contract.artistId.toString() === (session as Session).id;
  const isClient = contract.clientId.toString() === (session as Session).id;

  // Get the specific upload
  let upload;
  try {
    switch (uploadType) {
      case "progress":
        upload = await findProgressUploadStandardById(uploadId);
        break;
      case "milestone":
        upload = await findProgressUploadMilestoneById(uploadId);
        break;
      case "revision":
        upload = await findRevisionUploadById(uploadId);
        break;
      case "final":
        upload = await findFinalUploadById(uploadId);
        break;
      default:
        return <Alert severity="error">Invalid upload type</Alert>;
    }

    if (!upload) {
      return <Alert severity="error">Upload not found</Alert>;
    }
  } catch (err) {
    console.error(`Error fetching ${uploadType} upload:`, err);
    return <Alert severity="error">Failed to load upload data</Alert>;
  }

  // Serialize for client components
  const serializedContract = JSON.parse(JSON.stringify(contract));
  const serializedUpload = JSON.parse(JSON.stringify(upload));

  // Check if the client can review this upload
  const canReview =
    isClient &&
    ((uploadType === "milestone" &&
      (upload as IProgressUploadMilestone).isFinal) ||
      uploadType === "revision" ||
      uploadType === "final") &&
    ("expiresAt" in upload &&
    upload.status === "submitted");

  // If review mode is requested but not allowed, show an error
  if (showReview && !canReview) {
    return <Alert severity="error">You cannot review this upload</Alert>;
  }

  // Check if the upload is past the review deadline
  const isPastDeadline =
    uploadType === "progress" ||
    ("expiresAt" in upload &&
      upload.expiresAt &&
      new Date(upload.expiresAt) < new Date());

  return (
    <Box>
      <Typography variant="h5" fontWeight="bold" sx={{ mb: 3 }}>
        {showReview ? "Review " : ""}
        {uploadType === "progress" && "Progress Upload"}
        {uploadType === "milestone" && "Milestone Progress Upload"}
        {uploadType === "revision" && "Revision Upload"}
        {uploadType === "final" && "Final Delivery"}
      </Typography>

      {/* If in review mode and the upload is past deadline, show warning */}
      {uploadType === "progress" && showReview && isPastDeadline && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          This upload is past its review deadline and may be automatically
          accepted if not reviewed.
        </Alert>
      )}

      {/* Show review form or details based on mode */}
      {showReview ? (
        // Review Form Mode
        <Box>
          {/* This would be implemented separately */}
          {/* <UploadReviewForm
            contract={serializedContract}
            upload={serializedUpload}
            uploadType={uploadType}
            userId={(session as Session).id}
            isPastDeadline={isPastDeadline}
          /> */}
          <Box>
            <Typography>Upload review form would be displayed here</Typography>
            <Typography>
              This is for {uploadType} upload with ID {uploadId}
            </Typography>
            {isPastDeadline && (
              <Typography color="error">
                Review deadline expired on{" "}
                {"expiresAt" in upload && upload.expiresAt
                  ? new Date(upload.expiresAt).toLocaleString()
                  : "No expiration date"}
              </Typography>
            )}
          </Box>
        </Box>
      ) : (
        // Details View Mode
        <Box>
          {/* These would be implemented separately */}
          {uploadType === "progress" && (
            <Box>Progress upload details would be displayed here</Box>
            // <ProgressUploadDetails
            //   contract={serializedContract}
            //   upload={serializedUpload}
            //   userId={(session as Session).id}
            //   isArtist={isArtist}
            //   isClient={isClient}
            // />
          )}

          {uploadType === "milestone" && (
            <Box>
              <Typography>
                Milestone upload details would be displayed here
              </Typography>
              {canReview && (
                <Box sx={{ mt: 2 }}>
                  <Typography color="primary" sx={{ mb: 1 }}>
                    This upload requires your review
                  </Typography>
                  <Button
                    variant="contained"
                    color="primary"
                    href={`/dashboard/${username}/contracts/${contractId}/uploads/${uploadType}/${uploadId}?review=true`}
                  >
                    Review Upload
                  </Button>
                </Box>
              )}
            </Box>
            // <MilestoneUploadDetails
            //   contract={serializedContract}
            //   upload={serializedUpload}
            //   userId={(session as Session).id}
            //   isArtist={isArtist}
            //   isClient={isClient}
            //   canReview={canReview}
            // />
          )}

          {uploadType === "revision" && (
            <Box>
              <Typography>
                Revision upload details would be displayed here
              </Typography>
              {canReview && (
                <Box sx={{ mt: 2 }}>
                  <Typography color="primary" sx={{ mb: 1 }}>
                    This upload requires your review
                  </Typography>
                  <Button
                    variant="contained"
                    color="primary"
                    href={`/dashboard/${username}/contracts/${contractId}/uploads/${uploadType}/${uploadId}?review=true`}
                  >
                    Review Upload
                  </Button>
                </Box>
              )}
            </Box>
            // <RevisionUploadDetails
            //   contract={serializedContract}
            //   upload={serializedUpload}
            //   userId={(session as Session).id}
            //   isArtist={isArtist}
            //   isClient={isClient}
            //   canReview={canReview}
            // />
          )}

          {uploadType === "final" && (
            <Box>
              <Typography>
                Final upload details would be displayed here
              </Typography>
              {canReview && (
                <Box sx={{ mt: 2 }}>
                  <Typography color="primary" sx={{ mb: 1 }}>
                    This upload requires your review
                  </Typography>
                  <Button
                    variant="contained"
                    color="primary"
                    href={`/dashboard/${username}/contracts/${contractId}/uploads/${uploadType}/${uploadId}?review=true`}
                  >
                    Review Upload
                  </Button>
                </Box>
              )}
            </Box>
            // <FinalUploadDetails
            //   contract={serializedContract}
            //   upload={serializedUpload}
            //   userId={(session as Session).id}
            //   isArtist={isArtist}
            //   isClient={isClient}
            //   canReview={canReview}
            // />
          )}
        </Box>
      )}
    </Box>
  );
}

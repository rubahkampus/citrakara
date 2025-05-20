// src/app/[username]/dashboard/contracts/[contractId]/uploads/[uploadType]/[uploadId]/page.tsx
import {
  Box,
  Alert,
  Typography,
  Button,
  Link,
  Breadcrumbs,
} from "@mui/material";
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
import ProgressUploadDetails from "@/components/dashboard/contracts/uploads/ProgressUploadDetails";
import MilestoneUploadDetails from "@/components/dashboard/contracts/uploads/MilestoneUploadDetails";
import RevisionUploadDetails from "@/components/dashboard/contracts/uploads/RevisionUploadDetails";
import FinalUploadDetails from "@/components/dashboard/contracts/uploads/FinalUploadDetails";
import {
  NavigateNext,
  Home,
  PaletteRounded,
  CloudUploadRounded,
  ArrowBack,
} from "@mui/icons-material";

interface UploadDetailsPageProps {
  params: {
    username: string;
    contractId: string;
    uploadType: "progress" | "milestone" | "revision" | "final";
    uploadId: string;
  };
}

export default async function UploadDetailsPage({
  params,
}: UploadDetailsPageProps) {
  const param = await params;
  const { username, contractId, uploadType, uploadId } = param;
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

  // Check if the upload is expired
  const currentTime = new Date();
  const isExpired =
    "expiresAt" in upload &&
    upload.expiresAt &&
    new Date(upload.expiresAt) <= currentTime;

  // Log debug information
  console.log("isClient:", isClient);
  console.log("uploadType:", uploadType);
  console.log("upload:", upload);
  console.log(
    "upload.isFinal (if milestone):",
    uploadType === "milestone"
      ? (upload as IProgressUploadMilestone).isFinal
      : undefined
  );
  console.log(
    "upload.expiresAt:",
    "expiresAt" in upload ? upload.expiresAt : undefined
  );
  console.log(
    "upload.status:",
    (upload as IProgressUploadMilestone | IFinalUpload | IRevisionUpload).status
  );
  console.log("isExpired:", isExpired);

  // Check if the client can review this upload (including expiry check)
  const canReview =
    isClient &&
    ((uploadType === "milestone" &&
      (upload as IProgressUploadMilestone).isFinal) ||
      uploadType === "revision" ||
      uploadType === "final") &&
    "expiresAt" in upload &&
    "status" in upload &&
    upload.status === "submitted" &&
    !isExpired; // Add expiry check here

  console.log(isClient);
  console.log(
    (uploadType === "milestone" &&
      (upload as IProgressUploadMilestone).isFinal) ||
      uploadType === "revision" ||
      uploadType === "final"
  );
  console.log("expiresAt" in upload);
  console.log("status" in upload);
  console.log(
    (upload as IProgressUploadMilestone | IFinalUpload | IRevisionUpload)
      .status === "submitted"
  );
  console.log("canReview:", canReview);

  if (uploadType === "progress") {
    return (
      <ProgressUploadDetails
        contract={serializedContract}
        upload={serializedUpload}
        userId={(session as Session).id}
        isArtist={isArtist}
        isClient={isClient}
      />
    );
  }

  // If review mode is requested but not allowed, show an error
  // if (!canReview) {
  //   return <Alert severity="error">You cannot review this upload</Alert>;
  // }

  return (
    <Box py={4}>
      {/* Show non-blocking expired alert if needed for client */}
      {isExpired && isClient && (
        <Alert severity="info" sx={{ mb: 3 }}>
          Anda terlalu lama meresponnya dan unggahan ini telah diterima secara
          otomatis. Batas waktu untuk meninjau telah berakhir.
        </Alert>
      )}

      {/* Header section */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <Breadcrumbs separator={<NavigateNext fontSize="small" />}>
            <Link
              component={Link}
              href={`/${username}/dashboard`}
              underline="hover"
              color="inherit"
              sx={{ display: "flex", alignItems: "center" }}
            >
              <Home fontSize="small" sx={{ mr: 0.5 }} />
              Dashboard
            </Link>
            <Link
              component={Link}
              href={`/${username}/dashboard/contracts`}
              underline="hover"
              color="inherit"
              sx={{ display: "flex", alignItems: "center" }}
            >
              <PaletteRounded fontSize="small" sx={{ mr: 0.5 }} />
              Daftar Kontrak
            </Link>
            <Link
              component={Link}
              href={`/${username}/dashboard/contracts/${contractId}`}
              underline="hover"
              color="inherit"
              sx={{ display: "flex", alignItems: "center" }}
            >
              Detail Kontrak
            </Link>
            <Link
              component={Link}
              href={`/${username}/dashboard/contracts/${contractId}/uploads`}
              underline="hover"
              color="inherit"
              sx={{ display: "flex", alignItems: "center" }}
            >
              Daftar Unggahan
            </Link>
            <Typography
              color="text.primary"
              sx={{ display: "flex", alignItems: "center" }}
            >
              Detail Unggahan
            </Typography>
          </Breadcrumbs>

          <Box display="flex" alignItems="center" mt={4} ml={-0.5} mb={2}>
            <CloudUploadRounded
              sx={{ mr: 1, color: "primary.main", fontSize: 32 }}
            />
            <Typography variant="h4" fontWeight="bold">
              Detail Unggahan
            </Typography>
          </Box>
        </Box>

        <Button
          component={Link}
          href={`/${username}/dashboard/contracts/${contractId}/uploads`}
          variant="outlined"
          startIcon={<ArrowBack />}
          size="small"
        >
          Kembali ke Daftar Unggahan
        </Button>
      </Box>

      {uploadType === "milestone" && (
        <MilestoneUploadDetails
          contract={serializedContract}
          upload={serializedUpload}
          userId={(session as Session).id}
          isArtist={isArtist}
          isClient={isClient}
          isAdmin={false}
          canReview={canReview}
          username={(session as Session).username}
        />
      )}

      {uploadType === "revision" && (
        <RevisionUploadDetails
          contract={serializedContract}
          upload={serializedUpload}
          userId={(session as Session).id}
          isArtist={isArtist}
          isClient={isClient}
          isAdmin={false}
          canReview={canReview}
          username={(session as Session).username}
        />
      )}

      {uploadType === "final" && (
        <FinalUploadDetails
          contract={serializedContract}
          upload={serializedUpload}
          userId={(session as Session).id}
          isArtist={isArtist}
          isClient={isClient}
          isAdmin={false}
          canReview={canReview}
          username={(session as Session).username}
        />
      )}
    </Box>
  );
}

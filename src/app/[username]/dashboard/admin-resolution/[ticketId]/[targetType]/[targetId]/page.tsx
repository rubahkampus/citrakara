// src/app/[username]/dashboard/admin-resolution/[ticketId]/[targetType]/[targetId]/page.tsx
import {
  Box,
  Alert,
  Typography,
  Paper,
  Button,
  Breadcrumbs,
  Grid,
} from "@mui/material";
import { getAuthSession, isUserOwner, Session } from "@/lib/utils/session";
import { isUserAdminById } from "@/lib/services/user.service";
import { findResolutionTicketById } from "@/lib/db/repositories/ticket.repository";
import { getContractById } from "@/lib/services/contract.service";
import { findCancelTicketById } from "@/lib/db/repositories/ticket.repository";
import { findRevisionTicketById } from "@/lib/db/repositories/ticket.repository";
import { findChangeTicketById } from "@/lib/db/repositories/ticket.repository";
import { findProgressUploadMilestoneById } from "@/lib/db/repositories/upload.repository";
import { findFinalUploadById } from "@/lib/db/repositories/upload.repository";
import { findRevisionUploadById } from "@/lib/db/repositories/upload.repository";
import Link from "next/link";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

// Import existing detail components
import CancelTicketDetails from "@/components/dashboard/contracts/tickets/CancelTicketDetails";
import RevisionTicketDetails from "@/components/dashboard/contracts/tickets/RevisionTicketDetails";
import ChangeTicketDetails from "@/components/dashboard/contracts/tickets/ChangeTicketDetails";
import MilestoneUploadDetails from "@/components/dashboard/contracts/uploads/MilestoneUploadDetails";
import FinalUploadDetails from "@/components/dashboard/contracts/uploads/FinalUploadDetails";
import RevisionUploadDetails from "@/components/dashboard/contracts/uploads/RevisionUploadDetails";

interface AdminItemDetailsPageProps {
  params: {
    username: string;
    ticketId: string;
    targetType: string;
    targetId: string;
  };
}

export default async function AdminItemDetailsPage({
  params,
}: AdminItemDetailsPageProps) {
  const param = await params;
  const { username, ticketId, targetType, targetId } = param;
  const session = await getAuthSession();

  if (!session || !isUserOwner(session as Session, username)) {
    return (
      <Alert severity="error">Anda tidak memiliki akses ke halaman ini</Alert>
    );
  }

  // Check if user is an admin
  const isAdmin = await isUserAdminById((session as Session).id);
  if (!isAdmin) {
    return <Alert severity="error">Anda tidak memiliki hak akses admin</Alert>;
  }

  // Get resolution ticket for context
  let resolutionTicket;
  try {
    resolutionTicket = await findResolutionTicketById(ticketId);
    if (!resolutionTicket) {
      return <Alert severity="error">Tiket penyelesaian tidak ditemukan</Alert>;
    }
  } catch (err) {
    console.error("Error fetching resolution ticket:", err);
    return <Alert severity="error">Gagal memuat data tiket penyelesaian</Alert>;
  }

  // Get the contract for context
  let contract;
  try {
    contract = await getContractById(
      resolutionTicket.contractId.toString(),
      (session as Session).id
    );
  } catch (err) {
    console.error("Error fetching contract:", err);
    return <Alert severity="error">Gagal memuat data kontrak</Alert>;
  }

  // Get the disputed item based on targetType
  let item;
  try {
    switch (targetType) {
      case "cancelTicket":
        item = await findCancelTicketById(targetId);
        break;
      case "revisionTicket":
        item = await findRevisionTicketById(targetId);
        break;
      case "changeTicket":
        item = await findChangeTicketById(targetId);
        break;
      case "progressMilestoneUpload":
        item = await findProgressUploadMilestoneById(targetId);
        break;
      case "finalUpload":
        item = await findFinalUploadById(targetId);
        break;
      case "revisionUpload":
        item = await findRevisionUploadById(targetId);
        break;
      default:
        return <Alert severity="error">Jenis target tidak valid</Alert>;
    }

    if (!item) {
      return (
        <Alert severity="error">Item yang disengketakan tidak ditemukan</Alert>
      );
    }
  } catch (err) {
    console.error(`Error fetching ${targetType}:`, err);
    return (
      <Alert severity="error">Gagal memuat data item yang disengketakan</Alert>
    );
  }

  // Serialize data for client components
  const serializedContract = JSON.parse(JSON.stringify(contract));
  const serializedItem = JSON.parse(JSON.stringify(item));
  const serializedResolutionTicket = JSON.parse(
    JSON.stringify(resolutionTicket)
  );

  // Helper function to get target type display name
  const getTargetTypeDisplay = (type: string) => {
    switch (type) {
      case "cancelTicket":
        return "Pembatalan Kontrak";
      case "revisionTicket":
        return "Permintaan Revisi";
      case "changeTicket":
        return "Permintaan Perubahan";
      case "finalUpload":
        return "Pengiriman Final";
      case "progressMilestoneUpload":
        return "Progres Milestone";
      case "revisionUpload":
        return "Pengiriman Revisi";
      default:
        return type.charAt(0).toUpperCase() + type.slice(1);
    }
  };

  // Determine if this is a ticket type or upload type
  const isTicketType =
    targetType === "cancelTicket" ||
    targetType === "revisionTicket" ||
    targetType === "changeTicket";

  const isUploadType =
    targetType === "progressMilestoneUpload" ||
    targetType === "finalUpload" ||
    targetType === "revisionUpload";

  return (
    <Box>
      {/* Breadcrumbs navigation */}
      <Box sx={{ mb: 3 }}>
        <Breadcrumbs aria-label="breadcrumb">
          <Link href={`/dashboard/${username}/admin/resolutions`} passHref>
            <Typography
              component="span"
              color="text.secondary"
              sx={{ display: "flex", alignItems: "center", cursor: "pointer" }}
            >
              Semua Tiket Penyelesaian
            </Typography>
          </Link>
          <Link
            href={`/dashboard/${username}/admin-resolution/${ticketId}`}
            passHref
          >
            <Typography
              component="span"
              color="text.secondary"
              sx={{ display: "flex", alignItems: "center", cursor: "pointer" }}
            >
              Tiket #{ticketId}
            </Typography>
          </Link>
          <Typography color="text.primary">
            {getTargetTypeDisplay(targetType)}
          </Typography>
        </Breadcrumbs>
      </Box>

      {/* Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Typography variant="h5" fontWeight="bold">
          {getTargetTypeDisplay(targetType)} #{targetId}
        </Typography>
        <Button
          component={Link}
          href={`/dashboard/${username}/admin-resolution/${ticketId}`}
          startIcon={<ArrowBackIcon />}
          variant="outlined"
        >
          Kembali ke Tiket Penyelesaian
        </Button>
      </Box>

      {/* Context alert - show that this is viewed in admin resolution context */}
      <Alert severity="info" sx={{ mb: 3 }}>
        Anda melihat item ini dalam konteks penyelesaian sengketa. Item ini
        adalah objek yang disengketakan dalam tiket penyelesaian #{ticketId}.
      </Alert>

      {/* Render the appropriate component based on targetType */}
      {targetType === "cancelTicket" && (
        <CancelTicketDetails
          contract={serializedContract}
          ticket={serializedItem}
          userId={(session as Session).id}
          isArtist={contract.artistId.toString() === (session as Session).id}
          isClient={contract.clientId.toString() === (session as Session).id}
          isAdmin={true}
          username={(session as Session).username}
          canReview={false}
        />
      )}

      {targetType === "revisionTicket" && (
        <RevisionTicketDetails
          contract={serializedContract}
          ticket={serializedItem}
          userId={(session as Session).id}
          isArtist={contract.artistId.toString() === (session as Session).id}
          isClient={contract.clientId.toString() === (session as Session).id}
          isAdmin={true}
          username={(session as Session).username}
          canReview={false}
        />
      )}

      {targetType === "changeTicket" && (
        <ChangeTicketDetails
          contract={serializedContract}
          ticket={serializedItem}
          userId={(session as Session).id}
          isArtist={contract.artistId.toString() === (session as Session).id}
          isClient={contract.clientId.toString() === (session as Session).id}
          isAdmin={true}
          username={(session as Session).username}
          canReview={false}
        />
      )}

      {targetType === "progressMilestoneUpload" && (
        <MilestoneUploadDetails
          contract={serializedContract}
          upload={serializedItem}
          userId={(session as Session).id}
          isArtist={contract.artistId.toString() === (session as Session).id}
          isClient={contract.clientId.toString() === (session as Session).id}
          isAdmin={true}
          canReview={false}
          username={(session as Session).username}
        />
      )}

      {targetType === "finalUpload" && (
        <FinalUploadDetails
          contract={serializedContract}
          upload={serializedItem}
          userId={(session as Session).id}
          isArtist={contract.artistId.toString() === (session as Session).id}
          isClient={contract.clientId.toString() === (session as Session).id}
          isAdmin={true}
          canReview={false}
          username={(session as Session).username}
        />
      )}

      {targetType === "revisionUpload" && (
        <RevisionUploadDetails
          contract={serializedContract}
          upload={serializedItem}
          userId={(session as Session).id}
          isArtist={contract.artistId.toString() === (session as Session).id}
          isClient={contract.clientId.toString() === (session as Session).id}
          isAdmin={true}
          canReview={false}
          username={(session as Session).username}
        />
      )}

      {/* Resolution Context Box */}
      <Paper elevation={2} sx={{ p: 3, mt: 4, bgcolor: "#f9f9f9" }}>
        <Typography variant="h6" fontWeight="medium" gutterBottom>
          Konteks Tiket Penyelesaian
        </Typography>

        <Alert severity="info" sx={{ mb: 3 }}>
          {isTicketType ? "Tiket" : "Unggahan"} ini sedang disengketakan dalam
          proses penyelesaian.
        </Alert>

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Box>
              <Typography variant="subtitle2" color="text.secondary">
                Status Sengketa
              </Typography>
              <Typography variant="body1" sx={{ mt: 0.5 }}>
                {resolutionTicket.status.toUpperCase()}
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={12} md={6}>
            <Box>
              <Typography variant="subtitle2" color="text.secondary">
                Diajukan Oleh
              </Typography>
              <Typography variant="body1" sx={{ mt: 0.5 }}>
                {resolutionTicket.submittedBy === "client"
                  ? "Klien"
                  : "Seniman"}
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Navigation back to resolution ticket */}
      <Box sx={{ mt: 4, textAlign: "center" }}>
        <Button
          component={Link}
          href={`/dashboard/${username}/admin-resolution/${ticketId}`}
          startIcon={<ArrowBackIcon />}
          variant="contained"
        >
          Kembali ke Tiket Penyelesaian
        </Button>
      </Box>
    </Box>
  );
}

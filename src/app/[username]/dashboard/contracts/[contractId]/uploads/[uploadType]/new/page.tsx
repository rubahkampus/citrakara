// src/app/[username]/dashboard/contracts/[contractId]/uploads/[uploadType]/new/page.tsx
import { Box, Alert, Typography, Paper, Link, Breadcrumbs, Button } from "@mui/material";
import { getAuthSession, isUserOwner, Session } from "@/lib/utils/session";
import { getContractById } from "@/lib/services/contract.service";
import {
  getUnresolvedCancelTickets,
  getUnresolvedChangeTickets,
  getUnresolvedResolutionTickets,
  getUnresolvedRevisionTickets,
  getUnfinishedRevisionTickets,
  getUnfinishedCancelTickets,
} from "@/lib/services/ticket.service";
import {
  getUnfinishedRevisionUploads,
  getUnfinishedFinalUploads,
  getUnfinishedFinalMilestoneUploads,
} from "@/lib/services/upload.service";
import { findRevisionTicketById } from "@/lib/db/repositories/ticket.repository";

// These components would be created in src/components/dashboard/contracts/uploads/
import ProgressUploadForm from "@/components/dashboard/contracts/uploads/ProgressUploadForm";
import RevisionUploadForm from "@/components/dashboard/contracts/uploads/RevisionUploadForm";
import FinalUploadForm from "@/components/dashboard/contracts/uploads/FinalUploadForm";
import MilestoneUploadForm from "@/components/dashboard/contracts/uploads/MilestoneUploadForm";
import { NavigateNext, Home, PaletteRounded, ConfirmationNumberRounded, ArrowBack, CloudUploadRounded } from "@mui/icons-material";

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
  const param = await params;
  const searchParam = await searchParams;
  const { username, contractId, uploadType } = param;
  const { ticketId, milestoneIdx } = searchParam;
  const session = await getAuthSession();

  if (!session || !isUserOwner(session as Session, username)) {
    return (
      <Alert severity="error">Anda tidak memiliki akses ke halaman ini</Alert>
    );
  }

  let contract;
  try {
    contract = await getContractById(contractId, (session as Session).id);
  } catch (err) {
    console.error("Error fetching contract:", err);
    return <Alert severity="error">Gagal memuat data kontrak</Alert>;
  }

  // Verify user has permission to create this upload type
  const isArtist = contract.artistId.toString() === (session as Session).id;
  if (!isArtist) {
    return (
      <Alert severity="error">Hanya seniman yang dapat membuat unggahan</Alert>
    );
  }

  // Check if contract allows this upload type
  if (
    uploadType === "milestone" &&
    contract.proposalSnapshot.listingSnapshot.flow !== "milestone"
  ) {
    return (
      <Alert severity="error">
        Kontrak ini tidak menggunakan alur milestone
      </Alert>
    );
  }

  if (
    uploadType === "progress" &&
    contract.proposalSnapshot.listingSnapshot.flow !== "standard"
  ) {
    return (
      <Alert severity="error">Kontrak ini tidak menggunakan alur standar</Alert>
    );
  }

  if (uploadType === "revision" && !ticketId) {
    return <Alert severity="error">ID tiket revisi diperlukan</Alert>;
  }

  if (uploadType === "milestone" && !milestoneIdx) {
    return <Alert severity="error">Indeks milestone diperlukan</Alert>;
  }

  // Get revision ticket if this is a revision upload
  let revisionTicket;
  if (uploadType === "revision" && ticketId) {
    try {
      revisionTicket = await findRevisionTicketById(ticketId);
      if (!revisionTicket) {
        return <Alert severity="error">Tiket revisi tidak ditemukan</Alert>;
      }

      // Check if the ticket is in a state that allows uploads
      if (
        revisionTicket.status !== "accepted" &&
        revisionTicket.status !== "paid" &&
        revisionTicket.status !== "forcedAcceptedArtist"
      ) {
        return (
          <Alert severity="error">
            Tiket revisi ini tidak dalam status yang memungkinkan unggahan
          </Alert>
        );
      }
    } catch (err) {
      console.error("Error fetching revision ticket:", err);
      return <Alert severity="error">Gagal memuat data tiket revisi</Alert>;
    }
  }

  // Check for active tickets and uploads
  const [
    unresolvedCancelTickets,
    unresolvedChangeTickets,
    unresolvedResolutionTickets,
    unresolvedRevisionTickets,
    unfinishedRevisionTickets,
    unfinishedCancelTickets,
    unfinishedRevisionUploads,
    unfinishedFinalUploads,
    unfinishedFinalMilestoneUploads,
  ] = await Promise.all([
    getUnresolvedCancelTickets(contractId),
    getUnresolvedChangeTickets(contractId),
    getUnresolvedResolutionTickets(contractId),
    getUnresolvedRevisionTickets(contractId),
    getUnfinishedRevisionTickets(contractId),
    getUnfinishedCancelTickets(contractId),
    getUnfinishedRevisionUploads(contractId),
    getUnfinishedFinalUploads(contractId),
    getUnfinishedFinalMilestoneUploads(contractId),
  ]);

  // Collect warnings based on active tickets and uploads
  const warnings = [];
  let hasBlockingWarning = false;

  // First, check resolution tickets as they might block other operations
  if (unresolvedResolutionTickets.length > 0) {
    warnings.push({
      type: "warning",
      message:
        "Terdapat tiket resolusi yang masih aktif untuk kontrak ini. Sebaiknya tunggu hingga kasus tersebut diselesaikan sebelum mengunggah progres baru.",
    });
  }

  if (unresolvedCancelTickets.length > 0) {
    warnings.push({
      type: "warning",
      message:
        "Terdapat permintaan pembatalan yang masih aktif untuk kontrak ini. Disarankan untuk menunggu hingga permintaan tersebut diproses sebelum melanjutkan unggahan.",
    });
  }

  if (unresolvedChangeTickets.length > 0) {
    warnings.push({
      type: "warning",
      message:
        "Terdapat permintaan perubahan kontrak yang masih aktif. Disarankan untuk menunggu hingga permintaan tersebut diproses sebelum melanjutkan unggahan.",
    });
  }

  // Check for upload-specific blocks
  switch (uploadType) {
    case "progress":
      // Standard progress uploads don't have many restrictions
      // But we can show informational warnings
      break;

    case "milestone":
      // Check if there's already an active final milestone upload for this milestone
      if (milestoneIdx) {
        const milestoneIdxNum = parseInt(milestoneIdx);
        const activeMilestoneUploads = unfinishedFinalMilestoneUploads.filter(
          (upload) => upload.milestoneIdx === milestoneIdxNum && upload.isFinal
        );

        if (activeMilestoneUploads.length > 0) {
          warnings.push({
            type: "error",
            message: `Sudah ada unggahan final aktif untuk milestone ${
              contract?.milestones?.[milestoneIdxNum]?.title || "ini"
            }. Mohon tunggu ulasan klien sebelum mengirimkan yang baru.`,
          });
          
          hasBlockingWarning = true;
        }
      }

      // Other informational warnings
      if (unresolvedRevisionTickets.length > 0) {
        warnings.push({
          type: "info",
          message: `Anda memiliki ${unresolvedRevisionTickets.length} permintaan revisi yang memerlukan tanggapan anda atau pembayaran klien. Disarankan untuk menunggu hingga permintaan tersebut diproses sebelum melanjutkan unggahan.`,
        });
        
          // hasBlockingWarning = true;
      }

      // Other informational warnings
      if (unfinishedRevisionTickets.length > 0) {
        warnings.push({
          type: "error",
          message: `Anda memiliki ${unfinishedRevisionTickets.length} tiket revisi yang memerlukan unggahan anda untuk milestone ini. Harap selesaikan revisi terlebih dahulu`,
        });
        
          hasBlockingWarning = true;
      }
      break;

    case "revision":
      // Check if there's already an active revision upload for this specific ticket
      if (ticketId) {
        const activeTicketUploads = unfinishedRevisionUploads.filter(
          (upload) => upload.revisionTicketId.toString() === ticketId
        );

        if (activeTicketUploads.length > 0) {
          warnings.push({
            type: "error",
            message:
              "Sudah ada unggahan revisi aktif untuk tiket ini. Mohon tunggu ulasan klien sebelum mengirimkan yang baru.",
          });
          hasBlockingWarning = true;
        }
      }

      // If there are other revision tickets that need uploads, inform the artist
      const otherRevisionTickets = unfinishedRevisionTickets.filter(
        (ticket) => !ticketId || ticket._id.toString() !== ticketId
      );

      if (otherRevisionTickets.length > 0) {
        warnings.push({
          type: "info",
          message: `Anda memiliki ${otherRevisionTickets.length} tiket revisi lain yang memerlukan unggahan.`,
        });
      }
      break;

    case "final":
      // Check if there's already an active final upload
      if (unfinishedFinalUploads.length > 0) {
        warnings.push({
          type: "error",
          message:
            "Sudah ada unggahan final aktif. Mohon tunggu ulasan klien sebelum mengirimkan yang baru.",
        });
        hasBlockingWarning = true;
      }

      // Check if this is a cancellation upload
      if (ticketId) {
        // Make sure all required revision uploads are completed before allowing final cancellation upload
        if (unfinishedRevisionTickets.length > 0) {
          warnings.push({
            type: "error",
            message:
              `Anda masih memiliki ${unfinishedRevisionTickets.length} revisi yang menunggu unggahan. Namun, Anda dapat langsung mengunggah bukti pembatalan sekarang.`,
          });
        }
      } else {
        // For regular final delivery
        // 1. Check if all milestones are completed for milestone contracts
        if (
          contract.proposalSnapshot.listingSnapshot.flow === "milestone" &&
          contract.milestones
        ) {
          const incompleteMilestones = contract.milestones.filter(
            (milestone) => milestone.status !== "accepted"
          );

          if (incompleteMilestones.length > 0) {
            warnings.push({
              type: "error",
              message:
                "Semua milestone harus diselesaikan sebelum mengirimkan pengiriman final.",
            });
            hasBlockingWarning = true;
          }
        }

        // 2. Check if all revisions are completed
        if (unfinishedRevisionTickets.length > 0) {
          warnings.push({
            type: "error",
            message:
              "Anda harus menyelesaikan semua permintaan revisi sebelum mengirimkan pengiriman final.",
          });
          hasBlockingWarning = true;
        }
      }
      break;
  }

  // Serialize for client components
  const serializedContract = JSON.parse(JSON.stringify(contract));

  return (
    <Box py={4}>
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
              Buat Unggahan
            </Typography>
          </Breadcrumbs>

          <Box display="flex" alignItems="center" mt={4} ml={-0.5} mb={2}>
            <CloudUploadRounded
              sx={{ mr: 1, color: "primary.main", fontSize: 32 }}
            />
            <Typography variant="h4" fontWeight="bold">
              Buat Unggahan
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
      
      {/* Display warnings */}
      {warnings.length > 0 && (
        <Box sx={{ mb: 3 }}>
          {warnings.map((warning, index) => (
            <Alert
              key={index}
              severity={
                warning.type as "error" | "warning" | "info" | "success"
              }
              sx={{ mb: 1 }}
            >
              {warning.message}
            </Alert>
          ))}
        </Box>
      )}

      {/* Only display the form if there's no blocking warning */}
      {!hasBlockingWarning && (
        <>
          {uploadType === "progress" && (
            <ProgressUploadForm
              contract={serializedContract}
              userId={(session as Session).id}
              username={(session as Session).username}
            />
          )}

          {uploadType === "milestone" && (
            <MilestoneUploadForm
              contract={serializedContract}
              userId={(session as Session).id}
              username={(session as Session).username}
              milestoneIdx={parseInt(milestoneIdx || "0")}
              isAllowedFinal={unfinishedRevisionTickets.length === 0}
            />
          )}

          {uploadType === "revision" && ticketId && (
            <RevisionUploadForm
              contract={serializedContract}
              userId={(session as Session).id}
              username={(session as Session).username}
              ticketId={ticketId}
            />
          )}

          {uploadType === "final" && (
            <FinalUploadForm
              contract={serializedContract}
              userId={(session as Session).id}
              username={(session as Session).username}
              cancelTicketId={ticketId}
            />
          )}
        </>
      )}

      {/* For blocking errors, display a message explaining why the form is not shown */}
      {/* {hasBlockingWarning && (
        <Paper sx={{ p: 3, bgcolor: "#f5f5f5" }}>
          <Typography variant="body1" color="error">
            Anda tidak dapat membuat unggahan {uploadType} baru saat ini. Mohon selesaikan masalah yang disebutkan di atas terlebih dahulu.
          </Typography>
        </Paper>
      )} */}
    </Box>
  );
}

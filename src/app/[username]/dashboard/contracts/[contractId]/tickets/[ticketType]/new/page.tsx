// src/app/[username]/dashboard/contracts/[contractId]/tickets/[ticketType]/new/page.tsx
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

// These components would be created in src/components/dashboard/contracts/tickets/
import CancelTicketForm from "@/components/dashboard/contracts/tickets/CancelTicketForm";
import RevisionTicketForm from "@/components/dashboard/contracts/tickets/RevisionTicketForm";
import ChangeTicketForm from "@/components/dashboard/contracts/tickets/ChangeTicketForm";
import ResolutionTicketForm from "@/components/dashboard/contracts/tickets/ResolutionTicketForm";
import { NavigateNext, Home, PaletteRounded, ConfirmationNumberRounded, ArrowBack } from "@mui/icons-material";

interface CreateTicketPageProps {
  params: {
    username: string;
    contractId: string;
    ticketType: "cancel" | "revision" | "change";
  };
}

export default async function CreateTicketPage({
  params,
}: CreateTicketPageProps) {
  const param = await params;
  const { username, contractId, ticketType } = param;
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

  // Verify user has permission to create this ticket type
  const isArtist = contract.artistId.toString() === (session as Session).id;
  const isClient = contract.clientId.toString() === (session as Session).id;

  // Check if user can create this ticket type
  if (ticketType === "revision" && !isClient) {
    return (
      <Alert severity="error">
        Hanya klien yang dapat membuat tiket revisi
      </Alert>
    );
  }

  if (ticketType === "change" && !isClient) {
    return (
      <Alert severity="error">
        Hanya klien yang dapat membuat tiket perubahan
      </Alert>
    );
  }

  // Check if contract allows this ticket type
  if (
    ticketType === "revision" &&
    contract.proposalSnapshot.listingSnapshot.revisions?.type === "none"
  ) {
    return <Alert severity="error">Kontrak ini tidak mengizinkan revisi</Alert>;
  }

  if (
    ticketType === "change" &&
    !contract.proposalSnapshot.listingSnapshot.allowContractChange
  ) {
    return (
      <Alert severity="error">Kontrak ini tidak mengizinkan perubahan</Alert>
    );
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

  console.log(unresolvedRevisionTickets)
  console.log(unfinishedRevisionTickets)

  // Collect warnings based on active tickets and uploads
  const warnings = [];
  let hasBlockingWarning = false;

  // First, check resolution tickets as they might block other operations
  if (unresolvedResolutionTickets.length > 0) {
    warnings.push({
      type: "warning",
      message:
        "Ada kasus resolusi aktif untuk kontrak ini. Disarankan untuk menunggu sampai kasus tersebut terselesaikan sebelum membuat tiket baru.",
    });
  }

  // Check for ticket-specific blocks
  switch (ticketType) {
    case "cancel":
      // Check if there's already an active cancellation request
      if (unresolvedCancelTickets.length > 0) {
        warnings.push({
          type: "error",
          message:
            "Sudah ada permintaan pembatalan aktif untuk kontrak ini. Mohon tunggu hingga permintaan tersebut diselesaikan sebelum membuat yang baru.",
        });
        hasBlockingWarning = true;
      }

      // Other informational warnings
      if (isArtist && unfinishedRevisionTickets.length > 0) {
        warnings.push({
          type: "info",
          message: `Anda memiliki ${unfinishedRevisionTickets.length} tiket revisi yang memerlukan unggahan.`,
        });
      }
      break;

    case "revision":
      // Check if there's already an active revision ticket
      // if (unresolvedRevisionTickets.length > 0) {
      //   warnings.push({
      //     type: "error",
      //     message:
      //       "Sudah ada permintaan revisi aktif untuk kontrak ini. Mohon tunggu hingga permintaan tersebut diselesaikan sebelum membuat yang baru.",
      //   });
      //   hasBlockingWarning = true;
      // }

      if (unresolvedRevisionTickets.length > 0) {
        warnings.push({
          type: "warning",
          message: `Ada ${unresolvedRevisionTickets.length} permintaan revisi yang masih menunggu tanggapan seniman atau pembayaran. Apabila ditolak dan revisi menggunakan sistem jatah, jatah anda akan kembali.`,
        });
      }

      // Let client know about existing uploads waiting for review
      if (unfinishedRevisionUploads.length > 0) {
        warnings.push({
          type: "warning",
          message: `Ada ${unfinishedRevisionUploads.length} unggahan revisi yang masih menunggu unggahan seniman.`,
        });
      }
      break;

    case "change":
      // Check if there's already an active change ticket
      if (unresolvedChangeTickets.length > 0) {
        warnings.push({
          type: "error",
          message:
            "Sudah ada permintaan perubahan aktif untuk kontrak ini. Mohon tunggu hingga permintaan tersebut diselesaikan sebelum membuat yang baru.",
        });
        hasBlockingWarning = true;
      }

      // Additional warnings for change tickets
      if (unresolvedCancelTickets.length > 0) {
        warnings.push({
          type: "warning",
          message:
            "Ada permintaan pembatalan aktif untuk kontrak ini. Perubahan kontrak mungkin tidak diproses jika pembatalan disetujui.",
        });
      }
      break;
  }

  // Additional informational warnings
  if (isArtist && unfinishedCancelTickets.length > 0) {
    warnings.push({
      type: "info",
      message:
        "Anda memiliki permintaan pembatalan yang telah diterima yang memerlukan unggahan bukti pekerjaan akhir.",
    });
  }

  if (unfinishedFinalUploads.length > 0) {
    warnings.push({
      type: "info",
      message: "Ada unggahan final yang menunggu ulasan.",
    });
  }

  if (unfinishedFinalMilestoneUploads.length > 0) {
    warnings.push({
      type: "info",
      message: "Ada unggahan milestone yang menunggu ulasan.",
    });
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
              href={`/${username}/dashboard/contracts/${contractId}/tickets`}
              underline="hover"
              color="inherit"
              sx={{ display: "flex", alignItems: "center" }}
            >
              Daftar Tiket
            </Link>
            <Typography
              color="text.primary"
              sx={{ display: "flex", alignItems: "center" }}
            >
              Buat Tiket
            </Typography>
          </Breadcrumbs>

          <Box display="flex" alignItems="center" mt={4} ml={-0.5} mb={2}>
            <ConfirmationNumberRounded
              sx={{ mr: 1, color: "primary.main", fontSize: 32 }}
            />
            <Typography variant="h4" fontWeight="bold">
              Buat Tiket
            </Typography>
          </Box>
        </Box>

        <Button
          component={Link}
          href={`/${username}/dashboard/contracts/${contractId}/tickets`}
          variant="outlined"
          startIcon={<ArrowBack />}
          size="small"
        >
          Kembali ke Daftar Tiket
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
          {ticketType === "cancel" && (
            <CancelTicketForm
              contract={serializedContract}
              userId={(session as Session).id}
              username={(session as Session).username}
              isArtist={isArtist}
              isClient={isClient}
            />
          )}

          {ticketType === "revision" && (
            <RevisionTicketForm
              contract={serializedContract}
              userId={(session as Session).id}
              username={(session as Session).username}
              isClient={isClient}
              unresolvedQty={unresolvedRevisionTickets.length}
            />
          )}

          {ticketType === "change" && (
            <ChangeTicketForm
              contract={serializedContract}
              userId={(session as Session).id}
              username={(session as Session).username}
              isClient={isClient}
            />
          )}
        </>
      )}

      {/* For blocking errors, display a message explaining why the form is not shown */}
      {hasBlockingWarning && (
        <Paper sx={{ p: 3, bgcolor: "#f5f5f5" }}>
          <Typography variant="body1" color="error">
            Anda tidak dapat membuat tiket{" "}
            {ticketType === "cancel"
              ? "pembatalan"
              : ticketType === "revision"
              ? "revisi"
              : "perubahan"}{" "}
            baru saat ini. Mohon selesaikan masalah yang disebutkan di atas
            terlebih dahulu.
          </Typography>
        </Paper>
      )}
    </Box>
  );
}

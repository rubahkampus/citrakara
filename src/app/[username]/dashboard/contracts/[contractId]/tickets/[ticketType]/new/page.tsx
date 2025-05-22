// src/app/[username]/dashboard/contracts/[contractId]/tickets/[ticketType]/new/page.tsx
import {
  Box,
  Alert,
  Typography,
  Paper,
  Link,
  Breadcrumbs,
  Button,
} from "@mui/material";
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
import {
  NavigateNext,
  Home,
  PaletteRounded,
  ConfirmationNumberRounded,
  ArrowBack,
} from "@mui/icons-material";

interface CreateTicketPageProps {
  params: {
    username: string;
    contractId: string;
    ticketType: "cancel" | "revision" | "change";
  };
}

interface Warning {
  type: "error" | "warning" | "info" | "success";
  message: string;
}

interface TicketValidationData {
  unresolvedCancelTickets: any[];
  unresolvedChangeTickets: any[];
  unresolvedResolutionTickets: any[];
  unresolvedRevisionTickets: any[];
  unfinishedRevisionTickets: any[];
  unfinishedCancelTickets: any[];
  unfinishedRevisionUploads: any[];
  unfinishedFinalUploads: any[];
  unfinishedFinalMilestoneUploads: any[];
}

interface UserPermissions {
  isArtist: boolean;
  isClient: boolean;
}

export default async function CreateTicketPage({
  params,
}: CreateTicketPageProps) {
  const param = await params;
  const { username, contractId, ticketType } = param;

  // Session validation
  const session = await getAuthSession();
  if (!session || !isUserOwner(session as Session, username)) {
    return (
      <Alert severity="error">Anda tidak memiliki akses ke halaman ini</Alert>
    );
  }

  // Contract validation
  const contract = await getContractData(contractId, (session as Session).id);
  if (!contract) {
    return <Alert severity="error">Gagal memuat data kontrak</Alert>;
  }

  // Permission validation
  const permissions = getUserPermissions(contract, session as Session);
  const permissionCheck = validateTicketPermissions(
    ticketType,
    contract,
    permissions
  );
  if (permissionCheck) {
    return permissionCheck;
  }

  // Get validation data
  const validationData = await getTicketValidationData(contractId);

  // Generate warnings
  const { warnings, hasBlockingWarning } = generateTicketWarnings(
    ticketType,
    validationData,
    permissions
  );

  // Serialize for client components
  const serializedContract = JSON.parse(JSON.stringify(contract));

  return (
    <Box py={4}>
      {/* Header Section */}
      <PageHeader username={username} contractId={contractId} />

      {/* Warnings Section */}
      <WarningsSection warnings={warnings} />

      {/* Form Section */}
      <TicketFormSection
        hasBlockingWarning={hasBlockingWarning}
        ticketType={ticketType}
        contract={serializedContract}
        session={session as Session}
        permissions={permissions}
        validationData={validationData}
      />

      {/* Blocking Message */}
      <BlockingMessageSection
        hasBlockingWarning={hasBlockingWarning}
        ticketType={ticketType}
      />
    </Box>
  );
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

async function getContractData(contractId: string, userId: string) {
  try {
    return await getContractById(contractId, userId);
  } catch (err) {
    console.error("Error fetching contract:", err);
    return null;
  }
}

function getUserPermissions(contract: any, session: Session): UserPermissions {
  return {
    isArtist: contract.artistId.toString() === session.id,
    isClient: contract.clientId.toString() === session.id,
  };
}

function validateTicketPermissions(
  ticketType: string,
  contract: any,
  permissions: UserPermissions
) {
  // Check user permissions
  if (ticketType === "revision" && !permissions.isClient) {
    return (
      <Alert severity="error">
        Hanya klien yang dapat membuat tiket revisi
      </Alert>
    );
  }

  if (ticketType === "change" && !permissions.isClient) {
    return (
      <Alert severity="error">
        Hanya klien yang dapat membuat tiket perubahan
      </Alert>
    );
  }

  // Check contract settings
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

  return null;
}

async function getTicketValidationData(
  contractId: string
): Promise<TicketValidationData> {
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

  return {
    unresolvedCancelTickets,
    unresolvedChangeTickets,
    unresolvedResolutionTickets,
    unresolvedRevisionTickets,
    unfinishedRevisionTickets,
    unfinishedCancelTickets,
    unfinishedRevisionUploads,
    unfinishedFinalUploads,
    unfinishedFinalMilestoneUploads,
  };
}

function generateTicketWarnings(
  ticketType: string,
  data: TicketValidationData,
  permissions: UserPermissions
) {
  const warnings: Warning[] = [];
  let hasBlockingWarning = false;

  // Add general warnings
  addGeneralTicketWarnings(warnings, data);

  // Add ticket-specific warnings
  const ticketWarnings = getTicketSpecificWarnings(
    ticketType,
    data,
    permissions
  );
  warnings.push(...ticketWarnings.warnings);
  hasBlockingWarning = ticketWarnings.hasBlockingWarning;

  // Add informational warnings
  addInformationalWarnings(warnings, data, permissions);

  return { warnings, hasBlockingWarning };
}

function addGeneralTicketWarnings(
  warnings: Warning[],
  data: TicketValidationData
) {
  if (data.unresolvedResolutionTickets.length > 0) {
    warnings.push({
      type: "warning",
      message:
        "Ada kasus resolusi aktif untuk kontrak ini. Disarankan untuk menunggu sampai kasus tersebut terselesaikan sebelum membuat tiket baru.",
    });
  }
}

function getTicketSpecificWarnings(
  ticketType: string,
  data: TicketValidationData,
  permissions: UserPermissions
) {
  const warnings: Warning[] = [];
  let hasBlockingWarning = false;

  switch (ticketType) {
    case "cancel":
      return getCancelTicketWarnings(
        warnings,
        hasBlockingWarning,
        data,
        permissions
      );

    case "revision":
      return getRevisionTicketWarnings(warnings, hasBlockingWarning, data);

    case "change":
      return getChangeTicketWarnings(warnings, hasBlockingWarning, data);

    default:
      return { warnings, hasBlockingWarning };
  }
}

function getCancelTicketWarnings(
  warnings: Warning[],
  hasBlockingWarning: boolean,
  data: TicketValidationData,
  permissions: UserPermissions
) {
  // Check for existing cancellation requests
  if (data.unresolvedCancelTickets.length > 0) {
    warnings.push({
      type: "error",
      message:
        "Sudah ada permintaan pembatalan aktif untuk kontrak ini. Mohon tunggu hingga permintaan tersebut diselesaikan sebelum membuat yang baru.",
    });
    hasBlockingWarning = true;
  }

  // Artist-specific informational warnings
  if (permissions.isArtist && data.unfinishedRevisionTickets.length > 0) {
    warnings.push({
      type: "info",
      message: `Anda memiliki ${data.unfinishedRevisionTickets.length} tiket revisi yang memerlukan unggahan.`,
    });
  }

  return { warnings, hasBlockingWarning };
}

function getRevisionTicketWarnings(
  warnings: Warning[],
  hasBlockingWarning: boolean,
  data: TicketValidationData
) {
  // Informational warnings about existing revision tickets
  if (data.unresolvedRevisionTickets.length > 0) {
    warnings.push({
      type: "warning",
      message: `Ada ${data.unresolvedRevisionTickets.length} permintaan revisi yang masih menunggu tanggapan seniman atau pembayaran. Apabila ditolak dan revisi menggunakan sistem jatah, jatah anda akan kembali.`,
    });
  }

  // Warning about revision uploads
  if (data.unfinishedRevisionUploads.length > 0) {
    warnings.push({
      type: "warning",
      message: `Ada ${data.unfinishedRevisionUploads.length} unggahan revisi yang masih menunggu unggahan seniman.`,
    });
  }

  return { warnings, hasBlockingWarning };
}

function getChangeTicketWarnings(
  warnings: Warning[],
  hasBlockingWarning: boolean,
  data: TicketValidationData
) {
  // Check for existing change requests
  if (data.unresolvedChangeTickets.length > 0) {
    warnings.push({
      type: "error",
      message:
        "Sudah ada permintaan perubahan aktif untuk kontrak ini. Mohon tunggu hingga permintaan tersebut diselesaikan sebelum membuat yang baru.",
    });
    hasBlockingWarning = true;
  }

  // Warning about cancellation conflicts
  if (data.unresolvedCancelTickets.length > 0) {
    warnings.push({
      type: "warning",
      message:
        "Ada permintaan pembatalan aktif untuk kontrak ini. Perubahan kontrak mungkin tidak diproses jika pembatalan disetujui.",
    });
  }

  return { warnings, hasBlockingWarning };
}

function addInformationalWarnings(
  warnings: Warning[],
  data: TicketValidationData,
  permissions: UserPermissions
) {
  // Artist-specific informational warnings
  if (permissions.isArtist && data.unfinishedCancelTickets.length > 0) {
    warnings.push({
      type: "info",
      message:
        "Anda memiliki permintaan pembatalan yang telah diterima yang memerlukan unggahan bukti pekerjaan akhir.",
    });
  }

  // General upload status warnings
  if (data.unfinishedFinalUploads.length > 0) {
    warnings.push({
      type: "info",
      message: "Ada unggahan final yang menunggu ulasan.",
    });
  }

  if (data.unfinishedFinalMilestoneUploads.length > 0) {
    warnings.push({
      type: "info",
      message: "Ada unggahan milestone yang menunggu ulasan.",
    });
  }
}

// =============================================================================
// COMPONENT SECTIONS
// =============================================================================

function PageHeader({
  username,
  contractId,
}: {
  username: string;
  contractId: string;
}) {
  return (
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
  );
}

function WarningsSection({ warnings }: { warnings: Warning[] }) {
  if (warnings.length === 0) return null;

  return (
    <Box sx={{ mb: 3 }}>
      {warnings.map((warning, index) => (
        <Alert key={index} severity={warning.type} sx={{ mb: 1 }}>
          {warning.message}
        </Alert>
      ))}
    </Box>
  );
}

function TicketFormSection({
  hasBlockingWarning,
  ticketType,
  contract,
  session,
  permissions,
  validationData,
}: {
  hasBlockingWarning: boolean;
  ticketType: string;
  contract: any;
  session: Session;
  permissions: UserPermissions;
  validationData: TicketValidationData;
}) {
  if (hasBlockingWarning) {
    return null;
  }

  const commonProps = {
    contract,
    userId: session.id,
    username: session.username,
  };

  switch (ticketType) {
    case "cancel":
      return (
        <CancelTicketForm
          {...commonProps}
          isArtist={permissions.isArtist}
          isClient={permissions.isClient}
        />
      );

    case "revision":
      return (
        <RevisionTicketForm
          {...commonProps}
          isClient={permissions.isClient}
          unresolvedQty={validationData.unresolvedRevisionTickets.length}
        />
      );

    case "change":
      return (
        <ChangeTicketForm {...commonProps} isClient={permissions.isClient} />
      );

    default:
      return null;
  }
}

function BlockingMessageSection({
  hasBlockingWarning,
  ticketType,
}: {
  hasBlockingWarning: boolean;
  ticketType: string;
}) {
  if (!hasBlockingWarning) {
    return null;
  }

  const ticketTypeMap = {
    cancel: "pembatalan",
    revision: "revisi",
    change: "perubahan",
  };

  return (
    <Paper sx={{ p: 3, bgcolor: "#f5f5f5" }}>
      <Typography variant="body1" color="error">
        Anda tidak dapat membuat tiket{" "}
        {ticketTypeMap[ticketType as keyof typeof ticketTypeMap]} baru saat ini.
        Mohon selesaikan masalah yang disebutkan di atas terlebih dahulu.
      </Typography>
    </Paper>
  );
}

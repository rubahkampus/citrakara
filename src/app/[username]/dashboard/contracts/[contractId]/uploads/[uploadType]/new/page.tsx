// src/app/[username]/dashboard/contracts/[contractId]/uploads/[uploadType]/new/page.tsx
import {
  Box,
  Alert,
  Typography,
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
  hasFinishedContract as hasFinishedContractService,
  hasFinishedMilestone,
  hasFinishedCancellation,
  hasFinishedRevision,
  hasFinishedAllMilestones as hasFinishedAllMilestonesService,
} from "@/lib/services/upload.service";
import { findRevisionTicketById } from "@/lib/db/repositories/ticket.repository";

import ProgressUploadForm from "@/components/dashboard/contracts/uploads/ProgressUploadForm";
import RevisionUploadForm from "@/components/dashboard/contracts/uploads/RevisionUploadForm";
import FinalUploadForm from "@/components/dashboard/contracts/uploads/FinalUploadForm";
import MilestoneUploadForm from "@/components/dashboard/contracts/uploads/MilestoneUploadForm";
import {
  NavigateNext,
  Home,
  PaletteRounded,
  ConfirmationNumberRounded,
  ArrowBack,
  CloudUploadRounded,
} from "@mui/icons-material";

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

interface Warning {
  type: "error" | "warning" | "info" | "success";
  message: string;
}

interface UploadValidationData {
  unresolvedCancelTickets: any[];
  unresolvedChangeTickets: any[];
  unresolvedResolutionTickets: any[];
  unresolvedRevisionTickets: any[];
  unfinishedRevisionTickets: any[];
  unfinishedCancelTickets: any[];
  unfinishedRevisionUploads: any[];
  unfinishedFinalUploads: any[];
  unfinishedFinalMilestoneUploads: any[];
  hasFinishedContract: boolean;
  hasFinishedAllMilestones: boolean;
  hasFinishedMilestone?: boolean;
  hasFinishedCancellation?: boolean;
  hasFinishedRevision?: boolean;
}

export default async function CreateUploadPage({
  params,
  searchParams,
}: CreateUploadPageProps) {
  const param = await params;
  const searchParam = await searchParams;
  const { username, contractId, uploadType } = param;
  const { ticketId, milestoneIdx } = searchParam;

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
  const permissionCheck = validatePermissions(
    contract,
    session as Session,
    uploadType
  );
  if (permissionCheck) {
    return permissionCheck;
  }

  // Parameter validation
  const paramCheck = validateParameters(uploadType, ticketId, milestoneIdx);
  if (paramCheck) {
    return paramCheck;
  }

  // Revision ticket validation
  const revisionTicket = await validateRevisionTicket(uploadType, ticketId);
  if (revisionTicket && "error" in revisionTicket) {
    return revisionTicket.error;
  }

  // Get validation data
  const validationData = await getUploadValidationData(
    contractId,
    ticketId,
    milestoneIdx
  );

  // Generate warnings
  const { warnings, hasBlockingWarning } = generateWarnings(
    uploadType,
    contract,
    validationData,
    ticketId,
    milestoneIdx
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
      <FormSection
        hasBlockingWarning={hasBlockingWarning}
        uploadType={uploadType}
        contract={serializedContract}
        session={session as Session}
        ticketId={ticketId}
        milestoneIdx={milestoneIdx}
        validationData={validationData}
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

function validatePermissions(
  contract: any,
  session: Session,
  uploadType: string
) {
  const isArtist = contract.artistId.toString() === session.id;
  if (!isArtist) {
    return (
      <Alert severity="error">Hanya seniman yang dapat membuat unggahan</Alert>
    );
  }

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

  return null;
}

function validateParameters(
  uploadType: string,
  ticketId?: string,
  milestoneIdx?: string
) {
  if (uploadType === "revision" && !ticketId) {
    return <Alert severity="error">ID tiket revisi diperlukan</Alert>;
  }

  if (uploadType === "milestone" && !milestoneIdx) {
    return <Alert severity="error">Indeks milestone diperlukan</Alert>;
  }

  return null;
}

async function validateRevisionTicket(uploadType: string, ticketId?: string) {
  if (uploadType !== "revision" || !ticketId) {
    return null;
  }

  try {
    const revisionTicket = await findRevisionTicketById(ticketId);
    if (!revisionTicket) {
      return {
        error: <Alert severity="error">Tiket revisi tidak ditemukan</Alert>,
      };
    }

    if (
      revisionTicket.status !== "accepted" &&
      revisionTicket.status !== "paid" &&
      revisionTicket.status !== "forcedAcceptedArtist"
    ) {
      return {
        error: (
          <Alert severity="error">
            Tiket revisi ini tidak dalam status yang memungkinkan unggahan
          </Alert>
        ),
      };
    }

    return { ticket: revisionTicket };
  } catch (err) {
    console.error("Error fetching revision ticket:", err);
    return {
      error: <Alert severity="error">Gagal memuat data tiket revisi</Alert>,
    };
  }
}

async function getUploadValidationData(
  contractId: string,
  ticketId?: string,
  milestoneIdx?: string
): Promise<UploadValidationData> {
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
    hasFinishedContract,
    hasFinishedAllMilestones,
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
    hasFinishedContractService(contractId),
    hasFinishedAllMilestonesService(contractId),
  ]);

  // Get specific finished checks based on context
  let hasFinishedMilestoneCheck: boolean | undefined;
  let hasFinishedCancellationCheck: boolean | undefined;
  let hasFinishedRevisionCheck: boolean | undefined;

  if (milestoneIdx) {
    hasFinishedMilestoneCheck = await hasFinishedMilestone(
      contractId,
      parseInt(milestoneIdx)
    );
  }

  if (ticketId) {
    // Check if this is a cancellation or revision based on context
    const cancelTickets = unresolvedCancelTickets.concat(
      unfinishedCancelTickets
    );
    const isCancellation = cancelTickets.some(
      (ticket) => ticket._id.toString() === ticketId
    );

    if (isCancellation) {
      hasFinishedCancellationCheck = await hasFinishedCancellation(
        contractId,
        ticketId
      );
    } else {
      hasFinishedRevisionCheck = await hasFinishedRevision(
        contractId,
        ticketId
      );
    }
  }

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
    hasFinishedContract,
    hasFinishedAllMilestones,
    hasFinishedMilestone: hasFinishedMilestoneCheck,
    hasFinishedCancellation: hasFinishedCancellationCheck,
    hasFinishedRevision: hasFinishedRevisionCheck,
  };
}

function generateWarnings(
  uploadType: string,
  contract: any,
  data: UploadValidationData,
  ticketId?: string,
  milestoneIdx?: string
) {
  const warnings: Warning[] = [];
  let hasBlockingWarning = false;

  // Add general warnings
  addGeneralWarnings(warnings, data);

  // Add upload-specific warnings
  const uploadWarnings = getUploadSpecificWarnings(
    uploadType,
    contract,
    data,
    ticketId,
    milestoneIdx
  );

  warnings.push(...uploadWarnings.warnings);
  hasBlockingWarning = uploadWarnings.hasBlockingWarning;

  return { warnings, hasBlockingWarning };
}

function addGeneralWarnings(warnings: Warning[], data: UploadValidationData) {
  if (data.unresolvedResolutionTickets.length > 0) {
    warnings.push({
      type: "warning",
      message:
        "Terdapat tiket resolusi yang masih aktif untuk kontrak ini. Sebaiknya tunggu hingga kasus tersebut diselesaikan sebelum mengunggah progres baru.",
    });
  }

  if (data.unresolvedCancelTickets.length > 0) {
    warnings.push({
      type: "warning",
      message:
        "Terdapat permintaan pembatalan yang masih aktif untuk kontrak ini. Disarankan untuk menunggu hingga permintaan tersebut diproses sebelum melanjutkan unggahan.",
    });
  }

  if (data.unresolvedChangeTickets.length > 0) {
    warnings.push({
      type: "warning",
      message:
        "Terdapat permintaan perubahan kontrak yang masih aktif. Disarankan untuk menunggu hingga permintaan tersebut diproses sebelum melanjutkan unggahan.",
    });
  }
}

function getUploadSpecificWarnings(
  uploadType: string,
  contract: any,
  data: UploadValidationData,
  ticketId?: string,
  milestoneIdx?: string
) {
  const warnings: Warning[] = [];
  let hasBlockingWarning = false;

  switch (uploadType) {
    case "progress":
      return getProgressWarnings(warnings, hasBlockingWarning);

    case "milestone":
      return getMilestoneWarnings(
        warnings,
        hasBlockingWarning,
        contract,
        data,
        milestoneIdx
      );

    case "revision":
      return getRevisionWarnings(warnings, hasBlockingWarning, data, ticketId);

    case "final":
      return getFinalWarnings(
        warnings,
        hasBlockingWarning,
        contract,
        data,
        ticketId
      );

    default:
      return { warnings, hasBlockingWarning };
  }
}

function getProgressWarnings(warnings: Warning[], hasBlockingWarning: boolean) {
  // Standard progress uploads don't have many restrictions
  return { warnings, hasBlockingWarning };
}

function getMilestoneWarnings(
  warnings: Warning[],
  hasBlockingWarning: boolean,
  contract: any,
  data: UploadValidationData,
  milestoneIdx?: string
) {
  if (milestoneIdx) {
    const milestoneIdxNum = parseInt(milestoneIdx);

    // Check if milestone is already finished
    if (data.hasFinishedMilestone) {
      warnings.push({
        type: "info",
        message: `Milestone ${
          contract?.milestones?.[milestoneIdxNum]?.title || "ini"
        } telah selesai dengan unggahan yang diterima. Anda dapat mengunggah progres tambahan jika diperlukan.`,
      });
    }

    // Check for active milestone uploads
    const activeMilestoneUploads = data.unfinishedFinalMilestoneUploads.filter(
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

  // Check for unresolved revision tickets
  if (data.unresolvedRevisionTickets.length > 0) {
    warnings.push({
      type: "info",
      message: `Anda memiliki ${data.unresolvedRevisionTickets.length} permintaan revisi yang memerlukan tanggapan anda atau pembayaran klien. Disarankan untuk menunggu hingga permintaan tersebut diproses sebelum melanjutkan unggahan.`,
    });
  }

  // Check for unfinished revision tickets
  if (data.unfinishedRevisionTickets.length > 0) {
    warnings.push({
      type: "error",
      message: `Anda memiliki ${data.unfinishedRevisionTickets.length} tiket revisi yang memerlukan unggahan anda untuk milestone ini. Harap selesaikan revisi terlebih dahulu`,
    });
    hasBlockingWarning = true;
  }

  return { warnings, hasBlockingWarning };
}

function getRevisionWarnings(
  warnings: Warning[],
  hasBlockingWarning: boolean,
  data: UploadValidationData,
  ticketId?: string
) {
  if (ticketId) {
    // Check if revision is already finished
    if (data.hasFinishedRevision) {
      warnings.push({
        type: "info",
        message:
          "Revisi untuk tiket ini telah selesai dengan unggahan yang diterima. Anda dapat mengunggah revisi tambahan jika diperlukan.",
      });
    }

    // Check for active revision uploads for this ticket
    const activeTicketUploads = data.unfinishedRevisionUploads.filter(
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

  // Check for other revision tickets
  const otherRevisionTickets = data.unfinishedRevisionTickets.filter(
    (ticket) => !ticketId || ticket._id.toString() !== ticketId
  );

  if (otherRevisionTickets.length > 0) {
    warnings.push({
      type: "info",
      message: `Anda memiliki ${otherRevisionTickets.length} tiket revisi lain yang memerlukan unggahan.`,
    });
  }

  return { warnings, hasBlockingWarning };
}

function getFinalWarnings(
  warnings: Warning[],
  hasBlockingWarning: boolean,
  contract: any,
  data: UploadValidationData,
  ticketId?: string
) {
  console.log(ticketId, "ticketId in getFinalWarnings");
  // Check if contract is already finished
  if (data.hasFinishedContract) {
    warnings.push({
      type: "info",
      message:
        "Kontrak ini telah selesai dengan pengiriman final yang diterima. Anda dapat mengunggah pengiriman tambahan jika diperlukan.",
    });
  }

  // Check for active final uploads
  if (data.unfinishedFinalUploads.length > 0) {
    warnings.push({
      type: "error",
      message:
        "Sudah ada unggahan final aktif. Mohon tunggu ulasan klien sebelum mengirimkan yang baru.",
    });
    hasBlockingWarning = true;
  }

  if (ticketId) {
    // This is a cancellation upload - different validation rules

    // Check if cancellation is already finished
    if (data.hasFinishedCancellation) {
      warnings.push({
        type: "info",
        message:
          "Pembatalan untuk tiket ini telah selesai dengan bukti yang diterima. Anda dapat mengunggah bukti tambahan jika diperlukan.",
      });
    }

    // For cancellation uploads, unfinished revisions are allowed but inform the user
    if (data.unfinishedRevisionTickets.length > 0) {
      warnings.push({
        type: "info", // Changed from "error" to "info"
        message: `Anda masih memiliki ${data.unfinishedRevisionTickets.length} revisi yang menunggu unggahan. Namun, Anda dapat mengunggah bukti pembatalan untuk mengakhiri kontrak ini.`,
      });
      // Remove the blocking warning for cancellation uploads
      // hasBlockingWarning = true; // This line should be removed/commented out
    }
  } else {
    // This is a regular final delivery - strict validation rules

    if (
      contract.proposalSnapshot.listingSnapshot.flow === "milestone" &&
      contract.milestones
    ) {
      // Check if all milestones are finished
      if (data.hasFinishedAllMilestones) {
        warnings.push({
          type: "info",
          message:
            "Semua milestone telah selesai dengan unggahan yang diterima. Siap untuk pengiriman final.",
        });
      } else {
        // Check individual milestones
        const incompleteMilestones = contract.milestones.filter(
          (milestone: any) => milestone.status !== "accepted"
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
    }

    // Check for unfinished revisions - ONLY block for regular final delivery
    if (data.unfinishedRevisionTickets.length > 0) {
      warnings.push({
        type: "error",
        message:
          "Anda harus menyelesaikan semua permintaan revisi sebelum mengirimkan pengiriman final.",
      });
      hasBlockingWarning = true;
    }
  }

  return { warnings, hasBlockingWarning };
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

function FormSection({
  hasBlockingWarning,
  uploadType,
  contract,
  session,
  ticketId,
  milestoneIdx,
  validationData,
}: {
  hasBlockingWarning: boolean;
  uploadType: string;
  contract: any;
  session: Session;
  ticketId?: string;
  milestoneIdx?: string;
  validationData: UploadValidationData;
}) {
  // For final uploads with a cancel ticket, allow bypassing blocking warnings
  const shouldAllowUpload =
    uploadType === "final" && ticketId
      ? true // Always allow final upload with cancel ticket
      : !hasBlockingWarning;

  if (!shouldAllowUpload) {
    return null;
  }

  const commonProps = {
    contract,
    userId: session.id,
    username: session.username,
  };

  switch (uploadType) {
    case "progress":
      return <ProgressUploadForm {...commonProps} />;

    case "milestone":
      return (
        <MilestoneUploadForm
          {...commonProps}
          milestoneIdx={parseInt(milestoneIdx || "0")}
          isAllowedFinal={validationData.unfinishedRevisionTickets.length === 0}
        />
      );

    case "revision":
      if (!ticketId) return null;
      return <RevisionUploadForm {...commonProps} ticketId={ticketId} />;

    case "final":
      return <FinalUploadForm {...commonProps} cancelTicketId={ticketId} />;

    default:
      return null;
  }
}

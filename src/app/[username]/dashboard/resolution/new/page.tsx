// src/app/[username]/dashboard/resolution/new/page.tsx
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
import { getUnresolvedResolutionTickets } from "@/lib/services/ticket.service";
import {
  NavigateNext,
  Home,
  PaletteRounded,
  ArrowBack,
  GavelRounded,
} from "@mui/icons-material";
import ResolutionTicketForm from "@/components/dashboard/contracts/tickets/ResolutionTicketForm";

interface CreateResolutionPageProps {
  params: {
    username: string;
  };
  searchParams: {
    contractId?: string;
    targetType?:
      | "cancelTicket"
      | "revisionTicket"
      | "changeTicket"
      | "finalUpload"
      | "progressMilestoneUpload"
      | "revisionUpload";
    targetId?: string;
  };
}

export default async function CreateResolutionPage({
  params,
  searchParams,
}: CreateResolutionPageProps) {
  const { username } = params;
  const { contractId, targetType, targetId } = searchParams;
  const session = await getAuthSession();

  // Check if user is authenticated and authorized
  if (!session || !isUserOwner(session as Session, username)) {
    return (
      <Alert severity="error">Anda tidak memiliki akses ke halaman ini</Alert>
    );
  }

  // Check if contract ID is provided
  if (!contractId) {
    return (
      <Alert severity="error">
        ID kontrak diperlukan untuk membuat permintaan resolusi
      </Alert>
    );
  }

  // Check if target information is provided
  if (!targetType || !targetId) {
    return (
      <Alert severity="error">
        Informasi target diperlukan untuk membuat permintaan resolusi
      </Alert>
    );
  }

  // Fetch contract data
  let contract;
  try {
    contract = await getContractById(contractId, (session as Session).id);
  } catch (err) {
    console.error("Error fetching contract:", err);
    return <Alert severity="error">Gagal memuat data kontrak</Alert>;
  }

  // Check if user is either the artist or client of this contract
  const isArtist = contract.artistId.toString() === (session as Session).id;
  const isClient = contract.clientId.toString() === (session as Session).id;

  if (!isArtist && !isClient) {
    return (
      <Alert severity="error">
        Anda tidak memiliki akses untuk membuat permintaan resolusi pada kontrak
        ini
      </Alert>
    );
  }

  // Check if there are already unresolved resolution tickets
  const unresolvedResolutionTickets = await getUnresolvedResolutionTickets(
    contractId
  );

  // In some cases, we might want to prevent multiple resolution tickets
  // But since this is a dispute system, it's reasonable to allow multiple tickets
  const warnings = [];
  if (unresolvedResolutionTickets.length > 0) {
    warnings.push({
      type: "warning",
      message: `Sudah ada ${unresolvedResolutionTickets.length} permintaan resolusi aktif untuk kontrak ini. Membuat permintaan tambahan dapat memperlambat proses.`,
    });
  }

  // Serialize contract for client components
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
              href={`/${username}/dashboard/resolution`}
              underline="hover"
              color="inherit"
              sx={{ display: "flex", alignItems: "center" }}
            >
              Daftar Resolusi
            </Link>
            <Typography
              color="text.primary"
              sx={{ display: "flex", alignItems: "center" }}
            >
              Buat Permintaan Resolusi
            </Typography>
          </Breadcrumbs>

          <Box display="flex" alignItems="center" mt={4} ml={-0.5} mb={2}>
            <GavelRounded sx={{ mr: 1, color: "primary.main", fontSize: 32 }} />
            <Typography variant="h4" fontWeight="bold">
              Buat Permintaan Resolusi
            </Typography>
          </Box>
        </Box>

        <Button
          component={Link}
          href={`/${username}/dashboard/resolution`}
          variant="outlined"
          startIcon={<ArrowBack />}
          size="small"
        >
          Kembali ke Daftar Resolusi
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

      {/* Resolution Form */}
      <ResolutionTicketForm
        contract={serializedContract}
        userId={(session as Session).id}
        username={(session as Session).username}
        isArtist={isArtist}
        isClient={isClient}
        initialTargetType={targetType}
        initialTargetId={targetId}
      />
    </Box>
  );
}

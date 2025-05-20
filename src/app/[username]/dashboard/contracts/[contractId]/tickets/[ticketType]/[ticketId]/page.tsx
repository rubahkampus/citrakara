// src/app/[username]/dashboard/contracts/[contractId]/tickets/[ticketType]/[ticketId]/page.tsx
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
import { findCancelTicketById } from "@/lib/db/repositories/ticket.repository";
import { findRevisionTicketById } from "@/lib/db/repositories/ticket.repository";
import { findChangeTicketById } from "@/lib/db/repositories/ticket.repository";
import { findResolutionTicketById } from "@/lib/db/repositories/ticket.repository";

// These components would be created in src/components/dashboard/contracts/tickets/
import CancelTicketDetails from "@/components/dashboard/contracts/tickets/CancelTicketDetails";
import RevisionTicketDetails from "@/components/dashboard/contracts/tickets/RevisionTicketDetails";
import ChangeTicketDetails from "@/components/dashboard/contracts/tickets/ChangeTicketDetails";
import ResolutionTicketDetails from "@/components/dashboard/contracts/tickets/ResolutionTicketDetails";
import { IContract } from "@/lib/db/models/contract.model";
import { IResolutionTicket } from "@/lib/db/models/ticket.model";
import { isAdminByUsername } from "@/lib/db/repositories/user.repository";
import {
  NavigateNext,
  Home,
  PaletteRounded,
  CloudUploadRounded,
  ArrowBack,
  ConfirmationNumberRounded,
} from "@mui/icons-material";

interface TicketDetailsPageProps {
  params: {
    username: string;
    contractId: string;
    ticketType: "cancel" | "revision" | "change";
    ticketId: string;
  };
}

export default async function TicketDetailsPage({
  params,
}: TicketDetailsPageProps) {
  const param = await params;
  const { username, contractId, ticketType, ticketId } = param;
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

  // Get the specific ticket
  let ticket;
  let isExpired = false;

  try {
    switch (ticketType) {
      case "cancel":
        ticket = await findCancelTicketById(ticketId);
        break;
      case "revision":
        ticket = await findRevisionTicketById(ticketId);
        break;
      case "change":
        ticket = await findChangeTicketById(ticketId);
        break;
      default:
        return <Alert severity="error">Invalid ticket type</Alert>;
    }

    if (!ticket) {
      return <Alert severity="error">Ticket not found</Alert>;
    }

    // Check if ticket is expired but don't block rendering
    const currentTime = new Date();
    if (ticket.expiresAt && ticket.expiresAt <= currentTime) {
      isExpired = true;
    }
  } catch (err) {
    console.error(`Error fetching ${ticketType} ticket:`, err);
    return <Alert severity="error">Failed to load ticket data</Alert>;
  }

  // Serialize for client components
  const serializedContract = JSON.parse(JSON.stringify(contract)) as IContract;
  const serializedTicket = JSON.parse(JSON.stringify(ticket));

  return (
    <Box py={4}>
      {/* Show non-blocking expired alert if needed */}
      {isExpired && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          Tiket ini telah kedaluwarsa, tolong buat tiket baru atau ajukan tiket perselisihan
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
              Detail Tiket
            </Typography>
          </Breadcrumbs>

          <Box display="flex" alignItems="center" mt={4} ml={-0.5} mb={2}>
            <ConfirmationNumberRounded
              sx={{ mr: 1, color: "primary.main", fontSize: 32 }}
            />
            <Typography variant="h4" fontWeight="bold">
              Detail Tiket
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

      {/* These would be implemented separately */}
      {ticketType === "cancel" && (
        <CancelTicketDetails
          contract={serializedContract}
          ticket={serializedTicket}
          userId={(session as Session).id}
          isArtist={isArtist}
          isClient={isClient}
          isAdmin={false}
          username={(session as Session).username}
          canReview={isExpired}
        />
      )}

      {ticketType === "revision" && (
        <RevisionTicketDetails
          contract={serializedContract}
          ticket={serializedTicket}
          userId={(session as Session).id}
          isArtist={isArtist}
          isClient={isClient}
          isAdmin={false}
          username={(session as Session).username}
          canReview={isExpired}
        />
      )}

      {ticketType === "change" && (
        <ChangeTicketDetails
          contract={serializedContract}
          ticket={serializedTicket}
          userId={(session as Session).id}
          isArtist={isArtist}
          isClient={isClient}
          isAdmin={false}
          username={(session as Session).username}
          canReview={isExpired}
        />
      )}
    </Box>
  );
}

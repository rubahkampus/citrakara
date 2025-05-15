// src/app/[username]/dashboard/resolution/[ticketId]/page.tsx
import { Box, Alert, Typography } from "@mui/material";
import { getAuthSession, isUserOwner, Session } from "@/lib/utils/session";
import { findResolutionTicketById } from "@/lib/db/repositories/ticket.repository";
import { getContractById } from "@/lib/services/contract.service";
import ResolutionTicketDetails from "@/components/dashboard/contracts/tickets/ResolutionTicketDetails";
import Link from "next/link";

interface ResolutionDetailsPageProps {
  params: {
    username: string;
    ticketId: string;
  };
}

export default async function ResolutionDetailsPage({
  params,
}: ResolutionDetailsPageProps) {
  const param = await params;
  const { username, ticketId } = param;
  const session = await getAuthSession();

  if (!session || !isUserOwner(session as Session, username)) {
    return (
      <Alert severity="error">Anda tidak memiliki akses ke halaman ini</Alert>
    );
  }

  // Get resolution ticket
  let ticket;
  try {
    ticket = await findResolutionTicketById(ticketId);
    if (!ticket) {
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
      ticket.contractId.toString(),
      (session as Session).id
    );
  } catch (err) {
    console.error("Error fetching contract:", err);
    return <Alert severity="error">Gagal memuat data kontrak</Alert>;
  }

  // Determine the user's role in this ticket
  const isArtist = contract.artistId.toString() === (session as Session).id;
  const isClient = contract.clientId.toString() === (session as Session).id;

  // Verify user is involved in this resolution
  const isInvolved = isArtist || isClient;
  if (!isInvolved) {
    return (
      <Alert severity="error">
        Anda tidak memiliki akses ke tiket penyelesaian ini
      </Alert>
    );
  }

  // Serialize ticket for client component
  const serializedTicket = JSON.parse(JSON.stringify(ticket));

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography
          variant="body2"
          component={Link}
          href={`/dashboard/${username}/contracts/${ticket.contractId}`}
          sx={{ textDecoration: "none", color: "primary.main" }}
        >
          &larr; Kembali ke kontrak
        </Typography>
      </Box>

      <ResolutionTicketDetails
        ticket={serializedTicket}
        userId={(session as Session).id}
        contractId={ticket.contractId.toString()}
        isArtist={isArtist}
        isClient={isClient}
      />
    </Box>
  );
}

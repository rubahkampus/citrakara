// src/app/[username]/dashboard/contracts/[contractId]/resolution/new/page.tsx
// src/app/[username]/dashboard/contracts/[contractId]/resolution/new/page.tsx
import { Box, Alert, Typography } from "@mui/material";
import { getAuthSession, isUserOwner, Session } from "@/lib/utils/session";
import { getContractById } from "@/lib/services/contract.service";
import { getUnresolvedResolutionTickets } from "@/lib/services/ticket.service";
import ResolutionTicketForm from "@/components/dashboard/contracts/tickets/ResolutionTicketForm";

interface ResolutionTicketPageProps {
  params: {
    username: string;
    contractId: string;
  };
  searchParams?: {
    targetType?: string;
    targetId?: string;
  };
}

export default async function ResolutionTicketPage({
  params,
  searchParams,
}: ResolutionTicketPageProps) {
  const { username, contractId } = params;
  const session = await getAuthSession();

  // Check if user is authorized
  if (!session || !isUserOwner(session as Session, username)) {
    return <Alert severity="error">You do not have access to this page</Alert>;
  }

  // Fetch contract data
  let contract;
  try {
    contract = await getContractById(contractId, (session as Session).id);
  } catch (err) {
    console.error("Error fetching contract:", err);
    return <Alert severity="error">Failed to load contract data</Alert>;
  }

  // Determine user role
  const isArtist = contract.artistId.toString() === (session as Session).id;
  const isClient = contract.clientId.toString() === (session as Session).id;

  // Check if user has permission to create a resolution ticket
  if (!isArtist && !isClient) {
    return (
      <Alert severity="error">
        Only contract participants can create resolution tickets
      </Alert>
    );
  }

  // Check for existing unresolved resolution tickets
  const unresolvedResolutionTickets = await getUnresolvedResolutionTickets(
    contractId
  );

  // Check if there's already an active resolution ticket
  if (unresolvedResolutionTickets.length > 0) {
    return (
      <Box>
        <Typography variant="h5" fontWeight="bold" sx={{ mb: 3 }}>
          Request Resolution
        </Typography>

        <Alert severity="error" sx={{ mb: 3 }}>
          There is already an active resolution case for this contract. Please
          wait for it to be resolved before creating a new one.
        </Alert>
      </Box>
    );
  }

  // Prepare URL params if provided
  const searchParam = await searchParams;
  const targetType = searchParam?.targetType as
    | "cancel"
    | "revision"
    | "final"
    | "milestone";
  const targetId = searchParam?.targetId;

  // Serialize contract for client component
  const serializedContract = JSON.parse(JSON.stringify(contract));

  return (
    <Box>
      <Typography variant="h5" fontWeight="bold" sx={{ mb: 3 }}>
        Request Resolution
      </Typography>

      {targetId && targetType && (
        <ResolutionTicketForm
          contract={serializedContract}
          userId={(session as Session).id}
          username={(session as Session).username}
          isArtist={isArtist}
          isClient={isClient}
          // Pass URL params if provided
          initialTargetType={targetType}
          initialTargetId={targetId}
        />
      )}
    </Box>
  );
}

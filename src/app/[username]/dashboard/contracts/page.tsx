import { Box, Container, CircularProgress, Alert } from "@mui/material";
import { getAuthSession, isUserOwner, Session } from "@/lib/utils/session";
import { getUserContracts } from "@/lib/services/contract.service";
import ContractListingPage from "@/components/dashboard/contracts/ContractListingPage";

interface ContractsPageProps {
  params: { username: string };
}

export default async function ContractsPage({ params }: ContractsPageProps) {
  const param = await params;
  const username = param.username;
  const session = await getAuthSession();
  const isAuthorized = session && isUserOwner(session as Session, username);

  // If not authorized, return the client component with auth error
  if (!isAuthorized) {
    return (
      <Alert severity="error">
        You do not have access to this page. Please log in with the correct
        account.
      </Alert>
    );
  }

  let contracts;
  let error = null;

  try {
    contracts = await getUserContracts((session as Session).id);
  } catch (err) {
    console.error("Error fetching contracts:", err);
    error = "Failed to load your contracts. Please try refreshing the page.";
  }

  const asArtist = contracts?.asArtist ?? [];
  const asClient = contracts?.asClient ?? [];

  // Serialize for client components
  const serializedAsArtist = JSON.parse(JSON.stringify(asArtist));
  const serializedAsClient = JSON.parse(JSON.stringify(asClient));

  return (
    <ContractListingPage
      key={`contract-list-${serializedAsArtist?.length}-${serializedAsClient?.length}`}
      username={username}
      asArtist={serializedAsArtist || []}
      asClient={serializedAsClient || []}
      error={error ?? undefined}
    />
  );
}

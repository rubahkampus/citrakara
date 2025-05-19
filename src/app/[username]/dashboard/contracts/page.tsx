import { Box, Container, CircularProgress } from "@mui/material";
import { getAuthSession, isUserOwner, Session } from "@/lib/utils/session";
import { getUserContracts } from "@/lib/services/contract.service";
import ContractsClientPage from "@/components/dashboard/contracts/ContractsClientPage";

interface ContractsPageProps {
  params: { username: string };
}

export default async function ContractsPage({ params }: ContractsPageProps) {
  const username = params.username;
  const session = await getAuthSession();
  const isAuthorized = session && isUserOwner(session as Session, username);

  // If not authorized, return the client component with auth error
  if (!isAuthorized) {
    return (
      <ContractsClientPage
        username={username}
        isAuthorized={false}
        asArtist={[]}
        asClient={[]}
      />
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
    <ContractsClientPage
      username={username}
      asArtist={serializedAsArtist}
      asClient={serializedAsClient}
      error={error || undefined}
      isAuthorized={true}
    />
  );
}

// Updated Resolution page to handle query parameters correctly
// src/app/[username]/dashboard/contracts/[contractId]/resolution/page.tsx
import { redirect } from "next/navigation";
import { Box, Alert, Typography } from "@mui/material";
import { getAuthSession, isUserOwner, Session } from "@/lib/utils/session";
import { getContractById } from "@/lib/services/contract.service";
import { isValidObjectId } from "@/lib/utils/toObjectId";

interface ResolutionRedirectPageProps {
  params: {
    username: string;
    contractId: string;
  };
  searchParams: {
    targetType?: string;
    targetId?: string;
  };
}

export default async function ResolutionRedirectPage({
  params,
  searchParams,
}: ResolutionRedirectPageProps) {
  const { username, contractId } = params;
  const { targetType, targetId } = searchParams;

  // Validate the session
  const session = await getAuthSession();
  if (!session || !isUserOwner(session as Session, username)) {
    return <Alert severity="error">You do not have access to this page</Alert>;
  }

  // Validate contract access
  try {
    await getContractById(contractId, (session as Session).id);
  } catch (err) {
    console.error("Error fetching contract:", err);
    return <Alert severity="error">Failed to load contract data</Alert>;
  }

  // Redirect to the new form page
  // If we have valid parameters, include them in the redirect
  if (targetType && targetId) {
    // Validate parameters - only redirect if they are valid
    const validTargetTypes = ["cancel", "revision", "final", "milestone"];
    const isValidType = validTargetTypes.includes(targetType);
    const isValidId = isValidObjectId(targetId);

    if (isValidType && isValidId) {
      redirect(
        `/dashboard/${username}/contracts/${contractId}/resolution/new?targetType=${targetType}&targetId=${targetId}`
      );
    } else {
      // If invalid, redirect without query params
      redirect(`/dashboard/${username}/contracts/${contractId}/resolution/new`);
    }
  } else {
    // Simple redirect to new
    redirect(`/dashboard/${username}/contracts/${contractId}/resolution/new`);
  }

  // This will never be shown due to the redirect, but needed for TypeScript
  return (
    <Box>
      <Typography>Redirecting...</Typography>
    </Box>
  );
}

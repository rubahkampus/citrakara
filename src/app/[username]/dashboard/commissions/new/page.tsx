// src/app/[username]/dashboard/commissions/new/page.tsx
import { Box, Typography } from "@mui/material";
import { getAuthSession } from "@/lib/utils/session";
import { getUserDefaultTos } from "@/lib/services/tos.service";
import CommissionFormPage from "@/components/dashboard/commissions/CommissionFormPage";

interface NewCommissionPageProps {
  params: { username: string };
}

export default async function NewCommissionPage({
  params: { username },
}: NewCommissionPageProps) {
  // Get the current session and validate access
  const session = await getAuthSession();

  if (
    !session ||
    typeof session === "string" ||
    session.username !== username
  ) {
    return (
      <Box>
        <Typography color="error">Access denied</Typography>
      </Box>
    );
  }

  // Get user's default TOS for prefilling
  let defaultTosId = null;
  try {
    const defaultTos = await getUserDefaultTos(session.id);
    if (defaultTos) {
      defaultTosId = defaultTos._id;
    }
  } catch (error) {
    console.error("Error fetching default TOS:", error);
  }

  return (
    <Box>
      <Typography variant="h5" fontWeight="bold" sx={{ mb: 3 }}>
        Create New Commission
      </Typography>

      <CommissionFormPage
        username={username}
        mode="create"
      />
    </Box>
  );
}

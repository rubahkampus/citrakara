import { Suspense } from "react";
import { Box, Typography, Alert, Container, Paper } from "@mui/material";
import { getAuthSession, isUserOwner, Session } from "@/lib/utils/session";
import { getResolutionTicketsByUser } from "@/lib/services/ticket.service";
import ResolutionListSkeleton from "@/components/dashboard/resolution/ResolutionListSkeleton";
import ResolutionListPage from "@/components/dashboard/resolution/ResolutionListPage";
import { GavelRounded as GavelIcon } from "@mui/icons-material";

interface ResolutionPageProps {
  params: { username: string };
}

export default async function ResolutionPage({ params }: ResolutionPageProps) {
  const param = await params
  const { username } = param;
  const session = await getAuthSession();

  if (!session || !isUserOwner(session as Session, username)) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert
          severity="error"
          sx={{
            borderRadius: 1,
            boxShadow: "0 1px 3px rgba(0,0,0,0.12)",
          }}
        >
          You do not have access to this page. Please log in with the correct
          account.
        </Alert>
      </Container>
    );
  }

  let resolutionTickets;
  let error = null;

  try {
    resolutionTickets = await getResolutionTicketsByUser(
      (session as Session).id,
      "both"
    );
  } catch (err) {
    console.error("Error fetching resolution tickets:", err);
    error = "Failed to load resolution data. Please try refreshing the page.";
    resolutionTickets = [];
  }

  const serializedTickets = JSON.parse(JSON.stringify(resolutionTickets));

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Paper
        sx={{
          p: 3,
          borderRadius: 2,
          boxShadow: "0 1px 3px rgba(0,0,0,0.12)",
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            mb: 4,
            borderBottom: "1px solid",
            borderColor: "divider",
            pb: 2,
          }}
        >
          <GavelIcon sx={{ mr: 1, color: "primary.main" }} />
          <Typography variant="h5" fontWeight="bold">
            Dispute Resolution Center
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Suspense fallback={<ResolutionListSkeleton />}>
          <ResolutionListPage
            username={username}
            tickets={serializedTickets}
            userId={(session as Session).id}
          />
        </Suspense>
      </Paper>
    </Container>
  );
}

// src/app/[username]/dashboard/admin-resolution/page.tsx
import { Suspense } from "react";
import { Box, Typography, Alert } from "@mui/material";
import { getAuthSession, isUserOwner, Session } from "@/lib/utils/session";
import { isUserAdminById } from "@/lib/services/user.service";
import { getAllResolutionTickets } from "@/lib/services/ticket.service";
import DashboardLoadingSkeleton from "@/components/dashboard/DashboardLoadingSkeleton";

// This component would be created in src/components/dashboard/admin/
import AdminResolutionListPage from "@/components/dashboard/admin-resolution/AdminResolutionListPage";

interface AdminResolutionPageProps {
  params: { username: string };
}

export default async function AdminResolutionPage({
  params,
}: AdminResolutionPageProps) {
  const param = await params
  const { username } = param;
  const session = await getAuthSession();

  if (!session || !isUserOwner(session as Session, username)) {
    return <Alert severity="error">You do not have access to this page</Alert>;
  }

  // Check if user is an admin
  const isAdmin = await isUserAdminById((session as Session).id);
  if (!isAdmin) {
    return <Alert severity="error">You do not have admin privileges</Alert>;
  }

  let resolutionTickets;
  try {
    // Default to fetching awaiting review tickets
    resolutionTickets = await getAllResolutionTickets({
      status: ["awaitingReview"],
    });
  } catch (err) {
    console.error("Error fetching resolution tickets:", err);
    return <Alert severity="error">Failed to load resolution data</Alert>;
  }

  const serializedTickets = JSON.parse(JSON.stringify(resolutionTickets));

  return (
    <Box>
      <Typography variant="h5" fontWeight="bold" sx={{ mb: 3 }}>
        Admin Resolution Center
      </Typography>

      <Suspense fallback={<DashboardLoadingSkeleton />}>
        {/* This component would be implemented separately */}
        <AdminResolutionListPage
          username={username}
          tickets={serializedTickets}
          userId={(session as Session).id}
        />
        <Box>
          <Typography variant="h6">Pending Resolution Tickets</Typography>
          {resolutionTickets.length === 0 ? (
            <Typography>No pending resolution tickets found</Typography>
          ) : (
            <Typography>
              Found {resolutionTickets.length} tickets awaiting review
            </Typography>
          )}
        </Box>
      </Suspense>
    </Box>
  );
}

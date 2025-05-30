// src/app/[username]/dashboard/layout.tsx
import { ReactNode } from "react";
import { redirect, notFound } from "next/navigation";
import { Box, Container } from "@mui/material";
import { Suspense } from "react";
import DashboardSidebarWrapper from "@/components/dashboard/DashboardSidebarWrapper";
import DashboardLoadingSkeleton from "@/components/dashboard/DashboardLoadingSkeleton";
import ExpirationProcessor from "@/components/ExpirationProcessor";
import { getAuthSession, isUserOwner, Session } from "@/lib/utils/session";
import { getUserPublicProfile } from "@/lib/services/user.service";

interface Props {
  children: ReactNode;
  params: { username: string };
}

export default async function DashboardLayout({ children, params }: Props) {
  const param = await params;
  const { username } = param;

  const session = await getAuthSession();
  const profile = await getUserPublicProfile(username);

  if (!profile) notFound();
  if (!session || typeof session !== "object" || !("username" in session)) {
    redirect(`/${username}`);
  }
  if (!isUserOwner(session as Session, username)) redirect(`/${username}`);

  // Serialize for client
  const serializedProfile = JSON.parse(JSON.stringify(profile));

  return (
    <Container maxWidth="lg" sx={{ pt: 4, pb: 8 }}>
      {/* Process expirations every 5 minutes */}
      <ExpirationProcessor
        userId={(session as Session).id}
        intervalMinutes={5}
      />

      <Box display="flex" flexDirection={{ xs: "column", md: "row" }} gap={3}>
        <DashboardSidebarWrapper
          username={username}
          profile={serializedProfile}
        />
        <Box flex={1} minWidth={0}>
          <Suspense fallback={<DashboardLoadingSkeleton />}>
            {children}
          </Suspense>
        </Box>
      </Box>
    </Container>
  );
}

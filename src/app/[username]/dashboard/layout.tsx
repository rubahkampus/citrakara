// src/app/[username]/dashboard/layout.tsx
import type { ReactNode } from 'react';
import { redirect, notFound } from 'next/navigation';
import { getAuthSession, isUserOwner, serializeProfile, Session } from '@/lib/utils/session';
import { getUserPublicProfile } from '@/lib/services/user.service';
import DashboardSidebar from '@/components/DashboardSidebar';
import { Box } from '@mui/material';

interface Props {
  children: ReactNode;
  params: { username: string };
}

export default async function DashboardLayout({ children, params }: Props) {
  const session = await getAuthSession() as Session | null;
  const raw = await getUserPublicProfile(params.username);
  const profile = serializeProfile(raw);

  if (!profile) notFound();
  if (!isUserOwner(session, params.username)) {
    redirect(`/${params.username}`);
  }

  return (
    <Box sx={{ display: 'flex', gap: 3, mt: 3 }}>
      <DashboardSidebar username={params.username} />
      {children}
    </Box>
  );
}

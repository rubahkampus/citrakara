// src/app/[username]/dashboard/layout.tsx
import type { ReactNode } from 'react';
import { redirect, notFound } from 'next/navigation';
import { getAuthSession, isUserOwner, Session } from '@/lib/utils/session';
import { getUserPublicProfile } from '@/lib/services/user.service';
import DashboardSidebarWrapper from '@/components/dashboard/DashboardSidebarWrapper';
import { Box, Container } from '@mui/material';
import { Suspense } from 'react';
import DashboardLoadingSkeleton from '@/components/dashboard/DashboardLoadingSkeleton';

interface Props {
  children: ReactNode;
  params: { username: string };
}

// Context provider is moved to a separate component to avoid hydration issues
export default async function DashboardLayout({ children, params }: Props) {
  const { username } = params;
  const session = await getAuthSession() as Session | null;
  const profile = await getUserPublicProfile(username);

  // Handle auth and 404 errors
  if (!profile) {
    notFound();
  }
  
  if (!isUserOwner(session, username)) {
    redirect(`/${username}`);
  }

  // Serialize the data to avoid passing complex MongoDB objects to client components
  const serializedProfile = JSON.parse(JSON.stringify(profile));
  
  return (
    <Container maxWidth="lg" sx={{ pt: 4, pb: 8 }}>
      <Box sx={{ 
        display: 'flex', 
        flexDirection: { xs: 'column', md: 'row' }, 
        gap: 3 
      }}>
        {/* Sidebar - wrapped in client component for interactivity */}
        <DashboardSidebarWrapper 
          username={username} 
          profile={serializedProfile} 
        />
        
        {/* Main content area */}
        <Box sx={{ 
          flex: 1,
          minWidth: 0, // Important for flexbox to respect content width
        }}>
          <Suspense fallback={<DashboardLoadingSkeleton />}>
            {children}
          </Suspense>
        </Box>
      </Box>
    </Container>
  );
}
// src/components/dashboard/DashboardSidebarWrapper.tsx
'use client';

import { Box, useMediaQuery, Theme } from '@mui/material';
import { useState, useEffect } from 'react';
import DashboardSidebar from './DashboardSidebar';
import { useDashboardStore } from '@/lib/stores/dashboardStore';

interface Props {
  username: string;
  profile: {
    profilePicture: string;
    displayName?: string;
  };
}

/**
 * Client wrapper for the sidebar to handle responsive behavior
 * This component determines whether the sidebar is expanded/collapsed
 * based on screen size and manages sidebar state via Zustand
 */
export default function DashboardSidebarWrapper({ username, profile }: Props) {
  // Check viewport for responsive behavior
  const isMobile = useMediaQuery((theme: Theme) => theme.breakpoints.down('md'));
  const { sidebarState, setSidebarState } = useDashboardStore();
  const [mounted, setMounted] = useState(false);
  
  // This prevents hydration mismatch
  useEffect(() => {
    setMounted(true);
    
    // Set initial sidebar state based on viewport
    if (isMobile) {
      setSidebarState('collapsed');
    } else {
      setSidebarState('expanded');
    }
  }, [isMobile, setSidebarState]);
  
  // If not mounted yet, render the minimum amount of content
  // to ensure SSR and client match
  if (!mounted) {
    return (
      <Box sx={{ 
        width: { xs: '100%', md: 240 },
        flexShrink: 0,
      }}>
        <DashboardSidebar 
          username={username}
          profilePicture={profile.profilePicture}
          displayName={profile.displayName}
          expanded={false}
        />
      </Box>
    );
  }
  
  return (
    <Box sx={{ 
      width: { xs: '100%', md: 240 },
      flexShrink: 0,
      mb: { xs: 3, md: 0 }
    }}>
      <DashboardSidebar 
        username={username} 
        profilePicture={profile.profilePicture}
        displayName={profile.displayName}
        expanded={sidebarState === 'expanded'}
      />
    </Box>
  );
}
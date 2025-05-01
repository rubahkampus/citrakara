// src/components/dashboard/DashboardSidebarWrapper.tsx
"use client";

import { Box, useMediaQuery, Theme } from "@mui/material";
import { useState, useEffect } from "react";
import DashboardSidebar from "./DashboardSidebar";
import { useUIStore } from "@/lib/stores";

interface Props {
  username: string;
  profile: {
    profilePicture: string;
    displayName?: string;
  };
}

export default function DashboardSidebarWrapper({ username, profile }: Props) {
  const isMobile = useMediaQuery((theme: Theme) =>
    theme.breakpoints.down("md")
  );
  const { sidebar, setSidebar } = useUIStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setSidebar(isMobile ? "collapsed" : "expanded");
  }, [isMobile, setSidebar]);

  if (!mounted) {
    return (
      <Box sx={{ width: { xs: "100%", md: 240 }, flexShrink: 0 }}>
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
    <Box
      sx={{
        width: { xs: "100%", md: 240 },
        flexShrink: 0,
        mb: { xs: 3, md: 0 },
      }}
    >
      <DashboardSidebar
        username={username}
        profilePicture={profile.profilePicture}
        displayName={profile.displayName}
        expanded={sidebar === "expanded"}
      />
    </Box>
  );
}

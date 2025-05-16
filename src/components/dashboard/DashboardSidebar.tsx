// src/components/dashboard/DashboardSidebar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { JSX, useEffect } from "react";
import {
  Avatar,
  Box,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Paper,
  Collapse,
  IconButton,
  Divider,
} from "@mui/material";
import {
  Person as ProfileIcon,
  Chat as ChatIcon,
  Brush as CommissionIcon,
  Photo as GalleryIcon,
  Description as ProposalIcon,
  GavelRounded as ContractIcon,
  SupportAgent as ResolutionIcon,
  AdminPanelSettings as AdminIcon,
  AccountBalanceWallet as WalletIcon,
  ExpandMore as ExpandMoreIcon,
  ChevronRight as ChevronRightIcon,
  BookmarkBorderRounded,
  Bookmarks,
} from "@mui/icons-material";
import { useUIStore } from "@/lib/stores";

// Types
interface NavLink {
  label: string;
  href: (username: string) => string;
  icon: JSX.Element;
  exact?: boolean;
}

interface SidebarProps {
  username: string;
  profilePicture: string;
  displayName?: string;
  expanded: boolean;
  isAdmin?: boolean;
}

export default function DashboardSidebar({
  username,
  profilePicture,
  displayName,
  expanded,
  isAdmin = false,
}: SidebarProps) {
  const pathname = usePathname();
  const { toggleSidebar } = useUIStore();

  // Navigation links configuration
  const navLinks: NavLink[] = [
    {
      label: "Profil",
      href: (u) => `/${u}/dashboard`,
      icon: <ProfileIcon fontSize="small" />,
      exact: true,
    },
    {
      label: "Bookmark",
      href: (u) => `/${u}/dashboard/bookmarks`,
      icon: <Bookmarks fontSize="small" />,
      exact: true,
    },
    {
      label: "Galeri",
      href: (u) => `/${u}/dashboard/galleries`,
      icon: <GalleryIcon fontSize="small" />,
    },
    {
      label: "Pesan",
      href: (u) => `/${u}/dashboard/chat`,
      icon: <ChatIcon fontSize="small" />,
    },
    {
      label: "Komisi",
      href: (u) => `/${u}/dashboard/commissions`,
      icon: <CommissionIcon fontSize="small" />,
    },
    {
      label: "Proposal",
      href: (u) => `/${u}/dashboard/proposals`,
      icon: <ProposalIcon fontSize="small" />,
    },
    {
      label: "Kontrak",
      href: (u) => `/${u}/dashboard/contracts`,
      icon: <ContractIcon fontSize="small" />,
    },
    {
      label: "Dompet",
      href: (u) => `/${u}/dashboard/wallet`,
      icon: <WalletIcon fontSize="small" />,
    },
    {
      label: "Resolusi",
      href: (u) => `/${u}/dashboard/resolution`,
      icon: <ResolutionIcon fontSize="small" />,
    },
  ];

  // Admin-only links
  const adminLinks: NavLink[] = [
    {
      label: "Admin Resolusi",
      href: (u) => `/${u}/dashboard/admin-resolution`,
      icon: <AdminIcon fontSize="small" />,
    },
  ];

  // Helper to check if a path is active
  const isPathActive = (path: string, exact = false): boolean => {
    if (pathname === path) return true;
    if (!exact && pathname.startsWith(path)) return true;
    return false;
  };

  // Render a navigation link
  const renderNavLink = (link: NavLink) => {
    const href = link.href(username);
    const active = isPathActive(href, link.exact);

    return (
      <Link
        key={href}
        href={href}
        passHref
        style={{ textDecoration: "none", color: "inherit" }}
      >
        <ListItemButton
          selected={active}
          sx={{
            borderRadius: 1.5,
            mb: 0.75,
            transition: "all 0.2s ease",
            color: active ? "primary.main" : "text.primary",
            "&.Mui-selected": {
              bgcolor: "primary.lighter",
              "&:hover": { bgcolor: "primary.light" },
            },
          }}
        >
          <ListItemIcon
            sx={{
              minWidth: 36,
              color: active ? "primary.main" : "inherit",
            }}
          >
            {link.icon}
          </ListItemIcon>
          <ListItemText
            primary={link.label}
            primaryTypographyProps={{
              fontSize: 14,
              fontWeight: active ? 600 : 400,
            }}
          />
        </ListItemButton>
      </Link>
    );
  };

  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: 2,
        overflow: "hidden",
        border: "1px solid",
        borderColor: "divider",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        transition: "width 0.3s ease",
      }}
    >
      {/* User Profile Header */}
      <Link
        href={`/${username}`}
        style={{ textDecoration: "none", color: "inherit" }}
      >
        <Box
          sx={{
            p: 2,
            display: "flex",
            alignItems: "center",
            justifyContent: { xs: "space-between", md: "center" },
            bgcolor: "background.paper",
            borderBottom: "1px solid",
            borderColor: "divider",
            cursor: "pointer",
            transition: "background-color 0.2s",
            "&:hover": {
              bgcolor: "action.hover",
            },
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <Avatar
              src={profilePicture}
              alt={username}
              sx={{
                width: 40,
                height: 40,
                mr: { xs: 2, md: expanded ? 2 : 0 },
                transition: "all 0.2s",
              }}
            />
            {expanded && (
              <Typography
                variant="body1"
                fontWeight="bold"
                noWrap
                sx={{ maxWidth: 150 }}
              >
                {displayName || username}
              </Typography>
            )}
          </Box>
          <Box sx={{ display: { xs: "block", md: "none" } }}>
            <IconButton
              onClick={(e) => {
                e.preventDefault();
                toggleSidebar();
              }}
              size="small"
            >
              {expanded ? <ExpandMoreIcon /> : <ChevronRightIcon />}
            </IconButton>
          </Box>
        </Box>
      </Link>

      {/* Navigation Links */}
      <Collapse in={expanded} sx={{ display: { md: "block" }, flexGrow: 1 }}>
        <Box sx={{ p: 1.5 }}>
          <List disablePadding>
            {navLinks.map(renderNavLink)}

            {/* Admin-only section */}
            {isAdmin && (
              <>
                <Divider sx={{ my: 1.5 }} />
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ pl: 2, display: "block", mb: 1, fontWeight: 500 }}
                >
                  Kontrol Admin
                </Typography>
                {adminLinks.map(renderNavLink)}
              </>
            )}
          </List>
        </Box>
      </Collapse>
    </Paper>
  );
}

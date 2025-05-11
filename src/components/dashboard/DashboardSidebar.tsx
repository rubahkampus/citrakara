// src/components/dashboard/DashboardSidebar.tsx
"use client";

import Link from "next/link";
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
  Badge,
} from "@mui/material";
import { usePathname } from "next/navigation";
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
} from "@mui/icons-material";
import { useUIStore } from "@/lib/stores";
import { useEffect, useState } from "react";

interface Props {
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
  isAdmin = false, // Set to true for admin users
}: Props) {
  const pathname = usePathname();
  const { toggleSidebar } = useUIStore();
  const [pendingResolutions, setPendingResolutions] = useState(0);

  // Fetch pending resolutions count for admins
  useEffect(() => {
    if (isAdmin) {
      // This would be replaced with a real API call
      const fetchPendingResolutions = async () => {
        try {
          // const response = await fetch('/api/admin/resolution/pending-count');
          // const data = await response.json();
          // setPendingResolutions(data.count);

          // For demonstration, set a static number
          setPendingResolutions(3);
        } catch (error) {
          console.error("Failed to fetch pending resolutions:", error);
        }
      };

      fetchPendingResolutions();
    }
  }, [isAdmin]);

  const links = [
    {
      label: "Profil",
      href: (u: string) => `/${u}/dashboard`,
      icon: <ProfileIcon fontSize="small" />,
      exact: true,
    },
    {
      label: "Chat",
      href: (u: string) => `/${u}/dashboard/chat`,
      icon: <ChatIcon fontSize="small" />,
    },
    {
      label: "Komisi",
      href: (u: string) => `/${u}/dashboard/commissions`,
      icon: <CommissionIcon fontSize="small" />,
    },
    {
      label: "Galeri",
      href: (u: string) => `/${u}/dashboard/galleries`,
      icon: <GalleryIcon fontSize="small" />,
    },
    {
      label: "Proposal",
      href: (u: string) => `/${u}/dashboard/proposals`,
      icon: <ProposalIcon fontSize="small" />,
    },
    {
      label: "Kontrak",
      href: (u: string) => `/${u}/dashboard/contracts`,
      icon: <ContractIcon fontSize="small" />,
    },
    {
      label: "Wallet",
      href: (u: string) => `/${u}/dashboard/wallet`,
      icon: <WalletIcon fontSize="small" />,
    },
    {
      label: "Resolution",
      href: (u: string) => `/${u}/dashboard/resolution`,
      icon: <ResolutionIcon fontSize="small" />,
    },
  ];

  // Admin-only links
  const adminLinks = [
    {
      label: "Admin Resolution",
      href: (u: string) => `/${u}/dashboard/admin-resolution`,
      icon: <AdminIcon fontSize="small" />,
      badge: pendingResolutions,
    },
  ];

  const isPathActive = (path: string, exact = false) => {
    if (pathname === path) return true;
    if (!exact && pathname.startsWith(path)) return true;
    return false;
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
      }}
    >
      <Link
        href={`/${username}/dashboard`}
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

      <Collapse in={expanded} sx={{ display: { md: "block" }, flexGrow: 1 }}>
        <Box sx={{ p: 1 }}>
          <List disablePadding>
            {links.map((link) => {
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
                      borderRadius: 1,
                      mb: 0.5,
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
            })}

            {/* Admin-only links */}
            {isAdmin && (
              <>
                <Divider sx={{ my: 1 }} />
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ pl: 2, display: "block", mb: 0.5 }}
                >
                  Admin Controls
                </Typography>

                {adminLinks.map((link) => {
                  const href = link.href(username);
                  const active = isPathActive(href);
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
                          borderRadius: 1,
                          mb: 0.5,
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
                          {link.badge > 0 ? (
                            <Badge badgeContent={link.badge} color="error">
                              {link.icon}
                            </Badge>
                          ) : (
                            link.icon
                          )}
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
                })}
              </>
            )}
          </List>
        </Box>

        <Box sx={{ p: 2, textAlign: "center", mt: "auto" }}>
          <Typography variant="caption" color="text.secondary">
            Need help with Komis?
          </Typography>
          <Typography
            variant="body2"
            color="primary"
            sx={{
              cursor: "pointer",
              fontWeight: 500,
              "&:hover": { textDecoration: "underline" },
            }}
          >
            View Help Center
          </Typography>
        </Box>
      </Collapse>
    </Paper>
  );
}

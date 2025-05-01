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
  ExpandMore as ExpandMoreIcon,
  ChevronRight as ChevronRightIcon,
} from "@mui/icons-material";
import { useUIStore } from "@/lib/stores";

interface Props {
  username: string;
  profilePicture: string;
  displayName?: string;
  expanded: boolean;
}

const links = [
  {
    label: "Profil",
    href: (u: string) => `/${u}/dashboard`,
    icon: <ProfileIcon fontSize="small" />,
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
    label: "Resolution",
    href: (u: string) => `/${u}/dashboard/resolution`,
    icon: <ResolutionIcon fontSize="small" />,
  },
];

export default function DashboardSidebar({
  username,
  profilePicture,
  displayName,
  expanded,
}: Props) {
  const pathname = usePathname();
  const { toggleSidebar } = useUIStore();

  const isPathActive = (path: string) => {
    if (pathname === path) return true;
    if (path !== `/${username}/dashboard` && pathname.startsWith(path))
      return true;
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

      <Collapse in={expanded} sx={{ display: { md: "block" } }}>
        <Box sx={{ p: 1 }}>
          <List disablePadding>
            {links.map((link) => {
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
          </List>
        </Box>
        <Divider sx={{ mt: 2 }} />
        <Box sx={{ p: 2, textAlign: "center" }}>
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

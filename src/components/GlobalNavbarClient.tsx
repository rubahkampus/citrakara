// src/components/GlobalNavbarClient.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  AppBar,
  Toolbar,
  Typography,
  Avatar,
  IconButton,
  MenuItem,
  Box,
  Container,
  Menu,
  Button,
  Tooltip,
  Divider,
  ListItemIcon,
  Stack,
  Badge,
  useMediaQuery,
  useTheme as useMuiTheme,
  ListItemText,
} from "@mui/material";
import { axiosClient } from "@/lib/utils/axiosClient";
import { KButton } from "./KButton";
import { useUIStore, useDialogStore } from "@/lib/stores";
import {
  Menu as MenuIcon,
  Brightness4 as DarkModeIcon,
  Brightness7 as LightModeIcon,
  Dashboard as DashboardIcon,
  Logout as LogoutIcon,
  Settings as SettingsIcon,
  Person as PersonIcon,
  Search as SearchIcon,
  Notifications as NotificationsIcon,
  Chat as ChatIcon,
  Person as ProfileIcon,
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
  PaletteRounded,
} from "@mui/icons-material";

interface Props {
  session: any; // Replace with proper Session type
}

export default function GlobalNavbarClient({ session }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const muiTheme = useMuiTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down("md"));

  const mode = useUIStore((s) => s.theme);
  const toggleColorMode = useUIStore((s) => s.toggleTheme);

  const openDialog = useDialogStore((s) => s.open);

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const isLoggedIn =
    mounted && session && typeof session === "object" && "username" in session;

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const toggleMobileMenu = () => setMobileMenuOpen((open) => !open);

  if (!mounted) {
    return (
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          bgcolor: "background.paper",
          borderBottom: "1px solid",
          borderColor: "divider",
        }}
      >
        <Container maxWidth="lg">
          <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
            <Typography variant="h6" color="inherit">
              KOMIS
            </Typography>
            <Box />
          </Toolbar>
        </Container>
      </AppBar>
    );
  }

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        bgcolor: "background.paper",
        borderBottom: "1px solid",
        borderColor: "divider",
      }}
    >
      <Container maxWidth="lg">
        <Toolbar
          disableGutters
          sx={{ display: "flex", justifyContent: "space-between" }}
        >
          {/* Logo */}
          <Link href="/" style={{ textDecoration: "none", color: "inherit" }}>
            <Typography
              variant="h6"
              sx={{ fontWeight: 700, color: "primary.main" }}
            >
              KOMIS
            </Typography>
          </Link>

          {/* Center nav */}
          {/* {!isMobile && (
            <Stack
              direction="row"
              spacing={1}
              sx={{ flexGrow: 1, justifyContent: "center" }}
            >
              <NavLink
                href="/explore"
                label="Explore"
                active={pathname === "/explore"}
              />
              <NavLink
                href="/artists"
                label="Artists"
                active={pathname === "/artists"}
              />
              <NavLink
                href="/commissions"
                label="Commissions"
                active={pathname === "/commissions"}
              />
              <NavLink
                href="/how-it-works"
                label="How It Works"
                active={pathname === "/how-it-works"}
              />
            </Stack>
          )} */}

          {/* Right controls */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            {/* <Tooltip
              title={`Switch to ${mode === "light" ? "dark" : "light"} mode`}
            >
              <IconButton onClick={toggleColorMode} size="small">
                {mode === "light" ? <DarkModeIcon /> : <LightModeIcon />}
              </IconButton>
            </Tooltip>
            <IconButton size="small">
              <SearchIcon />
            </IconButton> */}
            {isLoggedIn ? (
              <AuthenticatedControls session={session} />
            ) : (
              <UnauthenticatedControls openDialog={openDialog} />
            )}
            {isMobile && (
              <IconButton onClick={toggleMobileMenu}>
                <MenuIcon />
              </IconButton>
            )}
          </Box>
        </Toolbar>
      </Container>

      {/* Mobile menu */}
      {isMobile && (
        <Menu
          open={mobileMenuOpen}
          onClose={() => setMobileMenuOpen(false)}
          anchorOrigin={{ vertical: "top", horizontal: "right" }}
          transformOrigin={{ vertical: "top", horizontal: "right" }}
          PaperProps={{ sx: { width: "100%", maxWidth: 300, mt: 5 } }}
        >
          {/* <MenuItem
            onClick={() => {
              router.push("/");
              setMobileMenuOpen(false);
            }}
          >
            Explore
          </MenuItem>
          <MenuItem
            onClick={() => {
              router.push("/search/artists");
              setMobileMenuOpen(false);
            }}
          >
            Artists
          </MenuItem>
          <MenuItem
            onClick={() => {
              router.push("/search/commissions");
              setMobileMenuOpen(false);
            }}
          >
            Commissions
          </MenuItem> */}
          <MenuItem
            onClick={() => {
              router.push("/how-it-works");
              setMobileMenuOpen(false);
            }}
          >
            How It Works
          </MenuItem>
          <Divider />
          {isLoggedIn
            ? [
                <MenuItem
                  key="profile"
                  onClick={() => {
                    router.push(`/${session.username}`);
                    setMobileMenuOpen(false);
                  }}
                >
                  <ListItemIcon>
                    <PersonIcon fontSize="small" />
                  </ListItemIcon>
                  Profile
                </MenuItem>,
                <MenuItem
                  key="dashboard"
                  onClick={() => {
                    router.push(`/${session.username}/dashboard`);
                    setMobileMenuOpen(false);
                  }}
                >
                  <ListItemIcon>
                    <DashboardIcon fontSize="small" />
                  </ListItemIcon>
                  Dashboard
                </MenuItem>,
                <MenuItem
                  key="logout"
                  onClick={async () => {
                    await axiosClient.post("/api/auth/logout");
                    router.refresh();
                    setMobileMenuOpen(false);
                  }}
                >
                  <ListItemIcon>
                    <LogoutIcon fontSize="small" />
                  </ListItemIcon>
                  Logout
                </MenuItem>,
              ]
            : [
                <MenuItem
                  key="login"
                  onClick={() => {
                    openDialog("login");
                    setMobileMenuOpen(false);
                  }}
                >
                  Login
                </MenuItem>,
                <MenuItem
                  key="register"
                  onClick={() => {
                    openDialog("register");
                    setMobileMenuOpen(false);
                  }}
                >
                  Register
                </MenuItem>,
              ]}
        </Menu>
      )}
    </AppBar>
  );
}

function NavLink({
  href,
  label,
  active,
}: {
  href: string;
  label: string;
  active: boolean;
}) {
  return (
    <Button
      component={Link}
      href={href}
      sx={{
        color: active ? "primary.main" : "text.primary",
        fontWeight: active ? 600 : 400,
        borderRadius: 1.5,
        px: 2,
        "&:hover": { bgcolor: "action.hover" },
      }}
    >
      {label}
    </Button>
  );
}

function AuthenticatedControls({ session }: { session: any }) {
  const router = useRouter();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const [avatarUrl, setAvatarUrl] = useState<string>("/default-profile.png");

  useEffect(() => {
    axiosClient
      .get<{ url: string | null }>(`/api/user/${session.username}/avatar`)
      .then((res) => {
        setAvatarUrl(res.data.url ?? "/default-profile.png");
      })
      .catch(() => {
        setAvatarUrl("/default-profile.png");
      });
  }, [session?.username]);

  const handleMenu = (e: React.MouseEvent<HTMLElement>) =>
    setAnchorEl(e.currentTarget);
  const handleClose = () => setAnchorEl(null);
  const logout = async () => {
    await axiosClient.post("/api/auth/logout");
    router.refresh();
    handleClose();
  };

  // Dashboard menu items based on the sidebar
  const dashboardMenuItems = [
    {
      label: "Pengaturan Profil",
      href: `/${session.username}/dashboard`,
      icon: <PersonIcon fontSize="small" />,
    },
    {
      label: "Bookmark",
      href: `/${session.username}/dashboard/bookmarks`,
      icon: <BookmarkBorderRounded fontSize="small" />,
    },
    {
      label: "Galeri",
      href: `/${session.username}/dashboard/galleries`,
      icon: <GalleryIcon fontSize="small" />,
    },
    {
      label: "Pesan",
      href: `/${session.username}/dashboard/chat`,
      icon: <ChatIcon fontSize="small" />,
    },
    {
      label: "Komisi",
      href: `/${session.username}/dashboard/commissions`,
      icon: <CommissionIcon fontSize="small" />,
    },
    {
      label: "Proposal",
      href: `/${session.username}/dashboard/proposals`,
      icon: <ProposalIcon fontSize="small" />,
    },
    {
      label: "Kontrak",
      href: `/${session.username}/dashboard/contracts`,
      icon: <PaletteRounded fontSize="small" />,
    },
    {
      label: "Dompet",
      href: `/${session.username}/dashboard/wallet`,
      icon: <WalletIcon fontSize="small" />,
    },
    {
      label: "Resolusi",
      href: `/${session.username}/dashboard/resolution`,
      icon: <ResolutionIcon fontSize="small" />,
    },
  ];

  // Add admin items if user is admin
  // const adminMenuItems = session.isAdmin
  //   ? [
  //       {
  //         label: "Admin Resolusi",
  //         href: `/${session.username}/dashboard/admin-resolution`,
  //         icon: <AdminPanelSettingsIcon fontSize="small" />,
  //       },
  //     ]
  //   : [];

  const handleMenuItemClick = (href: string) => {
    router.push(href);
    handleClose();
  };

  return (
    <>
      <Tooltip title="Account menu">
        <IconButton onClick={handleMenu} size="small">
          <Avatar
            src={avatarUrl}
            sx={{ width: 32, height: 32 }}
            alt={`${session.username}'s avatar`}
          />
        </IconButton>
      </Tooltip>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
        transformOrigin={{ horizontal: "right", vertical: "top" }}
        PaperProps={{
          sx: {
            mt: 1,
            width: 240,
            maxHeight: 400,
            overflowY: "auto",
            "& .MuiMenuItem-root": { py: 1.5 },
          },
        }}
      >
        {/* User Info Header */}
        <Box sx={{ px: 2, py: 1.5 }}>
          <Typography fontWeight="bold">{session.username}</Typography>
        </Box>
        <Divider />

        {/* Profile Link */}
        <MenuItem onClick={() => handleMenuItemClick(`/${session.username}`)}>
          <ListItemIcon>
            <PersonIcon fontSize="small" />
          </ListItemIcon>
          Laman Profil
        </MenuItem>
        
        {/* Logout */}
        <MenuItem onClick={logout}>
          <ListItemIcon>
            <LogoutIcon fontSize="small" />
          </ListItemIcon>
          Logout
        </MenuItem>

        <Divider />

        {/* Dashboard Section Header */}
        <Box sx={{ px: 2, py: 1 }}>
          <Typography
            variant="caption"
            color="text.secondary"
            fontWeight="bold"
            sx={{ textTransform: "uppercase", letterSpacing: 0.5 }}
          >
            Dashboard
          </Typography>
        </Box>

        {/* Dashboard Menu Items */}
        {dashboardMenuItems.map((item) => (
          <MenuItem
            key={item.href}
            onClick={() => handleMenuItemClick(item.href)}
            sx={{ pl: 3 }}
          >
            <ListItemIcon sx={{ minWidth: 36 }}>{item.icon}</ListItemIcon>
            <ListItemText
              primary={item.label}
              primaryTypographyProps={{ fontSize: 14 }}
            />
          </MenuItem>
        ))}

        {/* Admin Section */}
        {/* {adminMenuItems.length > 0 && (
          <>
            <Divider sx={{ mt: 1 }} />
            <Box sx={{ px: 2, py: 1 }}>
              <Typography
                variant="caption"
                color="text.secondary"
                fontWeight="bold"
                sx={{ textTransform: "uppercase", letterSpacing: 0.5 }}
              >
                Admin
              </Typography>
            </Box>
            {adminMenuItems.map((item) => (
              <MenuItem
                key={item.href}
                onClick={() => handleMenuItemClick(item.href)}
                sx={{ pl: 3 }}
              >
                <ListItemIcon sx={{ minWidth: 36 }}>{item.icon}</ListItemIcon>
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{ fontSize: 14 }}
                />
              </MenuItem>
            ))}
          </>
        )} */}

        <Divider sx={{ mt: 1 }} />
      </Menu>
    </>
  );
}

function UnauthenticatedControls({
  openDialog,
}: {
  openDialog: (type: "login" | "register") => void;
}) {
  return (
    <Stack direction="row" spacing={1}>
      <KButton
        variantType="ghost"
        size="small"
        onClick={() => openDialog("login")}
      >
        Login
      </KButton>
      <KButton size="small" onClick={() => openDialog("register")}>
        Sign Up
      </KButton>
    </Stack>
  );
}

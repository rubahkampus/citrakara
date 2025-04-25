// src/components/GlobalNavbarClient.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from "next/link";
import { usePathname, useRouter } from 'next/navigation';
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
  useMediaQuery,
  useTheme,
  Stack,
  Badge
} from "@mui/material";
import { useAuthDialogStore } from "@/lib/stores/authDialogStore";
import { axiosClient } from "@/lib/utils/axiosClient";
import { KButton } from "./KButton";
import { useThemeStore } from '@/lib/stores/themeStore';
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
  Chat as ChatIcon
} from '@mui/icons-material';

interface Props {
  session: any; // You can type this more strictly if needed
}

export default function GlobalNavbarClient({ session }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const theme = useTheme();
  const { mode, toggleColorMode } = useThemeStore();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mounted, setMounted] = useState(false);
  
  // Fix for hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);
  
  const isLoggedIn = mounted && session && typeof session === "object" && "username" in session;
  
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };
  
  // Don't render until client-side to prevent hydration mismatch
  if (!mounted) {
    return (
      <AppBar 
        position="sticky" 
        elevation={0}
        sx={{ 
          bgcolor: 'background.paper', 
          borderBottom: '1px solid',
          borderColor: 'divider'
        }}
      >
        <Container maxWidth="lg">
          <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
            <Typography variant="h6" color="inherit">KOMIS</Typography>
            <Box></Box> {/* Placeholder for auth widgets */}
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
        bgcolor: 'background.paper', 
        borderBottom: '1px solid',
        borderColor: 'divider'
      }}
    >
      <Container maxWidth="lg">
        <Toolbar disableGutters sx={{ display: "flex", justifyContent: "space-between" }}>
          {/* Logo - Left side */}
          <Link href="/" style={{ textDecoration: 'none', color: 'inherit' }}>
            <Typography 
              variant="h6" 
              component="div"
              sx={{ 
                fontWeight: 700, 
                color: 'primary.main',
                display: 'inline-flex',
                alignItems: 'center'
              }}
            >
              KOMIS
            </Typography>
          </Link>

          {/* Center navigation - only on desktop */}
          {!isMobile && (
            <Stack 
              direction="row" 
              spacing={1}
              sx={{ 
                flexGrow: 1, 
                justifyContent: 'center'
              }}
            >
              <NavLink href="/explore" label="Explore" active={pathname === '/explore'} />
              <NavLink href="/artists" label="Artists" active={pathname === '/artists'} />
              <NavLink href="/commissions" label="Commissions" active={pathname === '/commissions'} />
              <NavLink href="/how-it-works" label="How It Works" active={pathname === '/how-it-works'} />
            </Stack>
          )}

          {/* Right-side controls */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {/* Theme Toggle Button */}
            <Tooltip title={`Switch to ${mode === 'light' ? 'dark' : 'light'} mode`}>
              <IconButton onClick={toggleColorMode} color="inherit" size="small">
                {mode === 'light' ? <DarkModeIcon /> : <LightModeIcon />}
              </IconButton>
            </Tooltip>

            {/* Search Button */}
            <IconButton color="inherit" size="small">
              <SearchIcon />
            </IconButton>

            {/* Authenticated vs Non-authenticated section */}
            {isLoggedIn ? (
              <AuthenticatedControls username={session.username} />
            ) : (
              <UnauthenticatedControls />
            )}

            {/* Mobile menu button - only on mobile */}
            {isMobile && (
              <IconButton 
                color="inherit" 
                edge="end" 
                onClick={toggleMobileMenu}
              >
                <MenuIcon />
              </IconButton>
            )}
          </Box>
        </Toolbar>
      </Container>
      
      {/* Mobile menu */}
      {isMobile && (
        <Menu
          anchorOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
          open={mobileMenuOpen}
          onClose={() => setMobileMenuOpen(false)}
          PaperProps={{
            sx: { 
              width: '100%', 
              maxWidth: '300px',
              mt: 5
            }
          }}
        >
          {/* Combine all menu items into a flat array without fragments */}
          {[
            // Common navigation items
            <MenuItem key="explore" onClick={() => { router.push('/explore'); setMobileMenuOpen(false); }}>
              Explore
            </MenuItem>,
            <MenuItem key="artists" onClick={() => { router.push('/artists'); setMobileMenuOpen(false); }}>
              Artists
            </MenuItem>,
            <MenuItem key="commissions" onClick={() => { router.push('/commissions'); setMobileMenuOpen(false); }}>
              Commissions
            </MenuItem>,
            <MenuItem key="how-it-works" onClick={() => { router.push('/how-it-works'); setMobileMenuOpen(false); }}>
              How It Works
            </MenuItem>,
            
            <Divider key="divider" />,
            
            // Conditional items based on login state
            ...(isLoggedIn 
              ? [
                  <MenuItem key="profile" onClick={() => { router.push(`/${session.username}`); setMobileMenuOpen(false); }}>
                    <ListItemIcon>
                      <PersonIcon fontSize="small" />
                    </ListItemIcon>
                    Profile
                  </MenuItem>,
                  <MenuItem key="dashboard" onClick={() => { router.push(`/${session.username}/dashboard`); setMobileMenuOpen(false); }}>
                    <ListItemIcon>
                      <DashboardIcon fontSize="small" />
                    </ListItemIcon>
                    Dashboard
                  </MenuItem>,
                  <MenuItem key="logout" onClick={async () => { 
                    await axiosClient.post("/api/auth/logout"); 
                    router.refresh();
                    setMobileMenuOpen(false);
                  }}>
                    <ListItemIcon>
                      <LogoutIcon fontSize="small" />
                    </ListItemIcon>
                    Logout
                  </MenuItem>
                ]
              : [
                  <MenuItem key="login" onClick={() => { 
                    useAuthDialogStore.getState().open("login"); 
                    setMobileMenuOpen(false);
                  }}>
                    Login
                  </MenuItem>,
                  <MenuItem key="register" onClick={() => { 
                    useAuthDialogStore.getState().open("register"); 
                    setMobileMenuOpen(false);
                  }}>
                    Register
                  </MenuItem>
                ]
            )
          ]}
        </Menu>
      )}
    </AppBar>
  );
}

// Helper component for navigation links
function NavLink({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Button
      component={Link}
      href={href}
      sx={{
        color: active ? 'primary.main' : 'text.primary',
        fontWeight: active ? 600 : 400,
        borderRadius: 1.5,
        px: 2,
        '&:hover': {
          bgcolor: 'action.hover',
        },
      }}
    >
      {label}
    </Button>
  );
}

// Component for authenticated users
function AuthenticatedControls({ username }: { username: string }) {
  const router = useRouter();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  
  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };
  
  const logout = async () => {
    await axiosClient.post("/api/auth/logout");
    router.refresh();
    handleClose();
  };

  return (
    <>
      {/* Notification icon */}
      <Tooltip title="Notifications">
        <IconButton color="inherit" size="small">
          <Badge badgeContent={2} color="error">
            <NotificationsIcon />
          </Badge>
        </IconButton>
      </Tooltip>
      
      {/* Messages icon */}
      <Tooltip title="Messages">
        <IconButton color="inherit" size="small">
          <Badge badgeContent={4} color="primary">
            <ChatIcon />
          </Badge>
        </IconButton>
      </Tooltip>
      
      {/* User menu */}
      <Tooltip title="Account menu">
        <IconButton
          onClick={handleMenu}
          size="small"
          sx={{ ml: 1 }}
          aria-controls={open ? 'account-menu' : undefined}
          aria-haspopup="true"
          aria-expanded={open ? 'true' : undefined}
        >
          <Avatar 
            src="/default-profile.png" 
            sx={{ width: 32, height: 32 }}
          />
        </IconButton>
      </Tooltip>
      
      <Menu
        anchorEl={anchorEl}
        id="account-menu"
        open={open}
        onClose={handleClose}
        onClick={handleClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        PaperProps={{
          sx: {
            mt: 1,
            width: 220,
            '& .MuiMenuItem-root': {
              py: 1.5
            }
          }
        }}
      >
        {[
          // Custom header (not a MenuItem)
          <Box key="header" sx={{ px: 2, py: 1.5 }}>
            <Typography variant="subtitle2" fontWeight="bold">
              {username}
            </Typography>
          </Box>,
          
          <Divider key="divider-1" />,
          
          <MenuItem key="profile" onClick={() => router.push(`/${username}`)}>
            <ListItemIcon>
              <PersonIcon fontSize="small" />
            </ListItemIcon>
            Profile
          </MenuItem>,
          
          <MenuItem key="dashboard" onClick={() => router.push(`/${username}/dashboard`)}>
            <ListItemIcon>
              <DashboardIcon fontSize="small" />
            </ListItemIcon>
            Dashboard
          </MenuItem>,
          
          <MenuItem key="settings" onClick={() => router.push('/settings')}>
            <ListItemIcon>
              <SettingsIcon fontSize="small" />
            </ListItemIcon>
            Settings
          </MenuItem>,
          
          <Divider key="divider-2" />,
          
          <MenuItem key="logout" onClick={logout}>
            <ListItemIcon>
              <LogoutIcon fontSize="small" />
            </ListItemIcon>
            Logout
          </MenuItem>
        ]}
      </Menu>
    </>
  );
}

// Component for unauthenticated users
function UnauthenticatedControls() {
  const { open } = useAuthDialogStore();
  
  return (
    <Stack direction="row" spacing={1}>
      <KButton 
        variantType="ghost" 
        onClick={() => open("login")} 
        size="small"
      >
        Login
      </KButton>
      
      <KButton 
        onClick={() => open("register")} 
        size="small"
      >
        Sign Up
      </KButton>
    </Stack>
  );
}
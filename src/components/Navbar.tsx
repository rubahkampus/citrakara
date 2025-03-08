// src/components/Navbar.tsx
"use client";

import { useState } from "react";
import { AppBar, Toolbar, Typography, Button, Avatar, Menu, MenuItem, IconButton } from "@mui/material";
import { useAppSelector, useAppDispatch } from "@/redux/store";
import { openAuthDialog, logoutThunk } from "@/redux/slices/AuthSlice";

export default function Navbar() {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  return (
    <AppBar position="static">
      <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
        <Typography variant="h6">Marketplace</Typography>

        {user ? (
          <>
            <IconButton onClick={handleMenuOpen}>
              <Avatar src="/default-profile.png" />
            </IconButton>
            <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
              <MenuItem onClick={() => dispatch(logoutThunk())}>Logout</MenuItem>
            </Menu>
          </>
        ) : (
          <Button color="inherit" onClick={() => dispatch(openAuthDialog("login"))}>
            Login
          </Button>
        )}
      </Toolbar>
    </AppBar>
  );
}

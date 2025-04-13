// src/components/Navbar.tsx
import Link from "next/link";
import { AppBar, Toolbar, Typography, Button, Avatar, IconButton, Menu, MenuItem } from "@mui/material";
import { getAuthSession } from "@/lib/utils/session";
import LogoutButton from "./LogoutButton"; // A small client component for logout (if needed)
import LoginDialogTrigger from "./LoginDialogTrigger";

export default async function Navbar() {
  const session = await getAuthSession();

  return (
    <AppBar position="static">
      <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
        <Link href="/">
          <Typography variant="h6" color="inherit" sx={{ textDecoration: "none" }}>
            KOMIS
          </Typography>
        </Link>

        {session && typeof session === "object" && "username" in session ? (
          <div>
            <Link href={`/${session.username}`}>
              <IconButton>
                <Avatar src="/default-profile.png" />
              </IconButton>
            </Link>
            <LogoutButton />
          </div>
        ) : (
          <LoginDialogTrigger /> // A small client component for login dialog trigger
        )}
      </Toolbar>
    </AppBar>
  );
}


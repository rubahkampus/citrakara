// src/components/GlobalNavbarClient.tsx
'use client';

import Link from "next/link";
import { AppBar, Toolbar, Typography, Avatar, IconButton, MenuItem } from "@mui/material";
import { useAuthDialogStore } from "@/lib/stores/authDialogStore";
import { useRouter } from "next/navigation";
import { axiosClient } from "@/lib/utils/axiosClient";
import { KButton } from "./KButton";

interface Props {
  session: any; // You can type this more strictly if needed
}

export default function GlobalNavbarClient({ session }: Props) {
  return (
    <AppBar position="static">
      <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
        <Link href="/">
          <Typography variant="h6" color="inherit" sx={{ textDecoration: "none" }}>
            KOMIS
          </Typography>
        </Link>

        {session && typeof session === "object" && "username" in session ? (
          <UserMenu username={session.username} />
        ) : (
          <LoginButton />
        )}
      </Toolbar>
    </AppBar>
  );
}

function LoginButton() {
  const { open } = useAuthDialogStore();

  return (
    <KButton variantType="ghost" onClick={() => open("login")} sx={{ color: "inherit" }}>
      Login
    </KButton>
  );
}

function UserMenu({ username }: { username: string }) {
  const router = useRouter();

  const logout = async () => {
    await axiosClient.post("/api/auth/logout");
    router.refresh();
  };

  return (
    <div>
      <Link href={`/${username}`}>
        <IconButton>
          <Avatar src="/default-profile.png" />
        </IconButton>
      </Link>
      <MenuItem onClick={logout}>Logout</MenuItem>
    </div>
  );
}

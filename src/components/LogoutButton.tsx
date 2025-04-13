// src/components/LogoutButton.tsx
"use client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { axiosClient } from "@/lib/utils/axiosClient";
import MenuItem from "@mui/material/MenuItem"; // Import MenuItem from Material-UI

export default function LogoutButton() {
  const router = useRouter();

  const logout = async () => {
    await axiosClient.post("/api/auth/logout");
    router.refresh(); // refresh session-aware components
  };

  return <MenuItem onClick={logout}>Logout</MenuItem>;
}

// src/components/LoginDialogTrigger.tsx
"use client";

import { useState } from "react";
import { Button } from "@mui/material";
import AuthDialog from "@/components/AuthDialog";

export default function LoginDialogTrigger() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button color="inherit" onClick={() => setOpen(true)}>
        Login
      </Button>
      <AuthDialog open={open} onClose={() => setOpen(false)} />
    </>
  );
}

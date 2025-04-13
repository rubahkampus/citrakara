// src/components/AuthDialog.tsx
"use client";

import React from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Box, Typography
} from "@mui/material";
import LoginForm from "./AuthDialogLoginForm";
import RegisterForm from "./AuthDialogRegisterForm";

interface AuthDialogProps {
  open: boolean;
  onClose: () => void;
}

export default function AuthDialog({ open, onClose }: AuthDialogProps) {
  const [mode, setMode] = React.useState<"login" | "register">("login");

  const toggleMode = () => {
    setMode(mode === "login" ? "register" : "login");
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>{mode === "login" ? "Login" : "Register"}</DialogTitle>
      <DialogContent>
        {mode === "login" ? <LoginForm onSuccess={onClose} /> : <RegisterForm onSuccess={onClose} />}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
      </DialogActions>
      <Box textAlign="center" mb={2}>
        <Typography
          variant="body2"
          sx={{ cursor: "pointer", color: "blue" }}
          onClick={toggleMode}
        >
          {mode === "login" ? "New user? Register here" : "Already a user? Log In"}
        </Typography>
      </Box>
    </Dialog>
  );
}

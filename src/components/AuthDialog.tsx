// src/components/AuthDialog.tsx
"use client";

import React from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, Typography } from "@mui/material";
import { useAppSelector, useAppDispatch } from "@/redux/store";
import { closeAuthDialog, openAuthDialog } from "@/redux/slices/AuthSlice";
import LoginForm from "./AuthDialogLoginForm";
import RegisterForm from "./AuthDialogRegisterForm";

export default function AuthDialog() {
  const dispatch = useAppDispatch();
  const { dialogOpen, dialogMode } = useAppSelector((state) => state.auth);

  const toggleMode = () => {
    dispatch(openAuthDialog(dialogMode === "login" ? "register" : "login"));
  };

  const handleClose = () => {
    dispatch(closeAuthDialog());
  };

  return (
    <Dialog open={dialogOpen} onClose={handleClose} fullWidth maxWidth="xs">
      <DialogTitle>{dialogMode === "login" ? "Login" : "Register"}</DialogTitle>
      <DialogContent>
        {dialogMode === "login" ? <LoginForm /> : <RegisterForm />}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
      </DialogActions>
      <Box textAlign="center" mb={2}>
        <Typography
          variant="body2"
          sx={{ cursor: "pointer", color: "blue" }}
          onClick={toggleMode}
        >
          {dialogMode === "login" ? "New user? Register here" : "Already a user? Log In"}
        </Typography>
      </Box>
    </Dialog>
  );
}

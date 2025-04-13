// src/components/AuthDialogLoginForm.tsx
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { TextField, Button, Box, Typography } from "@mui/material";
import { axiosClient } from "@/lib/utils/axiosClient";
import { useRouter } from "next/navigation";


interface LoginFormProps {
  onSuccess: () => void;
}

export default function LoginForm({ onSuccess }: LoginFormProps) {
  const [loginError, setLoginError] = useState("");
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const onSubmit = async (data: { username: string; password: string }) => {
    setLoginError("");

    try {
      await axiosClient.post("/api/auth/login", data);
      onSuccess(); // ✅ Close dialog or refresh after login
      router.refresh(); // ✅ reflect session
    } catch (error: any) {
      setLoginError(
        error?.response?.data?.error || "Invalid username or password"
      );
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <TextField
        label="Username"
        variant="outlined"
        fullWidth
        margin="normal"
        {...register("username", { required: "Username is required" })}
        error={!!errors.username}
        helperText={errors.username?.message}
      />
      <TextField
        label="Password"
        type="password"
        variant="outlined"
        fullWidth
        margin="normal"
        {...register("password", { required: "Password is required" })}
        error={!!errors.password}
        helperText={errors.password?.message}
      />

      {loginError && (
        <Typography color="error" textAlign="center" mt={2}>
          {loginError}
        </Typography>
      )}

      <Box textAlign="center" mt={2}>
        <Button
          type="submit"
          variant="contained"
          color="primary"
          fullWidth
          disabled={isSubmitting}
        >
          Login
        </Button>
      </Box>
    </form>
  );
}

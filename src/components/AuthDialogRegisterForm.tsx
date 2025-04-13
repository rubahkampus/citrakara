// src/components/AuthDialogRegisterForm.tsx
"use client";

import { useState } from "react";
import {
  TextField,
  Button,
  Box,
  CircularProgress,
  Typography,
} from "@mui/material";
import { useForm } from "react-hook-form";
import { axiosClient } from "@/lib/utils/axiosClient";
import { useRouter } from "next/navigation";


interface RegisterFormProps {
  onSuccess: () => void;
}

export default function RegisterForm({ onSuccess }: RegisterFormProps) {
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [usernameError, setUsernameError] = useState("");

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      email: "",
      password: "",
      username: "",
    },
  });

  const checkAvailability = async (
    type: "email" | "username",
    value: string,
    setError: (msg: string) => void,
    onSuccess: () => void
  ) => {
    try {
      setError("");
      setCheckingAvailability(true);
      const res = await axiosClient.get(
        `/api/user/check-availability?${type}=${value}`
      );

      if (res.data?.message?.includes("Available")) {
        onSuccess();
      } else {
        throw new Error(res.data?.error || `${type} is already taken`);
      }
    } catch (err: any) {
      setError(err.message || `Error checking ${type}`);
    } finally {
      setCheckingAvailability(false);
    }
  };

  const onSubmit = async (values: {
    email: string;
    password: string;
    username: string;
  }) => {
    if (step === 1) {
      await checkAvailability("email", values.email, setEmailError, () =>
        setStep(2)
      );
    } else {
      await checkAvailability("username", values.username, setUsernameError, async () => {
        try {
          await axiosClient.post("/api/auth/register", values);
          onSuccess(); // ✅ Close dialog or refresh after success
          router.refresh(); // ✅ reflect session
        } catch (err: any) {
          setUsernameError(err?.response?.data?.error || "Registration failed");
        }
      });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {step === 1 && (
        <>
          <TextField
            label="Email"
            fullWidth
            margin="normal"
            {...register("email", {
              required: "Email is required",
              pattern: {
                value: /^[^@]+@[^@]+\.[^@]+$/,
                message: "Invalid email format",
              },
            })}
            error={!!errors.email || !!emailError}
            helperText={errors.email?.message || emailError}
          />
          <TextField
            label="Password"
            type="password"
            fullWidth
            margin="normal"
            {...register("password", {
              required: "Password is required",
              minLength: {
                value: 6,
                message: "Password must be at least 6 characters",
              },
            })}
            error={!!errors.password}
            helperText={errors.password?.message}
          />
        </>
      )}

      {step === 2 && (
        <TextField
        label="Username"
        fullWidth
        margin="normal"
        error={!!errors.username || !!usernameError}
        helperText={errors.username?.message || usernameError}
        {...register("username", {
          required: "Username is required",
          minLength: {
            value: 3,
            message: "Username must be at least 3 characters",
          },
          onChange: (e) => {
            const sanitized = e.target.value
              .toLowerCase()
              .replace(/[^a-z0-9]/g, "");
            setValue("username", sanitized, { shouldValidate: true });
          },
        })}
      />
      
      )}

      {checkingAvailability && (
        <Box textAlign="center" mt={2}>
          <CircularProgress size={24} />
          <Typography variant="body2" mt={1}>
            Checking availability...
          </Typography>
        </Box>
      )}

      <Box textAlign="center" mt={2}>
        <Button
          type="submit"
          variant="contained"
          color="primary"
          fullWidth
          disabled={isSubmitting || checkingAvailability}
        >
          {step === 1 ? "Next" : "Register"}
        </Button>
      </Box>
    </form>
  );
}

// src/components/auth/LoginForm.tsx
"use client";

import { useState } from "react";
import {
  TextField,
  Button,
  Box,
  CircularProgress,
  Typography,
  InputAdornment,
  IconButton,
  Alert,
  Fade,
  Paper,
  styled,
} from "@mui/material";
import { useForm } from "react-hook-form";
import { axiosClient } from "@/lib/utils/axiosClient";
import { useRouter } from "next/navigation";
import {
  Visibility,
  VisibilityOff,
  Login as LoginIcon,
} from "@mui/icons-material";

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  marginBottom: theme.spacing(2),
  borderRadius: theme.spacing(1),
  backgroundColor:
    theme.palette.mode === "dark"
      ? "rgba(255,255,255,0.05)"
      : "rgba(0,0,0,0.02)",
}));

interface LoginFormProps {
  onSuccess: () => void;
}

export default function LoginForm({ onSuccess }: LoginFormProps) {
  const router = useRouter();
  const [loginError, setLoginError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      username: "",
      password: "",
    },
    mode: "onChange",
  });

  const onSubmit = async (data: { username: string; password: string }) => {
    setLoginError("");
    try {
      await axiosClient.post("/api/auth/login", data);
      onSuccess();
      router.refresh();
    } catch (error: any) {
      setLoginError(
        error?.response?.data?.error ||
          "Nama pengguna atau kata sandi tidak valid"
      );
    }
  };

  const toggleShowPassword = () => {
    setShowPassword(!showPassword);
  };

  return (
    <Box>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Fade in={true}>
          <Box>
            <StyledPaper elevation={0}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Masukkan nama pengguna dan kata sandi untuk melanjutkan.
              </Typography>

              <TextField
                label="Nama Pengguna"
                fullWidth
                margin="normal"
                variant="outlined"
                autoComplete="username"
                autoFocus
                {...register("username", {
                  required: "Nama pengguna wajib diisi",
                })}
                error={!!errors.username}
                helperText={errors.username?.message}
              />

              <TextField
                label="Kata Sandi"
                type={showPassword ? "text" : "password"}
                fullWidth
                margin="normal"
                variant="outlined"
                autoComplete="current-password"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={toggleShowPassword}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                {...register("password", {
                  required: "Kata sandi wajib diisi",
                })}
                error={!!errors.password}
                helperText={errors.password?.message}
              />
            </StyledPaper>

            {loginError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {loginError}
              </Alert>
            )}

            <Box textAlign="center" mt={3}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                fullWidth
                size="large"
                disabled={isSubmitting}
                sx={{ py: 1.5 }}
                startIcon={
                  isSubmitting ? <CircularProgress size={20} /> : <LoginIcon />
                }
              >
                {isSubmitting ? "Memproses..." : "Masuk"}
              </Button>
            </Box>
          </Box>
        </Fade>
      </form>
    </Box>
  );
}

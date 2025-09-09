// src/components/auth/RegisterForm.tsx
"use client";

import { useState, useEffect } from "react";
import {
  TextField,
  Button,
  Box,
  CircularProgress,
  Typography,
  InputAdornment,
  IconButton,
  Stepper,
  Step,
  StepLabel,
  Alert,
  Fade,
  Paper,
  Tooltip,
  styled,
} from "@mui/material";
import { useForm } from "react-hook-form";
import { axiosClient } from "@/lib/utils/axiosClient";
import { useRouter } from "next/navigation";
import {
  Visibility,
  VisibilityOff,
  CheckCircle,
  Error as ErrorIcon,
  HelpOutline,
  ArrowBack,
  PersonAdd,
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

interface RegisterFormProps {
  onSuccess: () => void;
}

export default function RegisterForm({ onSuccess }: RegisterFormProps) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [usernameError, setUsernameError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  // Commented out password strength state - no longer needed
  // const [passwordStrength, setPasswordStrength] = useState({
  //   score: 0,
  //   message: "",
  //   color: "",
  // });

  const steps = ["Detail Akun", "Pilih Nama Pengguna"];

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    trigger,
    formState: { errors, isSubmitting, dirtyFields },
  } = useForm({
    defaultValues: {
      email: "",
      password: "",
      username: "",
    },
    mode: "onChange",
  });

  const email = watch("email");
  const password = watch("password");
  const username = watch("username");

  // Commented out password strength checker
  // useEffect(() => {
  //   if (!password || password.length < 1) {
  //     setPasswordStrength({ score: 0, message: "", color: "" });
  //     return;
  //   }

  //   // Simple password strength calculation
  //   let score = 0;
  //   if (password.length >= 8) score += 1;
  //   if (/[A-Z]/.test(password)) score += 1;
  //   if (/[0-9]/.test(password)) score += 1;
  //   if (/[^A-Za-z0-9]/.test(password)) score += 1;

  //   const strengthMap = [
  //     { message: "Sangat lemah", color: "#f44336" },
  //     { message: "Lemah", color: "#ff9800" },
  //     { message: "Sedang", color: "#ffeb3b" },
  //     { message: "Kuat", color: "#8bc34a" },
  //     { message: "Sangat kuat", color: "#4caf50" },
  //   ];

  //   setPasswordStrength({
  //     score,
  //     message: strengthMap[score].message,
  //     color: strengthMap[score].color,
  //   });
  // }, [password]);

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
        `/api/user/check-availability?${type}=${encodeURIComponent(value)}`
      );

      if (res.data?.message?.includes("Available")) {
        onSuccess();
      } else {
        throw new Error(
          res.data?.error ||
            `${
              type === "email" ? "Email" : "Nama pengguna"
            } ini sudah digunakan`
        );
      }
    } catch (err: any) {
      setError(
        err.message ||
          `Error memeriksa ${type === "email" ? "email" : "nama pengguna"}`
      );
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
      // Validate fields before checking availability
      const isValid = await trigger(["email", "password"]);
      if (!isValid) return;

      await checkAvailability("email", values.email, setEmailError, () => {
        setStep(2);
      });
    } else {
      try {
        setUsernameError("");
        await checkAvailability(
          "username",
          values.username,
          setUsernameError,
          async () => {
            try {
              await axiosClient.post("/api/auth/register", values);
              onSuccess();
              router.refresh();
            } catch (err: any) {
              setUsernameError(
                err?.response?.data?.error || "Pendaftaran gagal"
              );
            }
          }
        );
      } catch (error) {
        // Error is already handled in checkAvailability
      }
    }
  };

  const handleBack = () => {
    setStep(1);
  };

  const toggleShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const isValidEmail = !errors.email && email && dirtyFields.email;
  // Simplified password validation - removed strong password requirement
  const isValidPassword = !errors.password && password && dirtyFields.password;
  // const isStrongPassword =
  //   !errors.password &&
  //   passwordStrength.score >= 3 &&
  //   password &&
  //   dirtyFields.password;
  const isNextButtonEnabled =
    isValidEmail && isValidPassword && !checkingAvailability;

  return (
    <Box>
      <Stepper activeStep={step - 1} alternativeLabel sx={{ mb: 3 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      <form onSubmit={handleSubmit(onSubmit)}>
        {step === 1 && (
          <Fade in={step === 1}>
            <Box>
              <StyledPaper elevation={0}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Masukkan alamat email Anda dan buat kata sandi yang aman untuk
                  memulai.
                </Typography>

                <TextField
                  label="Alamat Email"
                  fullWidth
                  margin="normal"
                  variant="outlined"
                  autoComplete="email"
                  autoFocus
                  InputProps={{
                    endAdornment: email && (
                      <InputAdornment position="end">
                        {isValidEmail ? (
                          <CheckCircle color="success" fontSize="small" />
                        ) : (
                          errors.email && (
                            <ErrorIcon color="error" fontSize="small" />
                          )
                        )}
                      </InputAdornment>
                    ),
                  }}
                  {...register("email", {
                    required: "Email wajib diisi",
                    pattern: {
                      value: /^[^@]+@[^@]+\.[^@]+$/,
                      message: "Format email tidak valid",
                    },
                  })}
                  error={!!errors.email || !!emailError}
                  helperText={errors.email?.message || emailError}
                />

                <TextField
                  label="Kata Sandi"
                  type={showPassword ? "text" : "password"}
                  fullWidth
                  margin="normal"
                  variant="outlined"
                  autoComplete="new-password"
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
                    minLength: {
                      value: 8,
                      message: "Kata sandi minimal 8 karakter",
                    },
                  })}
                  error={!!errors.password}
                  helperText={errors.password?.message}
                />

                {/* Commented out password strength indicator */}
                {/* {password && password.length > 0 && (
                  <Box sx={{ mt: 1, mb: 2 }}>
                    <Box
                      sx={{ display: "flex", alignItems: "center", mb: 0.5 }}
                    >
                      <Typography variant="body2" sx={{ mr: 1 }}>
                        Kekuatan kata sandi:
                      </Typography>
                      <Typography
                        variant="body2"
                        fontWeight="bold"
                        sx={{ color: passwordStrength.color }}
                      >
                        {passwordStrength.message}
                      </Typography>
                      <Tooltip title="Gunakan minimal 8 karakter dengan huruf besar, angka, dan simbol untuk kata sandi yang kuat">
                        <HelpOutline
                          fontSize="small"
                          sx={{ ml: 1, color: "text.secondary", fontSize: 16 }}
                        />
                      </Tooltip>
                    </Box>
                    <Box
                      sx={{
                        width: "100%",
                        height: 4,
                        bgcolor: "background.paper",
                        borderRadius: 1,
                        overflow: "hidden",
                      }}
                    >
                      <Box
                        sx={{
                          width: `${(passwordStrength.score / 4) * 100}%`,
                          height: "100%",
                          bgcolor: passwordStrength.color,
                          transition: "width 0.3s ease-in-out",
                        }}
                      />
                    </Box>
                  </Box>
                )} */}
              </StyledPaper>

              {emailError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {emailError}
                </Alert>
              )}

              <Box textAlign="center" mt={3}>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  fullWidth
                  size="large"
                  disabled={
                    !isNextButtonEnabled || isSubmitting || checkingAvailability
                  }
                  sx={{ py: 1.5 }}
                >
                  {checkingAvailability ? (
                    <>
                      <CircularProgress size={20} sx={{ mr: 1 }} />
                      Memeriksa...
                    </>
                  ) : (
                    "Lanjutkan"
                  )}
                </Button>
              </Box>
            </Box>
          </Fade>
        )}

        {step === 2 && (
          <Fade in={step === 2}>
            <Box>
              <StyledPaper elevation={0}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Pilih nama pengguna unik untuk akun Anda. Ini akan menjadi
                  identitas Anda di platform.
                </Typography>

                <TextField
                  label="Nama Pengguna"
                  fullWidth
                  margin="normal"
                  variant="outlined"
                  autoFocus
                  autoComplete="username"
                  error={!!errors.username || !!usernameError}
                  helperText={
                    errors.username?.message ||
                    usernameError ||
                    "Hanya huruf kecil dan angka yang diperbolehkan"
                  }
                  InputProps={{
                    endAdornment: username &&
                      !errors.username &&
                      !usernameError && (
                        <InputAdornment position="end">
                          <CheckCircle color="success" fontSize="small" />
                        </InputAdornment>
                      ),
                  }}
                  {...register("username", {
                    required: "Nama pengguna wajib diisi",
                    minLength: {
                      value: 3,
                      message: "Nama pengguna minimal 3 karakter",
                    },
                    maxLength: {
                      value: 20,
                      message: "Nama pengguna maksimal 20 karakter",
                    },
                    pattern: {
                      value: /^[a-z0-9]+$/,
                      message: "Hanya huruf kecil dan angka yang diperbolehkan",
                    },
                    onChange: (e) => {
                      const sanitized = e.target.value
                        .toLowerCase()
                        .replace(/[^a-z0-9]/g, "");
                      setValue("username", sanitized, { shouldValidate: true });
                    },
                  })}
                />
              </StyledPaper>

              {usernameError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {usernameError}
                </Alert>
              )}

              <Box display="flex" gap={2} mt={3}>
                <Button
                  variant="outlined"
                  color="primary"
                  onClick={handleBack}
                  disabled={isSubmitting || checkingAvailability}
                  sx={{ flex: 1, py: 1.5 }}
                  startIcon={<ArrowBack />}
                >
                  Kembali
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  disabled={
                    !username ||
                    !!errors.username ||
                    isSubmitting ||
                    checkingAvailability
                  }
                  sx={{ flex: 2, py: 1.5 }}
                  startIcon={
                    !checkingAvailability && !isSubmitting ? (
                      <PersonAdd />
                    ) : null
                  }
                >
                  {checkingAvailability ? (
                    <>
                      <CircularProgress size={20} sx={{ mr: 1 }} />
                      Memeriksa...
                    </>
                  ) : isSubmitting ? (
                    <>
                      <CircularProgress size={20} sx={{ mr: 1 }} />
                      Membuat Akun...
                    </>
                  ) : (
                    "Buat Akun"
                  )}
                </Button>
              </Box>
            </Box>
          </Fade>
        )}
      </form>
    </Box>
  );
}
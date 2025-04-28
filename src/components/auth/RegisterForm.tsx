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
  styled
} from "@mui/material";
import { useForm } from "react-hook-form";
import { axiosClient } from "@/lib/utils/axiosClient";
import { useRouter } from "next/navigation";
import {
  Visibility,
  VisibilityOff,
  CheckCircle,
  Error as ErrorIcon,
  HelpOutline
} from "@mui/icons-material";

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  marginBottom: theme.spacing(2),
  borderRadius: theme.spacing(1),
  backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)'
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
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    message: "",
    color: ""
  });

  const steps = ['Account Details', 'Choose Username'];

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
    mode: "onChange"
  });

  const email = watch("email");
  const password = watch("password");
  const username = watch("username");

  // Password strength checker
  useEffect(() => {
    if (!password || password.length < 1) {
      setPasswordStrength({ score: 0, message: "", color: "" });
      return;
    }

    // Simple password strength calculation
    let score = 0;
    if (password.length >= 8) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;

    const strengthMap = [
      { message: "Very weak", color: "#f44336" },
      { message: "Weak", color: "#ff9800" },
      { message: "Medium", color: "#ffeb3b" },
      { message: "Strong", color: "#8bc34a" },
      { message: "Very strong", color: "#4caf50" }
    ];

    setPasswordStrength({
      score,
      message: strengthMap[score].message,
      color: strengthMap[score].color
    });
  }, [password]);

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
        throw new Error(res.data?.error || `This ${type} is already taken`);
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
      // Validate fields before checking availability
      const isValid = await trigger(["email", "password"]);
      if (!isValid) return;
      
      await checkAvailability("email", values.email, setEmailError, () => {
        setStep(2);
      });
    } else {
      try {
        setUsernameError("");
        await checkAvailability("username", values.username, setUsernameError, async () => {
          try {
            await axiosClient.post("/api/auth/register", values);
            onSuccess();
            router.refresh();
          } catch (err: any) {
            setUsernameError(err?.response?.data?.error || "Registration failed");
          }
        });
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
  const isStrongPassword = !errors.password && passwordStrength.score >= 3 && password && dirtyFields.password;
  const isNextButtonEnabled = isValidEmail && isStrongPassword && !checkingAvailability;

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
                  Enter your email address and create a secure password to get started.
                </Typography>

                <TextField
                  label="Email Address"
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
                          errors.email && <ErrorIcon color="error" fontSize="small" />
                        )}
                      </InputAdornment>
                    ),
                  }}
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
                    required: "Password is required",
                    minLength: {
                      value: 8,
                      message: "Password must be at least 8 characters",
                    },
                  })}
                  error={!!errors.password}
                  helperText={errors.password?.message}
                />

                {password && password.length > 0 && (
                  <Box sx={{ mt: 1, mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                      <Typography variant="body2" sx={{ mr: 1 }}>
                        Password strength:
                      </Typography>
                      <Typography 
                        variant="body2" 
                        fontWeight="bold" 
                        sx={{ color: passwordStrength.color }}
                      >
                        {passwordStrength.message}
                      </Typography>
                      <Tooltip title="Use at least 8 characters with uppercase letters, numbers, and symbols for a strong password">
                        <HelpOutline fontSize="small" sx={{ ml: 1, color: 'text.secondary', fontSize: 16 }} />
                      </Tooltip>
                    </Box>
                    <Box sx={{ width: '100%', height: 4, bgcolor: 'background.paper', borderRadius: 1, overflow: 'hidden' }}>
                      <Box 
                        sx={{ 
                          width: `${(passwordStrength.score / 4) * 100}%`, 
                          height: '100%', 
                          bgcolor: passwordStrength.color,
                          transition: 'width 0.3s ease-in-out'
                        }} 
                      />
                    </Box>
                  </Box>
                )}
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
                  disabled={!isNextButtonEnabled || isSubmitting || checkingAvailability}
                  sx={{ py: 1.5 }}
                >
                  {checkingAvailability ? (
                    <>
                      <CircularProgress size={20} sx={{ mr: 1 }} />
                      Checking...
                    </>
                  ) : (
                    "Continue"
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
                  Choose a unique username for your account. This will be your identity on the platform.
                </Typography>
                
                <TextField
                  label="Username"
                  fullWidth
                  margin="normal"
                  variant="outlined"
                  autoFocus
                  autoComplete="username"
                  error={!!errors.username || !!usernameError}
                  helperText={
                    errors.username?.message || 
                    usernameError || 
                    "Only lowercase letters and numbers allowed"
                  }
                  InputProps={{
                    endAdornment: username && !errors.username && !usernameError && (
                      <InputAdornment position="end">
                        <CheckCircle color="success" fontSize="small" />
                      </InputAdornment>
                    ),
                  }}
                  {...register("username", {
                    required: "Username is required",
                    minLength: {
                      value: 3,
                      message: "Username must be at least 3 characters",
                    },
                    maxLength: {
                      value: 20,
                      message: "Username must be less than 20 characters"
                    },
                    pattern: {
                      value: /^[a-z0-9]+$/,
                      message: "Only lowercase letters and numbers allowed"
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
                >
                  Back
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  disabled={!username || !!errors.username || isSubmitting || checkingAvailability}
                  sx={{ flex: 2, py: 1.5 }}
                >
                  {checkingAvailability ? (
                    <>
                      <CircularProgress size={20} sx={{ mr: 1 }} />
                      Checking...
                    </>
                  ) : isSubmitting ? (
                    <>
                      <CircularProgress size={20} sx={{ mr: 1 }} />
                      Creating Account...
                    </>
                  ) : (
                    "Create Account"
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

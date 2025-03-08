// src/components/AuthDialogRegisterForm.tsx
"use client";

import React, { useState } from "react";
import { TextField, Button, Box, CircularProgress, Typography } from "@mui/material";
import { useAppDispatch } from "@/redux/store";
import { closeAuthDialog, registerThunk } from "@/redux/slices/AuthSlice";
import { useFormik } from "formik";
import { RegisterSchema } from "@/schemas/UserSchema";
import { validateZodSchema } from "@/lib/utils/zodFormikValidate";
import { axiosClient } from "@/lib/utils/axiosClient";

export default function RegisterForm() {
  const dispatch = useAppDispatch();
  const [step, setStep] = useState(1);
  const [emailError, setEmailError] = useState("");
  const [usernameError, setUsernameError] = useState("");
  const [checkingAvailability, setCheckingAvailability] = useState(false);

  // Define a consistent form structure
  const formik = useFormik({
    initialValues: {
      email: "",
      password: "",
      username: "",
    },
    validate: (values) => {
      if (step === 1) {
        return validateZodSchema(RegisterSchema.pick({ email: true, password: true }))(values);
      }
      return validateZodSchema(RegisterSchema.pick({ username: true }))(values);
    },
    onSubmit: async (values) => {
      if (step === 1) {
        await checkAvailability("email", values.email, setEmailError, () => setStep(2));
      } else {
        await checkAvailability("username", values.username, setUsernameError, async () => {
          await dispatch(registerThunk(values));
          dispatch(closeAuthDialog()); // ✅ Close dialog after successful register
        });
      }
    },
  });

  // Check email or username availability
  const checkAvailability = async (
    type: "email" | "username",
    value: string,
    setError: (error: string) => void,
    onSuccess: () => void
  ) => {
    try {
      setError(""); // Reset previous errors
      setCheckingAvailability(true);
  
      const response = await axiosClient.get(`/api/user/check-availability?${type}=${value}`);
  
      if (response.data.error) {
        // If API returns an error message, manually throw an error
        throw new Error(response.data.error);
      }
  
      if (response.data.message.includes("available")) {
        onSuccess();
      }
    } catch (err: any) {
      setError(err.message || `Error checking ${type}`);
    } finally {
      setCheckingAvailability(false);
    }
  };
  

  return (
    <form onSubmit={formik.handleSubmit}>
      {step === 1 && (
        <>
          <TextField
            label="Email"
            variant="outlined"
            fullWidth
            margin="normal"
            name="email"
            value={formik.values.email}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={Boolean(formik.touched.email && (formik.errors.email || emailError))}
            helperText={formik.touched.email ? formik.errors.email || emailError : ""}
          />
          <TextField
            label="Password"
            variant="outlined"
            fullWidth
            margin="normal"
            type="password"
            name="password"
            value={formik.values.password}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={Boolean(formik.touched.password && formik.errors.password)}
            helperText={formik.touched.password && formik.errors.password}
          />
        </>
      )}

      {step === 2 && (
        <TextField
          label="Username"
          variant="outlined"
          fullWidth
          margin="normal"
          name="username"
          value={formik.values.username}
          onChange={(e) => {
            const sanitizedValue = e.target.value.toLowerCase().replace(/[^a-z0-9]/g, "");
            formik.setFieldValue("username", sanitizedValue);
          }}
          onBlur={formik.handleBlur}
          error={Boolean(formik.touched.username && (formik.errors.username || usernameError))}
          helperText={formik.touched.username ? formik.errors.username || usernameError : ""}
        />
      )}

      {checkingAvailability && (
        <Box textAlign="center" mt={2}>
          <CircularProgress size={24} />
          <Typography variant="body2" sx={{ mt: 1 }}>
            Checking availability...
          </Typography>
        </Box>
      )}

      <Box textAlign="center" mt={2}>
        <Button type="submit" variant="contained" color="primary" fullWidth>
          {step === 1 ? "Next" : "Register"}
        </Button>
      </Box>
    </form>
  );
}

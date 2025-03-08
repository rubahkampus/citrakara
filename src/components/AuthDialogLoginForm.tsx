// src/components/AuthDialogLoginForm.tsx
"use client";

import React, { useState } from "react";
import { TextField, Button, Box, Typography } from "@mui/material";
import { useAppDispatch } from "@/redux/store";
import { closeAuthDialog, loginThunk } from "@/redux/slices/AuthSlice";
import { useFormik } from "formik";
import { LoginSchema } from "@/schemas/AuthSchema";
import { validateZodSchema } from "@/lib/utils/zodFormikValidate";

export default function LoginForm() {
  const dispatch = useAppDispatch();
  const [loginError, setLoginError] = useState("");

  const formik = useFormik({
    initialValues: {
      username: "",
      password: "",
    },
    validate: validateZodSchema(LoginSchema),
    onSubmit: async (values) => {
      setLoginError(""); // Reset error message before new login attempt

      const action = await dispatch(loginThunk(values)); // Dispatch login action

      if (loginThunk.rejected.match(action)) {
        // Extract error message from Redux's rejected payload
        setLoginError(typeof action.payload === 'string' ? action.payload : "Invalid username or password");
      } else {
        dispatch(closeAuthDialog())
      }
    },
  });

  return (
    <form onSubmit={formik.handleSubmit}>
      <TextField
        label="Username"
        variant="outlined"
        fullWidth
        margin="normal"
        name="username"
        value={formik.values.username}
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
        error={Boolean(formik.touched.username && formik.errors.username)}
        helperText={formik.touched.username ? formik.errors.username : ""}
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
        helperText={formik.touched.password ? formik.errors.password : ""}
      />

      {/* Display login error */}
      {loginError && (
        <Typography color="error" textAlign="center" mt={2}>
          {loginError}
        </Typography>
      )}

      <Box textAlign="center" mt={2}>
        <Button type="submit" variant="contained" color="primary" fullWidth>
          Login
        </Button>
      </Box>
    </form>
  );
}

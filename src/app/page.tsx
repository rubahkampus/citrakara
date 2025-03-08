// src/app/page.tsx
"use client";

import { useState } from "react";
import { Typography, Box, Button, Stack, Snackbar, Alert, CircularProgress } from "@mui/material";
import { useAppSelector } from "@/redux/store";
import Image from "next/image";

export default function Home() {
  const { user } = useAppSelector((state) => state.auth);

  // Placeholder loading effect for commission listings
  const [loading, setLoading] = useState(true);
  setTimeout(() => setLoading(false), 2000); // Fake loading

  // Cute placeholder message
  return (
    <Box textAlign="center" sx={{ mt: 5 }}>
      <Typography variant="h3" sx={{ fontWeight: "bold", color: "primary.main" }}>
        ✨ Welcome to KOMIS! ✨
      </Typography>
      <Typography variant="h5" sx={{ mt: 2, color: "gray" }}>
        Your one-stop marketplace for amazing digital art commissions.
      </Typography>

      {/* Cute Illustration */}
      <Box sx={{ mt: 4, display: "flex", justifyContent: "center" }}>
      </Box>

      {/* Loading commissions (Fake for now) */}
      {loading ? (
        <Stack alignItems="center" sx={{ mt: 3 }}>
          <CircularProgress />
          <Typography sx={{ mt: 2, fontStyle: "italic" }}>Fetching amazing commissions...</Typography>
        </Stack>
      ) : (
        <Typography sx={{ mt: 3, fontSize: "18px", color: "gray" }}>
          (Commissions will be displayed here soon! 🎨)
        </Typography>
      )}
    </Box>
  );
}

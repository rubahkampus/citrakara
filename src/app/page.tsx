// src/app/page.tsx
import { Typography, Box, CircularProgress, Stack } from "@mui/material";
import { Suspense } from "react";

export default function Home() {
  return (
    <Box textAlign="center" sx={{ mt: 5 }}>
      <Typography variant="h3" sx={{ fontWeight: "bold", color: "primary.main" }}>
        ✨ Welcome to KOMIS! ✨
      </Typography>
      <Typography variant="h5" sx={{ mt: 2, color: "gray" }}>
        Your one-stop marketplace for amazing digital art commissions.
      </Typography>

      <Box sx={{ mt: 4, display: "flex", justifyContent: "center" }}>
        {/* Add image later */}
      </Box>

      {/* Commission listing (placeholder) */}
      <Suspense fallback={
        <Stack alignItems="center" sx={{ mt: 3 }}>
          <CircularProgress />
          <Typography sx={{ mt: 2, fontStyle: "italic" }}>Fetching amazing commissions...</Typography>
        </Stack>
      }>
        <PlaceholderCommission />
      </Suspense>
    </Box>
  );
}

function PlaceholderCommission() {
  return (
    <Typography sx={{ mt: 3, fontSize: "18px", color: "gray" }}>
      (Commissions will be displayed here soon! 🎨)
    </Typography>
  );
}

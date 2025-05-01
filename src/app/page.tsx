// src/app/page.tsx
import { Box, Typography, CircularProgress, Stack } from "@mui/material";
import { Suspense } from "react";

export default function HomePage() {
  return (
    <Box textAlign="center" sx={{ mt: 5 }}>
      <Typography variant="h3" fontWeight="bold" color="primary.main">
        ✨ Welcome to KOMIS! ✨
      </Typography>
      <Typography variant="h5" mt={2} color="text.secondary">
        Your one-stop marketplace for amazing digital art commissions.
      </Typography>

      <Box mt={4} display="flex" justifyContent="center">
        {/* hero image goes here */}
      </Box>

      <Suspense
        fallback={
          <Stack alignItems="center" mt={3}>
            <CircularProgress />
            <Typography mt={2} fontStyle="italic">
              Fetching amazing commissions...
            </Typography>
          </Stack>
        }
      >
        <PlaceholderCommission />
      </Suspense>
    </Box>
  );
}

function PlaceholderCommission() {
  return (
    <Typography mt={3} fontSize={18} color="text.secondary">
      (Commissions will be displayed here soon! 🎨)
    </Typography>
  );
}

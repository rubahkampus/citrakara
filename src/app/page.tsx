// src/app/page.tsx
import { Box, Typography, Button, Stack } from "@mui/material";

export default function Home() {
  return (
    <Box sx={{ textAlign: "center", mt: 5 }}>
      <Typography variant="h3" sx={{ fontWeight: "bold" }}>
        Welcome to Service Marketplace
      </Typography>
      <Typography variant="body1" sx={{ mt: 2, color: "text.secondary" }}>
        Get started by exploring our services.
      </Typography>

      <Stack direction="row" spacing={2} justifyContent="center" sx={{ mt: 4 }}>
        <Button variant="contained" color="primary">
          Browse Services
        </Button>
        <Button variant="outlined" color="secondary">
          Learn More
        </Button>
      </Stack>
    </Box>
  );
}

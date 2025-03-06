// src/app/layout.tsx
import type { Metadata } from "next";
import ThemeRegistry from "@/components/ThemeRegistry"; 
import { AppBar, Toolbar, Typography, Container } from "@mui/material";

export const metadata: Metadata = {
  title: "Service Marketplace",
  description: "Find and offer services easily",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ThemeRegistry> {/* ✅ Now it works because ThemeRegistry is a Client Component */}
          <AppBar position="static">
            <Toolbar>
              <Typography variant="h6">Marketplace</Typography>
            </Toolbar>
          </AppBar>
          <Container sx={{ mt: 4 }}>{children}</Container>
        </ThemeRegistry>
      </body>
    </html>
  );
}

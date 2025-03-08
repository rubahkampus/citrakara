// src/app/layout.tsx
// src/app/layout.tsx
import ThemeRegistry from "@/components/ThemeRegistry";
import { Container } from "@mui/material";
import AuthProvider, { ReduxProvider } from "@/redux/provider";
import AuthDialog from "@/components/AuthDialog";
import Navbar from "@/components/Navbar"; // Import the new Navbar component

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ReduxProvider>
          <AuthProvider>
            <ThemeRegistry>
              <Navbar /> {/* ✅ Use the new Navbar component here */}
              <Container sx={{ mt: 4 }}>{children}</Container>
              <AuthDialog />
            </ThemeRegistry>
          </AuthProvider>
        </ReduxProvider>
      </body>
    </html>
  );
}

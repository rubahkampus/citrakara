// src/app/layout.tsx
import { AppRouterCacheProvider } from "@mui/material-nextjs/v15-appRouter";
import { Container } from "@mui/material";
import { Roboto } from "next/font/google";
import GlobalNavbar from "@/components/GlobalNavbar";
import GlobalDialogs from "@/components/GlobalDialogs";
import ThemeProviderWrapper from "@/components/ThemeProviderWraper";

const roboto = Roboto({
  weight: ["300", "400", "500", "700"],
  subsets: ["latin"],
  variable: "--font-roboto",
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={roboto.variable}>
      <body>
        <AppRouterCacheProvider options={{ key: "css" }}>
          <ThemeProviderWrapper>
            <GlobalNavbar />
            <Container
              maxWidth={false}
              disableGutters
            >
              {children}
            </Container>
            <GlobalDialogs />
          </ThemeProviderWrapper>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}

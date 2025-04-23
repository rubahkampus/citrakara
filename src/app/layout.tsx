// src/app/layout.tsx
import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Container } from '@mui/material';
import { Roboto } from 'next/font/google';
import GlobalNavbar from '@/components/GlobalNavbar';
import GlobalDialogs from '@/components/GlobalDialogs';
import theme from '@/theme';

const roboto = Roboto({
  weight: ['300', '400', '500', '700'],
  subsets: ['latin'],
  variable: '--font-roboto',
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={roboto.variable}>
      <body>
        <AppRouterCacheProvider options={{ key: 'css' }}>
          <ThemeProvider theme={theme}>
            <CssBaseline />
            <GlobalNavbar />
            <Container sx={{ mt: 4 }}>{children}</Container>
            <GlobalDialogs /> {/* ✅ mount all dialogs here */}
          </ThemeProvider>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
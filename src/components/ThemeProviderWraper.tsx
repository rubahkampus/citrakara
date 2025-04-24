'use client';

import { ReactNode, useEffect, useState } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { useThemeStore } from '@/lib/stores/themeStore';

// Base theme settings
const getTheme = (mode: 'light' | 'dark') => createTheme({
  cssVariables: true,
  palette: {
    mode,
    primary: { main: '#556cd6' },
    secondary: { main: '#19857b' },
  },
  typography: {
    fontFamily: 'var(--font-roboto)',
  },
});

export default function ThemeProviderWrapper({ children }: { children: ReactNode }) {
  const { mode } = useThemeStore();
  const [mounted, setMounted] = useState(false);
  
  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Create the theme
  const theme = getTheme(mode);

  // Initial render - prevent hydration mismatch
  if (!mounted) {
    return (
      <ThemeProvider theme={getTheme('light')}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}
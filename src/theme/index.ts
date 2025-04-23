// src/theme/index.ts
'use client';
import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  cssVariables: true,
  palette: {
    primary: { main: '#556cd6' },
    secondary: { main: '#19857b' },
  },
  typography: {
    fontFamily: 'var(--font-roboto)',
  },
});

export default theme;

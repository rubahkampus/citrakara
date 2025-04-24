// src/theme/index.ts
'use client';
import { createTheme, Theme, ThemeOptions } from '@mui/material/styles';
import { PaletteMode } from '@mui/material';

// Define custom palette colors and augment the theme
declare module '@mui/material/styles' {
  interface Palette {
    lighter: Palette['primary'];
  }
  interface PaletteOptions {
    lighter?: PaletteOptions['primary'];
  }
  
  interface PaletteColor {
    lighter?: string;
  }
  interface SimplePaletteColorOptions {
    lighter?: string;
  }
}

// Create theme settings for both light and dark modes
const getThemeOptions = (mode: PaletteMode): ThemeOptions => {
  const isLight = mode === 'light';
  
  return {
    // Remove cssVariables - not compatible with ThemeOptions type
    palette: {
      mode,
      primary: { 
        main: '#556cd6',
        light: '#7986cb',
        lighter: isLight ? '#e3f2fd' : '#304ffe30',
        dark: '#3949ab',
        contrastText: '#ffffff' 
      },
      secondary: { 
        main: '#19857b',
        light: '#4db6ac',
        lighter: isLight ? '#e0f2f1' : '#00695c30',
        dark: '#00796b',
        contrastText: '#ffffff'  
      },
      error: {
        main: '#f44336',
        light: '#e57373',
        dark: '#d32f2f'
      },
      warning: {
        main: '#ff9800',
        light: '#ffb74d',
        dark: '#f57c00'
      },
      info: {
        main: '#2196f3',
        light: '#64b5f6',
        dark: '#1976d2'
      },
      success: {
        main: '#4caf50',
        light: '#81c784',
        dark: '#388e3c'
      },
      background: {
        default: isLight ? '#f5f5f5' : '#121212',
        paper: isLight ? '#ffffff' : '#1e1e1e'
      },
      divider: isLight ? 'rgba(0, 0, 0, 0.12)' : 'rgba(255, 255, 255, 0.12)',
      text: {
        primary: isLight ? 'rgba(0, 0, 0, 0.87)' : 'rgba(255, 255, 255, 0.87)',
        secondary: isLight ? 'rgba(0, 0, 0, 0.6)' : 'rgba(255, 255, 255, 0.6)',
        disabled: isLight ? 'rgba(0, 0, 0, 0.38)' : 'rgba(255, 255, 255, 0.38)'
      }
    },
    typography: {
      fontFamily: 'var(--font-roboto)',
      h1: {
        fontWeight: 700,
        fontSize: '2.5rem',
        lineHeight: 1.2
      },
      h2: {
        fontWeight: 700,
        fontSize: '2rem',
        lineHeight: 1.3
      },
      h3: {
        fontWeight: 700,
        fontSize: '1.75rem',
        lineHeight: 1.4
      },
      h4: {
        fontWeight: 600,
        fontSize: '1.5rem',
        lineHeight: 1.4
      },
      h5: {
        fontWeight: 600,
        fontSize: '1.25rem',
        lineHeight: 1.5
      },
      h6: {
        fontWeight: 600,
        fontSize: '1rem',
        lineHeight: 1.5
      },
      body1: {
        fontSize: '1rem',
        lineHeight: 1.5
      },
      body2: {
        fontSize: '0.875rem',
        lineHeight: 1.6
      },
      button: {
        // Fix: Use proper TextTransform type
        textTransform: 'none' as const,
        fontWeight: 500
      }
    },
    shape: {
      borderRadius: 8
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            textTransform: 'none',
            fontWeight: 500,
            boxShadow: 'none',
            '&:hover': {
              boxShadow: 'none'
            }
          },
          containedPrimary: {
            '&:hover': {
              backgroundColor: '#4C62D6'
            }
          },
          containedSecondary: {
            '&:hover': {
              backgroundColor: '#157A70'
            }
          }
        }
      },
      MuiPaper: {
        styleOverrides: {
          rounded: {
            borderRadius: 12
          }
        }
      },
      MuiListItemButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            '&.Mui-selected': {
              fontWeight: 500
            }
          }
        }
      },
      MuiAvatar: {
        styleOverrides: {
          root: {
            border: isLight ? '1px solid rgba(0,0,0,0.06)' : '1px solid rgba(255,255,255,0.12)'
          }
        }
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            boxShadow: isLight ? '0px 2px 8px rgba(0,0,0,0.08)' : '0px 2px 8px rgba(0,0,0,0.2)'
          }
        }
      },
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: 8
          }
        }
      }
    }
  };
};

// Export the default theme (light mode)
const theme = createTheme(getThemeOptions('light'));

export default theme;

// Export function to create a themed based on mode for future dark mode support
export const createAppTheme = (mode: PaletteMode): Theme => {
  return createTheme(getThemeOptions(mode));
};
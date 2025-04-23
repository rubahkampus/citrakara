// src/components/KButton.tsx
'use client';

import { Button, ButtonProps, CircularProgress } from '@mui/material';
import { forwardRef } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

interface KButtonProps extends ButtonProps {
  variantType?: Variant;
  loading?: boolean;
}

const variantStyles: Record<Variant, object> = {
  primary: { bgcolor: 'primary.main', color: 'white', '&:hover': { bgcolor: 'primary.dark' } },
  secondary: { bgcolor: 'secondary.main', color: 'white', '&:hover': { bgcolor: 'secondary.dark' } },
  ghost: {
    bgcolor: 'transparent',
    color: 'text.primary',
    '&:hover': { bgcolor: 'action.hover' },
    border: '1px solid',
    borderColor: 'divider',
  },
  danger: { bgcolor: 'error.main', color: 'white', '&:hover': { bgcolor: 'error.dark' } },
};

export const KButton = forwardRef<HTMLButtonElement, KButtonProps>(
  ({ variantType = 'primary', loading, children, sx, ...props }, ref) => (
    <Button
      ref={ref}
      sx={{
        borderRadius: 2,
        textTransform: 'none',
        fontWeight: 500,
        ...variantStyles[variantType],
        ...sx,
      }}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? <CircularProgress size={20} color="inherit" /> : children}
    </Button>
  )
);

KButton.displayName = 'KButton';

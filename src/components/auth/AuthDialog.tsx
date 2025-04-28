// src/components/auth/AuthDialog.tsx
'use client';

import { useState } from "react";
import { 
  Dialog, 
  DialogContent, 
  Box, 
  Typography, 
  IconButton,
  Divider,
  Slide,
  useTheme,
  useMediaQuery,
  Paper
} from "@mui/material";
import { TransitionProps } from '@mui/material/transitions';
import LoginForm from "./LoginForm";
import RegisterForm from "./RegisterForm";
import { useAuthStore } from "@/lib/stores";
import { KButton } from "../KButton";
import { Close as CloseIcon } from "@mui/icons-material";
import React from "react";

interface AuthDialogProps {
  open: boolean;
  onClose: () => void;
}

const Transition = React.forwardRef(function Transition(
  props: TransitionProps & {
    children: React.ReactElement;
  },
  ref: React.Ref<unknown>,
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

export default function AuthDialog({ open, onClose }: AuthDialogProps) {
  const { dialog, toggle } = useAuthStore();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [isClosing, setIsClosing] = useState(false);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 300);
  };

  const handleSuccess = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 300);
  };

  if (!dialog) return null;

  return (
    <Dialog 
      open={open} 
      onClose={handleClose} 
      fullWidth 
      maxWidth="sm"
      fullScreen={isMobile}
      TransitionComponent={Transition}
      PaperProps={{
        sx: { 
          borderRadius: isMobile ? 0 : 2,
          overflow: 'hidden',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
        }
      }}
    >
      <Box 
        sx={{ 
          display: 'flex',
          flexDirection: 'column',
          minHeight: isMobile ? '100vh' : 'auto',
        }}
      >
        {/* Header */}
        <Box
          sx={{
            p: 3,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Typography variant="h5" fontWeight="bold">
            {dialog === "login" ? "Welcome back" : "Create your account"}
          </Typography>
          <IconButton onClick={handleClose} edge="end">
            <CloseIcon />
          </IconButton>
        </Box>
        
        <Divider />

        {/* Content */}
        <DialogContent sx={{ p: 3, flexGrow: 1 }}>
          <Box 
            sx={{ 
              opacity: isClosing ? 0 : 1,
              transition: 'opacity 300ms ease',
              maxWidth: '450px', 
              mx: 'auto',
              width: '100%'
            }}
          >
            {dialog === "login" ? (
              <LoginForm onSuccess={handleSuccess} />
            ) : (
              <RegisterForm onSuccess={handleSuccess} />
            )}
          </Box>
        </DialogContent>

        {/* Footer */}
        <Box sx={{ p: 3, bgcolor: 'background.paper' }}>
          <Paper 
            elevation={0} 
            sx={{ 
              p: 2, 
              textAlign: 'center',
              bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.01)',
              borderRadius: 2
            }}
          >
            <Typography variant="body2" color="text.secondary">
              {dialog === "login" ? "Don't have an account?" : "Already have an account?"}
            </Typography>
            <KButton 
              variantType="ghost" 
              onClick={toggle} 
              sx={{ mt: 1, fontWeight: 600 }}
            >
              {dialog === "login" ? "Sign up" : "Sign in"}
            </KButton>
          </Paper>
        </Box>
      </Box>
    </Dialog>
  );
}
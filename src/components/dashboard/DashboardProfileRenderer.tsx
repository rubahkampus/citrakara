// src/components/dashboard/DashboardProfileRenderer.tsx
'use client';

import {
  Box,
  Paper,
  Typography,
  Stack,
  Button,
  Chip,
  Grid,
  Avatar,
  Divider
} from '@mui/material';
import { KButton } from '../KButton';
import { useUserDialogStore } from '@/lib/stores/userDialogStore';
import { useState, useEffect } from 'react';
import {
  Edit as EditIcon,
  Add as AddIcon,
  Dashboard as DashboardIcon,
  AttachMoney as MoneyIcon
} from '@mui/icons-material';
import TosCard from './TosCard';

interface Props {
  profile: {
    displayName?: string;
    username: string;
    email: string;
    profilePicture: string;
    openForCommissions?: boolean;
    socials?: Array<{label: string; url: string}>;
    tags?: string[];
  };
  saldo: number;
  tosSummary: string;
}

export default function DashboardProfileRenderer({ profile, saldo, tosSummary }: Props) {
  const { open } = useUserDialogStore();
  const [mounted, setMounted] = useState(false);
  
  // This prevents hydration mismatch with timestamps
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Format balance with proper thousands separator
  const formattedSaldo = saldo.toLocaleString('id-ID');
  
  return (
    <Box sx={{ width: '100%' }}>
      {/* Profile card */}
      <Paper elevation={0} sx={{ 
        p: { xs: 2, sm: 3 }, 
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider',
        mb: 3
      }}>
        <Stack 
          direction={{ xs: 'column', sm: 'row' }} 
          spacing={2} 
          alignItems={{ xs: 'center', sm: 'flex-start' }}
          sx={{ mb: 3 }}
        >
          <Avatar
            src={mounted ? `${profile.profilePicture}?t=${Date.now()}` : profile.profilePicture}
            alt={profile.displayName || profile.username}
            sx={{ 
              width: { xs: 100, sm: 80 }, 
              height: { xs: 100, sm: 80 },
              borderRadius: '50%', 
              border: '3px solid',
              borderColor: 'primary.light'
            }}
          />
          
          <Box sx={{ textAlign: { xs: 'center', sm: 'left' }, flexGrow: 1 }}>
            <Typography variant="h5" fontWeight="bold" gutterBottom>
              {profile.displayName || profile.username}
            </Typography>
            
            <Typography color="text.secondary" gutterBottom>
              {profile.email}
            </Typography>
            
            <Box sx={{ display: 'flex', mt: 1, flexWrap: 'wrap', justifyContent: { xs: 'center', sm: 'flex-start' }, gap: 1 }}>
              {profile.openForCommissions && (
                <Chip 
                  label="Open for Commissions" 
                  color="success" 
                  size="small"
                  sx={{ fontWeight: 500 }}
                />
              )}
              
              {profile.tags && profile.tags.slice(0, 3).map(tag => (
                <Chip 
                  key={tag} 
                  label={tag} 
                  size="small" 
                  sx={{ 
                    bgcolor: 'primary.light', 
                    color: 'primary.contrastText'
                  }} 
                />
              ))}
              
              {profile.tags && profile.tags.length > 3 && (
                <Chip 
                  label={`+${profile.tags.length - 3} more`} 
                  size="small" 
                  variant="outlined"
                />
              )}
            </Box>
          </Box>
          
          <KButton 
            onClick={() => open('editProfile')}
            variantType="ghost"
            sx={{ 
              alignSelf: { xs: 'center', sm: 'flex-start' },
              px: 2
            }}
            startIcon={<EditIcon />}
          >
            Edit
          </KButton>
        </Stack>

        <Grid container spacing={3}>
          {/* Saldo card */}
          <Grid item xs={12} sm={6}>
            <Paper 
              variant="outlined" 
              sx={{ 
                p: 2,
                borderRadius: 2,
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}
            >
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Saldo KOMIS
              </Typography>
              
              <Typography variant="h5" fontWeight="bold" sx={{ mb: 2 }}>
                Rp{formattedSaldo}
              </Typography>
              
              <Button 
                variant="text" 
                size="small"
                sx={{ alignSelf: 'flex-end', textTransform: 'none' }}
              >
                View History
              </Button>
            </Paper>
          </Grid>

          {/* Stats card */}
          <Grid item xs={12} sm={6}>
            <Paper 
              variant="outlined" 
              sx={{ 
                p: 2,
                borderRadius: 2,
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}
            >
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Commission Stats
              </Typography>
              
              <Typography variant="body2" sx={{ mb: 2 }}>
                0 active commissions
              </Typography>
              
              <Button 
                variant="text" 
                size="small"
                startIcon={<DashboardIcon fontSize="small" />}
                sx={{ alignSelf: 'flex-end', textTransform: 'none' }}
              >
                View Dashboard
              </Button>
            </Paper>
          </Grid>
        </Grid>
      </Paper>

      {/* TOS Card */}
      <TosCard username={profile.username} />

      {/* Quick actions */}
      <Paper elevation={0} sx={{ 
        p: { xs: 2, sm: 3 },
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider'
      }}>
        <Typography variant="h6" fontWeight="bold" gutterBottom>
          Quick Actions
        </Typography>
        
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12} sm={6} md={4}>
            <KButton
              fullWidth
              sx={{ py: 1.5 }}
              startIcon={<AddIcon />}
              onClick={() => open('createCommission')}
            >
              Create Commission
            </KButton>
          </Grid>
          
          <Grid item xs={12} sm={6} md={4}>
            <KButton
              fullWidth
              variantType="secondary"
              sx={{ py: 1.5 }}
              startIcon={<AddIcon />}
              onClick={() => open('uploadArtwork')}
            >
              Upload Artwork
            </KButton>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
}
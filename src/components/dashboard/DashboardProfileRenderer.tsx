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
  Divider,
  IconButton,
  Link,
  Tooltip
} from '@mui/material';
import { KButton } from '../KButton';
import { useUserDialogStore } from '@/lib/stores/userDialogStore';
import { useState, useEffect } from 'react';
import {
  Edit as EditIcon,
  Add as AddIcon,
  Description as DescriptionIcon,
  Language as LanguageIcon,
  Instagram as InstagramIcon,
  Twitter as TwitterIcon,
  Facebook as FacebookIcon,
  LinkedIn as LinkedInIcon,
  GitHub as GitHubIcon,
  Link as LinkIcon,
  CalendarMonth as CalendarIcon,
  Brush as BrushIcon,
  AttachMoney as MoneyIcon,
  WorkspacePremium as PremiumIcon
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';

interface Props {
  profile: {
    displayName?: string;
    username: string;
    email: string;
    profilePicture: string;
    openForCommissions?: boolean;
    socials?: Array<{label: string; url: string}>;
    tags?: string[];
    bio?: string;
    createdAt?: string;
    completedOrders?: number;
    rating?: { avg: number; count: number };
    defaultCurrency?: string;
  };
  saldo: number;
  tosSummary: string;
}

// Helper function to get social icon by platform
const getSocialIcon = (platform: string) => {
  switch (platform.toLowerCase()) {
    case 'instagram':
      return <InstagramIcon fontSize="small" />;
    case 'twitter':
    case 'x':
      return <TwitterIcon fontSize="small" />;
    case 'facebook':
      return <FacebookIcon fontSize="small" />;
    case 'linkedin':
      return <LinkedInIcon fontSize="small" />;
    case 'github':
      return <GitHubIcon fontSize="small" />;
    case 'website':
      return <LanguageIcon fontSize="small" />;
    default:
      return <LinkIcon fontSize="small" />;
  }
};

// Format date
const formatDate = (dateString?: string) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

export default function DashboardProfileRenderer({ profile, saldo, tosSummary }: Props) {
  const { open } = useUserDialogStore();
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  
  // This prevents hydration mismatch with timestamps
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Format balance with proper thousands separator
  const formattedSaldo = saldo.toLocaleString('id-ID');
  
  return (
    <Box sx={{ width: '100%' }}>
      {/* Profile Overview Card */}
      <Paper 
        elevation={0} 
        sx={{ 
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'divider',
          mb: 3,
          overflow: 'hidden'
        }}
      >
        {/* Header with profile pic and basic info */}
        <Box sx={{ 
          position: 'relative', 
          bgcolor: 'primary.lighter',
          p: { xs: 2, sm: 3 }
        }}>
          <Stack 
            direction={{ xs: 'column', sm: 'row' }} 
            spacing={3} 
            alignItems={{ xs: 'center', sm: 'flex-start' }}
          >
            <Avatar
              src={mounted ? `${profile.profilePicture}?t=${Date.now()}` : profile.profilePicture}
              alt={profile.displayName || profile.username}
              sx={{ 
                width: { xs: 100, sm: 120 }, 
                height: { xs: 100, sm: 120 },
                border: '4px solid white',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
              }}
            />
            
            <Box sx={{ flexGrow: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Typography variant="h4" fontWeight="bold" gutterBottom>
                    {profile.displayName || profile.username}
                  </Typography>
                  
                  <Typography variant="body1" sx={{ mb: 1 }}>
                    @{profile.username}
                  </Typography>
                </Box>
                
                <KButton 
                  onClick={() => open('editProfile')}
                  variant="contained"
                  sx={{ 
                    px: 3,
                    boxShadow: 2,
                    display: { xs: 'none', sm: 'flex' }
                  }}
                  startIcon={<EditIcon />}
                >
                  Edit Profile
                </KButton>
              </Box>
              
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', my: 1 }}>
                {profile.openForCommissions && (
                  <Chip 
                    label="Open for Commissions" 
                    color="success" 
                    sx={{ fontWeight: 500 }}
                  />
                )}
                
                {profile.defaultCurrency && (
                  <Chip 
                    icon={<MoneyIcon />} 
                    label={`${profile.defaultCurrency} Currency`} 
                    variant="outlined"
                    sx={{ bgcolor: 'rgba(255,255,255,0.7)' }}
                  />
                )}
              </Box>
              
              {/* Mobile edit button */}
              <Box sx={{ mt: 2, display: { xs: 'block', sm: 'none' } }}>
                <KButton 
                  onClick={() => open('editProfile')}
                  variant="contained"
                  fullWidth
                  startIcon={<EditIcon />}
                >
                  Edit Profile
                </KButton>
              </Box>
            </Box>
          </Stack>
        </Box>
        
        {/* Bio section */}
        {profile.bio && (
          <Box sx={{ p: { xs: 2, sm: 3 }, borderBottom: '1px solid', borderColor: 'divider' }}>
            <Typography variant="body1" sx={{ whiteSpace: 'pre-line' }}>
              {profile.bio}
            </Typography>
          </Box>
        )}
        
        {/* Stats section */}
        <Grid container sx={{ p: { xs: 2, sm: 3 } }}>
          {/* Join date */}
          <Grid item xs={6} sm={3}>
            <Box sx={{ textAlign: 'center', p: 1 }}>
              <CalendarIcon color="primary" sx={{ mb: 1 }} />
              <Typography variant="subtitle2" fontWeight="bold">
                Member Since
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {formatDate(profile.createdAt)}
              </Typography>
            </Box>
          </Grid>
          
          {/* Completed orders */}
          <Grid item xs={6} sm={3}>
            <Box sx={{ textAlign: 'center', p: 1 }}>
              <BrushIcon color="primary" sx={{ mb: 1 }} />
              <Typography variant="subtitle2" fontWeight="bold">
                Completed Orders
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {profile.completedOrders || 0}
              </Typography>
            </Box>
          </Grid>
          
          {/* Rating */}
          <Grid item xs={6} sm={3}>
            <Box sx={{ textAlign: 'center', p: 1 }}>
              <PremiumIcon color="primary" sx={{ mb: 1 }} />
              <Typography variant="subtitle2" fontWeight="bold">
                Rating
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {profile.rating?.avg ? `${profile.rating.avg.toFixed(1)} / 5 (${profile.rating.count})` : 'No ratings yet'}
              </Typography>
            </Box>
          </Grid>
          
          {/* Wallet balance */}
          <Grid item xs={6} sm={3}>
            <Box sx={{ textAlign: 'center', p: 1 }}>
              <MoneyIcon color="primary" sx={{ mb: 1 }} />
              <Typography variant="subtitle2" fontWeight="bold">
                Wallet Balance
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Rp {formattedSaldo}
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>
      
      {/* Social Links & Tags */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* Social Links */}
        <Grid item xs={12} md={6}>
          <Paper 
            elevation={0} 
            sx={{ 
              p: { xs: 2, sm: 3 },
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'divider',
              height: '100%'
            }}
          >
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Social Links
            </Typography>
            
            {profile.socials && profile.socials.length > 0 ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 2 }}>
                {profile.socials.map((social, index) => (
                  <Link 
                    key={index}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    underline="none"
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      p: 1.5,
                      borderRadius: 1,
                      bgcolor: 'action.hover',
                      transition: 'all 0.2s',
                      color: 'text.primary',
                      '&:hover': {
                        bgcolor: 'primary.lighter',
                        transform: 'translateY(-2px)'
                      }
                    }}
                  >
                    <Box sx={{ 
                      mr: 2, 
                      p: 1, 
                      borderRadius: '50%',
                      bgcolor: 'primary.main',
                      color: 'white',
                      display: 'flex'
                    }}>
                      {getSocialIcon(social.label)}
                    </Box>
                    <Typography variant="body2">
                      {social.label}
                    </Typography>
                  </Link>
                ))}
              </Box>
            ) : (
              <Box 
                sx={{ 
                  p: 3,
                  bgcolor: 'background.default',
                  borderRadius: 1,
                  textAlign: 'center'
                }}
              >
                <Typography variant="body2" color="text.secondary">
                  No social links added yet
                </Typography>
                <Button 
                  onClick={() => open('editProfile')}
                  variant="text"
                  sx={{ mt: 1 }}
                  startIcon={<AddIcon />}
                >
                  Add Social Links
                </Button>
              </Box>
            )}
          </Paper>
        </Grid>
        
        {/* Tags */}
        <Grid item xs={12} md={6}>
          <Paper 
            elevation={0} 
            sx={{ 
              p: { xs: 2, sm: 3 },
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'divider',
              height: '100%'
            }}
          >
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Artist Tags
            </Typography>
            
            {profile.tags && profile.tags.length > 0 ? (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 2 }}>
                {profile.tags.map(tag => (
                  <Chip 
                    key={tag} 
                    label={tag} 
                    sx={{ 
                      bgcolor: 'primary.lighter',
                      color: 'primary.dark',
                      fontWeight: 500,
                      px: 1,
                      '&:hover': {
                        bgcolor: 'primary.light',
                        color: 'primary.contrastText'
                      }
                    }}
                  />
                ))}
              </Box>
            ) : (
              <Box 
                sx={{ 
                  p: 3,
                  bgcolor: 'background.default',
                  borderRadius: 1,
                  textAlign: 'center'
                }}
              >
                <Typography variant="body2" color="text.secondary">
                  No tags added yet
                </Typography>
                <Button 
                  onClick={() => open('editProfile')}
                  variant="text"
                  sx={{ mt: 1 }}
                  startIcon={<AddIcon />}
                >
                  Add Tags
                </Button>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
      
      {/* Quick Actions */}
      <Paper 
        elevation={0} 
        sx={{ 
          p: { xs: 2, sm: 3 },
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'divider'
        }}
      >
        <Typography variant="h6" fontWeight="bold" gutterBottom>
          Quick Actions
        </Typography>
        
        <Divider sx={{ mb: 3 }} />
        
        <Grid container spacing={2}>
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
          
          <Grid item xs={12} sm={6} md={4}>
            <KButton
              fullWidth
              variantType="ghost"
              sx={{ py: 1.5 }}
              startIcon={<DescriptionIcon />}
              onClick={() => router.push(`/${profile.username}/dashboard/tos`)}
            >
              Manage TOS Templates
            </KButton>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
}
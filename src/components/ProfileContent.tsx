// src/components/ProfileContent.tsx
'use client';

import { Box, Typography, Avatar, Stack, Container, Tab, Tabs, useMediaQuery, useTheme, IconButton, Tooltip, Chip, Paper } from '@mui/material';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { KButton } from '@/components/KButton';
import GallerySection from '@/components/profile/GallerySection';
import CommissionSection from '@/components/profile/CommissionSection';
import GalleryPostDialog from '@/components/profile/dialogs/GalleryPostDialog';
import CommissionDialog from '@/components/profile/dialogs/CommissionDialog';
import UploadArtDialog from '@/components/profile/dialogs/UploadArtDialog';
import { useUserDialogStore } from '@/lib/stores/userDialogStore';
import { useAuthDialogStore } from '@/lib/stores/authDialogStore';
import { BookmarkBorder as BookmarkIcon, Message as MessageIcon } from '@mui/icons-material';

interface ProfileContentProps {
  profile: any;
  isOwner: boolean;
}

export default function ProfileContent({ profile, isOwner }: ProfileContentProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const router = useRouter();
  const { open } = useUserDialogStore();
  const { open: openAuthDialog } = useAuthDialogStore();
  const [activeTab, setActiveTab] = useState(0);
  
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };
  
  const handleEditProfile = () => {
    open('editProfile');
  };
  
  const handleOpenDashboard = () => {
    router.push(`/${profile.username}/dashboard`);
  };
  
  const handleMessageCreator = () => {
    // Check if user is logged in (mock for now)
    const isLoggedIn = true; // Replace with actual auth check
    
    if (isLoggedIn) {
      router.push('/dashboard/chat');
    } else {
      openAuthDialog('login');
    }
  };

  return (
    <>
      {/* Banner */}
      <Box
        sx={{
          width: "100%",
          height: 200,
          backgroundImage: `url(${profile.banner || "/default-banner.jpg"}?t=${Date.now()})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          borderRadius: { xs: 0, sm: 2 },
          position: 'relative',
        }}
      />
      
      {/* Profile Info Section */}
      <Container maxWidth="lg" sx={{ px: { xs: 2, sm: 3 } }}>
        <Box sx={{ position: 'relative', mb: 5 }}>
          {/* Profile Picture */}
          <Avatar
            src={`${profile.profilePicture || "/default-profile.png"}?t=${Date.now()}`}
            alt={profile.username}
            sx={{ 
              width: { xs: 80, sm: 100 }, 
              height: { xs: 80, sm: 100 }, 
              border: '4px solid white',
              position: 'absolute',
              top: -50,
              left: { xs: 16, sm: 24 },
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
            }}
          />
          
          {/* Owner/Visitor actions */}
          <Box sx={{ 
            display: 'flex',
            justifyContent: 'flex-end',
            mt: 1,
            mb: 2
          }}>
            {isOwner ? (
              <Stack direction="row" spacing={1}>
                <KButton
                  variantType="ghost"
                  onClick={handleEditProfile}
                  size="small"
                >
                  Edit Profile
                </KButton>
                <KButton
                  size="small"
                  onClick={handleOpenDashboard}
                >
                  Open Dashboard
                </KButton>
              </Stack>
            ) : (
              <Stack direction="row" spacing={1}>
                <Tooltip title="Bookmark Creator">
                  <IconButton size="small" sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                    <BookmarkIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <KButton
                  startIcon={<MessageIcon />}
                  onClick={handleMessageCreator}
                  size="small"
                >
                  Message Creator
                </KButton>
              </Stack>
            )}
          </Box>
          
          {/* User Info */}
          <Box sx={{ 
            mt: 3, 
            ml: { xs: 0, sm: 16 },
            pt: { xs: 1, sm: 0 }
          }}>
            <Typography variant="h5" fontWeight="bold">
              {profile.displayName || profile.username}
            </Typography>
            
            <Typography variant="body2" color="text.secondary">
              @{profile.username}
            </Typography>
            
            {/* User tags */}
            {profile.tags && profile.tags.length > 0 && (
              <Stack 
                direction="row" 
                spacing={0.5} 
                sx={{ 
                  mt: 1.5,
                  flexWrap: 'wrap',
                  gap: 0.5
                }}
              >
                {profile.tags.map((tag: string) => (
                  <Chip 
                    key={tag}
                    label={tag}
                    size="small"
                    sx={{ 
                      borderRadius: 1,
                      fontSize: '0.7rem',
                      height: 24
                    }}
                  />
                ))}
              </Stack>
            )}
            
            {/* Bio */}
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5, maxWidth: 600 }}>
              {profile.bio || "No bio yet."}
            </Typography>
            
            {/* Commission Status Badge */}
            {profile.openForCommissions && (
              <Box
                sx={{
                  mt: 2,
                  display: 'inline-flex',
                  alignItems: 'center',
                  px: 1.5,
                  py: 0.5,
                  bgcolor: 'success.lighter',
                  color: 'success.dark',
                  borderRadius: 1,
                  fontSize: '0.75rem',
                  fontWeight: 'medium',
                }}
              >
                Open for Commissions
              </Box>
            )}
          </Box>
        </Box>
        
        <Box sx={{ mb: 5 }}>
          {/* About section (visible on left side on desktop) */}
          {!isMobile && (
            <Box 
              sx={{ 
                display: 'flex',
                gap: 4
              }}
            >
              {/* Left sidebar */}
              <Box sx={{ width: 240, flexShrink: 0 }}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 2.5,
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: 'divider',
                  }}
                >
                  <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                    About
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    {profile.bio || "No bio yet."}
                  </Typography>
                  
                  <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                    Socials
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                    {profile.socials?.length > 0 ? (
                      profile.socials.map((social: any, index: number) => (
                        <Tooltip key={index} title={social.label}>
                          <IconButton 
                            size="small" 
                            sx={{ 
                              bgcolor: 'action.hover',
                              '&:hover': { bgcolor: 'action.selected' }
                            }}
                          >
                            {/* Placeholder for social icon */}
                            <Box 
                              sx={{ 
                                width: 24, 
                                height: 24, 
                                borderRadius: '50%', 
                                bgcolor: 'text.secondary' 
                              }} 
                            />
                          </IconButton>
                        </Tooltip>
                      ))
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        No social links added
                      </Typography>
                    )}
                  </Box>
                  
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {profile.tags?.map((tag: string) => (
                      <Chip 
                        key={tag}
                        label={tag}
                        size="small"
                        sx={{ 
                          fontSize: '0.7rem',
                          height: 24
                        }}
                      />
                    ))}
                  </Box>
                </Paper>
              </Box>
              
              {/* Main content */}
              <Box sx={{ flex: 1 }}>
                {/* Tabs Navigation */}
                <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                  <Tabs 
                    value={activeTab} 
                    onChange={handleTabChange}
                    textColor="primary"
                    indicatorColor="primary"
                  >
                    <Tab label="Commission" />
                    <Tab label="Gallery" />
                  </Tabs>
                </Box>
                
                {/* Tab Content */}
                <Box>
                  {activeTab === 0 && (
                    <CommissionSection username={profile.username} isOwner={isOwner} />
                  )}
                  {activeTab === 1 && (
                    <GallerySection username={profile.username} isOwner={isOwner} />
                  )}
                </Box>
              </Box>
            </Box>
          )}
          
          {/* Mobile layout - tabs only */}
          {isMobile && (
            <>
              {/* Tabs Navigation */}
              <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                <Tabs 
                  value={activeTab} 
                  onChange={handleTabChange}
                  variant="fullWidth"
                  textColor="primary"
                  indicatorColor="primary"
                >
                  <Tab label="Commission" />
                  <Tab label="Gallery" />
                </Tabs>
              </Box>
              
              {/* Tab Content */}
              <Box>
                {activeTab === 0 && (
                  <CommissionSection username={profile.username} isOwner={isOwner} />
                )}
                {activeTab === 1 && (
                  <GallerySection username={profile.username} isOwner={isOwner} />
                )}
              </Box>
            </>
          )}
        </Box>
      </Container>
      
      {/* Dialogs */}
      <GalleryPostDialog />
      <CommissionDialog isOwner={isOwner} />
      {isOwner && <UploadArtDialog />}
    </>
  );
}
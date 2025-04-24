// src/components/dashboard/DashboardSidebar.tsx
'use client';

import Link from 'next/link';
import { 
  Avatar, 
  Box, 
  List, 
  ListItemButton, 
  ListItemIcon, 
  ListItemText, 
  Typography, 
  Paper,
  Collapse,
  IconButton,
  Divider
} from '@mui/material';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { 
  Person as ProfileIcon,
  Chat as ChatIcon,
  Brush as CommissionIcon,
  Photo as GalleryIcon,
  Description as ProposalIcon,
  GavelRounded as ContractIcon,
  SupportAgent as ResolutionIcon,
  ExpandMore as ExpandMoreIcon,
  ChevronRight as ChevronRightIcon
} from '@mui/icons-material';
import { useDashboardStore } from '@/lib/stores/dashboardStore';

interface Props {
  username: string;
  profilePicture: string;
  displayName?: string;
  expanded: boolean;
}

// Navigation links with icons for better UX
const links = [
  { 
    label: 'Profil', 
    href: (username: string) => `/${username}/dashboard`,
    icon: <ProfileIcon fontSize="small" />
  },
  { 
    label: 'Chat', 
    href: (username: string) => `/${username}/dashboard/chat`,
    icon: <ChatIcon fontSize="small" />
  },
  { 
    label: 'Komisi', 
    href: (username: string) => `/${username}/dashboard/commissions`,
    icon: <CommissionIcon fontSize="small" />
  },
  { 
    label: 'Galeri', 
    href: (username: string) => `/${username}/dashboard/galleries`,
    icon: <GalleryIcon fontSize="small" />
  },
  { 
    label: 'Proposal', 
    href: (username: string) => `/${username}/dashboard/proposals`,
    icon: <ProposalIcon fontSize="small" />
  },
  { 
    label: 'Kontrak', 
    href: (username: string) => `/${username}/dashboard/contracts`,
    icon: <ContractIcon fontSize="small" />
  },
  { 
    label: 'Resolution', 
    href: (username: string) => `/${username}/dashboard/resolution`,
    icon: <ResolutionIcon fontSize="small" />
  },
];

export default function DashboardSidebar({ 
  username, 
  profilePicture, 
  displayName,
  expanded 
}: Props) {
  const pathname = usePathname();
  const [isExpanded, setIsExpanded] = useState(expanded);
  
  // Toggle expanded state on mobile
  const { toggleSidebar } = useDashboardStore();
  
  const toggleExpanded = () => {
    toggleSidebar();
    setIsExpanded(prev => !prev);
  };
  
  return (
    <Paper 
      elevation={0} 
      sx={{ 
        borderRadius: 2,
        overflow: 'hidden',
        border: '1px solid',
        borderColor: 'divider',
        height: '100%'
      }}
    >
      {/* Header card - Avatar + name */}
      <Box
        sx={{
          p: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: { xs: 'space-between', md: 'center' },
          textAlign: { xs: 'left', md: 'center' },
          bgcolor: 'background.paper',
          borderBottom: '1px solid',
          borderColor: 'divider'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Avatar
            src={profilePicture}
            alt={username}
            sx={{ 
              width: 40, 
              height: 40,
              mr: { xs: 2, md: isExpanded ? 2 : 0 }
            }}
          />
          
          {/* Show name only when expanded */}
          {isExpanded && (
            <Typography 
              fontWeight="bold"
              variant="body1"
              noWrap
              sx={{ 
                maxWidth: 150,
                display: { xs: 'block', md: 'block' }
              }}
            >
              {displayName || username}
            </Typography>
          )}
        </Box>
        
        {/* Only show toggle on xs and sm screens */}
        <Box sx={{ display: { xs: 'block', md: 'none' } }}>
          <IconButton onClick={toggleExpanded} size="small">
            {isExpanded ? <ExpandMoreIcon /> : <ChevronRightIcon />}
          </IconButton>
        </Box>
      </Box>

      {/* Navigation - conditionally collapsed on mobile */}
      <Collapse in={isExpanded} sx={{ display: { md: 'block' } }}>
        <Box sx={{ p: 1 }}>
          <List disablePadding>
            {links.map(link => {
              const href = link.href(username);
              const active = pathname === href;
              
              return (
                <Link 
                  key={href} 
                  href={href} 
                  passHref 
                  style={{ textDecoration: 'none', color: 'inherit' }}
                >
                  <ListItemButton
                    selected={active}
                    sx={{
                      borderRadius: 1,
                      mb: 0.5,
                      color: active ? 'primary.main' : 'text.primary',
                      '&.Mui-selected': {
                        bgcolor: 'primary.lighter',
                        '&:hover': {
                          bgcolor: 'primary.light',
                        },
                      },
                    }}
                  >
                    <ListItemIcon 
                      sx={{ 
                        minWidth: 36,
                        color: active ? 'primary.main' : 'inherit'
                      }}
                    >
                      {link.icon}
                    </ListItemIcon>
                    <ListItemText 
                      primary={link.label}
                      primaryTypographyProps={{
                        fontSize: 14,
                        fontWeight: active ? 600 : 400
                      }}
                    />
                  </ListItemButton>
                </Link>
              );
            })}
          </List>
        </Box>
        
        <Divider sx={{ mt: 2 }} />
        
        {/* Help section */}
        <Box sx={{ p: 2, textAlign: 'center' }}>
          <Typography variant="caption" color="text.secondary">
            Need help with Komis?
          </Typography>
          <Typography 
            variant="body2" 
            color="primary" 
            sx={{ 
              cursor: 'pointer',
              fontWeight: 500,
              '&:hover': { textDecoration: 'underline' } 
            }}
          >
            View Help Center
          </Typography>
        </Box>
      </Collapse>
    </Paper>
  );
}
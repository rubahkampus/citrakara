// src/components/profile/CommissionCard.tsx
'use client';

import { Box, Typography, Grid, useTheme, Button, Avatar } from '@mui/material';
import Image from 'next/image';
import { CommissionData } from '@/lib/stores/profilePageStore';
import { KButton } from '@/components/KButton';

interface CommissionCardProps {
  commission: CommissionData;
  onClick: () => void;
  isOwner: boolean;
}

export default function CommissionCard({ commission, onClick, isOwner }: CommissionCardProps) {
  const theme = useTheme();
  
  // Check if slots are available
  const slotsAvailable = commission.slots === -1 || commission.slotsUsed < commission.slots;
  
  // Format price range
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID').format(price);
  };
  
  const priceDisplay = `${commission.currency}${formatPrice(commission.price.min)}${
    commission.price.min !== commission.price.max ? ` - ${formatPrice(commission.price.max)}` : ''
  }`;
  
  return (
    <Box 
      onClick={onClick}
      sx={{
        cursor: 'pointer',
        mb: 2,
        transition: 'transform 0.15s, box-shadow 0.15s',
        '&:hover': {
          transform: 'translateY(-2px)',
        },
      }}
    >
      <Grid container spacing={0}>
        {/* Left image section */}
        <Grid item xs={12} sm={4} md={3}>
          <Box 
            sx={{ 
              position: 'relative',
              height: { xs: 200, sm: 150 },
              width: '100%',
              bgcolor: theme.palette.divider,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
            }}
          >
            {commission.thumbnail ? (
              <Image
                src={commission.thumbnail}
                alt={commission.title}
                layout="fill"
                objectFit="cover"
                unoptimized={true}
              />
            ) : (
              <Typography color="text.secondary">No Image</Typography>
            )}
          </Box>
        </Grid>
        
        {/* Right content section */}
        <Grid item xs={12} sm={8} md={9}>
          <Box sx={{ 
            p: 2, 
            height: '100%',
            bgcolor: 'background.paper',
            display: 'flex',
            flexDirection: 'column',
          }}>
            {/* Title */}
            <Typography 
              variant="h6" 
              component="h2" 
              fontWeight="medium"
              sx={{ mb: 1 }}
            >
              {commission.title}
            </Typography>
            
            {/* Description */}
            <Typography 
              variant="body2" 
              color="text.secondary"
              sx={{ 
                mb: 2,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {commission.description}
            </Typography>
            
            {/* Bottom row with price and actions */}
            <Box 
              sx={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                alignItems: 'center',
                mt: 'auto',
              }}
            >
              {/* Price */}
              <Typography 
                variant="h6" 
                fontWeight="medium" 
                color="text.primary"
              >
                {priceDisplay}
              </Typography>
              
              {/* Actions */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {/* Additional avatar for chat */}
                {!isOwner && (
                  <Avatar 
                    sx={{ 
                      width: 32, 
                      height: 32,
                      cursor: 'pointer'
                    }}
                  />
                )}
                
                {/* Send Request button */}
                {!isOwner && (
                  <KButton 
                    size="small"
                    variant="contained"
                    disabled={!slotsAvailable}
                    sx={{ 
                      minWidth: 110,
                      fontSize: '0.875rem',
                    }}
                  >
                    {slotsAvailable ? 'Send Request' : 'Slot Unavailable'}
                  </KButton>
                )}
              </Box>
            </Box>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
}
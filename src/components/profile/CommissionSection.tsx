// src/components/profile/CommissionSection.tsx
'use client';

import { useState, useEffect } from 'react';
import { Box, Typography, Grid, Skeleton } from '@mui/material';
import { useRouter } from 'next/navigation';
import { KButton } from '@/components/KButton';
import CommissionCard from './CommissionCard';
import { CommissionData, useProfilePageStore } from '@/lib/stores/profilePageStore';
import { axiosClient } from '@/lib/utils/axiosClient';

// Mock data
const mockCommissions: CommissionData[] = [
  {
    id: 'c1',
    title: 'A Very, Very, Long Text for Reference Furry Commission 1',
    description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus blandit nisi arcu, nec fringilla odio molestie tincidunt. Pellentesque id rutrum velit, non fermentum urna. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus blandit nisi arcu, nec fringilla odio molestie tincidunt. Pellentesque id rutrum velit, non fermentum urna. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus blandit nisi arcu, nec fringilla odio molestie tincidunt. Pellentesque id rutrum velit, non fermentum urna.',
    price: { min: 999999999, max: 999999999 },
    currency: 'Rp',
    thumbnail: '/placeholders/comm1.jpg',
    isActive: true,
    slots: 5,
    slotsUsed: 2
  },
  {
    id: 'c2',
    title: 'A Very, Very, Long Text for Reference Furry Commission 2',
    description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus blandit nisi arcu, nec fringilla odio molestie tincidunt. Pellentesque id rutrum velit, non fermentum urna.',
    price: { min: 999999999, max: 999999999 },
    currency: 'Rp',
    thumbnail: '/placeholders/comm2.jpg',
    isActive: true,
    slots: 3,
    slotsUsed: 3
  }
];

interface CommissionSectionProps {
  username: string;
  isOwner: boolean;
}

export default function CommissionSection({ username, isOwner }: CommissionSectionProps) {
  const router = useRouter();
  const { openCommissionDialog } = useProfilePageStore();
  const [commissions, setCommissions] = useState<CommissionData[]>([]);
  const [loading, setLoading] = useState(true);
  
  // For real data, uncomment this and comment out the useEffect below
  /*
  useEffect(() => {
    const fetchCommissions = async () => {
      try {
        setLoading(true);
        const response = await axiosClient.get(`/api/commission/user/${username}`);
        setCommissions(response.data.listings);
      } catch (error) {
        console.error('Error fetching commissions:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchCommissions();
  }, [username]);
  */
  
  // Mock data loading - replace with real API calls
  useEffect(() => {
    setLoading(true);
    // Simulate API request
    setTimeout(() => {
      setCommissions(mockCommissions);
      setLoading(false);
    }, 300);
  }, []);
  
  const navigateToCreateCommission = () => {
    router.push(`/${username}/dashboard/commissions/create`);
  };
  
  const navigateToManageCommissions = () => {
    router.push(`/${username}/dashboard/commissions`);
  };
  
  const handleCommissionClick = (commissionId: string) => {
    openCommissionDialog(commissionId);
  };
  
  return (
    <Box>
      {/* Action Buttons */}
      {isOwner && (
        <Box sx={{ 
          display: 'flex', 
          gap: 2, 
          mb: 2, 
          justifyContent: 'flex-start',
        }}>
          <KButton 
            variant="contained"
            color="primary" 
            onClick={navigateToCreateCommission}
            sx={{ px: 2, py: 1 }}
          >
            Create New Commission
          </KButton>
          <KButton 
            variantType="ghost"
            onClick={navigateToManageCommissions}
            sx={{ px: 2, py: 1 }}
          >
            Manage Commissions
          </KButton>
        </Box>
      )}

      {/* Commission Cards */}
      {loading ? (
        <Box>
          {Array.from(new Array(2)).map((_, index) => (
            <Skeleton 
              key={index}
              variant="rectangular" 
              height={140} 
              sx={{ mb: 2, borderRadius: 1 }} 
            />
          ))}
        </Box>
      ) : commissions.length === 0 ? (
        <Box 
          sx={{ 
            height: 150, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            bgcolor: 'background.paper',
            borderRadius: 1,
            border: '1px dashed',
            borderColor: 'divider',
          }}
        >
          <Typography variant="body1" color="text.secondary">
            No commissions available
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={0}>
          {commissions.map((commission) => (
            <Grid item xs={12} key={commission.id}>
              <CommissionCard 
                commission={commission} 
                onClick={() => handleCommissionClick(commission.id)}
                isOwner={isOwner}
              />
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
}
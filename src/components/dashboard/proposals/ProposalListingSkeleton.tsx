// src/components/dashboard/proposals/ProposalListingSkeleton.tsx
/**
 * `ProposalListingSkeleton` provides a loading placeholder
 * while the list is being fetched.
 *
 * Should visually approximate the shape of ProposalListingItem cards,
 * using MUI Skeleton components.
 */
import React from 'react';
import { Box, Grid, Skeleton } from '@mui/material';

export default function ProposalListingSkeleton() {
  return (
    <Grid container spacing={2}>
      {[1,2,3,4].map((i) => (
        <Grid item xs={12} sm={6} md={4} key={i}>
          <Box sx={{ p: 2, border: '1px solid #e0e0e0', borderRadius: 2 }}>
            <Skeleton variant="text" width="60%" height={30} sx={{ mb: 1 }} />
            <Skeleton variant="rectangular" height={20} width="40%" sx={{ mb: 1 }} />
            <Skeleton variant="rectangular" height={100} sx={{ mb: 1 }} />
            <Skeleton variant="text" width="30%" />
          </Box>
        </Grid>
      ))}
    </Grid>
  );
}

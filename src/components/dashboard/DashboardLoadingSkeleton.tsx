// src/components/dashboard/DashboardLoadingSkeleton.tsx
import { Box, Skeleton, Paper, Grid } from '@mui/material';

/**
 * Loading skeleton for dashboard content
 * Used as a suspense fallback in dashboard layout
 */
export default function DashboardLoadingSkeleton() {
  return (
    <Box sx={{ width: '100%' }}>
      {/* Profile card skeleton */}
      <Paper 
        elevation={0}
        sx={{ 
          p: 3, 
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'divider',
          mb: 3
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <Skeleton variant="circular" width={80} height={80} />
          <Box sx={{ flex: 1 }}>
            <Skeleton variant="text" width="60%" height={36} />
            <Skeleton variant="text" width="40%" height={24} />
          </Box>
          <Skeleton variant="rectangular" width={100} height={40} sx={{ borderRadius: 1 }} />
        </Box>
        
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <Skeleton variant="rectangular" height={120} sx={{ borderRadius: 2 }} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <Skeleton variant="rectangular" height={120} sx={{ borderRadius: 2 }} />
          </Grid>
        </Grid>
      </Paper>
      
      {/* Quick actions skeleton */}
      <Paper 
        elevation={0}
        sx={{ 
          p: 3, 
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'divider'
        }}
      >
        <Skeleton variant="text" width="30%" height={32} sx={{ mb: 2 }} />
        
        <Grid container spacing={2}>
          {[1, 2, 3].map((item) => (
            <Grid item xs={12} sm={6} md={4} key={item}>
              <Skeleton variant="rectangular" height={50} sx={{ borderRadius: 1 }} />
            </Grid>
          ))}
        </Grid>
      </Paper>
    </Box>
  );
}
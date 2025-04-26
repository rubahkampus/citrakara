// src/app/[username]/dashboard/tos/page.tsx
import { Suspense } from 'react';
import { Box, Typography, Paper, Skeleton } from '@mui/material';
import TosManagement from '@/components/dashboard/tos/TosManagement';

function TosLoading() {
  return (
    <Box>
      <Skeleton variant="text" width="50%" height={40} sx={{ mb: 2 }} />
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Skeleton variant="text" width="30%" height={32} />
        <Skeleton variant="rectangular" width={120} height={40} sx={{ borderRadius: 1 }} />
      </Box>
      
      <Paper 
        elevation={0}
        sx={{
          borderRadius: 2,
          overflow: 'hidden',
          border: '1px solid',
          borderColor: 'divider'
        }}
      >
        {Array.from(new Array(3)).map((_, index) => (
          <Box key={index} sx={{ p: 2, borderBottom: index < 2 ? '1px solid' : 'none', borderColor: 'divider' }}>
            <Skeleton variant="text" width="60%" />
            <Skeleton variant="text" width="40%" />
          </Box>
        ))}
      </Paper>
    </Box>
  );
}

export default function TosDashboardPage() {
  return (
    <Suspense fallback={<TosLoading />}>
      <Box>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
          Create and manage your Terms of Service templates. These templates can be applied to your commission listings to set clear expectations with your clients.
        </Typography>
      
        <TosManagement />
      </Box>
    </Suspense>
  );
}
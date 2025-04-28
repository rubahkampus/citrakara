// src/components/dashboard/TosCard.tsx
'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Skeleton,
  Alert,
  Divider
} from '@mui/material';
import { 
  Description as DescriptionIcon,
  Edit as EditIcon,
  Visibility as VisibilityIcon
} from '@mui/icons-material';
import { axiosClient } from '@/lib/utils/axiosClient';
import { KButton } from '../KButton';
import TosDialog from './TosDialog';

interface TosCardProps {
  username: string;
}

export default function TosCard({ username }: TosCardProps) {
  const [tos, setTos] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'view' | 'edit'>('view');
  
  // Load the user's TOS entry
  const fetchTos = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axiosClient.get('/api/tos/default');
      setTos(response.data.tos);
    } catch (err: any) {
      // Don't show error for 404 (no TOS yet)
      if (err.response?.status !== 404) {
        setError('Failed to load Terms of Service');
      }
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchTos();
  }, []);
  
  // Dialog handlers
  const handleView = () => {
    setDialogMode('view');
    setDialogOpen(true);
  };
  
  const handleEdit = () => {
    setDialogMode('edit');
    setDialogOpen(true);
  };
  
  const handleDialogClose = () => {
    setDialogOpen(false);
    // Always refresh data when dialog closes to ensure we have the latest
    fetchTos();
  };
  
  const handleCreate = () => {
    setDialogMode('edit');
    setDialogOpen(true);
  };
  
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString();
    } catch (e) {
      return 'N/A';
    }
  };
  
  return (
    <Paper 
      elevation={0} 
      sx={{ 
        p: { xs: 2, sm: 3 },
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider',
        mb: 3
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <DescriptionIcon sx={{ mr: 1, color: 'primary.main' }} />
        <Typography variant="h6" fontWeight="bold">
          Terms of Service
        </Typography>
      </Box>
      
      <Divider sx={{ mb: 2 }} />
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      {loading ? (
        <Box sx={{ p: 2 }}>
          <Skeleton variant="text" width="60%" height={24} />
          <Skeleton variant="text" width="40%" height={20} />
        </Box>
      ) : tos ? (
        <Box>
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle1" fontWeight="medium">
              {tos.title}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {tos.content?.length || 0} sections • Last updated {formatDate(tos.updatedAt)}
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button 
              startIcon={<VisibilityIcon />}
              onClick={handleView}
              variant="outlined"
              size="small"
            >
              View
            </Button>
            <Button 
              startIcon={<EditIcon />}
              onClick={handleEdit}
              variant="contained"
              size="small"
            >
              Edit
            </Button>
          </Box>
        </Box>
      ) : (
        <Box sx={{ 
          p: 2, 
          textAlign: 'center',
          borderRadius: 1,
          bgcolor: 'background.default'
        }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            You haven't created a Terms of Service yet. Create one to use in your commissions.
          </Typography>
          <KButton 
            onClick={handleCreate} 
            sx={{ mt: 1 }}
          >
            Create TOS
          </KButton>
        </Box>
      )}
      
      {/* TOS Dialog */}
      <TosDialog
        open={dialogOpen}
        onClose={handleDialogClose}
        mode={dialogMode}
        tosId={tos?._id}
      />
    </Paper>
  );
}
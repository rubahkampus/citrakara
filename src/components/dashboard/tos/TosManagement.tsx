// src/components/dashboard/tos/TosManagement.tsx
'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  IconButton,
  Chip,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  CircularProgress,
  Alert,
  Tooltip,
  Skeleton
} from '@mui/material';
import { 
  Add as AddIcon, 
  Edit as EditIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import { KButton } from '@/components/KButton';
import { axiosClient } from '@/lib/utils/axiosClient';
import TosDialog from './TosDialog';
import { Refresh as RefreshIcon } from '@mui/icons-material';

interface TosSection {
  subtitle: string;
  text: string;
}

interface TosEntry {
  _id: string;
  title: string;
  content: TosSection[];
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function TosManagement() {
  // State for TOS entries
  const [tosEntries, setTosEntries] = useState<TosEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Dialog states
  const [viewTosId, setViewTosId] = useState<string | null>(null);
  const [editTosId, setEditTosId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [activeTosId, setActiveTosId] = useState<string | null>(null);
  
  // Load TOS entries
  const fetchTosEntries = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axiosClient.get('/api/tos');
      setTosEntries(response.data.tosEntries || []);
    } catch (err: any) {
      console.error('Error fetching TOS entries:', err);
      setError('Failed to load your Terms of Service entries');
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchTosEntries();
  }, []);
  
  // Action handlers
  const handleViewTos = (tosId: string) => {
    setViewTosId(tosId);
  };
  
  const handleEditTos = (tosId: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent triggering the parent click (view)
    setEditTosId(tosId);
  };
  
  const handleDeleteTos = (tosId: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent triggering the parent click (view)
    setActiveTosId(tosId);
    setDeleteDialogOpen(true);
  };
  
  const confirmDelete = async () => {
    if (!activeTosId) return;
    
    try {
      setDeleteLoading(true);
      setDeleteError(null);
      
      await axiosClient.delete(`/api/tos/${activeTosId}`);
      
      // Refresh the list
      await fetchTosEntries();
      setDeleteDialogOpen(false);
      setActiveTosId(null);
    } catch (err: any) {
      setDeleteError(err.response?.data?.error || 'Failed to delete Terms of Service');
    } finally {
      setDeleteLoading(false);
    }
  };
  
  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  // Refresh handler
  const handleRefresh = async () => {
    await fetchTosEntries();
  };
  
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight="bold">
          Terms of Service Templates
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button 
            variant="outlined" 
            startIcon={<RefreshIcon />} 
            onClick={handleRefresh}
            disabled={loading}
          >
            Refresh
          </Button>
          <KButton 
            startIcon={<AddIcon />} 
            onClick={() => setCreateDialogOpen(true)}
          >
            Create New
          </KButton>
        </Box>
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      
      {loading ? (
        <Paper
          elevation={0}
          sx={{
            borderRadius: 2,
            overflow: 'hidden',
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          {[1, 2, 3].map((item) => (
            <Box key={item}>
              {item > 1 && <Divider />}
              <Box sx={{ p: 3 }}>
                <Skeleton variant="text" width="40%" height={28} sx={{ mb: 1 }} />
                <Skeleton variant="text" width="60%" height={20} />
              </Box>
            </Box>
          ))}
        </Paper>
      ) : tosEntries.length === 0 ? (
        <Paper 
          elevation={0} 
          sx={{ 
            p: 4, 
            borderRadius: 2, 
            textAlign: 'center',
            border: '1px dashed',
            borderColor: 'divider'
          }}
        >
          <Typography variant="body1" color="text.secondary" gutterBottom>
            You haven't created any Terms of Service templates yet.
          </Typography>
          <KButton 
            startIcon={<AddIcon />} 
            onClick={() => setCreateDialogOpen(true)}
            sx={{ mt: 2 }}
          >
            Create Your First Template
          </KButton>
        </Paper>
      ) : (
        <Paper 
          elevation={0}
          sx={{
            borderRadius: 2,
            overflow: 'hidden',
            border: '1px solid',
            borderColor: 'divider'
          }}
        >
          <List disablePadding>
            {tosEntries.map((tos, index) => (
              <Box key={tos._id}>
                {index > 0 && <Divider />}
                <ListItem
                  sx={{
                    py: 2,
                    px: 3,
                    cursor: 'pointer',
                    '&:hover': {
                      bgcolor: 'action.hover'
                    },
                    display: 'flex',
                    justifyContent: 'space-between'
                  }}
                  onClick={() => handleViewTos(tos._id)}
                >
                  <Box sx={{ flex: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                      <Typography variant="subtitle1" fontWeight="medium">
                        {tos.title}
                      </Typography>
                      {tos.isDefault && (
                        <Tooltip title="Default Terms of Service">
                          <Chip 
                            size="small" 
                            color="primary" 
                            label="Default" 
                            icon={<CheckCircleIcon fontSize="small" />}
                            sx={{ ml: 1, height: 24 }}
                          />
                        </Tooltip>
                      )}
                    </Box>
                    
                    <Typography variant="body2" color="text.secondary">
                      {tos.content.length} {tos.content.length === 1 ? 'section' : 'sections'} • Last updated {formatDate(tos.updatedAt)}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Tooltip title="Edit">
                      <IconButton 
                        size="small"
                        onClick={(e) => handleEditTos(tos._id, e)}
                        sx={{ 
                          color: 'primary.main',
                          '&:hover': { bgcolor: 'primary.lighter' }
                        }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    
                    {/* Only show delete for non-default TOS */}
                    {!tos.isDefault && (
                      <Tooltip title="Delete">
                        <IconButton 
                          size="small"
                          onClick={(e) => handleDeleteTos(tos._id, e)}
                          sx={{ 
                            color: 'error.main',
                            '&:hover': { bgcolor: 'error.lighter' }
                          }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Box>
                </ListItem>
              </Box>
            ))}
          </List>
        </Paper>
      )}
      
      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 2 } }}
      >
        <DialogTitle>Delete Terms of Service</DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            Are you sure you want to delete this Terms of Service template? This action cannot be undone.
          </Typography>
          
          {deleteError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {deleteError}
            </Alert>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button 
            variant="outlined" 
            onClick={() => setDeleteDialogOpen(false)}
            disabled={deleteLoading}
          >
            Cancel
          </Button>
          <Button 
            variant="contained" 
            color="error" 
            onClick={confirmDelete}
            disabled={deleteLoading}
            startIcon={deleteLoading ? <CircularProgress size={20} /> : null}
          >
            {deleteLoading ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* View TOS Dialog */}
      <TosDialog
        open={viewTosId !== null}
        onClose={() => setViewTosId(null)}
        mode="view"
        tosId={viewTosId || undefined}
      />
      
      {/* Edit TOS Dialog */}
      <TosDialog
        open={editTosId !== null}
        onClose={() => setEditTosId(null)}
        mode="edit"
        tosId={editTosId || undefined}
        onSuccess={fetchTosEntries}
      />
      
      {/* Create TOS Dialog */}
      <TosDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        mode="create"
        onSuccess={fetchTosEntries}
      />
    </Box>
  );
}
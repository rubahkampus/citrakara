// src/components/dashboard/TosDialog.tsx
'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  IconButton,
  Divider,
  CircularProgress,
  Alert,
  Paper
} from '@mui/material';
import { 
  Close as CloseIcon, 
  Add as AddIcon, 
  Delete as DeleteIcon,
  Description as DescriptionIcon
} from '@mui/icons-material';
import { KButton } from '../../KButton';
import { axiosClient } from '@/lib/utils/axiosClient';

// Types for TOS data
interface TosSection {
  subtitle: string;
  text: string;
}

interface TosDialogProps {
  open: boolean;
  onClose: () => void;
  mode: 'view' | 'edit';
  tosId?: string;
}

export default function TosDialog({ open, onClose, mode, tosId }: TosDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Form state
  const [title, setTitle] = useState('');
  const [sections, setSections] = useState<TosSection[]>([{ subtitle: '', text: '' }]);
  
  // Reset state when dialog opens or mode changes
  useEffect(() => {
    if (open) {
      // Clear any previous success or error messages
      setSuccess(null);
      setError(null);
      
      fetchTosData();
    }
  }, [open, mode, tosId]);
  
  // Fetch TOS data
  const fetchTosData = async () => {
    // Reset form for create mode
    if (!tosId) {
      setTitle('Terms of Service');
      setSections([
        { subtitle: 'General Terms', text: 'These terms govern all commissions accepted by the artist.' },
        { subtitle: 'Payment', text: 'Payment is required upfront before work begins.' },
        { subtitle: 'Revisions', text: 'Each commission includes up to 2 revisions.' }
      ]);
      return;
    }
    
    // Fetch existing TOS data
    try {
      setLoading(true);
      
      const response = await axiosClient.get(`/api/tos/${tosId}`);
      const tos = response.data.tos;
      
      setTitle(tos.title);
      setSections(tos.content || []);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load TOS data');
    } finally {
      setLoading(false);
    }
  };
  
  const handleAddSection = () => {
    setSections([...sections, { subtitle: '', text: '' }]);
  };
  
  const handleRemoveSection = (index: number) => {
    setSections(sections.filter((_, i) => i !== index));
  };
  
  const handleSectionChange = (index: number, field: 'subtitle' | 'text', value: string) => {
    const updatedSections = [...sections];
    updatedSections[index][field] = value;
    setSections(updatedSections);
  };
  
  const handleSubmit = async () => {
    // Validate form
    if (!title.trim()) {
      setError('Title is required');
      return;
    }
    
    if (sections.some(section => !section.subtitle.trim() || !section.text.trim())) {
      setError('All sections must have a subtitle and text');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      if (tosId) {
        // Update existing TOS
        await axiosClient.patch(`/api/tos/${tosId}`, {
          title,
          content: sections,
          setAsDefault: true
        });
      } else {
        // Create new TOS
        await axiosClient.post('/api/tos', {
          title,
          content: sections
        });
      }
      
      // Close dialog immediately on success and notify parent
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save Terms of Service');
      setLoading(false);
    }
  };
  
  const handleClose = () => {
    if (loading) return;
    onClose();
  };
  
  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{ sx: { borderRadius: 2 } }}
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <DescriptionIcon sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="h6" fontWeight="bold">
            {mode === 'view' ? 'Terms of Service' : tosId ? 'Edit Terms of Service' : 'Create Terms of Service'}
          </Typography>
        </Box>
        <IconButton onClick={handleClose} disabled={loading}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <Divider />
      
      <DialogContent sx={{ py: 3 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        ) : success ? (
          <Alert severity="success" sx={{ mb: 3 }}>
            {success}
          </Alert>
        ) : (
          <Box>
            {/* Title */}
            {mode === 'view' ? (
              <Box sx={{ mb: 3 }}>
                <Typography variant="h5" align="center" gutterBottom sx={{ 
                  fontWeight: 'bold',
                  pb: 2,
                  borderBottom: '1px solid',
                  borderColor: 'divider'
                }}>
                  {title}
                </Typography>
              </Box>
            ) : (
              <TextField
                label="Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                fullWidth
                required
                variant="outlined"
                placeholder="e.g., Standard Commission Terms"
                sx={{ mb: 3 }}
              />
            )}
            
            {/* Sections - View Mode */}
            {mode === 'view' && (
              <Box sx={{ mt: 2 }}>
                {sections.map((section, index) => (
                  <Paper key={index} variant="outlined" sx={{ mb: 2, overflow: 'visible', p: 2 }}>
                    <Typography variant="h6" color="primary" gutterBottom>
                      {section.subtitle}
                    </Typography>
                    <Typography variant="body1" sx={{ whiteSpace: 'pre-line' }}>
                      {section.text}
                    </Typography>
                  </Paper>
                ))}
              </Box>
            )}
            
            {/* Sections - Edit Mode */}
            {mode === 'edit' && (
              <>
                <Typography variant="subtitle1" fontWeight="medium" sx={{ mt: 3, mb: 2 }}>
                  Content Sections
                </Typography>
                
                {sections.map((section, index) => (
                  <Paper 
                    key={index} 
                    elevation={0} 
                    sx={{ 
                      mb: 3,
                      p: 2,
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 2
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                      <Typography variant="subtitle2" fontWeight="medium">
                        Section {index + 1}
                      </Typography>
                      
                      {sections.length > 1 && (
                        <IconButton 
                          color="error" 
                          onClick={() => handleRemoveSection(index)}
                          size="small"
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      )}
                    </Box>
                    
                    <TextField
                      label="Section Title"
                      value={section.subtitle}
                      onChange={(e) => handleSectionChange(index, 'subtitle', e.target.value)}
                      fullWidth
                      required
                      size="small"
                      placeholder="e.g., Payment Terms"
                      sx={{ mb: 2 }}
                    />
                    
                    <TextField
                      label="Section Content"
                      value={section.text}
                      onChange={(e) => handleSectionChange(index, 'text', e.target.value)}
                      fullWidth
                      required
                      multiline
                      rows={3}
                      placeholder="Describe your terms for this section..."
                    />
                  </Paper>
                ))}
                
                <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1 }}>
                  <Button
                    variant="outlined"
                    startIcon={<AddIcon />}
                    onClick={handleAddSection}
                  >
                    Add Section
                  </Button>
                </Box>
              </>
            )}
          </Box>
        )}
      </DialogContent>
      
      <Divider />
      
      <DialogActions sx={{ px: 3, py: 2 }}>
        {mode === 'view' ? (
          <KButton onClick={handleClose}>
            Close
          </KButton>
        ) : (
          <>
            <Button 
              variant="outlined" 
              onClick={handleClose}
              disabled={loading}
            >
              Cancel
            </Button>
            
            <KButton 
              onClick={handleSubmit}
              disabled={loading}
              loading={loading}
            >
              Save Changes
            </KButton>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
}
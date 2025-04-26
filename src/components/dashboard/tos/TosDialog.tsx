// src/components/dashboard/tos/TosDialog.tsx
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
  List,
  ListItem,
  CircularProgress,
  Alert,
  Paper,
  Card,
  CardContent,
  Tooltip,
  Fade,
  Switch,
  FormControlLabel
} from '@mui/material';
import { 
  Close as CloseIcon, 
  Add as AddIcon, 
  Delete as DeleteIcon,
  Description as DescriptionIcon
} from '@mui/icons-material';
import { KButton } from '@/components/KButton';
import { axiosClient } from '@/lib/utils/axiosClient';

// Types for TOS data
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

interface TosDialogProps {
  open: boolean;
  onClose: () => void;
  mode: 'view' | 'create' | 'edit';
  tosId?: string;
  onSuccess?: () => void;
}

export default function TosDialog({ open, onClose, mode, tosId, onSuccess }: TosDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Form state
  const [title, setTitle] = useState('');
  const [sections, setSections] = useState<TosSection[]>([{ subtitle: '', text: '' }]);
  const [isDefault, setIsDefault] = useState(false);
  
  // Load TOS data if editing or viewing
  useEffect(() => {
    if (!open || !tosId || mode === 'create') return;
    
    const fetchTosData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await axiosClient.get(`/api/tos/${tosId}`);
        const tos = response.data.tos;
        
        setTitle(tos.title);
        setSections(tos.content || []);
        setIsDefault(tos.isDefault || false);
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to load TOS data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchTosData();
  }, [open, tosId, mode]);
  
  // Reset form when dialog opens
  useEffect(() => {
    if (open && mode === 'create') {
      setTitle('');
      setSections([
        { subtitle: 'General Terms', text: 'These terms govern all commissions accepted by the artist.' },
        { subtitle: 'Payment', text: 'Payment is required upfront before work begins.' },
        { subtitle: 'Revisions', text: 'Each commission includes up to 2 revisions.' }
      ]);
      setIsDefault(false);
      setError(null);
      setSuccess(null);
    }
  }, [open, mode]);
  
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
      if (mode === 'create') {
        // Create new TOS
        await axiosClient.post('/api/tos', {
          title,
          content: sections
        });
        
        setSuccess('Terms of Service created successfully');
      } else if (mode === 'edit' && tosId) {
        // Update existing TOS
        await axiosClient.patch(`/api/tos/${tosId}`, {
          title,
          content: sections,
          setAsDefault: isDefault
        });
        
        setSuccess('Terms of Service updated successfully');
      }
      
      // Call success callback
      if (onSuccess) {
        setTimeout(() => {
          onSuccess();
          handleClose();
        }, 1500);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save Terms of Service');
    } finally {
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
            {mode === 'create' ? 'Create Terms of Service' : 
             mode === 'edit' ? 'Edit Terms of Service' : 
             'Terms of Service'}
          </Typography>
          {isDefault && mode === 'view' && (
            <Box sx={{ 
              ml: 2, 
              px: 1.5, 
              py: 0.5, 
              bgcolor: 'primary.main', 
              color: 'white', 
              borderRadius: 1,
              fontSize: '0.75rem',
              fontWeight: 'bold'
            }}>
              Default
            </Box>
          )}
        </Box>
        <IconButton onClick={handleClose} disabled={loading}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <Divider />
      
      <DialogContent sx={{ py: 3 }}>
        {loading && mode !== 'create' ? (
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
                disabled={mode !== 'create' && mode !== 'edit' || loading}
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
                  <Card key={index} variant="outlined" sx={{ mb: 2, overflow: 'visible' }}>
                    <CardContent>
                      <Typography variant="h6" color="primary" gutterBottom>
                        {section.subtitle}
                      </Typography>
                      <Typography variant="body1" sx={{ whiteSpace: 'pre-line' }}>
                        {section.text}
                      </Typography>
                    </CardContent>
                  </Card>
                ))}
              </Box>
            )}
            
            {/* Sections - Edit/Create Mode */}
            {mode !== 'view' && (
              <>
                <Typography variant="subtitle1" fontWeight="medium" sx={{ mt: 3, mb: 2 }}>
                  Content Sections
                </Typography>
                
                <List sx={{ mb: 2 }}>
                  {sections.map((section, index) => (
                    <Fade key={index} in={true}>
                      <Paper 
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
                            <Tooltip title="Remove Section">
                              <IconButton 
                                color="error" 
                                onClick={() => handleRemoveSection(index)}
                                size="small"
                                disabled={loading}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Box>
                        
                        <TextField
                          label="Section Title"
                          value={section.subtitle}
                          onChange={(e) => handleSectionChange(index, 'subtitle', e.target.value)}
                          fullWidth
                          disabled={loading}
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
                          disabled={loading}
                          required
                          multiline
                          rows={3}
                          placeholder="Describe your terms for this section..."
                        />
                      </Paper>
                    </Fade>
                  ))}
                </List>
                
                <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
                  <Button
                    variant="outlined"
                    startIcon={<AddIcon />}
                    onClick={handleAddSection}
                    disabled={loading}
                  >
                    Add Section
                  </Button>
                </Box>
                
                {/* Default checkbox - only for edit mode */}
                {mode === 'edit' && (
                  <Paper 
                    elevation={0}
                    sx={{ 
                      p: 2, 
                      borderRadius: 2,
                      bgcolor: 'primary.lighter',
                      mb: 2,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <Box>
                      <Typography variant="subtitle2" fontWeight="bold">
                        Set as Default Terms of Service
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        This template will be applied to all your new commissions
                      </Typography>
                    </Box>
                    
                    <FormControlLabel
                      control={
                        <Switch
                          checked={isDefault}
                          onChange={() => setIsDefault(!isDefault)}
                          disabled={loading}
                          color="primary"
                        />
                      }
                      label={isDefault ? "Default" : "Set Default"}
                      labelPlacement="start"
                    />
                  </Paper>
                )}
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
              {mode === 'create' ? 'Create Template' : 'Save Changes'}
            </KButton>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
}
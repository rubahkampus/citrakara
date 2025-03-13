// src/components/ProfileDialog.tsx
"use client";

import { useEffect, useState } from "react";
import { axiosClient } from "@/lib/utils/axiosClient";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Avatar,
  Box,
  CircularProgress,
  Typography,
} from "@mui/material";

interface EditProfileDialogProps {
  open: boolean;
  onClose: () => void;
  profile: any;
  onUpdateSuccess: (updatedUser: any) => void;
}

export default function EditProfileDialog({
  open,
  onClose,
  profile,
  onUpdateSuccess,
}: EditProfileDialogProps) {
  const [bio, setBio] = useState(profile.bio || "");
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [banner, setBanner] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bioError, setBioError] = useState<string | null>(null);

  const [profilePreview, setProfilePreview] = useState(profile.profilePicture);
  const [bannerPreview, setBannerPreview] = useState(profile.banner);

  const MAX_BIO_LENGTH = 250;

  /** Reset state when dialog opens */
  useEffect(() => {
    if (open) {
      setBio(profile.bio || "");
      setProfilePicture(null);
      setBanner(null);
      setProfilePreview(profile.profilePicture);
      setBannerPreview(profile.banner);
      setError(null);
      setBioError(null);
    }
  }, [open, profile]);

  /** Handle file selection */
  const handleFileChange = (
    event: React.ChangeEvent<HTMLInputElement>, 
    setFile: React.Dispatch<React.SetStateAction<File | null>>, 
    setPreview: React.Dispatch<React.SetStateAction<string | undefined>>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Only image files are allowed');
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be less than 5MB');
      return;
    }

    setFile(file);
    const objectURL = URL.createObjectURL(file);
    setPreview(objectURL);

    // Cleanup function to revoke the object URL
    return () => URL.revokeObjectURL(objectURL);
  };

  /** Handle bio change */
  const handleBioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setBio(value);
    
    if (value.length > MAX_BIO_LENGTH) {
      setBioError(`Bio must be less than ${MAX_BIO_LENGTH} characters`);
    } else {
      setBioError(null);
    }
  };

  /** Handle profile update */
  const handleSubmit = async () => {
    // Validate bio length
    if (bio.length > MAX_BIO_LENGTH) {
      setBioError(`Bio must be less than ${MAX_BIO_LENGTH} characters`);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("bio", bio);
      if (profilePicture) formData.append("profilePicture", profilePicture);
      if (banner) formData.append("banner", banner);
  
      const response = await axiosClient.patch("/api/user/me/update", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
  
      const updatedUser = response.data.user;
      updatedUser.profilePicture += `?t=${new Date().getTime()}`; // Cache-busting
      updatedUser.banner += `?t=${new Date().getTime()}`;
  
      onUpdateSuccess(updatedUser);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to update profile.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Edit Profile</DialogTitle>
      <DialogContent>
        {/* Profile Picture Preview */}
        <Box display="flex" justifyContent="center" mb={2}>
          <Avatar src={profilePreview} sx={{ width: 100, height: 100 }} />
        </Box>

        <Button variant="contained" component="label" fullWidth sx={{ mb: 2 }}>
          Change Profile Picture
          <input 
            type="file" 
            accept="image/*" 
            hidden 
            onChange={(e) => handleFileChange(e, setProfilePicture, setProfilePreview)} 
          />
        </Button>

        {/* Banner Preview */}
        <Box
          sx={{
            width: "100%",
            height: 100,
            backgroundImage: `url(${bannerPreview})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            borderRadius: 2,
            mb: 2,
          }}
        />

        <Button variant="contained" component="label" fullWidth sx={{ mb: 2 }}>
          Change Banner
          <input 
            type="file" 
            accept="image/*" 
            hidden 
            onChange={(e) => handleFileChange(e, setBanner, setBannerPreview)} 
          />
        </Button>

        {/* Bio Input */}
        <TextField
          label="Bio"
          fullWidth
          multiline
          rows={3}
          value={bio}
          onChange={handleBioChange}
          error={!!bioError}
          helperText={bioError || `${bio.length}/${MAX_BIO_LENGTH}`}
          sx={{ mb: 2 }}
        />

        {/* Error Message */}
        {error && <Typography color="error" textAlign="center" sx={{ mb: 2 }}>{error}</Typography>}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={loading}>Cancel</Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          disabled={loading || !!bioError}
        >
          {loading ? <CircularProgress size={24} /> : "Save Changes"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
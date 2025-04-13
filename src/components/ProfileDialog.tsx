// src/components/ProfileDialog.tsx
// src/components/ProfileDialog.tsx
"use client";

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
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { axiosClient } from "@/lib/utils/axiosClient";

interface EditProfileDialogProps {
  open: boolean;
  onClose: () => void;
  profile: any;
  onUpdateSuccess: (updatedUser: any) => void;
}

interface FormValues {
  bio: string;
}

export default function EditProfileDialog({
  open,
  onClose,
  profile,
  onUpdateSuccess,
}: EditProfileDialogProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
    watch,
  } = useForm<FormValues>({
    defaultValues: {
      bio: profile.bio || "",
    },
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [banner, setBanner] = useState<File | null>(null);
  const [profilePreview, setProfilePreview] = useState(profile.profilePicture);
  const [bannerPreview, setBannerPreview] = useState(profile.banner);

  const MAX_BIO_LENGTH = 250;

  useEffect(() => {
    if (open) {
      reset({ bio: profile.bio || "" });
      setProfilePicture(null);
      setBanner(null);
      setProfilePreview(profile.profilePicture);
      setBannerPreview(profile.banner);
      setError(null);
    }
  }, [open, profile, reset]);

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    setFile: React.Dispatch<React.SetStateAction<File | null>>,
    setPreview: React.Dispatch<React.SetStateAction<string | undefined>>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Only image files are allowed");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be less than 5MB");
      return;
    }

    setFile(file);
    const objectURL = URL.createObjectURL(file);
    setPreview(objectURL);
    return () => URL.revokeObjectURL(objectURL);
  };

  const onSubmit = async (data: FormValues) => {
    if (data.bio.length > MAX_BIO_LENGTH) return;

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("bio", data.bio);
      if (profilePicture) formData.append("profilePicture", profilePicture);
      if (banner) formData.append("banner", banner);

      const response = await axiosClient.patch("/api/user/me/update", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const updatedUser = response.data.user;
      updatedUser.profilePicture += `?t=${Date.now()}`;
      updatedUser.banner += `?t=${Date.now()}`;

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

        <TextField
          label="Bio"
          fullWidth
          multiline
          rows={3}
          {...register("bio", {
            maxLength: {
              value: MAX_BIO_LENGTH,
              message: `Must be less than ${MAX_BIO_LENGTH} characters`,
            },
          })}
          error={!!errors.bio}
          helperText={errors.bio?.message || `${watch("bio")?.length || 0}/${MAX_BIO_LENGTH}`}
          sx={{ mb: 2 }}
        />

        {error && (
          <Typography color="error" textAlign="center" sx={{ mb: 2 }}>
            {error}
          </Typography>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit(onSubmit)}
          variant="contained"
          disabled={loading}
        >
          {loading ? <CircularProgress size={24} /> : "Save Changes"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

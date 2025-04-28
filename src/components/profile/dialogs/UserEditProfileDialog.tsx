// src/components/UserEditProfileDialog.tsx
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
  Chip,
  IconButton,
  Divider,
  Paper,
  Alert,
  FormControlLabel,
  Switch,
  MenuItem,
  InputAdornment,
  Tooltip
} from "@mui/material";
import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { axiosClient } from "@/lib/utils/axiosClient";
import {
  Add,
  Delete,
  CameraAlt,
  Image,
  InfoOutlined,
  Link as LinkIcon
} from "@mui/icons-material";

interface UserEditProfileDialogProps {
  open: boolean;
  onClose: () => void;
  profile: any;
  onUpdateSuccess: (updatedUser: any) => void;
}

interface SocialLink {
  label: string;
  url: string;
}

interface FormValues {
  bio: string;
  displayName: string;
  openForCommissions: boolean;
  defaultCurrency: string;
}

const SOCIAL_PLATFORMS = {
  discord: "Discord",
  x: "X (Twitter)",
  instagram: "Instagram",
  facebook: "Facebook",
  bluesky: "Bluesky",
  linkedin: "LinkedIn",
  github: "GitHub",
  behance: "Behance",
  dribbble: "Dribbble"
};

export default function UserEditProfileDialog({
  open,
  onClose,
  profile,
  onUpdateSuccess,
}: UserEditProfileDialogProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
    watch,
    control
  } = useForm<FormValues>({
    defaultValues: {
      bio: profile.bio || "",
      displayName: profile.displayName || profile.username || "",
      openForCommissions: profile.openForCommissions ?? false,
      defaultCurrency: profile.defaultCurrency || "IDR",
    },
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tags, setTags] = useState<string[]>(profile.tags || []);
  const [tagInput, setTagInput] = useState<string>("");

  const [socials, setSocials] = useState<SocialLink[]>(profile.socials || []);
  const [socialLabel, setSocialLabel] = useState("");
  const [socialUrl, setSocialUrl] = useState("");

  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [banner, setBanner] = useState<File | null>(null);
  const [profilePreview, setProfilePreview] = useState(profile.profilePicture);
  const [bannerPreview, setBannerPreview] = useState(profile.banner);

  const MAX_BIO_LENGTH = 250;
  const MAX_TAGS = 10;
  const CURRENCIES = ["IDR", "USD", "EUR", "SGD", "AUD", "JPY"];

  const watchBio = watch("bio");
  const bioLength = watchBio?.length || 0;
  const hasChanges = isDirty || profilePicture || banner || 
    tags.join(',') !== (profile.tags || []).join(',') || 
    JSON.stringify(socials) !== JSON.stringify(profile.socials || []);

  useEffect(() => {
    if (open) {
      reset({
        bio: profile.bio || "",
        displayName: profile.displayName || profile.username || "",
        openForCommissions: profile.openForCommissions ?? false,
        defaultCurrency: profile.defaultCurrency || "IDR",
      });
      setTags(profile.tags || []);
      setSocials(profile.socials || []);
      setTagInput("");
      setSocialLabel("");
      setSocialUrl("");
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

  const addTag = () => {
    const trimmed = tagInput.trim();
    if (trimmed && !tags.includes(trimmed) && tags.length < MAX_TAGS) {
      setTags([...tags, trimmed]);
    }
    setTagInput("");
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const addSocial = () => {
    if (socialLabel.trim() && socialUrl.trim()) {
      setSocials([
        ...socials,
        { label: socialLabel.trim(), url: socialUrl.trim() },
      ]);
      setSocialLabel("");
      setSocialUrl("");
    }
  };

  const removeSocial = (index: number) => {
    setSocials(socials.filter((_, i) => i !== index));
  };

  const handleClose = () => {
    if (hasChanges) {
      if (window.confirm("You have unsaved changes. Are you sure you want to close?")) {
        onClose();
      }
    } else {
      onClose();
    }
  };

  const onSubmit = async (data: FormValues) => {
    if (data.bio.length > MAX_BIO_LENGTH) return;

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("bio", data.bio);
      formData.append("displayName", data.displayName);
      formData.append("openForCommissions", String(data.openForCommissions));
      formData.append("defaultCurrency", data.defaultCurrency);
      formData.append("tags", tags.join(","));
      formData.append("socials", JSON.stringify(socials));
      if (profilePicture) formData.append("profilePicture", profilePicture);
      if (banner) formData.append("banner", banner);

      const response = await axiosClient.patch(
        "/api/me/update",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

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
    <Dialog 
      open={open} 
      onClose={handleClose} 
      fullWidth 
      maxWidth="md"
      PaperProps={{
        sx: { borderRadius: 2 }
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Typography variant="h5" fontWeight="bold">Edit Your Profile</Typography>
      </DialogTitle>
      <Divider />
      
      <DialogContent sx={{ pt: 3 }}>
        <Box sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, gap: 4 }}>
          {/* Left column - Profile images */}
          <Box sx={{ width: { xs: "100%", md: "40%" } }}>
            <Paper elevation={0} sx={{ p: 3, mb: 3, borderRadius: 2, border: "1px solid #e0e0e0" }}>
              <Typography variant="h6" gutterBottom>Profile Picture</Typography>
              
              <Box display="flex" justifyContent="center" mb={2} position="relative">
                <Avatar 
                  src={profilePreview} 
                  sx={{ 
                    width: 150, 
                    height: 150,
                    border: "4px solid #f5f5f5"
                  }} 
                />
                <Button 
                  variant="contained" 
                  component="label" 
                  size="small"
                  sx={{ 
                    position: "absolute", 
                    bottom: 0, 
                    borderRadius: 10,
                    backgroundColor: "primary.main"
                  }}
                >
                  <CameraAlt sx={{ mr: 1 }} fontSize="small" />
                  Change
                  <input
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={(e) =>
                      handleFileChange(e, setProfilePicture, setProfilePreview)
                    }
                  />
                </Button>
              </Box>
              
              <Typography variant="body2" color="text.secondary" align="center" gutterBottom>
                Recommended size: 400x400px, max 5MB
              </Typography>
            </Paper>

            <Paper elevation={0} sx={{ p: 3, borderRadius: 2, border: "1px solid #e0e0e0" }}>
              <Typography variant="h6" gutterBottom>Profile Banner</Typography>
              
              <Box 
                sx={{
                  position: "relative",
                  width: "100%",
                  height: 120,
                  backgroundImage: bannerPreview ? `url(${bannerPreview})` : "none",
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  backgroundColor: bannerPreview ? "transparent" : "#f0f0f0",
                  borderRadius: 2,
                  mb: 2,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}
              >
                {!bannerPreview && <Image color="action" sx={{ opacity: 0.5 }} />}
                <Button 
                  variant="contained" 
                  component="label"
                  size="small"
                  sx={{ 
                    position: "absolute", 
                    bottom: 8, 
                    right: 8,
                    borderRadius: 10 
                  }}
                >
                  <Image sx={{ mr: 1 }} fontSize="small" />
                  Upload
                  <input
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={(e) => handleFileChange(e, setBanner, setBannerPreview)}
                  />
                </Button>
              </Box>
              
              <Typography variant="body2" color="text.secondary" align="center">
                Recommended size: 1200x400px, max 5MB
              </Typography>
            </Paper>
          </Box>

          {/* Right column - Profile details */}
          <Box sx={{ width: { xs: "100%", md: "60%" } }}>
            <Paper elevation={0} sx={{ p: 3, mb: 3, borderRadius: 2, border: "1px solid #e0e0e0" }}>
              <Typography variant="h6" gutterBottom>Basic Information</Typography>
              
              <TextField
                label="Display Name"
                fullWidth
                variant="outlined"
                {...register("displayName", { 
                  required: "Display name is required",
                  maxLength: {
                    value: 50,
                    message: "Display name must be less than 50 characters"
                  }
                })}
                error={!!errors.displayName}
                helperText={errors.displayName?.message}
                sx={{ mb: 3 }}
              />

              <TextField
                label="Bio"
                fullWidth
                multiline
                rows={4}
                variant="outlined"
                {...register("bio", {
                  maxLength: {
                    value: MAX_BIO_LENGTH,
                    message: `Must be less than ${MAX_BIO_LENGTH} characters`,
                  },
                })}
                error={bioLength > MAX_BIO_LENGTH || !!errors.bio}
                helperText={
                  errors.bio?.message ||
                  `${bioLength}/${MAX_BIO_LENGTH} characters`
                }
                sx={{ 
                  mb: 3,
                  "& .MuiFormHelperText-root": {
                    textAlign: "right",
                    mr: 0,
                    color: bioLength > MAX_BIO_LENGTH * 0.8 
                      ? bioLength > MAX_BIO_LENGTH 
                        ? "error.main" 
                        : "warning.main"
                      : "text.secondary"
                  }
                }}
              />

              <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
                <Controller
                  name="openForCommissions"
                  control={control}
                  render={({ field }) => (
                    <FormControlLabel
                      control={
                        <Switch
                          checked={field.value}
                          onChange={field.onChange}
                          color="primary"
                        />
                      }
                      label="Open for Commissions"
                    />
                  )}
                />

                <Controller
                  name="defaultCurrency"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      select
                      label="Currency"
                      value={field.value}
                      onChange={field.onChange}
                      variant="outlined"
                      size="small"
                      sx={{ width: 120 }}
                    >
                      {CURRENCIES.map((currency) => (
                        <MenuItem key={currency} value={currency}>
                          {currency}
                        </MenuItem>
                      ))}
                    </TextField>
                  )}
                />
              </Box>
            </Paper>

            <Paper elevation={0} sx={{ p: 3, mb: 3, borderRadius: 2, border: "1px solid #e0e0e0" }}>
              <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                <Typography variant="h6">Tags</Typography>
                <Tooltip title={`Add up to ${MAX_TAGS} tags to help people find your profile`}>
                  <InfoOutlined fontSize="small" sx={{ ml: 1, color: "text.secondary" }} />
                </Tooltip>
              </Box>

              <Box sx={{ mb: 2 }}>
                {tags.length === 0 ? (
                  <Typography variant="body2" color="text.secondary" mb={2}>
                    Add tags to help others discover your work
                  </Typography>
                ) : (
                  <Box display="flex" gap={1} flexWrap="wrap" mb={2}>
                    {tags.map((tag) => (
                      <Chip 
                        key={tag} 
                        label={tag} 
                        onDelete={() => removeTag(tag)} 
                        sx={{ 
                          bgcolor: "primary.light", 
                          color: "primary.contrastText",
                          "& .MuiChip-deleteIcon": {
                            color: "primary.contrastText",
                            "&:hover": { color: "white" }
                          }
                        }}
                      />
                    ))}
                  </Box>
                )}

                <Box display="flex" gap={1}>
                  <TextField
                    fullWidth
                    placeholder="Add a tag"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                    size="small"
                    disabled={tags.length >= MAX_TAGS}
                    helperText={tags.length >= MAX_TAGS ? `Maximum ${MAX_TAGS} tags` : ""}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <Button 
                            onClick={addTag} 
                            disabled={!tagInput.trim() || tags.length >= MAX_TAGS}
                            size="small"
                          >
                            Add
                          </Button>
                        </InputAdornment>
                      )
                    }}
                  />
                </Box>
              </Box>
            </Paper>

            <Paper elevation={0} sx={{ p: 3, borderRadius: 2, border: "1px solid #e0e0e0" }}>
              <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                <Typography variant="h6">Social Links</Typography>
                <Tooltip title="Connect your social profiles">
                  <InfoOutlined fontSize="small" sx={{ ml: 1, color: "text.secondary" }} />
                </Tooltip>
              </Box>

              {socials.length === 0 ? (
                <Typography variant="body2" color="text.secondary" mb={2}>
                  Add your social media links so others can connect with you
                </Typography>
              ) : (
                <Box sx={{ mb: 3 }}>
                  {socials.map((s, i) => (
                    <Box 
                      key={i} 
                      sx={{
                        display: "flex",
                        alignItems: "center", 
                        p: 1.5,
                        mb: 1,
                        borderRadius: 1,
                        bgcolor: "background.paper",
                        border: "1px solid #e0e0e0"
                      }}
                    >
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          fontWeight: "bold", 
                          minWidth: 100,
                          color: "text.secondary"
                        }}
                      >
                        {SOCIAL_PLATFORMS[s.label as keyof typeof SOCIAL_PLATFORMS] || s.label}
                      </Typography>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          flex: 1,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap"
                        }}
                      >
                        {s.url}
                      </Typography>
                      <IconButton 
                        onClick={() => removeSocial(i)} 
                        size="small" 
                        sx={{ color: "error.light" }}
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    </Box>
                  ))}
                </Box>
              )}

              <Box sx={{ display: "flex", gap: 1, alignItems: "flex-start" }}>
                <TextField
                  select
                  label="Platform"
                  value={socialLabel}
                  onChange={(e) => setSocialLabel(e.target.value)}
                  size="small"
                  sx={{ minWidth: 150 }}
                >
                  <MenuItem value="">Select platform</MenuItem>
                  {Object.entries(SOCIAL_PLATFORMS).map(([value, label]) => (
                    <MenuItem 
                      key={value} 
                      value={value} 
                      disabled={socials.some(s => s.label === value)}
                    >
                      {label}
                    </MenuItem>
                  ))}
                </TextField>

                <TextField
                  label="URL"
                  value={socialUrl}
                  onChange={(e) => setSocialUrl(e.target.value)}
                  fullWidth
                  size="small"
                  placeholder="https://"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LinkIcon fontSize="small" />
                      </InputAdornment>
                    )
                  }}
                />

                <Button 
                  onClick={addSocial} 
                  variant="outlined"
                  disabled={!socialLabel || !socialUrl.trim()}
                  sx={{ height: 40 }}
                >
                  <Add />
                </Button>
              </Box>
            </Paper>
          </Box>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
      </DialogContent>

      <Divider />
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button 
          onClick={handleClose} 
          disabled={loading}
          variant="outlined"
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit(onSubmit)}
          variant="contained"
          disabled={loading || !hasChanges}
          startIcon={loading && <CircularProgress size={16} />}
        >
          {loading ? "Saving..." : "Save Changes"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
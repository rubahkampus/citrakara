// src/components/dialogs/ProfileDialog.tsx
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
  Tooltip,
  Stack,
} from "@mui/material";
import { useForm, Controller } from "react-hook-form";
import { axiosClient } from "@/lib/utils/axiosClient";
import {
  Add,
  Delete,
  CameraAlt,
  Image,
  InfoOutlined,
  Link as LinkIcon,
} from "@mui/icons-material";

// Types
interface ProfileDialogProps {
  open: boolean;
  onClose: () => void;
  profile: UserProfile | null;
  onUpdateSuccess?: (updatedUser: UserProfile) => void;
}

interface UserProfile {
  id?: string;
  username?: string;
  displayName?: string;
  bio?: string;
  profilePicture?: string;
  banner?: string;
  tags?: string[];
  socials?: Array<{ label: string; url: string }>;
  openForCommissions?: boolean;
  defaultCurrency?: string;
}

interface FormValues {
  bio: string;
  displayName: string;
  openForCommissions: boolean;
  defaultCurrency: string;
}

interface SocialPlatforms {
  [key: string]: string;
}

// Constants
const MAX_BIO_LENGTH = 250;
const MAX_TAGS = 10;
const CURRENCIES = ["IDR", "USD", "EUR", "SGD", "AUD", "JPY"];

const SOCIAL_PLATFORMS: SocialPlatforms = {
  discord: "Discord",
  x: "X (Twitter)",
  instagram: "Instagram",
  facebook: "Facebook",
  bluesky: "Bluesky",
  linkedin: "LinkedIn",
  github: "GitHub",
  behance: "Behance",
  dribbble: "Dribbble",
};

export default function ProfileDialog({
  open,
  onClose,
  profile,
  onUpdateSuccess,
}: ProfileDialogProps) {
  const router = useRouter();
  // Form handling
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
    watch,
    control,
  } = useForm<FormValues>({
    defaultValues: {
      bio: profile?.bio || "",
      displayName: profile?.displayName || profile?.username || "",
      openForCommissions: profile?.openForCommissions ?? false,
      defaultCurrency: profile?.defaultCurrency || "IDR",
    },
  });

  // State management
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tags, setTags] = useState<string[]>(profile?.tags || []);
  const [tagInput, setTagInput] = useState("");
  const [socials, setSocials] = useState<Array<{ label: string; url: string }>>(
    profile?.socials || []
  );
  const [socialLabel, setSocialLabel] = useState("");
  const [socialUrl, setSocialUrl] = useState("");
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [banner, setBanner] = useState<File | null>(null);
  const [profilePreview, setProfilePreview] = useState<string | undefined>(
    profile?.profilePicture
  );
  const [bannerPreview, setBannerPreview] = useState<string | undefined>(
    profile?.banner
  );

  // Computed values
  const watchBio = watch("bio");
  const bioLength = watchBio?.length || 0;
  const hasChanges =
    isDirty ||
    profilePicture !== null ||
    banner !== null ||
    tags.join(",") !== (profile?.tags || []).join(",") ||
    JSON.stringify(socials) !== JSON.stringify(profile?.socials || []);

  // Reset form when dialog opens
  useEffect(() => {
    if (open && profile) {
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

  // File handling
  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    setFile: React.Dispatch<React.SetStateAction<File | null>>,
    setPreview: React.Dispatch<React.SetStateAction<string | undefined>>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Hanya file gambar yang diperbolehkan");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Ukuran gambar harus kurang dari 5MB");
      return;
    }

    setFile(file);
    const objectURL = URL.createObjectURL(file);
    setPreview(objectURL);
  };

  // Tag management
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

  // Social link management
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

  // Dialog actions
  const handleClose = () => {
    if (hasChanges) {
      if (
        window.confirm(
          "Anda memiliki perubahan yang belum disimpan. Yakin ingin menutup?"
        )
      ) {
        onClose();
      }
    } else {
      onClose();
    }
  };

  // Form submission
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

      const response = await axiosClient.patch("/api/me/update", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const updatedUser = response.data.user;
      if (updatedUser.profilePicture) {
        updatedUser.profilePicture += `?t=${Date.now()}`;
      }
      if (updatedUser.banner) {
        updatedUser.banner += `?t=${Date.now()}`;
      }

      if (onUpdateSuccess) {
        onUpdateSuccess(updatedUser);
      }
      setTimeout(() => {
        router.refresh();
      }, 2000);

      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || "Gagal memperbarui profil.");
    } finally {
      setLoading(false);
    }
  };

  if (!profile) return null;

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth
      maxWidth="md"
      PaperProps={{
        sx: {
          borderRadius: 2,
          overflow: "hidden",
        },
      }}
    >
      <DialogTitle
        sx={{
          pb: 1,
          backgroundColor: "primary.light",
          color: "primary.contrastText",
        }}
      >
        <Typography component="div" variant="h5" fontWeight="bold">
          Edit Profil Anda
        </Typography>
      </DialogTitle>
      <Divider />

      <DialogContent sx={{ pt: 3 }}>
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            gap: 4,
          }}
        >
          {/* Left column - Profile images */}
          <Stack spacing={3} sx={{ width: { xs: "100%", md: "40%" } }}>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: 2,
                border: "1px solid #e0e0e0",
                transition: "all 0.2s ease-in-out",
                "&:hover": {
                  boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                },
              }}
            >
              <Typography variant="h6" gutterBottom fontWeight="medium">
                Foto Profil
              </Typography>

              <Box
                display="flex"
                justifyContent="center"
                mb={2}
                position="relative"
              >
                <Avatar
                  src={profilePreview}
                  sx={{
                    width: 150,
                    height: 150,
                    border: "4px solid #f5f5f5",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
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
                    bgcolor: "primary.main",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
                    "&:hover": {
                      bgcolor: "primary.dark",
                    },
                  }}
                >
                  <CameraAlt sx={{ mr: 1 }} fontSize="small" />
                  Ganti
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

              <Typography
                variant="body2"
                color="text.secondary"
                align="center"
                gutterBottom
              >
                Ukuran yang direkomendasikan: 400x400px, maks 5MB
              </Typography>
            </Paper>

            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: 2,
                border: "1px solid #e0e0e0",
                transition: "all 0.2s ease-in-out",
                "&:hover": {
                  boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                },
              }}
            >
              <Typography variant="h6" gutterBottom fontWeight="medium">
                Banner Profil
              </Typography>

              <Box
                sx={{
                  position: "relative",
                  width: "100%",
                  height: 120,
                  backgroundImage: bannerPreview
                    ? `url(${bannerPreview})`
                    : "none",
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  backgroundColor: bannerPreview ? "transparent" : "#f0f0f0",
                  borderRadius: 2,
                  mb: 2,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.05)",
                }}
              >
                {!bannerPreview && (
                  <Image color="action" sx={{ opacity: 0.5 }} />
                )}
                <Button
                  variant="contained"
                  component="label"
                  size="small"
                  sx={{
                    position: "absolute",
                    bottom: 8,
                    right: 8,
                    borderRadius: 10,
                    boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
                  }}
                >
                  <Image sx={{ mr: 1 }} fontSize="small" />
                  Unggah
                  <input
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={(e) =>
                      handleFileChange(e, setBanner, setBannerPreview)
                    }
                  />
                </Button>
              </Box>

              <Typography variant="body2" color="text.secondary" align="center">
                Ukuran yang direkomendasikan: 1200x400px, maks 5MB
              </Typography>
            </Paper>
          </Stack>

          {/* Right column - Profile details */}
          <Stack spacing={3} sx={{ width: { xs: "100%", md: "60%" } }}>
            {/* Basic Information */}
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: 2,
                border: "1px solid #e0e0e0",
                transition: "all 0.2s ease-in-out",
                "&:hover": {
                  boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                },
              }}
            >
              <Typography variant="h6" gutterBottom fontWeight="medium">
                Informasi Dasar
              </Typography>

              <TextField
                label="Nama Tampilan"
                fullWidth
                variant="outlined"
                {...register("displayName", {
                  required: "Nama tampilan wajib diisi",
                  maxLength: {
                    value: 50,
                    message: "Nama tampilan harus kurang dari 50 karakter",
                  },
                })}
                error={!!errors.displayName}
                helperText={errors.displayName?.message}
                sx={{ mb: 3, mt: 2 }}
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
                    message: `Harus kurang dari ${MAX_BIO_LENGTH} karakter`,
                  },
                })}
                error={bioLength > MAX_BIO_LENGTH || !!errors.bio}
                helperText={
                  errors.bio?.message ||
                  `${bioLength}/${MAX_BIO_LENGTH} karakter`
                }
                sx={{
                  mb: 3,
                  "& .MuiFormHelperText-root": {
                    textAlign: "right",
                    mr: 0,
                    color:
                      bioLength > MAX_BIO_LENGTH * 0.8
                        ? bioLength > MAX_BIO_LENGTH
                          ? "error.main"
                          : "warning.main"
                        : "text.secondary",
                  },
                }}
              />

              <Box
                sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}
              >
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
                      label="Terbuka untuk Komisi"
                    />
                  )}
                />
              </Box>
            </Paper>

            {/* Tags */}
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: 2,
                border: "1px solid #e0e0e0",
                transition: "all 0.2s ease-in-out",
                "&:hover": {
                  boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                },
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                <Typography variant="h6" fontWeight="medium">
                  Tag
                </Typography>
                <Tooltip
                  title={`Tambahkan hingga ${MAX_TAGS} tag untuk membantu orang menemukan profil Anda`}
                >
                  <InfoOutlined
                    fontSize="small"
                    sx={{ ml: 1, color: "text.secondary" }}
                  />
                </Tooltip>
              </Box>

              <Box sx={{ mb: 2 }}>
                {tags.length === 0 ? (
                  <Typography variant="body2" color="text.secondary" mb={2}>
                    Tambahkan tag untuk membantu orang lain menemukan karya Anda
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
                          fontWeight: 500,
                          "& .MuiChip-deleteIcon": {
                            color: "primary.contrastText",
                            "&:hover": { color: "white" },
                          },
                        }}
                      />
                    ))}
                  </Box>
                )}

                <Box display="flex" gap={1}>
                  <TextField
                    fullWidth
                    placeholder="Tambahkan tag"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addTag();
                      }
                    }}
                    size="small"
                    disabled={tags.length >= MAX_TAGS}
                    helperText={
                      tags.length >= MAX_TAGS ? `Maksimal ${MAX_TAGS} tag` : ""
                    }
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <Button
                            onClick={addTag}
                            disabled={
                              !tagInput.trim() || tags.length >= MAX_TAGS
                            }
                            size="small"
                          >
                            Tambah
                          </Button>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Box>
              </Box>
            </Paper>

            {/* Social Links */}
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: 2,
                border: "1px solid #e0e0e0",
                transition: "all 0.2s ease-in-out",
                "&:hover": {
                  boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                },
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                <Typography variant="h6" fontWeight="medium">
                  Tautan Media Sosial
                </Typography>
                <Tooltip title="Hubungkan profil sosial Anda">
                  <InfoOutlined
                    fontSize="small"
                    sx={{ ml: 1, color: "text.secondary" }}
                  />
                </Tooltip>
              </Box>

              {socials.length === 0 ? (
                <Typography variant="body2" color="text.secondary" mb={2}>
                  Tambahkan tautan media sosial Anda agar orang lain dapat
                  terhubung dengan Anda
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
                        border: "1px solid #e0e0e0",
                        transition: "all 0.15s ease-in-out",
                        "&:hover": {
                          bgcolor: "#f9f9f9",
                          borderColor: "#d0d0d0",
                        },
                      }}
                    >
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: "bold",
                          minWidth: 100,
                          color: "text.secondary",
                        }}
                      >
                        {SOCIAL_PLATFORMS[
                          s.label as keyof typeof SOCIAL_PLATFORMS
                        ] || s.label}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          flex: 1,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {s.url}
                      </Typography>
                      <IconButton
                        onClick={() => removeSocial(i)}
                        size="small"
                        sx={{
                          color: "error.light",
                          "&:hover": {
                            color: "error.main",
                            bgcolor: "error.light",
                            opacity: 0.1,
                          },
                        }}
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
                  <MenuItem value="">Pilih platform</MenuItem>
                  {Object.entries(SOCIAL_PLATFORMS).map(([value, label]) => (
                    <MenuItem
                      key={value}
                      value={value}
                      disabled={socials.some((s) => s.label === value)}
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
                    ),
                  }}
                />

                <Button
                  onClick={addSocial}
                  variant="outlined"
                  disabled={!socialLabel || !socialUrl.trim()}
                  sx={{
                    height: 40,
                    minWidth: 0,
                    px: 1,
                  }}
                >
                  <Add />
                </Button>
              </Box>
            </Paper>
          </Stack>
        </Box>

        {error && (
          <Alert
            severity="error"
            sx={{
              mt: 2,
              borderRadius: 2,
            }}
          >
            {error}
          </Alert>
        )}
      </DialogContent>

      <Divider />
      <DialogActions sx={{ px: 3, py: 2, bgcolor: "background.paper" }}>
        <Button
          onClick={handleClose}
          disabled={loading}
          variant="outlined"
          sx={{
            borderRadius: 2,
          }}
        >
          Batal
        </Button>
        <Button
          onClick={handleSubmit(onSubmit)}
          variant="contained"
          disabled={loading || !hasChanges}
          startIcon={loading ? <CircularProgress size={16} /> : undefined}
          sx={{
            borderRadius: 2,
            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
            "&:hover": {
              boxShadow: "0 4px 10px rgba(0,0,0,0.2)",
            },
          }}
        >
          {loading ? "Menyimpan..." : "Simpan Perubahan"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

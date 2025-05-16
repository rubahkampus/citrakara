// src/components/dialogs/UploadArtDialog.tsx
import { useRef, useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Divider,
  Button,
  Paper,
  FormHelperText,
  CircularProgress,
  Alert,
  useMediaQuery,
  useTheme,
  Stack,
  Fade,
  Tooltip,
} from "@mui/material";
import {
  Close as CloseIcon,
  AddPhotoAlternate,
  Delete,
  Info as InfoIcon,
} from "@mui/icons-material";
import { KButton } from "@/components/KButton";
import { axiosClient } from "@/lib/utils/axiosClient";

// Types & Interfaces
interface Gallery {
  _id: string;
  name: string;
}

interface FormValues {
  galleryId: string;
  description: string;
}

interface UploadArtDialogProps {
  open: boolean;
  onClose: () => void;
  initialGalleryId?: string;
}

// Constants
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const SUPPORTED_FORMATS = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
];
const AUTO_CLOSE_DELAY = 1500; // 1.5 seconds

export default function UploadArtDialog({
  open,
  onClose,
  initialGalleryId,
}: UploadArtDialogProps) {
  // Hooks
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State
  const [galleries, setGalleries] = useState<Gallery[]>([]);
  const [galleriesLoading, setGalleriesLoading] = useState(false);
  const [images, setImages] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form
  const {
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isDirty },
  } = useForm<FormValues>({
    defaultValues: {
      galleryId: "",
      description: "",
    },
  });

  // Derived state
  const hasChanges = isDirty || images.length > 0;
  const canSubmit = images.length > 0 && hasChanges && !loading;

  // Fetch galleries on open
  useEffect(() => {
    if (!open) return;

    const fetchGalleries = async () => {
      setGalleriesLoading(true);

      try {
        const response = await axiosClient.get("/api/gallery");
        setGalleries(response.data.galleries || []);

        // Set gallery selection priority:
        // 1. initialGalleryId (prop)
        // 2. defaultGalleryId (localStorage)
        // 3. First gallery in the list
        if (initialGalleryId) {
          setValue("galleryId", initialGalleryId);
        } else {
          const defaultGalleryId = localStorage.getItem("defaultGalleryId");
          if (defaultGalleryId) {
            setValue("galleryId", defaultGalleryId);
            localStorage.removeItem("defaultGalleryId"); // Clear after use
          } else if (response.data.galleries?.length > 0) {
            setValue("galleryId", response.data.galleries[0]._id);
          }
        }
      } catch (error) {
        console.error("Error fetching galleries:", error);
        setError("Gagal memuat galeri");
      } finally {
        setGalleriesLoading(false);
      }
    };

    fetchGalleries();
  }, [open, setValue, initialGalleryId]);

  // File handling methods
  const handleAddImages = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    // Validate files
    const newFiles: File[] = [];
    const invalidFiles: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      // Check file type
      if (!SUPPORTED_FORMATS.includes(file.type)) {
        invalidFiles.push(`${file.name} (bukan gambar yang didukung)`);
        continue;
      }

      // Check file size
      if (file.size > MAX_FILE_SIZE) {
        invalidFiles.push(`${file.name} (melebihi batas 5MB)`);
        continue;
      }

      newFiles.push(file);
    }

    // Show error for invalid files
    if (invalidFiles.length > 0) {
      setError(
        `File berikut tidak dapat ditambahkan: ${invalidFiles.join(", ")}`
      );
    } else {
      setError(null);
    }

    // Add new files and create previews
    if (newFiles.length > 0) {
      const updatedImages = [...images, ...newFiles];
      setImages(updatedImages);

      // Create preview URLs
      const newPreviews = newFiles.map((file) => URL.createObjectURL(file));
      setPreviewUrls((prev) => [...prev, ...newPreviews]);
    }

    // Clear the input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemoveImage = (index: number) => {
    // Create new arrays without the removed item
    const newImages = [...images];
    const newPreviews = [...previewUrls];

    // Revoke the object URL to avoid memory leaks
    URL.revokeObjectURL(newPreviews[index]);

    // Remove the item
    newImages.splice(index, 1);
    newPreviews.splice(index, 1);

    // Update state
    setImages(newImages);
    setPreviewUrls(newPreviews);
  };

  // Dialog management
  const handleClose = () => {
    // Confirm if there are unsaved changes
    if (hasChanges) {
      if (
        window.confirm(
          "Anda memiliki perubahan yang belum disimpan. Yakin ingin menutup?"
        )
      ) {
        cleanupAndClose();
      }
    } else {
      cleanupAndClose();
    }
  };

  const cleanupAndClose = () => {
    // Clean up preview URLs
    previewUrls.forEach((url) => URL.revokeObjectURL(url));

    // Reset state
    reset();
    setImages([]);
    setPreviewUrls([]);
    setError(null);
    setSuccess(null);

    // Close dialog
    onClose();
  };

  // Form submission
  const onSubmit = async (data: FormValues) => {
    if (images.length === 0) {
      setError("Harap tambahkan minimal satu gambar");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Prepare form data
      const formData = new FormData();
      formData.append("galleryId", data.galleryId);
      formData.append("description", data.description);

      // Add all images
      images.forEach((image) => {
        formData.append("images[]", image);
      });

      await axiosClient.post("/api/gallery/post", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setSuccess("Karya berhasil diunggah");

      // Auto close after success
      setTimeout(() => {
        cleanupAndClose();
      }, AUTO_CLOSE_DELAY);
    } catch (err: any) {
      setError(
        err.response?.data?.error ||
          "Gagal mengunggah karya. Silakan coba lagi."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullScreen={fullScreen}
      fullWidth
      maxWidth="md"
      PaperProps={{
        sx: {
          borderRadius: fullScreen ? 0 : 2,
          overflow: "visible", // Allows tooltips to be visible outside dialog
        },
      }}
    >
      <DialogTitle
        sx={{
          py: 2,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Typography variant="h6" fontWeight="bold">
          Unggah Karya Baru
        </Typography>
        <IconButton onClick={handleClose} edge="end" aria-label="tutup">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <Divider />

      <DialogContent sx={{ py: 3 }}>
        {/* Status messages with Fade transition */}
        <Box sx={{ mb: 3 }}>
          {error && (
            <Fade in={!!error}>
              <Alert severity="error" onClose={() => setError(null)}>
                {error}
              </Alert>
            </Fade>
          )}

          {success && (
            <Fade in={!!success}>
              <Alert severity="success" onClose={() => setSuccess(null)}>
                {success}
              </Alert>
            </Fade>
          )}
        </Box>

        <form>
          {/* Gallery Selection */}
          <Controller
            name="galleryId"
            control={control}
            rules={{ required: "Silakan pilih galeri" }}
            render={({ field }) => (
              <FormControl fullWidth margin="normal" error={!!errors.galleryId}>
                <InputLabel id="gallery-select-label">Galeri</InputLabel>
                <Select
                  {...field}
                  labelId="gallery-select-label"
                  label="Galeri"
                  disabled={galleriesLoading}
                >
                  {galleriesLoading ? (
                    <MenuItem value="">
                      <CircularProgress size={20} sx={{ mr: 1 }} />
                      Memuat galeri...
                    </MenuItem>
                  ) : galleries.length === 0 ? (
                    <MenuItem value="" disabled>
                      Tidak ada galeri tersedia
                    </MenuItem>
                  ) : (
                    galleries.map((gallery) => (
                      <MenuItem key={gallery._id} value={gallery._id}>
                        {gallery.name}
                      </MenuItem>
                    ))
                  )}
                </Select>
                {errors.galleryId && (
                  <FormHelperText>{errors.galleryId.message}</FormHelperText>
                )}
              </FormControl>
            )}
          />

          {/* Description */}
          <Controller
            name="description"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Deskripsi"
                multiline
                rows={3}
                fullWidth
                margin="normal"
                placeholder="Deskripsikan karya Anda (opsional)"
              />
            )}
          />

          {/* Image Upload Section */}
          <Stack
            direction="row"
            alignItems="center"
            spacing={1}
            sx={{ mt: 3, mb: 1 }}
          >
            <Typography variant="subtitle1" fontWeight="medium">
              Gambar
            </Typography>
            <Tooltip title="Format yang didukung: JPG, PNG, GIF, WebP. Ukuran maksimum: 5MB per gambar.">
              <InfoIcon fontSize="small" color="action" />
            </Tooltip>
          </Stack>

          {/* Image preview grid */}
          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              gap: 2,
              mb: 2,
              minHeight: 150,
            }}
          >
            {/* Preview of uploaded images */}
            {previewUrls.map((url, index) => (
              <Paper
                key={index}
                elevation={2}
                sx={{
                  width: 150,
                  height: 150,
                  overflow: "hidden",
                  position: "relative",
                  borderRadius: 2,
                  transition: "transform 0.2s, box-shadow 0.2s",
                  "&:hover": {
                    transform: "translateY(-4px)",
                    boxShadow: 6,
                  },
                }}
              >
                <Box
                  component="img"
                  src={url}
                  alt={`Pratinjau ${index + 1}`}
                  sx={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />
                <Tooltip title="Hapus gambar">
                  <IconButton
                    onClick={() => handleRemoveImage(index)}
                    aria-label="hapus gambar"
                    sx={{
                      position: "absolute",
                      top: 4,
                      right: 4,
                      bgcolor: "rgba(0,0,0,0.5)",
                      color: "white",
                      "&:hover": {
                        bgcolor: "rgba(0,0,0,0.7)",
                      },
                      p: 0.5,
                    }}
                  >
                    <Delete fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Paper>
            ))}

            {/* Upload button */}
            <Tooltip title="Klik untuk menambahkan gambar">
              <Paper
                onClick={() => fileInputRef.current?.click()}
                elevation={1}
                sx={{
                  width: 150,
                  height: 150,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  border: "2px dashed",
                  borderColor: "divider",
                  borderRadius: 2,
                  p: 2,
                  transition: "all 0.2s ease",
                  "&:hover": {
                    borderColor: "primary.main",
                    bgcolor: "action.hover",
                    transform: "scale(1.03)",
                  },
                }}
              >
                <AddPhotoAlternate
                  sx={{ fontSize: 40, color: "text.secondary", mb: 1 }}
                />
                <Typography
                  variant="body2"
                  color="text.secondary"
                  align="center"
                >
                  Klik untuk menambah gambar
                </Typography>
              </Paper>
            </Tooltip>
          </Box>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            multiple
            style={{ display: "none" }}
            onChange={handleAddImages}
            aria-label="Unggah gambar"
          />
        </form>
      </DialogContent>

      <Divider />

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button
          onClick={handleClose}
          disabled={loading}
          variant="outlined"
          color="inherit"
        >
          Batal
        </Button>
        <KButton
          onClick={handleSubmit(onSubmit)}
          disabled={!canSubmit}
          loading={loading}
        >
          {loading ? "Mengunggah..." : "Unggah Karya"}
        </KButton>
      </DialogActions>
    </Dialog>
  );
}

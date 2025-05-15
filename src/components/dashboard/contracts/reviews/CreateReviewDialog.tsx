"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { axiosClient } from "@/lib/utils/axiosClient";
import {
  Box,
  Typography,
  Button,
  Alert,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Stack,
  Grid,
  Card,
  CardMedia,
  CardContent,
  TextField,
  Rating,
  Checkbox,
  FormControlLabel,
} from "@mui/material";
import StarIcon from "@mui/icons-material/Star";
import StarBorderIcon from "@mui/icons-material/StarBorder";

interface CreateReviewDialogProps {
  open: boolean;
  onClose: () => void;
  uploadId: string;
  contractId: string;
  uploadImages: string[];
  onSuccess: () => void;
}

interface ReviewFormData {
  rating: number;
  comment: string;
}

export default function CreateReviewDialog({
  open,
  onClose,
  uploadId,
  contractId,
  uploadImages,
  onSuccess,
}: CreateReviewDialogProps) {
  const [selectedImages, setSelectedImages] = useState<string[]>(
    uploadImages || []
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hover, setHover] = useState(-1);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ReviewFormData>({
    defaultValues: {
      rating: 0,
      comment: "",
    },
  });

  const handleClose = () => {
    reset();
    setSelectedImages(uploadImages || []);
    setError(null);
    onClose();
  };

  const toggleImageSelection = (imageUrl: string) => {
    setSelectedImages((prev) => {
      if (prev.includes(imageUrl)) {
        return prev.filter((url) => url !== imageUrl);
      } else {
        return [...prev, imageUrl];
      }
    });
  };

  const selectAllImages = (select: boolean) => {
    if (select) {
      setSelectedImages([...uploadImages]);
    } else {
      setSelectedImages([]);
    }
  };

  const onSubmit = async (data: ReviewFormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      await axiosClient.post(`/api/contract/${contractId}/uploads/final/${uploadId}/review`, {
        rating: data.rating,
        comment: data.comment,
        selectedImages,
      });

      onSuccess();
      handleClose();
    } catch (err: any) {
      setError(
        err.response?.data?.error ||
          err.message ||
          "Terjadi kesalahan saat mengirim ulasan"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const labels: { [index: number]: string } = {
    1: "Sangat Buruk",
    2: "Buruk",
    3: "Cukup",
    4: "Baik",
    5: "Sangat Baik",
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      scroll="paper"
    >
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogTitle sx={{ pb: 1 }}>
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <StarIcon sx={{ mr: 1, color: "warning.main" }} />
            Berikan Ulasan untuk Pesanan
          </Box>
        </DialogTitle>

        <DialogContent sx={{ pb: 1 }}>
          <DialogContentText sx={{ mb: 3 }}>
            Bagikan pengalaman Anda bekerja dengan seniman ini. Ulasan Anda
            membantu seniman lain dan klien membuat keputusan yang tepat.
          </DialogContentText>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <Box sx={{ mb: 4 }}>
            <Typography
              component="legend"
              variant="subtitle2"
              fontWeight="bold"
              gutterBottom
            >
              Peringkat
            </Typography>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                flexDirection: { xs: "column", sm: "row" },
                gap: { xs: 1, sm: 2 },
              }}
            >
              <Controller
                name="rating"
                control={control}
                rules={{ min: { value: 1, message: "Pilih peringkat" } }}
                render={({ field }) => (
                  <Rating
                    {...field}
                    size="large"
                    onChange={(_, value) => {
                      field.onChange(value);
                    }}
                    onChangeActive={(_, newHover) => {
                      setHover(newHover);
                    }}
                    emptyIcon={
                      <StarBorderIcon
                        style={{ opacity: 0.55 }}
                        fontSize="inherit"
                      />
                    }
                  />
                )}
              />
              {hover !== -1 ? (
                <Typography variant="body2" sx={{ ml: 2 }}>
                  {labels[hover]}
                </Typography>
              ) : (
                <Controller
                  name="rating"
                  control={control}
                  render={({ field }) => (
                    <Typography variant="body2" sx={{ ml: 2 }}>
                      {field.value > 0 ? labels[field.value] : ""}
                    </Typography>
                  )}
                />
              )}
            </Box>
            {errors.rating && (
              <Typography color="error" variant="caption">
                {errors.rating.message}
              </Typography>
            )}
          </Box>

          <Box sx={{ mb: 4 }}>
            <Typography
              component="legend"
              variant="subtitle2"
              fontWeight="bold"
              gutterBottom
            >
              Komentar Anda
            </Typography>
            <Controller
              name="comment"
              control={control}
              rules={{
                required: "Komentar diperlukan",
                minLength: {
                  value: 5,
                  message: "Berikan minimal 5 karakter",
                },
              }}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  multiline
                  rows={4}
                  placeholder="Bagikan pengalaman Anda bekerja dengan seniman ini..."
                  variant="outlined"
                  error={!!errors.comment}
                  helperText={errors.comment?.message}
                />
              )}
            />
          </Box>

          {uploadImages && uploadImages.length > 0 && (
            <Box sx={{ mb: 3 }}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 2,
                }}
              >
                <Typography
                  component="legend"
                  variant="subtitle2"
                  fontWeight="bold"
                >
                  Pilih Gambar untuk Ditampilkan
                </Typography>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={selectedImages.length === uploadImages.length}
                      indeterminate={
                        selectedImages.length > 0 &&
                        selectedImages.length < uploadImages.length
                      }
                      onChange={(e) => selectAllImages(e.target.checked)}
                    />
                  }
                  label="Pilih Semua"
                />
              </Box>

              <Grid container spacing={2}>
                {uploadImages.map((imageUrl, index) => (
                  <Grid item xs={6} sm={4} md={3} key={index}>
                    <Card
                      variant="outlined"
                      sx={{
                        position: "relative",
                        border: (theme) =>
                          selectedImages.includes(imageUrl)
                            ? `2px solid ${theme.palette.primary.main}`
                            : undefined,
                      }}
                      onClick={() => toggleImageSelection(imageUrl)}
                    >
                      <CardMedia
                        component="img"
                        image={imageUrl}
                        alt={`Gambar ${index + 1}`}
                        height={120}
                        sx={{
                          objectFit: "cover",
                          opacity: selectedImages.includes(imageUrl) ? 1 : 0.6,
                        }}
                      />
                      <Checkbox
                        checked={selectedImages.includes(imageUrl)}
                        sx={{
                          position: "absolute",
                          top: 0,
                          right: 0,
                          color: "white",
                          "&.Mui-checked": {
                            color: "primary.main",
                          },
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleImageSelection(imageUrl);
                        }}
                      />
                    </Card>
                  </Grid>
                ))}
              </Grid>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: "block", mt: 1 }}
              >
                Pilih gambar yang ingin Anda tampilkan di ulasan Anda. Anda
                dapat memilih beberapa, semua, atau tidak ada gambar.
              </Typography>
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={handleClose} color="inherit" disabled={isSubmitting}>
            Batal
          </Button>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={isSubmitting}
            startIcon={
              isSubmitting ? (
                <CircularProgress size={20} color="inherit" />
              ) : null
            }
          >
            {isSubmitting ? "Mengirim..." : "Kirim Ulasan"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

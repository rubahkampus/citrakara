// src/components/dialogs/TosDialog.tsx
"use client";

import { useState, useEffect } from "react";
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
  Paper,
} from "@mui/material";
import {
  Close as CloseIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Description as DescriptionIcon,
} from "@mui/icons-material";
import { KButton } from "@/components/KButton";
import { axiosClient } from "@/lib/utils/axiosClient";

// Types
type DialogMode =
  | "viewTos"
  | "editTos"
  | "createTos"
  | "view"
  | "edit"
  | "create";

interface TosSection {
  subtitle: string;
  text: string;
}

interface TosData {
  _id: string;
  title: string;
  content: TosSection[];
  isDefault?: boolean;
}

interface TosDialogProps {
  open: boolean;
  onClose: () => void;
  mode: DialogMode;
  tosId?: string;
  initialData?: TosData;
  isOwner?: boolean;
}

// Default values
const DEFAULT_SECTIONS: TosSection[] = [
  {
    subtitle: "Ketentuan Umum",
    text: "Persyaratan ini mengatur semua komisi yang diterima oleh artis.",
  },
  {
    subtitle: "Pembayaran",
    text: "Pembayaran diperlukan di muka sebelum pekerjaan dimulai. Tidak ada pengembalian dana setelah pekerjaan dimulai.",
  },
  {
    subtitle: "Hak Cipta",
    text: "Artis mempertahankan semua hak atas karya seni kecuali dinyatakan lain secara eksplisit.",
  },
  {
    subtitle: "Penggunaan",
    text: "Klien hanya dapat menggunakan karya yang ditugaskan untuk penggunaan pribadi, kecuali jika hak komersial dibeli.",
  },
  {
    subtitle: "Revisi",
    text: "Setiap komisi mencakup hingga 2 revisi. Revisi tambahan akan dikenakan biaya sesuai tarif per jam artis.",
  },
];

// Component
export default function TosDialog({
  open,
  onClose,
  mode,
  tosId,
  initialData,
  isOwner = false,
}: TosDialogProps) {
  // State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [sections, setSections] = useState<TosSection[]>([]);
  const [setAsDefault, setSetAsDefault] = useState(true);

  // Normalize the mode to handle both naming conventions
  const normalizedMode = mode.includes("view")
    ? "view"
    : mode.includes("edit")
    ? "edit"
    : "create";

  // Load existing or default data
  useEffect(() => {
    if (!open) return;

    setError(null);

    if (normalizedMode === "create") {
      setTitle("Syarat dan Ketentuan");
      setSections(DEFAULT_SECTIONS);
      setSetAsDefault(true);
      return;
    }

    if (initialData) {
      setTitle(initialData.title);
      setSections(initialData.content);
      setSetAsDefault(initialData.isDefault || false);
      return;
    }

    if (tosId) {
      setLoading(true);
      axiosClient
        .get(`/api/tos/${tosId}`)
        .then((res) => {
          const tos = res.data.tos;
          setTitle(tos.title);
          setSections(tos.content || []);
          setSetAsDefault(tos.isDefault || false);
        })
        .catch((err) =>
          setError(
            err.response?.data?.error || "Gagal memuat Syarat dan Ketentuan"
          )
        )
        .finally(() => setLoading(false));
    }
  }, [open, normalizedMode, tosId, initialData]);

  // Section handlers
  const handleAddSection = () => {
    setSections([...sections, { subtitle: "", text: "" }]);
  };

  const handleRemoveSection = (idx: number) => {
    setSections(sections.filter((_, i) => i !== idx));
  };

  const handleSectionChange = (
    idx: number,
    field: "subtitle" | "text",
    value: string
  ) => {
    const updatedSections = [...sections];
    updatedSections[idx][field] = value;
    setSections(updatedSections);
  };

  // Form submission
  const handleSubmit = async () => {
    // Validation
    if (!title.trim()) {
      setError("Judul diperlukan");
      return;
    }

    if (sections.some((s) => !s.subtitle.trim() || !s.text.trim())) {
      setError("Semua bagian harus diisi");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (normalizedMode === "edit" && tosId) {
        await axiosClient.patch(`/api/tos/${tosId}`, {
          title,
          content: sections,
          setAsDefault,
        });
      } else {
        await axiosClient.post("/api/tos", {
          title,
          content: sections,
          setAsDefault,
        });
      }
      onClose();
    } catch (err: any) {
      setError(
        err.response?.data?.error || "Gagal menyimpan Syarat dan Ketentuan"
      );
      setLoading(false);
    }
  };

  // Dialog title based on mode
  const getDialogTitle = () => {
    switch (normalizedMode) {
      case "view":
        return "Syarat dan Ketentuan";
      case "edit":
        return "Edit Syarat dan Ketentuan";
      default:
        return "Buat Syarat dan Ketentuan";
    }
  };

  // Render UI Components
  const renderContent = () => {
    if (loading) {
      return (
        <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
          <CircularProgress />
        </Box>
      );
    }

    if (normalizedMode === "view") {
      return (
        <>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: "bold" }}>
            {title}
          </Typography>

          {sections.map((sec, i) => (
            <Paper
              key={i}
              variant="outlined"
              sx={{
                mb: 2,
                p: 2,
                borderRadius: 1.5,
                transition: "all 0.2s ease-in-out",
                "&:hover": { boxShadow: 1 },
              }}
            >
              <Typography variant="h6" color="primary" gutterBottom>
                {sec.subtitle}
              </Typography>
              <Typography variant="body1" sx={{ whiteSpace: "pre-line" }}>
                {sec.text}
              </Typography>
            </Paper>
          ))}
        </>
      );
    }

    return (
      <Box>
        <TextField
          label="Judul"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          fullWidth
          required
          sx={{ mb: 3 }}
        />

        {sections.map((sec, i) => (
          <Paper
            key={i}
            elevation={0}
            sx={{
              mb: 3,
              p: 2.5,
              border: "1px solid",
              borderColor: "divider",
              borderRadius: 2,
              transition: "all 0.2s",
              "&:hover": { boxShadow: 1 },
            }}
          >
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                mb: 1.5,
                alignItems: "center",
              }}
            >
              <Typography variant="subtitle2">Bagian {i + 1}</Typography>
              {sections.length > 1 && (
                <IconButton
                  color="error"
                  onClick={() => handleRemoveSection(i)}
                  size="small"
                  sx={{
                    opacity: 0.7,
                    "&:hover": { opacity: 1 },
                  }}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              )}
            </Box>

            <TextField
              label="Judul Bagian"
              value={sec.subtitle}
              onChange={(e) =>
                handleSectionChange(i, "subtitle", e.target.value)
              }
              fullWidth
              required
              sx={{ mb: 2 }}
              size="small"
            />

            <TextField
              label="Konten"
              value={sec.text}
              onChange={(e) => handleSectionChange(i, "text", e.target.value)}
              fullWidth
              multiline
              rows={3}
              placeholder="Masukkan konten bagian di sini..."
            />
          </Paper>
        ))}

        <Box sx={{ textAlign: "center", mb: 2 }}>
          <Button
            startIcon={<AddIcon />}
            onClick={handleAddSection}
            sx={{ borderRadius: 2 }}
          >
            Tambah Bagian
          </Button>
        </Box>
      </Box>
    );
  };

  // Main dialog render
  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onClose}
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
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          px: 3,
          py: 2,
          bgcolor: "background.paper",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <DescriptionIcon sx={{ mr: 1.5, color: "primary.main" }} />
          <Typography variant="h6" sx={{ fontWeight: 500 }}>
            {getDialogTitle()}
          </Typography>
        </Box>
        <IconButton
          onClick={onClose}
          disabled={loading}
          sx={{ color: "text.secondary" }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ p: 3 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: 1 }}>
            {error}
          </Alert>
        )}

        {renderContent()}
      </DialogContent>

      <Divider />

      <DialogActions sx={{ px: 3, py: 2, justifyContent: "flex-end" }}>
        {normalizedMode === "view" ? (
          <KButton onClick={onClose}>Tutup</KButton>
        ) : (
          <>
            <Button
              onClick={onClose}
              disabled={loading}
              sx={{ mr: 1, borderRadius: 1 }}
            >
              Batalkan
            </Button>
            <KButton
              onClick={handleSubmit}
              loading={loading}
              sx={{ borderRadius: 1 }}
            >
              Simpan Perubahan
            </KButton>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
}

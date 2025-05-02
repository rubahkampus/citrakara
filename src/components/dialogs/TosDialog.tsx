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

// Update the type to match what DialogManager expects
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

export default function TosDialog({
  open,
  onClose,
  mode,
  tosId,
  initialData,
  isOwner = false,
}: TosDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [sections, setSections] = useState<TosSection[]>([]);
  const [setAsDefault, setSetAsDefault] = useState(true);

  // Normalize the mode to handle both naming conventions
  const normalizedMode =
    mode === "viewTos" || mode === "view"
      ? "view"
      : mode === "editTos" || mode === "edit"
      ? "edit"
      : "create";

  // Load existing or default data
  useEffect(() => {
    if (!open) return;
    setError(null);

    if (normalizedMode === "create") {
      setTitle("Terms of Service");
      setSections([
        {
          subtitle: "General Terms",
          text: "These terms govern all commissions accepted by the artist.",
        },
        {
          subtitle: "Payment",
          text: "Payment is required upfront before work begins. No refunds after work has started.",
        },
        {
          subtitle: "Rights",
          text: "The artist retains all rights to the artwork unless explicitly stated otherwise.",
        },
        {
          subtitle: "Usage",
          text: "The client may use the commissioned work for personal use only, unless commercial rights are purchased.",
        },
        {
          subtitle: "Revisions",
          text: "Each commission includes up to 2 revisions. Additional revisions will be charged at the artist's hourly rate.",
        },
      ]);
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
          setError(err.response?.data?.error || "Failed to load TOS")
        )
        .finally(() => setLoading(false));
    }
  }, [open, normalizedMode, tosId, initialData]);

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
    const copy = [...sections];
    copy[idx][field] = value;
    setSections(copy);
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      setError("Title is required");
      return;
    }

    if (sections.some((s) => !s.subtitle.trim() || !s.text.trim())) {
      setError("All sections must be filled");
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
      setError(err.response?.data?.error || "Failed to save TOS");
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="md"
      PaperProps={{ sx: { borderRadius: 2 } }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <DescriptionIcon sx={{ mr: 1, color: "primary.main" }} />
          <Typography variant="h6">
            {normalizedMode === "view"
              ? "Terms of Service"
              : normalizedMode === "edit"
              ? "Edit Terms of Service"
              : "Create Terms of Service"}
          </Typography>
        </Box>
        <IconButton onClick={onClose} disabled={loading}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <Divider />
      <DialogContent sx={{ py: 3 }}>
        {loading && (
          <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
            <CircularProgress />
          </Box>
        )}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        {!loading && !error && (
          <Box>
            {normalizedMode === "view" ? (
              <>
                <Typography
                  variant="h6"
                  gutterBottom
                  sx={{ fontWeight: "bold" }}
                >
                  {title}
                </Typography>

                {sections.map((sec, i) => (
                  <Paper key={i} variant="outlined" sx={{ mb: 2, p: 2 }}>
                    <Typography variant="h6" color="primary" gutterBottom>
                      {sec.subtitle}
                    </Typography>
                    <Typography variant="body1" sx={{ whiteSpace: "pre-line" }}>
                      {sec.text}
                    </Typography>
                  </Paper>
                ))}
              </>
            ) : (
              <Box>
                <TextField
                  label="Title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  fullWidth
                  required
                  sx={{ mb: 3 }}
                />
                {sections.map((sec, i) => (
                  <Paper
                    key={i}
                    sx={{
                      mb: 3,
                      p: 2,
                      border: "1px solid",
                      borderColor: "divider",
                      borderRadius: 2,
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        mb: 1,
                      }}
                    >
                      <Typography>Section {i + 1}</Typography>
                      {sections.length > 1 && (
                        <IconButton
                          color="error"
                          onClick={() => handleRemoveSection(i)}
                          size="small"
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      )}
                    </Box>
                    <TextField
                      label="Section Title"
                      value={sec.subtitle}
                      onChange={(e) =>
                        handleSectionChange(i, "subtitle", e.target.value)
                      }
                      fullWidth
                      required
                      sx={{ mb: 2 }}
                    />
                    <TextField
                      label="Content"
                      value={sec.text}
                      onChange={(e) =>
                        handleSectionChange(i, "text", e.target.value)
                      }
                      fullWidth
                      multiline
                      rows={3}
                    />
                  </Paper>
                ))}
                <Box sx={{ textAlign: "center", mb: 2 }}>
                  <Button startIcon={<AddIcon />} onClick={handleAddSection}>
                    Add Section
                  </Button>
                </Box>
              </Box>
            )}
          </Box>
        )}
      </DialogContent>
      <Divider />
      <DialogActions sx={{ px: 3, py: 2 }}>
        {normalizedMode === "view" ? (
          <KButton onClick={onClose}>Close</KButton>
        ) : (
          <>
            <Button onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <KButton onClick={handleSubmit} loading={loading}>
              Save Changes
            </KButton>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
}

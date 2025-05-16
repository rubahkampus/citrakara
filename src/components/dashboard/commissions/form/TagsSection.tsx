"use client";
import React, { useState } from "react";
import {
  Box,
  Chip,
  TextField,
  Button,
  Typography,
  Paper,
  Tooltip,
  Stack,
} from "@mui/material";
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Info as InfoIcon,
} from "@mui/icons-material";
import { useFormContext } from "react-hook-form";
import { CommissionFormValues } from "../CommissionFormPage";

// Constants
const POPULAR_TAGS = [
  "anime",
  "fantasy",
  "chibi",
  "portrait",
  "character-design",
  "furry",
  "fanart",
  "concept-art",
  "illustration",
  "cartoon",
];
const MAX_TAGS = 10;

const TagsSection = () => {
  // Form context
  const { setValue, watch } = useFormContext<CommissionFormValues>();
  const tags = watch("tags") || [];

  // Local state
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(true);

  // Filtered suggestions
  const availableSuggestions = POPULAR_TAGS.filter(
    (tag) => !tags.includes(tag)
  );

  // Tag validation
  const validateTag = (tag: string): boolean => {
    const trimmed = tag.trim().toLowerCase();

    if (!trimmed) {
      setError("Tag tidak boleh kosong");
      return false;
    }

    if (trimmed.length < 2) {
      setError("Tag minimal 2 karakter");
      return false;
    }

    if (trimmed.length > 20) {
      setError("Tag maksimal 20 karakter");
      return false;
    }

    if (tags.includes(trimmed)) {
      setError("Tag sudah ditambahkan");
      return false;
    }

    if (tags.length >= MAX_TAGS) {
      setError(`Maksimal ${MAX_TAGS} tag diperbolehkan`);
      return false;
    }

    setError(null);
    return true;
  };

  // Tag management handlers
  const addTag = () => {
    const trimmed = input.trim().toLowerCase();
    if (validateTag(trimmed)) {
      setValue("tags", [...tags, trimmed], {
        shouldDirty: true,
        shouldValidate: true,
      });
      setInput("");

      if (tags.length >= 4) {
        setShowSuggestions(false);
      }
    }
  };

  const removeTag = (tag: string) => {
    setValue(
      "tags",
      tags.filter((t) => t !== tag),
      { shouldDirty: true, shouldValidate: true }
    );

    if (tags.length <= 5) {
      setShowSuggestions(true);
    }
  };

  const addSuggestion = (tag: string) => {
    if (validateTag(tag)) {
      setValue("tags", [...tags, tag], {
        shouldDirty: true,
        shouldValidate: true,
      });

      if (tags.length >= 4) {
        setShowSuggestions(false);
      }
    }
  };

  const clearAllTags = () => {
    if (confirm("Apakah Anda yakin ingin menghapus semua tag?")) {
      setValue("tags", [], {
        shouldDirty: true,
        shouldValidate: true,
      });
      setShowSuggestions(true);
    }
  };

  // Event handlers
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag();
    }
  };

  const toggleSuggestions = () => {
    setShowSuggestions(!showSuggestions);
  };

  return (
    <Box>
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
        }}
      >
        <Typography variant="h6" fontWeight="bold">
          Tag
        </Typography>

        {tags.length > 0 && (
          <Tooltip title="Hapus semua tag">
            <Button
              variant="text"
              color="error"
              size="small"
              onClick={clearAllTags}
              startIcon={<DeleteIcon />}
            >
              Hapus Semua
            </Button>
          </Tooltip>
        )}
      </Box>

      {/* Description */}
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Tambahkan tag untuk membantu klien potensial menemukan komisi Anda.
        Maksimal {MAX_TAGS} tag.
      </Typography>

      {/* Tag Input */}
      <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
        <TextField
          label="Tambah tag"
          size="small"
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            setError(null);
          }}
          onKeyDown={handleKeyDown}
          fullWidth
          error={!!error}
          helperText={error || `${tags.length}/${MAX_TAGS} tag digunakan`}
          placeholder="Masukkan tag dan tekan Enter atau Tambah"
          disabled={tags.length >= MAX_TAGS}
          InputProps={{
            endAdornment: (
              <Button
                variant="contained"
                size="small"
                onClick={addTag}
                disabled={tags.length >= MAX_TAGS || !input.trim()}
                sx={{ ml: 1 }}
              >
                Tambah
              </Button>
            ),
          }}
        />
      </Box>

      {/* Current Tags Display */}
      <Paper
        variant="outlined"
        sx={{ p: 2, mb: 3, borderRadius: 2, minHeight: 60 }}
      >
        {tags.length > 0 ? (
          <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", gap: 1 }}>
            {tags.map((tag) => (
              <Chip
                key={tag}
                label={tag}
                onDelete={() => removeTag(tag)}
                color="primary"
                variant="outlined"
                sx={{ m: 0.5 }}
              />
            ))}
          </Stack>
        ) : (
          <Typography variant="body2" color="text.secondary" align="center">
            Belum ada tag yang ditambahkan. Tag membantu klien menemukan komisi
            Anda.
          </Typography>
        )}
      </Paper>

      {/* Popular Tag Suggestions */}
      {availableSuggestions.length > 0 && (
        <Box>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 1,
            }}
          >
            <Typography variant="subtitle2" color="text.secondary">
              <InfoIcon
                fontSize="small"
                sx={{ mr: 0.5, verticalAlign: "middle" }}
              />
              Tag Populer
            </Typography>
            <Button size="small" onClick={toggleSuggestions} variant="text">
              {showSuggestions ? "Sembunyikan" : "Tampilkan"} Saran
            </Button>
          </Box>

          {showSuggestions && (
            <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
              <Stack
                direction="row"
                spacing={1}
                sx={{ flexWrap: "wrap", gap: 0.5 }}
              >
                {availableSuggestions.slice(0, 8).map((tag) => (
                  <Chip
                    key={tag}
                    label={tag}
                    onClick={() => addSuggestion(tag)}
                    variant="outlined"
                    clickable
                    color="secondary"
                    size="small"
                    sx={{ m: 0.5 }}
                    disabled={tags.length >= MAX_TAGS}
                  />
                ))}
              </Stack>
            </Paper>
          )}
        </Box>
      )}
    </Box>
  );
};

export default TagsSection;

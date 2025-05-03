"use client";
import React, { useState, useEffect } from "react";
import {
  Box,
  Chip,
  TextField,
  Button,
  Typography,
  Paper,
  Divider,
  IconButton,
  Tooltip,
  Alert,
  Stack,
} from "@mui/material";
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Info as InfoIcon,
} from "@mui/icons-material";
import { useFormContext } from "react-hook-form";
import { CommissionFormValues } from "../CommissionFormPage";

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

const TagsSection: React.FC = () => {
  const { setValue, watch } = useFormContext<CommissionFormValues>();
  const tags = watch("tags") || [];
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(true);

  // Filter out suggestions that are already selected
  const availableSuggestions = POPULAR_TAGS.filter(
    (tag) => !tags.includes(tag)
  );

  const validateTag = (tag: string): boolean => {
    const trimmed = tag.trim().toLowerCase();

    // Check if empty
    if (!trimmed) {
      setError("Tag cannot be empty");
      return false;
    }

    // Check for length
    if (trimmed.length < 2) {
      setError("Tag must be at least 2 characters");
      return false;
    }

    if (trimmed.length > 20) {
      setError("Tag must be less than 20 characters");
      return false;
    }

    // Check if already exists
    if (tags.includes(trimmed)) {
      setError("Tag already added");
      return false;
    }

    // Check max tags limit
    if (tags.length >= MAX_TAGS) {
      setError(`Maximum ${MAX_TAGS} tags allowed`);
      return false;
    }

    // Valid tag
    setError(null);
    return true;
  };

  const addTag = () => {
    const trimmed = input.trim().toLowerCase();
    if (validateTag(trimmed)) {
      setValue("tags", [...tags, trimmed], {
        shouldDirty: true,
        shouldValidate: true,
      });
      setInput("");
      // Hide suggestions after adding a few tags
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

    // Show suggestions again if removing brings us under threshold
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

      // Hide suggestions after adding a few tags
      if (tags.length >= 4) {
        setShowSuggestions(false);
      }
    }
  };

  const clearAllTags = () => {
    if (confirm("Are you sure you want to remove all tags?")) {
      setValue("tags", [], {
        shouldDirty: true,
        shouldValidate: true,
      });
      setShowSuggestions(true);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag();
    }
  };

  // Toggle suggestions visibility
  const toggleSuggestions = () => {
    setShowSuggestions(!showSuggestions);
  };

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
        }}
      >
        <Typography variant="h6" fontWeight="bold">
          Tags
        </Typography>

        {tags.length > 0 && (
          <Tooltip title="Clear all tags">
            <Button
              variant="text"
              color="error"
              size="small"
              onClick={clearAllTags}
              startIcon={<DeleteIcon />}
            >
              Clear All
            </Button>
          </Tooltip>
        )}
      </Box>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Add tags to help potential clients find your commission. Maximum{" "}
        {MAX_TAGS} tags.
      </Typography>

      <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
        <TextField
          label="Add tag"
          size="small"
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            setError(null);
          }}
          onKeyDown={handleKeyDown}
          fullWidth
          error={!!error}
          helperText={error || `${tags.length}/${MAX_TAGS} tags used`}
          placeholder="Enter a tag and press Enter or Add"
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
                Add
              </Button>
            ),
          }}
        />
      </Box>

      {/* Current tags */}
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
            No tags added yet. Tags help clients find your commissions.
          </Typography>
        )}
      </Paper>

      {/* Popular tag suggestions */}
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
              Popular Tags
            </Typography>
            <Button size="small" onClick={toggleSuggestions} variant="text">
              {showSuggestions ? "Hide" : "Show"} Suggestions
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

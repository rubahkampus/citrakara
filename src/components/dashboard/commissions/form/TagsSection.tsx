"use client";
import React, { useState } from "react";
import { Box, Chip, TextField, Button, Typography, Stack } from "@mui/material";
import { useFormContext } from "react-hook-form";
import { CommissionFormValues } from "../CommissionFormPage";

const TagsSection: React.FC = () => {
  const { setValue, watch } = useFormContext<CommissionFormValues>();
  const tags = watch("tags") || [];
  const [input, setInput] = useState("");

  const addTag = () => {
    const trimmed = input.trim();
    if (!trimmed || tags.includes(trimmed)) return;
    setValue("tags", [...tags, trimmed]);
    setInput("");
  };

  const removeTag = (tag: string) => {
    setValue(
      "tags",
      tags.filter((t) => t !== tag)
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag();
    }
  };

  return (
    <Box>
      <Typography variant="h6" fontWeight="bold" gutterBottom>
        Tags
      </Typography>

      <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
        <TextField
          label="Add tag"
          size="small"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          fullWidth
        />
        <Button variant="contained" onClick={addTag}>
          Add
        </Button>
      </Box>

      <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", gap: 1 }}>
        {tags.map((tag) => (
          <Chip
            key={tag}
            label={tag}
            onDelete={() => removeTag(tag)}
            sx={{ margin: "2px" }}
          />
        ))}
        {tags.length === 0 && (
          <Typography variant="body2" color="text.secondary">
            No tags added yet
          </Typography>
        )}
      </Stack>
    </Box>
  );
};

export default TagsSection;

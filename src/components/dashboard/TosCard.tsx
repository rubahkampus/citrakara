// src/components/dashboard/TosCard.tsx
"use client";

import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Button,
  Skeleton,
  Alert,
  Divider,
} from "@mui/material";
import {
  Description as DescriptionIcon,
  Edit as EditIcon,
  Visibility as VisibilityIcon,
} from "@mui/icons-material";
import { axiosClient } from "@/lib/utils/axiosClient";
import { useDialogStore } from "@/lib/stores";

interface TosCardProps {
  username: string;
  isOwner?: boolean;
}

interface TosData {
  _id: string;
  title: string;
  content: Array<{ subtitle: string; text: string }>;
  updatedAt: string;
}

export default function TosCard({ username, isOwner = false }: TosCardProps) {
  const [tos, setTos] = useState<TosData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const openDialog = useDialogStore((state) => state.open);

  // Load default TOS
  const fetchTos = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await axiosClient.get("/api/tos/default");
      setTos(response.data.tos);
    } catch (err: any) {
      if (err.response?.status !== 404) {
        setError("Failed to load Terms of Service");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTos();
  }, []);

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return "N/A";
    }
  };

  const handleView = () => {
    if (tos) openDialog("viewTos", tos._id, tos, isOwner);
  };

  const handleEdit = () => {
    if (tos) {
      openDialog("editTos", tos._id, tos, isOwner);
    } else {
      openDialog("createTos", undefined, undefined, isOwner);
    }
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2, sm: 3 },
        borderRadius: 2,
        border: "1px solid",
        borderColor: "divider",
        mb: 3,
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
        <DescriptionIcon sx={{ mr: 1, color: "primary.main" }} />
        <Typography variant="h6" fontWeight="bold">
          Terms of Service
        </Typography>
      </Box>

      <Divider sx={{ mb: 2 }} />

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ p: 2 }}>
          <Skeleton variant="text" width="60%" height={24} />
          <Skeleton variant="text" width="40%" height={20} />
        </Box>
      ) : tos ? (
        <Box>
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle1" fontWeight="medium">
              {tos.title}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {tos.content.length} sections • Last updated{" "}
              {formatDate(tos.updatedAt)}
            </Typography>
          </Box>

          <Box sx={{ display: "flex", gap: 2 }}>
            <Button
              startIcon={<VisibilityIcon />}
              onClick={handleView}
              variant="outlined"
              size="small"
            >
              View
            </Button>
            {isOwner && (
              <Button
                startIcon={<EditIcon />}
                onClick={handleEdit}
                variant="contained"
                size="small"
              >
                Edit
              </Button>
            )}
          </Box>
        </Box>
      ) : (
        <Box
          sx={{
            p: 2,
            textAlign: "center",
            borderRadius: 1,
            bgcolor: "background.default",
          }}
        >
          <Typography variant="body2" color="text.secondary" gutterBottom>
            You haven't created a Terms of Service yet. Create one to use in
            your commissions.
          </Typography>
          {isOwner && (
            <Button onClick={handleEdit} variant="contained">
              Create TOS
            </Button>
          )}
        </Box>
      )}
    </Paper>
  );
}

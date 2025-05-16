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
  Stack,
} from "@mui/material";
import {
  Description as DescriptionIcon,
  Edit as EditIcon,
  Visibility as VisibilityIcon,
} from "@mui/icons-material";
import { axiosClient } from "@/lib/utils/axiosClient";
import { useDialogStore } from "@/lib/stores";

// Types
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

// Main component
export default function TosCard({ username, isOwner = false }: TosCardProps) {
  // State
  const [tos, setTos] = useState<TosData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const openDialog = useDialogStore((state) => state.open);

  // Helpers
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return "T/A";
    }
  };

  // Data fetching
  const fetchTos = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axiosClient.get("/api/tos/default");
      setTos(response.data.tos);
    } catch (err: any) {
      if (err.response?.status !== 404) {
        setError("Gagal memuat Syarat dan Ketentuan");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTos();
  }, []);

  // Event handlers
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

  // UI Components
  const CardHeader = () => (
    <>
      <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
        <DescriptionIcon sx={{ mr: 1, color: "primary.main" }} />
        <Typography variant="h6" fontWeight="bold">
          Syarat dan Ketentuan
        </Typography>
      </Box>
      <Divider sx={{ mb: 2 }} />
    </>
  );

  const LoadingState = () => (
    <Box sx={{ p: 2 }}>
      <Skeleton variant="text" width="60%" height={24} />
      <Skeleton variant="text" width="40%" height={20} />
    </Box>
  );

  const EmptyState = () => (
    <Box
      sx={{
        p: 2,
        textAlign: "center",
        borderRadius: 1,
        bgcolor: "background.default",
      }}
    >
      <Typography variant="body2" color="text.secondary" gutterBottom>
        Anda belum membuat Syarat dan Ketentuan. Buat dokumen untuk digunakan
        dalam komisi Anda.
      </Typography>
      {isOwner && (
        <Button onClick={handleEdit} variant="contained" sx={{ mt: 1 }}>
          Buat S&K
        </Button>
      )}
    </Box>
  );

  const ContentState = () => (
    <Box>
      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle1" fontWeight="medium">
          {tos?.title}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {tos?.content.length} bagian • Terakhir diperbarui{" "}
          {formatDate(tos?.updatedAt || "")}
        </Typography>
      </Box>

      <Stack direction="row" spacing={2}>
        <Button
          startIcon={<VisibilityIcon />}
          onClick={handleView}
          variant="outlined"
          size="small"
        >
          Lihat
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
      </Stack>
    </Box>
  );

  // Render
  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2, sm: 3 },
        borderRadius: 2,
        border: "1px solid",
        borderColor: "divider",
        mb: 3,
        transition: "all 0.2s ease-in-out",
        "&:hover": {
          boxShadow: "0 4px 8px rgba(0,0,0,0.08)",
        },
      }}
    >
      <CardHeader />

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {loading ? <LoadingState /> : tos ? <ContentState /> : <EmptyState />}
    </Paper>
  );
}

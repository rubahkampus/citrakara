// src/components/dashboard/contracts/ContractStatusBadge.tsx
"use client";

import React from "react";
import { Chip, Tooltip, Box, Typography } from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import CancelIcon from "@mui/icons-material/Cancel";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";

interface ContractStatusBadgeProps {
  status: string;
  size?: "small" | "medium";
}

const ContractStatusBadge: React.FC<ContractStatusBadgeProps> = ({
  status,
  size = "small",
}) => {
  interface StatusConfig {
    color:
      | "default"
      | "primary"
      | "secondary"
      | "error"
      | "info"
      | "success"
      | "warning";
    icon: React.ElementType;
    label: string;
    description: string;
  }

  const getStatusConfig = (status: string): StatusConfig => {
    const configs: Record<string, StatusConfig> = {
      active: {
        color: "primary",
        icon: HourglassEmptyIcon,
        label: "Aktif",
        description: "Kontrak ini sedang dalam proses.",
      },
      completed: {
        color: "success",
        icon: CheckCircleIcon,
        label: "Selesai",
        description: "Kontrak ini telah berhasil diselesaikan tepat waktu.",
      },
      completedLate: {
        color: "success",
        icon: AccessTimeIcon,
        label: "Selesai (Terlambat)",
        description: "Kontrak ini diselesaikan setelah tenggat waktu asli.",
      },
      cancelledClient: {
        color: "error",
        icon: CancelIcon,
        label: "Dibatalkan oleh Klien",
        description: "Klien telah membatalkan kontrak ini.",
      },
      cancelledClientLate: {
        color: "error",
        icon: CancelIcon,
        label: "Dibatalkan oleh Klien (Terlambat)",
        description:
          "Klien telah membatalkan kontrak ini setelah tenggat waktu berlalu.",
      },
      cancelledArtist: {
        color: "error",
        icon: CancelIcon,
        label: "Dibatalkan oleh Seniman",
        description: "Seniman telah membatalkan kontrak ini.",
      },
      cancelledArtistLate: {
        color: "error",
        icon: CancelIcon,
        label: "Dibatalkan oleh Seniman (Terlambat)",
        description:
          "Seniman telah membatalkan kontrak ini setelah tenggat waktu berlalu.",
      },
      notCompleted: {
        color: "error",
        icon: ErrorIcon,
        label: "Tidak Selesai",
        description: "Kontrak ini tidak diselesaikan pada tenggat waktu.",
      },
    };

    return (
      configs[status] || {
        color: "default",
        icon: HourglassEmptyIcon,
        label: status.charAt(0).toUpperCase() + status.slice(1),
        description: "Status kontrak",
      }
    );
  };

  const config = getStatusConfig(status);
  const IconComponent = config.icon;

  return (
    <Tooltip title={config.description} arrow placement="top">
      <Chip
        icon={<IconComponent fontSize="small" />}
        label={config.label}
        color={config.color}
        size={size}
        sx={{
          borderRadius: "16px",
          fontWeight: "medium",
          "& .MuiChip-icon": {
            color: "inherit",
            marginLeft: "6px",
          },
          boxShadow:
            status === "active" ? "0 0 0 1px rgba(25, 118, 210, 0.3)" : "none",
          animation: status === "active" ? "pulse 2s infinite" : "none",
          "@keyframes pulse": {
            "0%": {
              boxShadow: "0 0 0 0 rgba(25, 118, 210, 0.4)",
            },
            "70%": {
              boxShadow: "0 0 0 6px rgba(25, 118, 210, 0)",
            },
            "100%": {
              boxShadow: "0 0 0 0 rgba(25, 118, 210, 0)",
            },
          },
        }}
      />
    </Tooltip>
  );
};

export default ContractStatusBadge;

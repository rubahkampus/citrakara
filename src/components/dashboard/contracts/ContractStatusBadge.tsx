// src/components/dashboard/contracts/ContractStatusBadge.tsx
"use client";

import React from "react";
import { Chip, Tooltip, useTheme } from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import CancelIcon from "@mui/icons-material/Cancel";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";
import PersonIcon from "@mui/icons-material/Person";
import BrushIcon from "@mui/icons-material/Brush";

// Types
interface ContractStatusBadgeProps {
  status: string;
  size?: "small" | "medium";
}

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

// Constants
const STATUS_CONFIGS: Record<string, StatusConfig> = {
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
    icon: PersonIcon,
    label: "Dibatalkan oleh Klien",
    description: "Klien telah membatalkan kontrak ini.",
  },
  cancelledClientLate: {
    color: "error",
    icon: PersonIcon,
    label: "Dibatalkan oleh Klien (Terlambat)",
    description:
      "Klien telah membatalkan kontrak ini setelah tenggat waktu berlalu.",
  },
  cancelledArtist: {
    color: "error",
    icon: BrushIcon,
    label: "Dibatalkan oleh Seniman",
    description: "Seniman telah membatalkan kontrak ini.",
  },
  cancelledArtistLate: {
    color: "error",
    icon: BrushIcon,
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

// Default status config
const DEFAULT_STATUS_CONFIG: StatusConfig = {
  color: "default",
  icon: HourglassEmptyIcon,
  label: "Status Tidak Dikenal",
  description: "Status kontrak tidak dikenali.",
};

// Helper function
const capitalizeFirstLetter = (string: string): string => {
  return string.charAt(0).toUpperCase() + string.slice(1);
};

// Component
const ContractStatusBadge: React.FC<ContractStatusBadgeProps> = ({
  status,
  size = "small",
}) => {
  const theme = useTheme();

  // Get status configuration
  const getStatusConfig = (status: string): StatusConfig => {
    if (STATUS_CONFIGS[status]) {
      return STATUS_CONFIGS[status];
    }

    // If status not found, return a custom default with capitalized label
    return {
      ...DEFAULT_STATUS_CONFIG,
      label: capitalizeFirstLetter(status),
    };
  };

  const config = getStatusConfig(status);
  const IconComponent = config.icon;

  // Determine animation styles based on status
  const isActive = status === "active";
  const isError = [
    "cancelledClient",
    "cancelledClientLate",
    "cancelledArtist",
    "cancelledArtistLate",
    "notCompleted",
  ].includes(status);
  const isCompleted = ["completed", "completedLate"].includes(status);

  // Custom animation and styling based on status type
  const getCustomStyles = () => {
    if (isActive) {
      return {
        boxShadow: `0 0 0 1px ${theme.palette.primary.main}40`,
        animation: "pulse 2s infinite",
        "&:hover": {
          boxShadow: `0 0 0 1px ${theme.palette.primary.main}60`,
          transform: "translateY(-1px)",
        },
        "@keyframes pulse": {
          "0%": {
            boxShadow: `0 0 0 0 ${theme.palette.primary.main}40`,
          },
          "70%": {
            boxShadow: `0 0 0 5px ${theme.palette.primary.main}00`,
          },
          "100%": {
            boxShadow: `0 0 0 0 ${theme.palette.primary.main}00`,
          },
        },
      };
    } else if (isError) {
      return {
        boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
        "&:hover": {
          boxShadow: "0 2px 5px rgba(0,0,0,0.15)",
          transform: "translateY(-1px)",
        },
      };
    } else if (isCompleted) {
      return {
        boxShadow: `0 0 0 1px ${theme.palette.success.light}30`,
        "&:hover": {
          boxShadow: `0 0 0 1px ${theme.palette.success.light}50`,
          transform: "translateY(-1px)",
        },
      };
    }

    return {
      "&:hover": {
        transform: "translateY(-1px)",
      },
    };
  };

  return (
    <Tooltip
      title={config.description}
      arrow
      placement="top"
      enterDelay={500}
      leaveDelay={200}
    >
      <Chip
        icon={<IconComponent fontSize="small" />}
        label={config.label}
        color={config.color}
        size={size}
        sx={{
          borderRadius: "16px",
          fontWeight: 500,
          transition: "all 0.2s ease-in-out",
          "& .MuiChip-icon": {
            color: "inherit",
            marginLeft: "6px",
          },
          ...getCustomStyles(),
        }}
      />
    </Tooltip>
  );
};

export default ContractStatusBadge;

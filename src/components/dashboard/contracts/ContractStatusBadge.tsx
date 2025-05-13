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
        label: "Active",
        description: "This contract is currently in progress.",
      },
      completed: {
        color: "success",
        icon: CheckCircleIcon,
        label: "Completed",
        description: "This contract has been successfully completed on time.",
      },
      completedLate: {
        color: "success",
        icon: AccessTimeIcon,
        label: "Completed (Late)",
        description: "This contract was completed after the original deadline.",
      },
      cancelledClient: {
        color: "error",
        icon: CancelIcon,
        label: "Cancelled by Client",
        description: "The client has cancelled this contract.",
      },
      cancelledClientLate: {
        color: "error",
        icon: CancelIcon,
        label: "Cancelled by Client (Late)",
        description:
          "The client has cancelled this contract after the deadline passed.",
      },
      cancelledArtist: {
        color: "error",
        icon: CancelIcon,
        label: "Cancelled by Artist",
        description: "The artist has cancelled this contract.",
      },
      cancelledArtistLate: {
        color: "error",
        icon: CancelIcon,
        label: "Cancelled by Artist (Late)",
        description:
          "The artist has cancelled this contract after the deadline passed.",
      },
      notCompleted: {
        color: "error",
        icon: ErrorIcon,
        label: "Not Completed",
        description: "This contract was not completed by the deadline.",
      },
    };

    return (
      configs[status] || {
        color: "default",
        icon: HourglassEmptyIcon,
        label: status.charAt(0).toUpperCase() + status.slice(1),
        description: "Contract status",
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

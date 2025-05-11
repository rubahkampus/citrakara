// src/components/dashboard/contracts/ContractStatusBadge.tsx
import React from "react";
import { Chip } from "@mui/material";

interface ContractStatusBadgeProps {
  status: string;
}

const ContractStatusBadge: React.FC<ContractStatusBadgeProps> = ({
  status,
}) => {
  const getStatusColor = (status: string) => {
    const statusMap: Record<string, string> = {
      active: "primary",
      completed: "success",
      completedLate: "success",
      cancelledClient: "error",
      cancelledClientLate: "error",
      cancelledArtist: "error",
      cancelledArtistLate: "error",
      notCompleted: "error",
    };

    return statusMap[status] || "default";
  };

  const getStatusLabel = (status: string) => {
    const statusLabels: Record<string, string> = {
      active: "Active",
      completed: "Completed",
      completedLate: "Completed (Late)",
      cancelledClient: "Cancelled by Client",
      cancelledClientLate: "Cancelled by Client (Late)",
      cancelledArtist: "Cancelled by Artist",
      cancelledArtistLate: "Cancelled by Artist (Late)",
      notCompleted: "Not Completed",
    };

    return statusLabels[status] || status;
  };

  return (
    <Chip
      label={getStatusLabel(status)}
      color={getStatusColor(status) as any}
      size="small"
    />
  );
};

export default ContractStatusBadge;

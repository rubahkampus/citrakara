"use client";

import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Button,
  Box,
  Typography,
  useTheme,
} from "@mui/material";
import { useRouter } from "next/navigation";
import { IResolutionTicket } from "@/lib/db/models/ticket.model";
import {
  VisibilityOutlined as ViewIcon,
  ArrowForward as ArrowIcon,
} from "@mui/icons-material";

// Constants for display formats
const TARGET_TYPE_MAP = {
  cancelTicket: {
    display: "Pembatalan",
    color: "error",
  },
  revisionTicket: {
    display: "Revisi",
    color: "info",
  },
  changeTicket: {
    display: "Permintaan Perubahan",
    color: "secondary",
  },
  finalUpload: {
    display: "Pengiriman Akhir",
    color: "success",
  },
  progressMilestoneUpload: {
    display: "Unggahan Progres",
    color: "warning",
  },
  revisionUpload: {
    display: "Unggahan Revisi",
    color: "info",
  },
};

const STATUS_MAP = {
  open: {
    display: "Terbuka",
    color: "primary",
  },
  awaitingReview: {
    display: "Menunggu Tinjauan",
    color: "warning",
  },
  resolved: {
    display: "Terselesaikan",
    color: "success",
  },
  cancelled: {
    display: "Dibatalkan",
    color: "error",
  },
};

interface ResolutionListTableProps {
  tickets: IResolutionTicket[];
  username: string;
  userId: string;
  emptyMessage: string;
}

export default function ResolutionListTable({
  tickets,
  username,
  userId,
  emptyMessage,
}: ResolutionListTableProps) {
  const router = useRouter();
  const theme = useTheme();

  // Navigate to ticket details
  const handleViewTicket = (ticketId: string) => {
    router.push(`/${username}/dashboard/resolution/${ticketId}`);
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("id-ID", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Get status chip color and display text
  const getStatusInfo = (status: string, decision?: string) => {
    const statusInfo = STATUS_MAP[status as keyof typeof STATUS_MAP] || {
      display: status,
      color: "default",
    };

    // Handle special case for resolved status with decision
    if (status === "resolved" && decision) {
      return {
        display:
          decision === "favorClient"
            ? "Terselesaikan (Klien)"
            : "Terselesaikan (Artis)",
        color: statusInfo.color,
      };
    }

    return statusInfo;
  };

  // Get target type display info
  const getTargetTypeInfo = (type: string) => {
    const typeInfo = TARGET_TYPE_MAP[type as keyof typeof TARGET_TYPE_MAP];

    if (typeInfo) {
      return typeInfo;
    }

    // Default behavior for unknown types
    return {
      display: type.charAt(0).toUpperCase() + type.slice(1),
      color: "default",
    };
  };

  // Check if the user needs to respond to a ticket
  const needsResponse = (ticket: IResolutionTicket) => {
    return (
      ticket.status === "open" &&
      ticket.submittedById.toString() !== userId &&
      !ticket.counterDescription
    );
  };

  // Render empty state
  if (tickets.length === 0) {
    return (
      <Box
        sx={{
          p: 4,
          textAlign: "center",
          bgcolor: "background.paper",
          borderRadius: 2,
          boxShadow: theme.shadows[1],
          transition: "box-shadow 0.2s",
          "&:hover": {
            boxShadow: theme.shadows[2],
          },
        }}
      >
        <Typography variant="body1" color="text.secondary">
          {emptyMessage}
        </Typography>
      </Box>
    );
  }

  // Column definitions for better organization
  const columns = [
    { id: "date", label: "Tanggal" },
    { id: "contract", label: "Kontrak" },
    { id: "type", label: "Tipe" },
    { id: "submittedBy", label: "Diajukan Oleh" },
    { id: "status", label: "Status" },
    { id: "action", label: "Tindakan", align: "center" },
  ];

  return (
    <TableContainer
      component={Paper}
      sx={{
        borderRadius: 2,
        boxShadow: theme.shadows[1],
        overflow: "hidden",
        transition: "box-shadow 0.2s",
        "&:hover": {
          boxShadow: theme.shadows[2],
        },
      }}
    >
      <Table size="medium">
        <TableHead
          sx={{
            bgcolor: theme.palette.background.default,
            "& .MuiTableRow-root": {
              borderBottom: `2px solid ${theme.palette.divider}`,
            },
          }}
        >
          <TableRow>
            {columns.map((column) => (
              <TableCell
                key={column.id}
                align={column.align as any}
                sx={{
                  fontWeight: "bold",
                  py: 1.5,
                  whiteSpace: "nowrap",
                }}
              >
                {column.label}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {tickets.map((ticket) => {
            const requiresResponse = needsResponse(ticket);
            const targetTypeInfo = getTargetTypeInfo(ticket.targetType);
            const statusInfo = getStatusInfo(ticket.status, ticket.decision);

            return (
              <TableRow
                key={ticket._id.toString()}
                sx={{
                  transition: "background-color 0.2s",
                  "&:hover": {
                    backgroundColor: theme.palette.action.hover,
                  },
                  ...(requiresResponse && {
                    backgroundColor: `${theme.palette.warning.lighter}`,
                  }),
                }}
              >
                <TableCell>{formatDate(ticket.createdAt.toString())}</TableCell>
                <TableCell>
                  {/* Truncate contract ID for display */}
                  {ticket.contractId
                    ? `${ticket.contractId.toString().substring(0, 8)}...`
                    : "N/A"}
                </TableCell>
                <TableCell>
                  <Chip
                    label={targetTypeInfo.display}
                    size="small"
                    variant="outlined"
                    color={targetTypeInfo.color as any}
                    sx={{
                      borderRadius: "16px",
                      fontWeight: 500
                    }}
                  />
                </TableCell>
                <TableCell>
                  <Chip
                    label={
                      ticket.submittedById.toString() === userId
                        ? "Anda"
                        : ticket.submittedBy === "client"
                        ? "Klien"
                        : "Artis"
                    }
                    size="small"
                    variant="filled"
                    sx={{
                      borderRadius: "16px",
                      bgcolor:
                        ticket.submittedById.toString() === userId
                          ? theme.palette.primary.lighter
                          : theme.palette.grey[200],
                      color:
                        ticket.submittedById.toString() === userId
                          ? theme.palette.primary.dark
                          : theme.palette.text.secondary,
                      fontWeight: 500,
                      transition: "all 0.2s",
                      "&:hover": {
                        boxShadow: `0 0 0 1px ${
                          ticket.submittedById.toString() === userId
                            ? theme.palette.primary.main
                            : theme.palette.grey[400]
                        }`,
                      },
                    }}
                  />
                </TableCell>
                <TableCell>
                  <Chip
                    label={statusInfo.display}
                    size="small"
                    color={statusInfo.color as any}
                    sx={{
                      borderRadius: "16px",
                      fontWeight: 500,
                      transition: "all 0.2s"
                    }}
                  />
                </TableCell>
                <TableCell align="center">
                  <Button
                    variant={requiresResponse ? "contained" : "outlined"}
                    size="small"
                    onClick={() => handleViewTicket(ticket._id.toString())}
                    endIcon={requiresResponse ? <ArrowIcon /> : <ViewIcon />}
                    color={requiresResponse ? "warning" : "primary"}
                    sx={{
                      minWidth: 100,
                      borderRadius: "8px",
                      textTransform: "none",
                      py: 0.5,
                      fontWeight: 500,
                      transition: "all 0.2s",
                      boxShadow: requiresResponse ? 2 : 0,
                      "&:hover": {
                        boxShadow: requiresResponse ? 3 : 1,
                      },
                    }}
                  >
                    {requiresResponse ? "Merespon" : "Lihat"}
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

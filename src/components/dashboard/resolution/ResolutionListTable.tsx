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
    return new Date(dateString).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Get status chip color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "primary";
      case "awaitingReview":
        return "warning";
      case "resolved":
        return "success";
      case "cancelled":
        return "error";
      default:
        return "default";
    }
  };

  // Get target type display name
  const getTargetTypeDisplay = (type: string): string => {
    switch (type) {
      case "cancelTicket":
        return "Cancellation";
      case "revisionTicket":
        return "Revision";
      case "changeTicket":
        return "Change Request";
      case "finalUpload":
        return "Final Delivery";
      case "progressMilestoneUpload":
        return "Progress Upload";
      case "revisionUpload":
        return "Revision Upload";
      default:
        return type.charAt(0).toUpperCase() + type.slice(1);
    }
  };

  // Get target type chip color
  const getTargetTypeColor = (targetType: string) => {
    switch (targetType) {
      case "cancelTicket":
        return "error";
      case "revisionTicket":
      case "revisionUpload":
        return "info";
      case "changeTicket":
        return "secondary";
      case "finalUpload":
        return "success";
      case "progressMilestone":
        return "warning";
      default:
        return "default";
    }
  };

  // Check if the user needs to respond to a ticket
  const needsResponse = (ticket: IResolutionTicket) => {
    return (
      ticket.status === "open" &&
      ticket.submittedById.toString() !== userId &&
      !ticket.counterDescription
    );
  };

  if (tickets.length === 0) {
    return (
      <Box
        sx={{
          p: 4,
          textAlign: "center",
          bgcolor: "background.paper",
          borderRadius: 1,
          boxShadow: theme.shadows[1],
        }}
      >
        <Typography variant="body1" color="text.secondary">
          {emptyMessage}
        </Typography>
      </Box>
    );
  }

  return (
    <TableContainer
      component={Paper}
      sx={{
        borderRadius: 1,
        boxShadow: theme.shadows[1],
        overflow: "hidden",
      }}
    >
      <Table size="medium">
        <TableHead sx={{ bgcolor: theme.palette.background.default }}>
          <TableRow>
            <TableCell sx={{ fontWeight: "bold" }}>Date</TableCell>
            <TableCell sx={{ fontWeight: "bold" }}>Contract</TableCell>
            <TableCell sx={{ fontWeight: "bold" }}>Type</TableCell>
            <TableCell sx={{ fontWeight: "bold" }}>Submitted By</TableCell>
            <TableCell sx={{ fontWeight: "bold" }}>Status</TableCell>
            <TableCell align="center" sx={{ fontWeight: "bold" }}>
              Action
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {tickets.map((ticket) => (
            <TableRow
              key={ticket._id.toString()}
              sx={{
                "&:hover": {
                  backgroundColor: "background.paper",
                },
                ...(needsResponse(ticket) && {
                  backgroundColor: theme.palette.warning.lighter,
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
                  label={getTargetTypeDisplay(ticket.targetType)}
                  size="small"
                  variant="outlined"
                  color={getTargetTypeColor(ticket.targetType) as any}
                />
              </TableCell>
              <TableCell>
                <Chip
                  label={
                    ticket.submittedById.toString() === userId
                      ? "You"
                      : ticket.submittedBy === "client"
                      ? "Client"
                      : "Artist"
                  }
                  size="small"
                  variant="filled"
                  sx={{
                    bgcolor:
                      ticket.submittedById.toString() === userId
                        ? theme.palette.primary.lighter
                        : theme.palette.grey[200],
                    color:
                      ticket.submittedById.toString() === userId
                        ? theme.palette.primary.dark
                        : theme.palette.text.secondary,
                    fontWeight: "medium",
                  }}
                />
              </TableCell>
              <TableCell>
                <Chip
                  label={
                    ticket.status === "open"
                      ? "Open"
                      : ticket.status === "awaitingReview"
                      ? "Awaiting Review"
                      : ticket.status === "resolved"
                      ? ticket.decision === "favorClient"
                        ? "Resolved (Client)"
                        : "Resolved (Artist)"
                      : "Cancelled"
                  }
                  size="small"
                  color={getStatusColor(ticket.status) as any}
                />
              </TableCell>
              <TableCell align="center">
                <Button
                  variant={needsResponse(ticket) ? "contained" : "outlined"}
                  size="small"
                  onClick={() => handleViewTicket(ticket._id.toString())}
                  endIcon={needsResponse(ticket) ? <ArrowIcon /> : <ViewIcon />}
                  color={needsResponse(ticket) ? "warning" : "primary"}
                  sx={{
                    minWidth: 100,
                    borderRadius: 1,
                  }}
                >
                  {needsResponse(ticket) ? "Respond" : "View"}
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

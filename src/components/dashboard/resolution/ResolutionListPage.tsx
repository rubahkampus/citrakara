// src/omponents/dashboard/resolution/ResolutionListPage.tsx
"use client";

import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Button,
  Alert,
  CircularProgress,
} from "@mui/material";
import { useRouter } from "next/navigation";

// Types for the props passed to this component
interface ResolutionListPageProps {
  username: string;
  tickets: ResolutionTicket[];
  userId: string;
}

// Types for the resolution ticket
interface ResolutionTicket {
  _id: string;
  contractId: string;
  submittedBy: "client" | "artist";
  submittedById: string;
  targetType: "cancel" | "revision" | "final" | "milestone";
  targetId: string;
  description: string;
  proofImages?: string[];
  counterparty: "client" | "artist";
  counterDescription?: string;
  counterProofImages?: string[];
  counterExpiresAt: string;
  status: "open" | "awaitingReview" | "resolved" | "cancelled";
  decision?: "favorClient" | "favorArtist";
  resolutionNote?: string;
  resolvedBy?: string;
  resolvedAt?: string;
  createdAt: string;
}

export default function ResolutionListPage({
  username,
  tickets,
  userId,
}: ResolutionListPageProps) {
  const router = useRouter();
  const [tabValue, setTabValue] = useState(0);
  const [filteredTickets, setFilteredTickets] = useState<ResolutionTicket[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Filter tickets based on the selected tab
  useEffect(() => {
    if (tabValue === 0) {
      // All tickets
      setFilteredTickets(tickets);
    } else if (tabValue === 1) {
      // Submitted by me
      setFilteredTickets(
        tickets.filter((ticket) => ticket.submittedById === userId)
      );
    } else if (tabValue === 2) {
      // Responding to
      setFilteredTickets(
        tickets.filter((ticket) => ticket.submittedById !== userId)
      );
    } else if (tabValue === 3) {
      // Open tickets
      setFilteredTickets(tickets.filter((ticket) => ticket.status === "open"));
    } else if (tabValue === 4) {
      // Awaiting admin review
      setFilteredTickets(
        tickets.filter((ticket) => ticket.status === "awaitingReview")
      );
    } else if (tabValue === 5) {
      // Resolved tickets
      setFilteredTickets(
        tickets.filter((ticket) => ticket.status === "resolved")
      );
    }
  }, [tabValue, tickets, userId]);

  // Navigate to ticket details
  const handleViewTicket = (ticketId: string) => {
    router.push(`/${username}/dashboard/resolution/${ticketId}`);
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
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

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="All" />
          <Tab label="Submitted by me" />
          <Tab label="Responding to" />
          <Tab label="Open" />
          <Tab label="Awaiting Review" />
          <Tab label="Resolved" />
        </Tabs>
      </Box>

      {isLoading ? (
        <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
          <CircularProgress />
        </Box>
      ) : filteredTickets.length === 0 ? (
        <Typography variant="body1" align="center" sx={{ py: 4 }}>
          No resolution tickets found in this category.
        </Typography>
      ) : (
        <TableContainer component={Paper} sx={{ mb: 4 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Contract</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Submitted By</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredTickets.map((ticket) => (
                <TableRow key={ticket._id}>
                  <TableCell>{formatDate(ticket.createdAt)}</TableCell>
                  <TableCell>
                    {/* Truncate contract ID for display */}
                    {ticket.contractId
                      ? `${ticket.contractId.substring(0, 8)}...`
                      : "N/A"}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={
                        ticket.targetType.charAt(0).toUpperCase() +
                        ticket.targetType.slice(1)
                      }
                      size="small"
                      variant="outlined"
                      color={
                        ticket.targetType === "cancel"
                          ? "error"
                          : ticket.targetType === "revision"
                          ? "info"
                          : ticket.targetType === "final"
                          ? "success"
                          : "warning"
                      }
                    />
                  </TableCell>
                  <TableCell>
                    {ticket.submittedById === userId
                      ? "You"
                      : ticket.submittedBy}
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
                      color={getStatusColor(ticket.status)}
                    />
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => handleViewTicket(ticket._id)}
                    >
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Box sx={{ mb: 2 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          Resolution tickets are used to resolve disputes between clients and
          artists.
        </Typography>
        <Typography variant="body2" color="text.secondary">
          If you need to escalate an issue with a contract, please use the
          "Request Resolution" button on the contract page.
        </Typography>
      </Box>
    </Box>
  );
}

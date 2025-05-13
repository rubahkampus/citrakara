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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
} from "@mui/material";
import { useRouter } from "next/navigation";

// Types for the props passed to this component
interface AdminResolutionListPageProps {
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
  targetType:
    | "cancel"
    | "revision"
    | "change"
    | "final"
    | "milestone"
    | "progressMilestone"
    | "revisionUpload";
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

export default function AdminResolutionListPage({
  username,
  tickets,
  userId,
}: AdminResolutionListPageProps) {
  const router = useRouter();
  const [tabValue, setTabValue] = useState(0);
  const [statusFilter, setStatusFilter] = useState<string>("awaitingReview");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [filteredTickets, setFilteredTickets] = useState<ResolutionTicket[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    if (newValue === 0) {
      setStatusFilter("awaitingReview");
    } else if (newValue === 1) {
      setStatusFilter("open");
    } else if (newValue === 2) {
      setStatusFilter("resolved");
    } else if (newValue === 3) {
      setStatusFilter("all");
    }
  };

  // Handle status filter change
  const handleStatusFilterChange = (event: SelectChangeEvent) => {
    setStatusFilter(event.target.value);
  };

  // Handle type filter change
  const handleTypeFilterChange = (event: SelectChangeEvent) => {
    setTypeFilter(event.target.value);
  };

  // Fetch tickets from API
  const fetchTickets = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Build query params
      let queryParams = new URLSearchParams();

      if (statusFilter !== "all") {
        queryParams.append("status", statusFilter);
      }

      if (typeFilter !== "all") {
        queryParams.append("targetType", typeFilter);
      }

      const response = await fetch(
        `/api/admin/resolution?${queryParams.toString()}`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch tickets: ${response.statusText}`);
      }

      const data = await response.json();
      setFilteredTickets(data);
    } catch (err) {
      console.error("Error fetching tickets:", err);
      setError(err instanceof Error ? err.message : "Failed to load tickets");
      // Fall back to the provided tickets
      setFilteredTickets(filterTickets(tickets));
    } finally {
      setIsLoading(false);
    }
  };

  // Filter tickets based on current filters
  const filterTickets = (ticketsToFilter: ResolutionTicket[]) => {
    return ticketsToFilter.filter((ticket) => {
      // Status filter
      if (statusFilter !== "all" && ticket.status !== statusFilter) {
        return false;
      }

      // Type filter
      if (typeFilter !== "all" && ticket.targetType !== typeFilter) {
        return false;
      }

      return true;
    });
  };

  // Apply filters when they change or when refresh is triggered
  useEffect(() => {
    if (tickets.length > 0) {
      // Try to fetch from API first
      fetchTickets();
    } else {
      setFilteredTickets([]);
    }
  }, [statusFilter, typeFilter, refreshTrigger]);

  // Initialize with provided tickets
  useEffect(() => {
    setFilteredTickets(filterTickets(tickets));
  }, [tickets]);

  // Navigate to ticket details
  const handleViewTicket = (ticketId: string) => {
    router.push(`/${username}/dashboard/admin-resolution/${ticketId}`);
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

  // Get type display name
  const getTypeDisplayName = (type: string) => {
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

  // Get chip color for target type
  const getTypeChipColor = (type: string) => {
    switch (type) {
      case "cancelTicket":
        return "error";
      case "revisionTicket":
      case "revisionUpload":
        return "info";
      case "changeTicket":
        return "secondary";
      case "finalUpload":
        return "success";
      case "progressMilestoneUpload":
        return "warning";
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

      {/* Tabs for quick filtering */}
      <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="Awaiting Review" />
          <Tab label="Open" />
          <Tab label="Resolved" />
          <Tab label="All Tickets" />
        </Tabs>
      </Box>

      {/* Additional filters */}
      <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>Status</InputLabel>
          <Select
            value={statusFilter}
            label="Status"
            onChange={handleStatusFilterChange}
          >
            <MenuItem value="all">All Statuses</MenuItem>
            <MenuItem value="open">Open</MenuItem>
            <MenuItem value="awaitingReview">Awaiting Review</MenuItem>
            <MenuItem value="resolved">Resolved</MenuItem>
            <MenuItem value="cancelled">Cancelled</MenuItem>
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>Type</InputLabel>
          <Select
            value={typeFilter}
            label="Type"
            onChange={handleTypeFilterChange}
          >
            <MenuItem value="all">All Types</MenuItem>
            <MenuItem value="cancel">Cancellation</MenuItem>
            <MenuItem value="revision">Revision</MenuItem>
            <MenuItem value="change">Change Request</MenuItem>
            <MenuItem value="final">Final Delivery</MenuItem>
            <MenuItem value="milestone">Milestone</MenuItem>
            <MenuItem value="progressMilestone">Progress Upload</MenuItem>
            <MenuItem value="revisionUpload">Revision Upload</MenuItem>
          </Select>
        </FormControl>

        <Button
          variant="outlined"
          onClick={() => setRefreshTrigger((prev) => prev + 1)}
          disabled={isLoading}
        >
          Refresh
        </Button>
      </Box>

      {isLoading ? (
        <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
          <CircularProgress />
        </Box>
      ) : filteredTickets.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: "center" }}>
          <Typography variant="body1">
            No resolution tickets found matching your criteria.
          </Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper} sx={{ mb: 4 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Contract ID</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Parties</TableCell>
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
                      label={getTypeDisplayName(ticket.targetType)}
                      size="small"
                      variant="outlined"
                      color={getTypeChipColor(ticket.targetType)}
                    />
                  </TableCell>
                  <TableCell>
                    {`${
                      ticket.submittedBy.charAt(0).toUpperCase() +
                      ticket.submittedBy.slice(1)
                    } vs ${
                      ticket.counterparty.charAt(0).toUpperCase() +
                      ticket.counterparty.slice(1)
                    }`}
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
                      disabled={isLoading}
                    >
                      {ticket.status === "awaitingReview" ? "Resolve" : "View"}
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
          As an administrator, you are responsible for resolving disputes
          between clients and artists.
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Tickets with "Awaiting Review" status require your decision. Please
          review all evidence carefully before making a judgment.
        </Typography>
        <Alert severity="info" sx={{ mt: 2 }}>
          <Typography variant="body2">
            <strong>Note:</strong> Your decisions impact the escrow fund
            distribution and contract status. All decisions are logged for audit
            purposes.
          </Typography>
        </Alert>
      </Box>
    </Box>
  );
}

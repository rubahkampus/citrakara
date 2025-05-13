"use client";

import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Paper,
  Alert,
  CircularProgress,
  Badge,
  useTheme,
  Divider,
} from "@mui/material";
import {
  Gavel as GavelIcon,
  Send as SentIcon,
  Inbox as InboxIcon,
  AccessTime as PendingIcon,
  Visibility as VisibilityIcon,
  CheckCircle as ResolvedIcon,
} from "@mui/icons-material";

import { IResolutionTicket } from "@/lib/db/models/ticket.model";
import ResolutionListTable from "./ResolutionListTable";
import ResolutionListSkeleton from "./ResolutionListSkeleton";

// Types for the props passed to this component
interface ResolutionListPageProps {
  username: string;
  tickets: IResolutionTicket[];
  userId: string;
  loading?: boolean;
}

export default function ResolutionListPage({
  username,
  tickets,
  userId,
  loading = false,
}: ResolutionListPageProps) {
  const theme = useTheme();
  const [tabValue, setTabValue] = useState(0);
  const [filteredTickets, setFilteredTickets] = useState<IResolutionTicket[]>(
    []
  );
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
        tickets.filter((ticket) => ticket.submittedById.toString() === userId)
      );
    } else if (tabValue === 2) {
      // Responding to
      setFilteredTickets(
        tickets.filter((ticket) => ticket.submittedById.toString() !== userId)
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

  // Calculate counts for the badges
  const countByCategory = {
    all: tickets.length,
    submitted: tickets.filter(
      (ticket) => ticket.submittedById.toString() === userId
    ).length,
    responding: tickets.filter(
      (ticket) => ticket.submittedById.toString() !== userId
    ).length,
    open: tickets.filter((ticket) => ticket.status === "open").length,
    awaiting: tickets.filter((ticket) => ticket.status === "awaitingReview")
      .length,
    resolved: tickets.filter((ticket) => ticket.status === "resolved").length,
  };

  if (loading) {
    return <ResolutionListSkeleton />;
  }

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Paper
        sx={{
          borderRadius: 1,
          overflow: "hidden",
          mb: 3,
          boxShadow: theme.shadows[1],
        }}
      >
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ borderBottom: 1, borderColor: "divider" }}
        >
          <Tab
            label={
              <Badge
                badgeContent={countByCategory.all}
                color="primary"
                max={99}
                showZero
              >
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  <GavelIcon sx={{ mr: 0.5, fontSize: 18 }} />
                  <span style={{ marginRight: 8 }}>All</span>
                </Box>
              </Badge>
            }
          />
          <Tab
            label={
              <Badge
                badgeContent={countByCategory.submitted}
                color="secondary"
                max={99}
                showZero
              >
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  <SentIcon sx={{ mr: 0.5, fontSize: 18 }} />
                  <span style={{ marginRight: 8 }}>Submitted</span>
                </Box>
              </Badge>
            }
          />
          <Tab
            label={
              <Badge
                badgeContent={countByCategory.responding}
                color="info"
                max={99}
                showZero
              >
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  <InboxIcon sx={{ mr: 0.5, fontSize: 18 }} />
                  <span style={{ marginRight: 8 }}>Responding</span>
                </Box>
              </Badge>
            }
          />
          <Tab
            label={
              <Badge
                badgeContent={countByCategory.open}
                color="primary"
                max={99}
                showZero
              >
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  <PendingIcon sx={{ mr: 0.5, fontSize: 18 }} />
                  <span style={{ marginRight: 8 }}>Open</span>
                </Box>
              </Badge>
            }
          />
          <Tab
            label={
              <Badge
                badgeContent={countByCategory.awaiting}
                color="warning"
                max={99}
                showZero
              >
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  <VisibilityIcon sx={{ mr: 0.5, fontSize: 18 }} />
                  <span style={{ marginRight: 8 }}>Awaiting Review</span>
                </Box>
              </Badge>
            }
          />
          <Tab
            label={
              <Badge
                badgeContent={countByCategory.resolved}
                color="success"
                max={99}
                showZero
              >
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  <ResolvedIcon sx={{ mr: 0.5, fontSize: 18 }} />
                  <span style={{ marginRight: 8 }}>Resolved</span>
                </Box>
              </Badge>
            }
          />
        </Tabs>
      </Paper>

      <ResolutionListTable
        tickets={filteredTickets}
        username={username}
        userId={userId}
        emptyMessage={`No resolution tickets found in this category.`}
      />

      <Paper sx={{ p: 2, borderRadius: 1, mt: 4, bgcolor: "background.paper" }}>
        <Typography
          variant="subtitle1"
          color="primary"
          gutterBottom
          fontWeight="medium"
        >
          About Dispute Resolution
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          Resolution tickets are used to resolve disputes between clients and
          artists when there's a disagreement about contract deliverables or
          terms.
        </Typography>
        <Typography variant="body2" color="text.secondary">
          If you need to escalate an issue with a contract, please use the{" "}
          <strong>"Open Dispute"</strong> button on the contract's tickets page.
          Both parties will have 24 hours to provide evidence before an admin
          reviews the case.
        </Typography>
      </Paper>
    </Box>
  );
}

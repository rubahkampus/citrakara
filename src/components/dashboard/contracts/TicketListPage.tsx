// src/components/dashboard/contracts/TicketsListPage.tsx
'use client'

import React, { useState } from "react";
import {
  Box,
  Typography,
  Tabs,
  Tab,
  List,
  ListItem,
  Paper,
  Chip,
  Button,
  Stack,
  Divider,
} from "@mui/material";
import Link from "next/link";
import { IContract } from "@/lib/db/models/contract.model";

interface TicketsListPageProps {
  username: string;
  contractId: string;
  tickets: {
    cancel: any[];
    revision: any[];
    change: any[];
    resolution: any[];
  };
  isArtist: boolean;
  isClient: boolean;
  contractStatus: string;
}

const TicketsListPage: React.FC<TicketsListPageProps> = ({
  username,
  contractId,
  tickets,
  isArtist,
  isClient,
  contractStatus,
}) => {
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const isActive = contractStatus === "active";

  // Format date helper
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString();
  };

  const getStatusColor = (status: string) => {
    const statusMap: Record<string, string> = {
      pending: "warning",
      accepted: "success",
      paid: "success",
      forcedAcceptedArtist: "success",
      forcedAcceptedClient: "success",
      forcedAccepted: "success",
      rejected: "error",
      cancelled: "error",
      disputed: "warning",
      open: "primary",
      awaitingReview: "warning",
      resolved: "success",
    };

    return statusMap[status] || "default";
  };

  return (
    <Box>
      <Box
        mb={3}
        display="flex"
        justifyContent="space-between"
        alignItems="center"
      >
        <Typography variant="h6">Contract Tickets</Typography>

        {isActive && (
          <Stack direction="row" spacing={1}>
            {isClient && (
              <>
                <Link
                  href={`/${username}/dashboard/contracts/${contractId}/tickets/cancel/new`}
                  passHref
                >
                  <Button size="small" variant="outlined" color="error">
                    Cancel Contract
                  </Button>
                </Link>
                <Link
                  href={`/${username}/dashboard/contracts/${contractId}/tickets/revision/new`}
                  passHref
                >
                  <Button size="small" variant="outlined">
                    Request Revision
                  </Button>
                </Link>
                <Link
                  href={`/${username}/dashboard/contracts/${contractId}/tickets/change/new`}
                  passHref
                >
                  <Button size="small" variant="outlined">
                    Request Change
                  </Button>
                </Link>
              </>
            )}

            {isArtist && (
              <Link
                href={`/${username}/dashboard/contracts/${contractId}/tickets/cancel/new`}
                passHref
              >
                <Button size="small" variant="outlined" color="error">
                  Cancel Contract
                </Button>
              </Link>
            )}

            <Link
              href={`/${username}/dashboard/contracts/${contractId}/tickets/resolution/new`}
              passHref
            >
              <Button size="small" variant="outlined" color="warning">
                Open Dispute
              </Button>
            </Link>
          </Stack>
        )}
      </Box>

      <Tabs value={tabValue} onChange={handleTabChange} sx={{ mb: 2 }}>
        <Tab label="All" />
        <Tab label={`Cancellation (${tickets.cancel.length})`} />
        <Tab label={`Revision (${tickets.revision.length})`} />
        <Tab label={`Change (${tickets.change.length})`} />
        <Tab label={`Resolution (${tickets.resolution.length})`} />
      </Tabs>

      {tabValue === 0 && (
        <AllTicketsList
          tickets={tickets}
          username={username}
          contractId={contractId}
          formatDate={formatDate}
          getStatusColor={getStatusColor}
        />
      )}

      {tabValue === 1 && (
        <CancelTicketsList
          tickets={tickets.cancel}
          username={username}
          contractId={contractId}
          formatDate={formatDate}
          getStatusColor={getStatusColor}
        />
      )}

      {tabValue === 2 && (
        <RevisionTicketsList
          tickets={tickets.revision}
          username={username}
          contractId={contractId}
          formatDate={formatDate}
          getStatusColor={getStatusColor}
        />
      )}

      {tabValue === 3 && (
        <ChangeTicketsList
          tickets={tickets.change}
          username={username}
          contractId={contractId}
          formatDate={formatDate}
          getStatusColor={getStatusColor}
        />
      )}

      {tabValue === 4 && (
        <ResolutionTicketsList
          tickets={tickets.resolution}
          username={username}
          contractId={contractId}
          formatDate={formatDate}
          getStatusColor={getStatusColor}
        />
      )}
    </Box>
  );
};

// All tickets list component
const AllTicketsList = ({
  tickets,
  username,
  contractId,
  formatDate,
  getStatusColor,
}: any) => {
  const allTickets = [
    ...tickets.cancel.map((ticket: any) => ({ ...ticket, type: "cancel" })),
    ...tickets.revision.map((ticket: any) => ({ ...ticket, type: "revision" })),
    ...tickets.change.map((ticket: any) => ({ ...ticket, type: "change" })),
    ...tickets.resolution.map((ticket: any) => ({
      ...ticket,
      type: "resolution",
    })),
  ].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  if (allTickets.length === 0) {
    return (
      <Box p={3} textAlign="center">
        <Typography color="textSecondary">
          No tickets found for this contract
        </Typography>
      </Box>
    );
  }

  return (
    <List>
      {allTickets.map((ticket: any) => (
        <Paper key={ticket._id.toString()} sx={{ mb: 2 }} elevation={1}>
          <ListItem
            component={Link}
            href={`/${username}/dashboard/contracts/${contractId}/tickets/${ticket.type}/${ticket._id}`}
            sx={{
              display: "block",
              textDecoration: "none",
              color: "inherit",
              p: 2,
              "&:hover": {
                backgroundColor: "rgba(0, 0, 0, 0.04)",
              },
            }}
          >
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
              mb={1}
            >
              <Box display="flex" alignItems="center">
                <Typography
                  variant="subtitle1"
                  component="span"
                  fontWeight="bold"
                  mr={1}
                >
                  {ticket.type.charAt(0).toUpperCase() + ticket.type.slice(1)}{" "}
                  Ticket
                </Typography>
                <Chip
                  size="small"
                  label={ticket.status}
                  color={getStatusColor(ticket.status)}
                />
              </Box>
              <Typography variant="body2" color="textSecondary">
                Created: {formatDate(ticket.createdAt)}
              </Typography>
            </Box>

            {ticket.type === "cancel" && (
              <Typography variant="body2">
                Requested by: {ticket.requestedBy}
              </Typography>
            )}

            {ticket.type === "revision" && (
              <Typography variant="body2" noWrap>
                {ticket.description?.substring(0, 100)}
                {ticket.description?.length > 100 ? "..." : ""}
              </Typography>
            )}

            {ticket.type === "change" && (
              <Typography variant="body2" noWrap>
                {ticket.reason?.substring(0, 100)}
                {ticket.reason?.length > 100 ? "..." : ""}
              </Typography>
            )}

            {ticket.type === "resolution" && (
              <Typography variant="body2">
                Target: {ticket.targetType}, Submitted by: {ticket.submittedBy}
              </Typography>
            )}
          </ListItem>
        </Paper>
      ))}
    </List>
  );
};

// Cancel tickets list component
const CancelTicketsList = ({
  tickets,
  username,
  contractId,
  formatDate,
  getStatusColor,
}: any) => {
  if (tickets.length === 0) {
    return (
      <Box p={3} textAlign="center">
        <Typography color="textSecondary">
          No cancellation tickets found
        </Typography>
      </Box>
    );
  }

  return (
    <List>
      {tickets.map((ticket: any) => (
        <Paper key={ticket._id.toString()} sx={{ mb: 2 }} elevation={1}>
          <ListItem
            component={Link}
            href={`/${username}/dashboard/contracts/${contractId}/tickets/cancel/${ticket._id}`}
            sx={{
              display: "block",
              textDecoration: "none",
              color: "inherit",
              p: 2,
              "&:hover": {
                backgroundColor: "rgba(0, 0, 0, 0.04)",
              },
            }}
          >
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
              mb={1}
            >
              <Box display="flex" alignItems="center">
                <Typography
                  variant="subtitle1"
                  component="span"
                  fontWeight="bold"
                  mr={1}
                >
                  Cancellation Request
                </Typography>
                <Chip
                  size="small"
                  label={ticket.status}
                  color={getStatusColor(ticket.status)}
                />
              </Box>
              <Typography variant="body2" color="textSecondary">
                Created: {formatDate(ticket.createdAt)}
              </Typography>
            </Box>

            <Typography variant="body2">
              Requested by: {ticket.requestedBy}
            </Typography>

            <Typography variant="body2">
              Reason: {ticket.reason?.substring(0, 100)}
              {ticket.reason?.length > 100 ? "..." : ""}
            </Typography>

            {ticket.resolvedAt && (
              <Typography variant="body2">
                Resolved: {formatDate(ticket.resolvedAt)}
              </Typography>
            )}
          </ListItem>
        </Paper>
      ))}
    </List>
  );
};

// Revision tickets list component
const RevisionTicketsList = ({
  tickets,
  username,
  contractId,
  formatDate,
  getStatusColor,
}: any) => {
  if (tickets.length === 0) {
    return (
      <Box p={3} textAlign="center">
        <Typography color="textSecondary">No revision tickets found</Typography>
      </Box>
    );
  }

  return (
    <List>
      {tickets.map((ticket: any) => (
        <Paper key={ticket._id.toString()} sx={{ mb: 2 }} elevation={1}>
          <ListItem
            component={Link}
            href={`/${username}/dashboard/contracts/${contractId}/tickets/revision/${ticket._id}`}
            sx={{
              display: "block",
              textDecoration: "none",
              color: "inherit",
              p: 2,
              "&:hover": {
                backgroundColor: "rgba(0, 0, 0, 0.04)",
              },
            }}
          >
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
              mb={1}
            >
              <Box display="flex" alignItems="center">
                <Typography
                  variant="subtitle1"
                  component="span"
                  fontWeight="bold"
                  mr={1}
                >
                  Revision Request
                </Typography>
                <Chip
                  size="small"
                  label={ticket.status}
                  color={getStatusColor(ticket.status)}
                />
                {ticket.paidFee && (
                  <Chip
                    size="small"
                    label={`Paid: ${ticket.paidFee}`}
                    color="success"
                    sx={{ ml: 1 }}
                  />
                )}
              </Box>
              <Typography variant="body2" color="textSecondary">
                Created: {formatDate(ticket.createdAt)}
              </Typography>
            </Box>

            <Typography variant="body2">
              Description: {ticket.description?.substring(0, 100)}
              {ticket.description?.length > 100 ? "..." : ""}
            </Typography>

            {ticket.milestoneIdx !== undefined && (
              <Typography variant="body2">
                Milestone: {ticket.milestoneIdx}
              </Typography>
            )}

            {ticket.resolvedAt && (
              <Typography variant="body2">
                Resolved: {formatDate(ticket.resolvedAt)}
              </Typography>
            )}
          </ListItem>
        </Paper>
      ))}
    </List>
  );
};

// Change tickets list component
const ChangeTicketsList = ({
  tickets,
  username,
  contractId,
  formatDate,
  getStatusColor,
}: any) => {
  if (tickets.length === 0) {
    return (
      <Box p={3} textAlign="center">
        <Typography color="textSecondary">No change tickets found</Typography>
      </Box>
    );
  }

  return (
    <List>
      {tickets.map((ticket: any) => (
        <Paper key={ticket._id.toString()} sx={{ mb: 2 }} elevation={1}>
          <ListItem
            component={Link}
            href={`/${username}/dashboard/contracts/${contractId}/tickets/change/${ticket._id}`}
            sx={{
              display: "block",
              textDecoration: "none",
              color: "inherit",
              p: 2,
              "&:hover": {
                backgroundColor: "rgba(0, 0, 0, 0.04)",
              },
            }}
          >
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
              mb={1}
            >
              <Box display="flex" alignItems="center">
                <Typography
                  variant="subtitle1"
                  component="span"
                  fontWeight="bold"
                  mr={1}
                >
                  Change Request
                </Typography>
                <Chip
                  size="small"
                  label={ticket.status}
                  color={getStatusColor(ticket.status)}
                />
                {ticket.isPaidChange && (
                  <Chip
                    size="small"
                    label={`Fee: ${ticket.paidFee || "Pending"}`}
                    color="info"
                    sx={{ ml: 1 }}
                  />
                )}
              </Box>
              <Typography variant="body2" color="textSecondary">
                Created: {formatDate(ticket.createdAt)}
              </Typography>
            </Box>

            <Typography variant="body2">
              Reason: {ticket.reason?.substring(0, 100)}
              {ticket.reason?.length > 100 ? "..." : ""}
            </Typography>

            {ticket.resolvedAt && (
              <Typography variant="body2">
                Resolved: {formatDate(ticket.resolvedAt)}
              </Typography>
            )}
          </ListItem>
        </Paper>
      ))}
    </List>
  );
};

// Resolution tickets list component
const ResolutionTicketsList = ({
  tickets,
  username,
  contractId,
  formatDate,
  getStatusColor,
}: any) => {
  if (tickets.length === 0) {
    return (
      <Box p={3} textAlign="center">
        <Typography color="textSecondary">
          No resolution tickets found
        </Typography>
      </Box>
    );
  }

  return (
    <List>
      {tickets.map((ticket: any) => (
        <Paper key={ticket._id.toString()} sx={{ mb: 2 }} elevation={1}>
          <ListItem
            component={Link}
            href={`/${username}/dashboard/contracts/${contractId}/tickets/resolution/${ticket._id}`}
            sx={{
              display: "block",
              textDecoration: "none",
              color: "inherit",
              p: 2,
              "&:hover": {
                backgroundColor: "rgba(0, 0, 0, 0.04)",
              },
            }}
          >
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
              mb={1}
            >
              <Box display="flex" alignItems="center">
                <Typography
                  variant="subtitle1"
                  component="span"
                  fontWeight="bold"
                  mr={1}
                >
                  Resolution
                </Typography>
                <Chip
                  size="small"
                  label={ticket.status}
                  color={getStatusColor(ticket.status)}
                />
              </Box>
              <Typography variant="body2" color="textSecondary">
                Created: {formatDate(ticket.createdAt)}
              </Typography>
            </Box>

            <Typography variant="body2">
              Submitted by: {ticket.submittedBy}
            </Typography>

            <Typography variant="body2">
              Target: {ticket.targetType} #{ticket.targetId?.toString()}
            </Typography>

            {ticket.decision && (
              <Typography variant="body2">
                Decision: {ticket.decision} ({formatDate(ticket.resolvedAt)})
              </Typography>
            )}
          </ListItem>
        </Paper>
      ))}
    </List>
  );
};

export default TicketsListPage;

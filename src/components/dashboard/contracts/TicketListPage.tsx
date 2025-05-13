"use client";

import React, { useState } from "react";
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Button,
  Stack,
  Badge,
  Paper,
  useTheme,
} from "@mui/material";
import Link from "next/link";
import {
  CancelOutlined,
  EditOutlined,
  SwapHorizontalCircleOutlined,
  GavelOutlined,
} from "@mui/icons-material";

// Import ticket list components
import {
  AllTicketsList,
  CancelTicketsList,
  RevisionTicketsList,
  ChangeTicketsList,
  ResolutionTicketsList,
} from "./ticket-lists";

// Import utilities
import { formatDate, getStatusColor } from "@/lib/utils/formatters";

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
  const theme = useTheme();
  const [tabValue, setTabValue] = useState(0);
  const isActive = contractStatus === "active";

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Action Buttons rendering
  const renderActionButtons = () => {
    if (!isActive) return null;

    return (
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={1}
        sx={{ mt: { xs: 2, sm: 0 } }}
      >
        {isClient && (
          <>
            <Link
              href={`/${username}/dashboard/contracts/${contractId}/tickets/cancel/new`}
              passHref
            >
              <Button
                size="small"
                variant="outlined"
                color="error"
                startIcon={<CancelOutlined />}
              >
                Cancel
              </Button>
            </Link>
            <Link
              href={`/${username}/dashboard/contracts/${contractId}/tickets/revision/new`}
              passHref
            >
              <Button
                size="small"
                variant="outlined"
                startIcon={<EditOutlined />}
              >
                Revision
              </Button>
            </Link>
            <Link
              href={`/${username}/dashboard/contracts/${contractId}/tickets/change/new`}
              passHref
            >
              <Button
                size="small"
                variant="outlined"
                startIcon={<SwapHorizontalCircleOutlined />}
              >
                Change
              </Button>
            </Link>
          </>
        )}

        {isArtist && (
          <Link
            href={`/${username}/dashboard/contracts/${contractId}/tickets/cancel/new`}
            passHref
          >
            <Button
              size="small"
              variant="outlined"
              color="error"
              startIcon={<CancelOutlined />}
            >
              Cancel
            </Button>
          </Link>
        )}

        <Link
          href={`/${username}/dashboard/contracts/${contractId}/tickets/resolution/new`}
          passHref
        >
          <Button
            size="small"
            variant="outlined"
            color="warning"
            startIcon={<GavelOutlined />}
          >
            Dispute
          </Button>
        </Link>
      </Stack>
    );
  };

  return (
    <Box>
      <Box
        mb={3}
        display="flex"
        justifyContent="space-between"
        alignItems={{ sm: "center" }}
        flexDirection={{ xs: "column", sm: "row" }}
      >
        <Typography variant="h6" fontWeight="bold">
          Contract Tickets
        </Typography>
        {renderActionButtons()}
      </Box>

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
          sx={{
            borderBottom: 1,
            borderColor: "divider",
            bgcolor: "background.paper",
          }}
        >
          <Tab label="All" />
          <Tab
            label={
              <Badge
                badgeContent={tickets.cancel.length}
                color="error"
                max={99}
                showZero
              >
                <span style={{ marginRight: "8px" }}>Cancellation</span>
              </Badge>
            }
          />
          <Tab
            label={
              <Badge
                badgeContent={tickets.revision.length}
                color="primary"
                max={99}
                showZero
              >
                <span style={{ marginRight: "8px" }}>Revision</span>
              </Badge>
            }
          />
          <Tab
            label={
              <Badge
                badgeContent={tickets.change.length}
                color="info"
                max={99}
                showZero
              >
                <span style={{ marginRight: "8px" }}>Change</span>
              </Badge>
            }
          />
          <Tab
            label={
              <Badge
                badgeContent={tickets.resolution.length}
                color="warning"
                max={99}
                showZero
              >
                <span style={{ marginRight: "8px" }}>Resolution</span>
              </Badge>
            }
          />
        </Tabs>
      </Paper>

      {/* Tab Panels */}
      <Box sx={{ mt: 2 }}>
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
    </Box>
  );
};

export default TicketsListPage;

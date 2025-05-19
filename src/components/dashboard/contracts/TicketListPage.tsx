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
  Tooltip,
} from "@mui/material";
import Link from "next/link";
import {
  CancelOutlined,
  EditOutlined,
  SwapHorizontalCircleOutlined,
  GavelOutlined,
  ConfirmationNumberOutlined,
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

// Constants - Indonesian translations
const TRANSLATIONS = {
  contractTickets: "Tiket Kontrak",
  all: "Semua",
  cancellation: "Pembatalan",
  revision: "Revisi",
  change: "Perubahan",
  resolution: "Resolusi",
  dispute: "Perselisihan",
  cancel: "Batalkan",
};

// Types definition
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

  // Calculate total tickets for badges
  const totalTickets = {
    cancel: tickets.cancel.length,
    revision: tickets.revision.length,
    change: tickets.change.length,
    resolution: tickets.resolution.length,
    all:
      tickets.cancel.length +
      tickets.revision.length +
      tickets.change.length +
      tickets.resolution.length,
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Action Buttons rendering
  const renderActionButtons = () => {
    if (!isActive) return null;

    return (
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={1.5}
        sx={{ mt: { xs: 2, sm: 0 } }}
      >
        {isClient && (
          <>
            <Tooltip title={TRANSLATIONS.cancel} arrow>
              <Link
                href={`/${username}/dashboard/contracts/${contractId}/tickets/cancel/new`}
                passHref
              >
                <Button
                  size="small"
                  variant="outlined"
                  color="error"
                  startIcon={<CancelOutlined />}
                  sx={{ borderRadius: 1.5 }}
                >
                  {TRANSLATIONS.cancel}
                </Button>
              </Link>
            </Tooltip>

            <Tooltip title={TRANSLATIONS.revision} arrow>
              <Link
                href={`/${username}/dashboard/contracts/${contractId}/tickets/revision/new`}
                passHref
              >
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<EditOutlined />}
                  sx={{ borderRadius: 1.5 }}
                >
                  {TRANSLATIONS.revision}
                </Button>
              </Link>
            </Tooltip>

            <Tooltip title={TRANSLATIONS.change} arrow>
              <Link
                href={`/${username}/dashboard/contracts/${contractId}/tickets/change/new`}
                passHref
              >
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<SwapHorizontalCircleOutlined />}
                  sx={{ borderRadius: 1.5 }}
                >
                  {TRANSLATIONS.change}
                </Button>
              </Link>
            </Tooltip>
          </>
        )}

        {isArtist && (
          <Tooltip title={TRANSLATIONS.cancel} arrow>
            <Link
              href={`/${username}/dashboard/contracts/${contractId}/tickets/cancel/new`}
              passHref
            >
              <Button
                size="small"
                variant="outlined"
                color="error"
                startIcon={<CancelOutlined />}
                sx={{ borderRadius: 1.5 }}
              >
                {TRANSLATIONS.cancel}
              </Button>
            </Link>
          </Tooltip>
        )}

        <Tooltip title={TRANSLATIONS.dispute} arrow>
          <Link
            href={`/${username}/dashboard/contracts/${contractId}/tickets/resolution/new`}
            passHref
          >
            <Button
              size="small"
              variant="outlined"
              color="warning"
              startIcon={<GavelOutlined />}
              sx={{
                borderRadius: 1.5,
                boxShadow: theme.shadows[1],
                "&:hover": {
                  boxShadow: theme.shadows[3],
                },
              }}
            >
              {TRANSLATIONS.dispute}
            </Button>
          </Link>
        </Tooltip>
      </Stack>
    );
  };

  // Tab badge component to reduce repetition
  interface TabBadgeProps {
    count: number;
    color: "primary" | "secondary" | "error" | "info" | "success" | "warning";
    label: string;
  }

  const TabBadge: React.FC<TabBadgeProps> = ({ count, color, label }) => (
    <Badge
      badgeContent={count}
      color={color}
      max={99}
      showZero
      sx={{ "& .MuiBadge-badge": { fontWeight: 600 } }}
    >
      <span style={{ marginRight: "8px" }}>{label}</span>
    </Badge>
  );

  // Tab panel content renderer
  const renderTabContent = () => {
    const sharedProps = {
      username,
      contractId,
      formatDate,
      getStatusColor,
    };

    switch (tabValue) {
      case 0:
        return <AllTicketsList tickets={tickets} {...sharedProps} />;
      case 1:
        return <CancelTicketsList tickets={tickets.cancel} {...sharedProps} />;
      case 2:
        return (
          <RevisionTicketsList tickets={tickets.revision} {...sharedProps} />
        );
      case 3:
        return <ChangeTicketsList tickets={tickets.change} {...sharedProps} />;
      case 4:
        return (
          <ResolutionTicketsList
            tickets={tickets.resolution}
            {...sharedProps}
          />
        );
      default:
        return <AllTicketsList tickets={tickets} {...sharedProps} />;
    }
  };

  return (
    <Box>
      {/* Header section */}
      <Box
        mb={3}
        display="flex"
        justifyContent="space-between"
        alignItems={{ sm: "center" }}
        flexDirection={{ xs: "column", sm: "row" }}
        sx={{
          pb: 1.5,
          borderBottom: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Typography
          variant="h6"
          fontWeight="bold"
          sx={{
            display: "flex",
            alignItems: "center",
            color: theme.palette.text.primary,
          }}
        >
          <ConfirmationNumberOutlined
            sx={{
              mr: 1,
              color: theme.palette.primary.main,
            }}
          />
          {TRANSLATIONS.contractTickets}
        </Typography>
        {renderActionButtons()}
      </Box>

      {/* Tabs navigation */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: 2,
          overflow: "hidden",
          mb: 3,
          border: `1px solid ${theme.palette.divider}`,
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
            "& .MuiTab-root": {
              minHeight: 48,
              textTransform: "none",
              fontWeight: 500,
            },
            "& .Mui-selected": {
              fontWeight: 600,
            },
          }}
        >
          <Tab label={TRANSLATIONS.all} />
          <Tab
            label={
              <TabBadge
                count={totalTickets.cancel}
                color="error"
                label={TRANSLATIONS.cancellation}
              />
            }
          />
          <Tab
            label={
              <TabBadge
                count={totalTickets.revision}
                color="primary"
                label={TRANSLATIONS.revision}
              />
            }
          />
          <Tab
            label={
              <TabBadge
                count={totalTickets.change}
                color="info"
                label={TRANSLATIONS.change}
              />
            }
          />
          <Tab
            label={
              <TabBadge
                count={totalTickets.resolution}
                color="warning"
                label={TRANSLATIONS.resolution}
              />
            }
          />
        </Tabs>
      </Paper>

      {/* Tab content section */}
      <Box sx={{ mt: 2 }}>{renderTabContent()}</Box>
    </Box>
  );
};

export default TicketsListPage;

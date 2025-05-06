"use client";

import React, { useState } from "react";
import {
  Box,
  Tabs,
  Tab,
  Alert,
  Typography,
  Grid,
  Paper,
  Skeleton,
  ButtonGroup,
  Button,
  Chip,
  Stack,
  useTheme,
} from "@mui/material";
import ProposalListingItem from "./ProposalListingItem";
import { IProposal } from "@/lib/db/models/proposal.model";
import { useRouter } from "next/navigation";
import {
  Send as SendIcon,
  Inbox as InboxIcon,
  FilterList as FilterIcon,
} from "@mui/icons-material";

interface ProposalListingPageProps {
  username: string;
  incoming: IProposal[];
  outgoing: IProposal[];
  error?: string;
  loading?: boolean;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel({ children, value, index }: TabPanelProps) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`proposal-tabpanel-${index}`}
      aria-labelledby={`proposal-tab-${index}`}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

export default function ProposalListingPage({
  username,
  incoming,
  outgoing,
  error,
  loading = false,
}: ProposalListingPageProps) {
  const [tabValue, setTabValue] = useState(0);
  const [filter, setFilter] = useState<string | null>(null);
  const router = useRouter();
  const theme = useTheme();

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    setFilter(null); // Reset filter when changing tabs
  };

  const handleEdit = (id: string) => {
    router.push(`/${username}/dashboard/proposals/${id}/edit`);
  };

  const handleRespond = (id: string) => {
    router.push(`/${username}/dashboard/proposals/${id}/respond`);
  };

  const filterProposals = (proposals: IProposal[]) => {
    if (!filter) return proposals;
    return proposals.filter((proposal) => proposal.status === filter);
  };

  const renderProposalList = (proposals: IProposal[], isIncoming: boolean) => {
    if (loading) {
      return (
        <Grid container spacing={3}>
          {[1, 2, 3, 4, 5, 6].map((item) => (
            <Grid item xs={12} sm={6} lg={4} key={item}>
              <Skeleton variant="rectangular" height={350} />
            </Grid>
          ))}
        </Grid>
      );
    }

    const filteredProposals = filterProposals(proposals);

    if (filteredProposals.length === 0) {
      return (
        <Paper sx={{ textAlign: "center", py: 8, px: 3, mt: 2 }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            {filter
              ? `No ${filter} proposals found`
              : `No ${
                  isIncoming ? "incoming" : "outgoing"
                } proposals at this time.`}
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            {filter
              ? "Try changing your filter or check back later."
              : isIncoming
              ? "When artists send you proposals, they'll appear here."
              : "When you send proposals to artists, they'll appear here."}
          </Typography>
          {filter && (
            <Button
              variant="outlined"
              onClick={() => setFilter(null)}
              startIcon={<FilterIcon />}
            >
              Clear Filter
            </Button>
          )}
        </Paper>
      );
    }

    return (
      <Grid container spacing={3}>
        {filteredProposals.map((proposal) => (
          <Grid item xs={12} sm={6} lg={4} key={proposal._id.toString()}>
            <ProposalListingItem
              proposal={proposal}
              onEdit={
                proposal.status === "pendingArtist" && !isIncoming
                  ? handleEdit
                  : undefined
              }
              onRespond={
                (isIncoming && proposal.status === "pendingArtist") ||
                (!isIncoming && proposal.status === "pendingClient")
                  ? handleRespond
                  : undefined
              }
            />
          </Grid>
        ))}
      </Grid>
    );
  };

  const renderFilters = () => {
    const statuses = [
      { value: "pendingArtist", label: "Awaiting Artist" },
      { value: "pendingClient", label: "Awaiting Client" },
      { value: "accepted", label: "Accepted" },
      { value: "rejectedArtist", label: "Rejected by Artist" },
      { value: "rejectedClient", label: "Rejected by Client" },
    ];

    return (
      <Box sx={{ mb: 3, mt: 2 }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <Typography variant="body2" color="text.secondary">
            Filter:
          </Typography>
          {statuses.map((status) => (
            <Chip
              key={status.value}
              label={status.label}
              onClick={() => setFilter(status.value)}
              onDelete={
                filter === status.value ? () => setFilter(null) : undefined
              }
              color={filter === status.value ? "primary" : "default"}
              variant={filter === status.value ? "filled" : "outlined"}
              size="small"
            />
          ))}
        </Stack>
      </Box>
    );
  };

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
        <Tabs value={tabValue} onChange={handleTabChange} variant="fullWidth">
          <Tab
            label={
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <InboxIcon sx={{ mr: 1 }} fontSize="small" />
                <span>Incoming</span>
                <Chip
                  label={incoming.length}
                  size="small"
                  sx={{ ml: 1, height: 20, minWidth: 20 }}
                />
              </Box>
            }
          />
          <Tab
            label={
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <SendIcon sx={{ mr: 1 }} fontSize="small" />
                <span>Outgoing</span>
                <Chip
                  label={outgoing.length}
                  size="small"
                  sx={{ ml: 1, height: 20, minWidth: 20 }}
                />
              </Box>
            }
          />
        </Tabs>
      </Box>

      <TabPanel value={tabValue} index={0}>
        {renderFilters()}
        {renderProposalList(incoming, true)}
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        {renderFilters()}
        {renderProposalList(outgoing, false)}
      </TabPanel>
    </Box>
  );
}

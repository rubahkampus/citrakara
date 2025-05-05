// src/components/dashboard/proposals/ProposalListingPage.tsx
"use client";

import React, { useState } from "react";
import { Box, Tabs, Tab, Alert, Typography, Grid } from "@mui/material";
import ProposalListingItem from "./ProposalListingItem";
import { ProposalUI } from "@/types/proposal";
import { useRouter } from "next/navigation";

interface ProposalListingPageProps {
  username: string;
  incoming: ProposalUI[];
  outgoing: ProposalUI[];
  error?: string;
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
}: ProposalListingPageProps) {
  const [tabValue, setTabValue] = useState(0);
  const router = useRouter();

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleEdit = (id: string) => {
    router.push(`/${username}/dashboard/proposals/${id}/edit`);
  };

  const handleRespond = (id: string) => {
    router.push(`/${username}/dashboard/proposals/${id}/respond`);
  };

  const renderProposalList = (proposals: ProposalUI[], isIncoming: boolean) => {
    if (proposals.length === 0) {
      return (
        <Box sx={{ textAlign: "center", py: 4 }}>
          <Typography variant="body1" color="text.secondary">
            No {isIncoming ? "incoming" : "outgoing"} proposals at this time.
          </Typography>
        </Box>
      );
    }

    return (
      <Grid container spacing={3}>
        {proposals.map((proposal) => (
          <Grid item xs={12} sm={6} lg={4} key={proposal.id}>
            <ProposalListingItem
              proposal={proposal}
              onEdit={
                proposal.status === "pendingArtist" ? handleEdit : undefined
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

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label={`Incoming (${incoming.length})`} />
          <Tab label={`Outgoing (${outgoing.length})`} />
        </Tabs>
      </Box>

      <TabPanel value={tabValue} index={0}>
        {renderProposalList(incoming, true)}
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        {renderProposalList(outgoing, false)}
      </TabPanel>
    </Box>
  );
}

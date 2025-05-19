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
  Button,
  Chip,
  Stack,
  useTheme,
  Breadcrumbs,
  Link,
} from "@mui/material";
import ProposalListingItem from "./ProposalListingItem";
import { IProposal } from "@/lib/db/models/proposal.model";
import { useRouter } from "next/navigation";
import {
  Send as SendIcon,
  Inbox as InboxIcon,
  FilterList as FilterIcon,
  Description,
  ArrowBack,
  Home,
  NavigateNext,
  DescriptionRounded,
} from "@mui/icons-material";

// Type definitions
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

// Separate TabPanel component for better organization
const TabPanel = ({ children, value, index }: TabPanelProps) => (
  <div
    role="tabpanel"
    hidden={value !== index}
    id={`proposal-tabpanel-${index}`}
    aria-labelledby={`proposal-tab-${index}`}
  >
    {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
  </div>
);

// Status options for filtering
const STATUS_OPTIONS = [
  { value: "pendingArtist", label: "Menunggu Seniman" },
  { value: "pendingClient", label: "Menunggu Klien" },
  { value: "accepted", label: "Diterima" },
  { value: "rejectedArtist", label: "Ditolak oleh Seniman" },
  { value: "rejectedClient", label: "Ditolak oleh Klien" },
];

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

  const handleView = (id: string) => {
    router.push(`/${username}/dashboard/proposals/${id}/view`);
  };

  const filterProposals = (proposals: IProposal[]) => {
    if (!filter) return proposals;
    return proposals.filter((proposal) => proposal.status === filter);
  };

  // Extract skeleton loader to a separate component for readability
  const renderSkeletonLoaders = () => (
    <Grid container spacing={3}>
      {[1, 2, 3, 4, 5, 6].map((item) => (
        <Grid item xs={12} sm={6} lg={4} key={item}>
          <Skeleton variant="rectangular" height={350} animation="wave" />
        </Grid>
      ))}
    </Grid>
  );

  // Component for empty state
  const renderEmptyState = (isIncoming: boolean) => (
    <Paper
      elevation={1}
      sx={{
        textAlign: "center",
        py: 8,
        px: 3,
        mt: 2,
        borderRadius: 2,
        backgroundColor: theme.palette.background.paper,
      }}
    >
      <Typography variant="h6" color="text.secondary" gutterBottom>
        {filter
          ? `Tidak ada proposal dengan status "${filter}"`
          : `Tidak ada proposal ${isIncoming ? "masuk" : "keluar"} saat ini.`}
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        {filter
          ? "Coba ubah filter Anda atau periksa kembali nanti."
          : isIncoming
          ? "Ketika seniman mengirimkan proposal kepada Anda, proposal tersebut akan muncul di sini."
          : "Ketika Anda mengirimkan proposal kepada seniman, proposal tersebut akan muncul di sini."}
      </Typography>
      {filter && (
        <Button
          variant="outlined"
          onClick={() => setFilter(null)}
          startIcon={<FilterIcon />}
          sx={{ borderRadius: 2 }}
        >
          Hapus Filter
        </Button>
      )}
    </Paper>
  );

  // Component for filters
  const renderFilters = () => (
    <Box sx={{ mb: 3, mt: 2 }}>
      <Stack
        direction="row"
        spacing={1}
        alignItems="center"
        sx={{ flexWrap: "wrap", gap: 1 }}
      >
        <Typography variant="body2" color="text.secondary">
          Filter:
        </Typography>
        {STATUS_OPTIONS.map((status) => (
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
            sx={{
              borderRadius: "16px",
              "&:hover": {
                backgroundColor:
                  filter === status.value
                    ? theme.palette.primary.main
                    : theme.palette.action.hover,
              },
            }}
          />
        ))}
      </Stack>
    </Box>
  );

  // Component for proposal list
  const renderProposalList = (proposals: IProposal[], isIncoming: boolean) => {
    if (loading) {
      return renderSkeletonLoaders();
    }

    const filteredProposals = filterProposals(proposals);

    if (filteredProposals.length === 0) {
      return renderEmptyState(isIncoming);
    }

    return (
      <Grid container spacing={3}>
        {filteredProposals.map((proposal) => (
          <Grid item xs={12} sm={6} lg={4} key={proposal._id.toString()}>
            <ProposalListingItem proposal={proposal} onView={handleView} />
          </Grid>
        ))}
      </Grid>
    );
  };

  return (
    <Box
      sx={{
        py: 4,
        maxWidth: "100%",
        animation: "fadeIn 0.3s ease-in-out",
        "@keyframes fadeIn": {
          "0%": { opacity: 0, transform: "translateY(10px)" },
          "100%": { opacity: 1, transform: "translateY(0)" },
        },
      }}
    >
      <Box
        sx={{
          mb: 3,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <Breadcrumbs separator={<NavigateNext fontSize="small" />}>
            <Link
              component={Link}
              href={`/${username}/dashboard`}
              underline="hover"
              color="inherit"
              sx={{ display: "flex", alignItems: "center" }}
            >
              <Home fontSize="small" sx={{ mr: 0.5 }} />
              Dashboard
            </Link>
            <Typography
              color="text.primary"
              sx={{ display: "flex", alignItems: "center" }}
            >
              <DescriptionRounded fontSize="small" sx={{ mr: 0.5 }} />
              Proposal
            </Typography>
          </Breadcrumbs>

          <Box display="flex" alignItems="center" mt={4} ml={-0.5}>
            <DescriptionRounded
              sx={{ mr: 1, color: "primary.main", fontSize: 32 }}
            />
            <Typography variant="h4" fontWeight="bold">
              Proposal Saya
            </Typography>
          </Box>
        </Box>

        <Button
          component={Link}
          href={`/${username}/dashboard`}
          variant="outlined"
          startIcon={<ArrowBack />}
          size="small"
          sx={{ mt: 1 }}
        >
          Kembali ke Profil
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
          {error}
        </Alert>
      )}

      <Box
        sx={{
          borderBottom: 1,
          borderColor: "divider",
          mb: -2,
        }}
      >
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          variant="fullWidth"
          sx={{
            "& .MuiTab-root": {
              transition: "all 0.2s",
              py: 1.5,
            },
          }}
        >
          <Tab
            label={
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <InboxIcon sx={{ mr: 1 }} fontSize="small" />
                <span>Masuk</span>
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
                <span>Keluar</span>
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

"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  Box,
  Tabs,
  Tab,
  Typography,
  List,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  Badge,
  useTheme,
  ButtonGroup,
  Button,
  Alert,
  SelectChangeEvent,
  Fade,
  Breadcrumbs,
  Link,
  Chip,
} from "@mui/material";
import {
  FilterAlt as FilterIcon,
  Assignment as AssignmentIcon,
  Brush as BrushIcon,
  Send as SendIcon,
  Inbox as InboxIcon,
  ViewList as ViewListIcon,
  ClearAll as ClearAllIcon,
  PaletteRounded,
  Home,
  NavigateNext,
} from "@mui/icons-material";
import { IContract } from "@/lib/db/models/contract.model";
import ContractListingItem from "./ContractListingItem";
import ContractListingSkeleton from "./ContractListingSkeleton";
import ArrowBack from "@mui/icons-material/ArrowBack";

// Types
interface ContractListingPageProps {
  username: string;
  asArtist: IContract[];
  asClient: IContract[];
  loading?: boolean;
  error?: string;
}

type StatusCategory = "all" | "active" | "completed" | "cancelled";
type RoleView = "incoming" | "outgoing";

// Constants
const STATUS_CATEGORIES: Record<string, StatusCategory> = {
  active: "active",
  completed: "completed",
  completedLate: "completed",
  cancelledClient: "cancelled",
  cancelledClientLate: "cancelled",
  cancelledArtist: "cancelled",
  cancelledArtistLate: "cancelled",
  notCompleted: "cancelled",
};

// Translations
const translations = {
  yourContracts: "Kontrak Anda",
  status: "Status",
  allStatuses: "Semua Status",
  all: "Semua",
  active: "Aktif",
  completed: "Selesai",
  cancelled: "Dibatalkan",
  noContractsMatch: "Tidak ada kontrak yang sesuai dengan filter Anda",
  tryChangingFilters:
    "Coba ubah pengaturan filter Anda atau periksa kembali nanti.",
  contractsWillAppear:
    "Ketika Anda membuat atau menerima kontrak, kontrak akan muncul di sini.",
  clearFilters: "Hapus Filter",
  showAllContracts: "Tampilkan Semua Kontrak",
  error: "Terjadi kesalahan saat memuat data kontrak",
  incoming: "Masuk",
  outgoing: "Keluar",
};

// Helper functions
const getStatusCategory = (status: string): StatusCategory => {
  return STATUS_CATEGORIES[status] || "active";
};

const formatStatusText = (status: string): string => {
  return status.charAt(0).toUpperCase() + status.slice(1);
};

// Main component
const ContractListingPage: React.FC<ContractListingPageProps> = ({
  username,
  asArtist = [],
  asClient = [],
  loading = false,
  error,
}) => {
  const theme = useTheme();
  const [roleTabValue, setRoleTabValue] = useState(0);
  const [statusTabValue, setStatusTabValue] = useState(0);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [initialized, setInitialized] = useState(false);

  // Initialize client-side state after mount
  useEffect(() => {
    setInitialized(true);
  }, []);

  // Event handlers
  const handleRoleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setRoleTabValue(newValue);
  };

  const handleStatusTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setStatusTabValue(newValue);
  };

  const handleClearFilters = () => {
    setStatusFilter("all");
    setStatusTabValue(0);
  };

  // Get current role view based on tab
  const currentRoleView: RoleView =
    roleTabValue === 0 ? "incoming" : "outgoing";

  // Count contracts by category for badges
  const incomingContracts = useMemo(() => asArtist, [asClient]);
  const outgoingContracts = useMemo(() => asClient, [asArtist]);

  const countByCategory = useMemo(() => {
    const counts: Record<StatusCategory, number> = {
      all: 0,
      active: 0,
      completed: 0,
      cancelled: 0,
    };

    const contractsToCount =
      currentRoleView === "incoming" ? incomingContracts : outgoingContracts;

    counts.all = contractsToCount.length;

    contractsToCount.forEach((contract) => {
      const category = getStatusCategory(contract.status);
      counts[category]++;
    });

    return counts;
  }, [incomingContracts, outgoingContracts, currentRoleView]);

  // Filter contracts based on selected filters
  const filteredContracts = useMemo(() => {
    // Get contracts based on role tab
    let contracts =
      currentRoleView === "incoming" ? incomingContracts : outgoingContracts;

    // Filter by specific status if selected
    if (statusFilter !== "all") {
      contracts = contracts.filter(
        (contract) => contract.status === statusFilter
      );
    }

    // Filter by status tab category
    if (statusTabValue === 1) {
      contracts = contracts.filter(
        (contract) => getStatusCategory(contract.status) === "active"
      );
    } else if (statusTabValue === 2) {
      contracts = contracts.filter(
        (contract) => getStatusCategory(contract.status) === "completed"
      );
    } else if (statusTabValue === 3) {
      contracts = contracts.filter(
        (contract) => getStatusCategory(contract.status) === "cancelled"
      );
    }

    // Sort by most recent first
    return contracts.sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }, [
    incomingContracts,
    outgoingContracts,
    statusTabValue,
    statusFilter,
    currentRoleView,
  ]);

  // Show loading state
  if (loading || !initialized) {
    return <ContractListingSkeleton />;
  }

  const hasActiveFilters = statusFilter !== "all" || statusTabValue !== 0;

  return (
    <Box
      sx={{
        py: 4,
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
              <PaletteRounded fontSize="small" sx={{ mr: 0.5 }} />
              Kontrak
            </Typography>
          </Breadcrumbs>

          <Box display="flex" alignItems="center" mt={4} ml={-0.5} mb={2}>
            <PaletteRounded
              sx={{ mr: 1, color: "primary.main", fontSize: 32 }}
            />
            <Typography variant="h4" fontWeight="bold">
              {translations.yourContracts}
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

      {/* Error Alert */}
      {error && (
        <Alert
          severity="error"
          sx={{
            mb: 3,
            borderRadius: 2,
            boxShadow: theme.shadows[1],
          }}
        >
          {error || translations.error}
        </Alert>
      )}

      {/* Incoming/Outgoing Role Tabs */}
      <Box
        sx={{
          borderBottom: 1,
          borderColor: "divider",
          mb: 2,
        }}
      >
        <Tabs
          value={roleTabValue}
          onChange={handleRoleTabChange}
          variant="fullWidth"
          textColor="primary"
          indicatorColor="primary"
          sx={{
            borderBottom: 1,
            borderColor: "divider",
            "& .MuiTab-root": {
              py: 1.5,
              fontWeight: 500,
              transition: "all 0.2s",
              "&:hover": {
                backgroundColor: theme.palette.action.hover,
              },
            },
          }}
        >
          {/* Incoming Tab */}
          <Tab
            label={
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <InboxIcon sx={{ mr: 1 }} fontSize="small" />
                <span>{translations.incoming}</span>
                <Chip
                  label={incomingContracts.length}
                  size="small"
                  sx={{ ml: 1, height: 20, minWidth: 20 }}
                />
              </Box>
            }
          />
          {/* Outgoing Tab */}
          <Tab
            label={
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <SendIcon sx={{ mr: 1 }} fontSize="small" />
                <span>{translations.outgoing}</span>
                <Chip
                  label={outgoingContracts.length}
                  size="small"
                  sx={{ ml: 1, height: 20, minWidth: 20 }}
                />
              </Box>
            }
          />
        </Tabs>
      </Box>

      {/* Status Tabs */}
      <Paper
        sx={{
          borderRadius: 2,
          overflow: "hidden",
          mb: 3,
          boxShadow: theme.shadows[1],
          transition: "all 0.2s",
          "&:hover": {
            boxShadow: theme.shadows[2],
          },
        }}
      >
        <Tabs
          value={statusTabValue}
          onChange={handleStatusTabChange}
          variant="fullWidth"
          textColor="primary"
          indicatorColor="primary"
          sx={{
            borderBottom: 1,
            borderColor: "divider",
            "& .MuiTab-root": {
              py: 1.8,
              fontWeight: 500,
              transition: "all 0.2s",
              "&:hover": {
                backgroundColor: theme.palette.action.hover,
              },
            },
          }}
        >
          {/* All Tab */}
          <Tab
            label={
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <span>{translations.all}</span>
                <Badge
                  badgeContent={countByCategory.all}
                  color="primary"
                  sx={{ ml: 2 }}
                  max={99}
                />
              </Box>
            }
          />
          {/* Active Tab */}
          <Tab
            label={
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <span>{translations.active}</span>
                <Badge
                  badgeContent={countByCategory.active}
                  color="primary"
                  sx={{ ml: 2 }}
                  max={99}
                />
              </Box>
            }
          />
          {/* Completed Tab */}
          <Tab
            label={
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <span>{translations.completed}</span>
                <Badge
                  badgeContent={countByCategory.completed}
                  color="success"
                  sx={{ ml: 2 }}
                  max={99}
                />
              </Box>
            }
          />
          {/* Cancelled Tab */}
          <Tab
            label={
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <span>{translations.cancelled}</span>
                <Badge
                  badgeContent={countByCategory.cancelled}
                  color="error"
                  sx={{ ml: 2 }}
                  max={99}
                />
              </Box>
            }
          />
        </Tabs>
      </Paper>

      {/* Contract listings or empty state */}
      {initialized && (
        <Fade in={true} timeout={300}>
          <Box>
            {filteredContracts.length === 0 ? (
              <Paper
                sx={{
                  textAlign: "center",
                  py: 8,
                  px: 3,
                  borderRadius: 2,
                  boxShadow: theme.shadows[1],
                  backgroundColor: theme.palette.background.default,
                }}
              >
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  {translations.noContractsMatch}
                </Typography>
                <Typography
                  variant="body1"
                  color="text.secondary"
                  sx={{ mb: 4 }}
                >
                  {hasActiveFilters
                    ? translations.tryChangingFilters
                    : translations.contractsWillAppear}
                </Typography>

                {hasActiveFilters && (
                  <ButtonGroup
                    variant="outlined"
                    sx={{
                      "& .MuiButton-root": {
                        borderRadius: 2,
                        px: 2,
                        py: 1,
                        fontWeight: 500,
                        boxShadow: theme.shadows[1],
                        transition: "all 0.2s",
                        "&:hover": {
                          transform: "translateY(-2px)",
                          boxShadow: theme.shadows[2],
                        },
                      },
                    }}
                  >
                    {/* Clear Filters Button */}
                    {statusFilter !== "all" && (
                      <Button
                        onClick={handleClearFilters}
                        startIcon={<ClearAllIcon />}
                        color="primary"
                      >
                        {translations.clearFilters}
                      </Button>
                    )}

                    {/* Show All Button */}
                    {statusTabValue !== 0 && (
                      <Button
                        onClick={() => setStatusTabValue(0)}
                        startIcon={<ViewListIcon />}
                        color="secondary"
                      >
                        {translations.showAllContracts}
                      </Button>
                    )}
                  </ButtonGroup>
                )}
              </Paper>
            ) : (
              <List
                sx={{
                  width: "100%",
                  p: 0,
                }}
              >
                {filteredContracts.map((contract) => (
                  <ContractListingItem
                    key={contract._id.toString()}
                    contract={contract}
                    username={username}
                    isArtist={currentRoleView === "incoming"}
                  />
                ))}
              </List>
            )}
          </Box>
        </Fade>
      )}
    </Box>
  );
};

export default ContractListingPage;

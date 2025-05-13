"use client";

import React, { useState, useMemo } from "react";
import {
  Box,
  Tabs,
  Tab,
  Typography,
  List,
  Chip,
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
} from "@mui/material";
import {
  FilterAlt as FilterIcon,
  Assignment as AssignmentIcon,
  Brush as BrushIcon,
  Person as PersonIcon,
} from "@mui/icons-material";
import Link from "next/link";
import { IContract } from "@/lib/db/models/contract.model";
import ContractListingItem from "./ContractListingItem";
import ContractListingSkeleton from "./ContractListingSkeleton";

interface ContractListingPageProps {
  username: string;
  asArtist: IContract[];
  asClient: IContract[];
  loading?: boolean;
  error?: string;
}

// Define a type for the categories
type StatusCategory = "all" | "active" | "completed" | "cancelled";

// Update the function to return the specific type
const getStatusCategory = (status: string): StatusCategory => {
  const categoryMap: Record<string, StatusCategory> = {
    active: "active",
    completed: "completed",
    completedLate: "completed",
    cancelledClient: "cancelled",
    cancelledClientLate: "cancelled",
    cancelledArtist: "cancelled",
    cancelledArtistLate: "cancelled",
    notCompleted: "cancelled",
  };

  return categoryMap[status] || "active";
};
const ContractListingPage: React.FC<ContractListingPageProps> = ({
  username,
  asArtist,
  asClient,
  loading = false,
  error,
}) => {
  const theme = useTheme();
  const [tabValue, setTabValue] = useState(0);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [roleFilter, setRoleFilter] = useState<string>("all");

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Filter contracts based on tab, status and role
  const filteredContracts = useMemo(() => {
    let contracts: IContract[] = [];

    if (roleFilter === "client" || roleFilter === "all") {
      contracts = [...contracts, ...asClient];
    }

    if (roleFilter === "artist" || roleFilter === "all") {
      contracts = [...contracts, ...asArtist];
    }

    // Filter by status if not "all"
    if (statusFilter !== "all") {
      contracts = contracts.filter(
        (contract) => contract.status === statusFilter
      );
    }

    // Filter based on tab value
    if (tabValue === 1) {
      // Active
      contracts = contracts.filter(
        (contract) => getStatusCategory(contract.status) === "active"
      );
    } else if (tabValue === 2) {
      // Completed
      contracts = contracts.filter(
        (contract) => getStatusCategory(contract.status) === "completed"
      );
    } else if (tabValue === 3) {
      // Cancelled
      contracts = contracts.filter(
        (contract) => getStatusCategory(contract.status) === "cancelled"
      );
    }

    // Sort by most recent first
    return contracts.sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }, [asArtist, asClient, tabValue, statusFilter, roleFilter]);

  // Get all available statuses from the contracts
  const availableStatuses = useMemo(() => {
    return [
      ...new Set([
        ...asArtist.map((contract) => contract.status),
        ...asClient.map((contract) => contract.status),
      ]),
    ];
  }, [asArtist, asClient]);

  // Now use the typed function in your count code
  const countByCategory = useMemo(() => {
    const counts: Record<StatusCategory, number> = {
      all: 0,
      active: 0,
      completed: 0,
      cancelled: 0,
    };

    const allContracts = [...asArtist, ...asClient];
    counts.all = allContracts.length;

    allContracts.forEach((contract) => {
      const category = getStatusCategory(contract.status);
      counts[category]++; // This will now work without the check
    });

    return counts;
  }, [asArtist, asClient]);

  if (loading) {
    return <ContractListingSkeleton />;
  }

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Box
        mb={3}
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        flexWrap="wrap"
        gap={2}
      >
        <Typography variant="h6" fontWeight="bold">
          Your Contracts
        </Typography>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          alignItems={{ xs: "stretch", sm: "center" }}
        >
          <FormControl variant="outlined" size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Role</InputLabel>
            <Select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              label="Role"
              startAdornment={
                roleFilter === "artist" ? (
                  <BrushIcon fontSize="small" sx={{ mr: 1 }} />
                ) : roleFilter === "client" ? (
                  <PersonIcon fontSize="small" sx={{ mr: 1 }} />
                ) : (
                  <AssignmentIcon fontSize="small" sx={{ mr: 1 }} />
                )
              }
            >
              <MenuItem value="all">All Roles</MenuItem>
              <MenuItem value="artist">As Artist</MenuItem>
              <MenuItem value="client">As Client</MenuItem>
            </Select>
          </FormControl>

          <FormControl variant="outlined" size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              label="Status"
              startAdornment={<FilterIcon fontSize="small" sx={{ mr: 1 }} />}
            >
              <MenuItem value="all">All Statuses</MenuItem>
              {availableStatuses.map((status) => (
                <MenuItem key={status} value={status}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>
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
          variant="fullWidth"
          sx={{
            borderBottom: 1,
            borderColor: "divider",
            "& .MuiTab-root": {
              py: 1.5,
            },
          }}
        >
          <Tab
            label={
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <span>All</span>
                <Badge
                  badgeContent={countByCategory.all}
                  color="primary"
                  sx={{ ml: 1 }}
                  max={99}
                />
              </Box>
            }
          />
          <Tab
            label={
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <span>Active</span>
                <Badge
                  badgeContent={countByCategory.active}
                  color="primary"
                  sx={{ ml: 1 }}
                  max={99}
                />
              </Box>
            }
          />
          <Tab
            label={
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <span>Completed</span>
                <Badge
                  badgeContent={countByCategory.completed}
                  color="success"
                  sx={{ ml: 1 }}
                  max={99}
                />
              </Box>
            }
          />
          <Tab
            label={
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <span>Cancelled</span>
                <Badge
                  badgeContent={countByCategory.cancelled}
                  color="error"
                  sx={{ ml: 1 }}
                  max={99}
                />
              </Box>
            }
          />
        </Tabs>
      </Paper>

      {filteredContracts.length === 0 ? (
        <Paper
          sx={{
            textAlign: "center",
            py: 8,
            px: 3,
            borderRadius: 1,
            boxShadow: theme.shadows[1],
          }}
        >
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No contracts found matching your filters
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            {statusFilter !== "all" || roleFilter !== "all"
              ? "Try changing your filter settings or check back later."
              : "When you create or receive contracts, they'll appear here."}
          </Typography>
          {(statusFilter !== "all" ||
            roleFilter !== "all" ||
            tabValue !== 0) && (
            <ButtonGroup variant="outlined">
              {(statusFilter !== "all" || roleFilter !== "all") && (
                <Button
                  onClick={() => {
                    setStatusFilter("all");
                    setRoleFilter("all");
                  }}
                  startIcon={<FilterIcon />}
                >
                  Clear Filters
                </Button>
              )}
              {tabValue !== 0 && (
                <Button onClick={() => setTabValue(0)}>
                  Show All Contracts
                </Button>
              )}
            </ButtonGroup>
          )}
        </Paper>
      ) : (
        <List sx={{ width: "100%", p: 0 }}>
          {filteredContracts.map((contract) => (
            <ContractListingItem
              key={contract._id.toString()}
              contract={contract}
              username={username}
              isArtist={asArtist.some(
                (c) => c._id.toString() === contract._id.toString()
              )}
            />
          ))}
        </List>
      )}
    </Box>
  );
};

export default ContractListingPage;

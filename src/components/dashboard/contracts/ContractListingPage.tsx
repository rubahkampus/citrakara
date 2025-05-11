// src/components/dashboard/contracts/ContractListingPage.tsx
import React, { useState } from "react";
import {
  Box,
  Tabs,
  Tab,
  Typography,
  List,
  ListItem,
  ListItemText,
  Chip,
  Button,
  Paper,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import Link from "next/link";
import { IContract } from "@/lib/db/models/contract.model";

interface ContractListingPageProps {
  username: string;
  asArtist: IContract[];
  asClient: IContract[];
}

// Helper to get the status color
const getStatusColor = (status: string) => {
  const statusMap: Record<string, string> = {
    active: "primary",
    completed: "success",
    completedLate: "success",
    cancelledClient: "error",
    cancelledClientLate: "error",
    cancelledArtist: "error",
    cancelledArtistLate: "error",
    notCompleted: "error",
  };

  return statusMap[status] || "default";
};

// Format date helper
const formatDate = (date: string | Date) => {
  return new Date(date).toLocaleDateString();
};

const ContractListingPage: React.FC<ContractListingPageProps> = ({
  username,
  asArtist,
  asClient,
}) => {
  const [tabValue, setTabValue] = useState(0);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [roleFilter, setRoleFilter] = useState<string>("all");

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Filter contracts based on status and role
  const getFilteredContracts = () => {
    let contracts: IContract[] = [];

    if (roleFilter === "client" || roleFilter === "all") {
      contracts = [...contracts, ...asClient];
    }

    if (roleFilter === "artist" || roleFilter === "all") {
      contracts = [...contracts, ...asArtist];
    }

    if (statusFilter !== "all") {
      contracts = contracts.filter(
        (contract) => contract.status === statusFilter
      );
    }

    // Sort by most recent first
    return contracts.sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  };

  const filteredContracts = getFilteredContracts();

  // Get all available statuses from the contracts
  const availableStatuses = [
    ...new Set([
      ...asArtist.map((contract) => contract.status),
      ...asClient.map((contract) => contract.status),
    ]),
  ];

  return (
    <Box>
      <Box
        mb={3}
        display="flex"
        justifyContent="space-between"
        alignItems="center"
      >
        <Typography variant="h6">Your Contracts</Typography>
        <Box>
          <FormControl
            variant="outlined"
            size="small"
            sx={{ minWidth: 120, mr: 2 }}
          >
            <InputLabel>Role</InputLabel>
            <Select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              label="Role"
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
            >
              <MenuItem value="all">All Statuses</MenuItem>
              {availableStatuses.map((status) => (
                <MenuItem key={status} value={status}>
                  {status}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </Box>

      <Tabs value={tabValue} onChange={handleTabChange} sx={{ mb: 2 }}>
        <Tab label="All" />
        <Tab label="Active" />
        <Tab label="Completed" />
        <Tab label="Cancelled" />
      </Tabs>

      {filteredContracts.length === 0 ? (
        <Box p={3} textAlign="center">
          <Typography color="textSecondary">
            No contracts found matching your filters
          </Typography>
        </Box>
      ) : (
        <List sx={{ width: "100%" }}>
          {filteredContracts.map((contract) => {
            const isArtistForContract = asArtist.some(
              (c) => c._id.toString() === contract._id.toString()
            );
            const role = isArtistForContract ? "artist" : "client";
            const otherParty = isArtistForContract
              ? contract.clientId.toString()
              : contract.artistId.toString();

            return (
              <Paper
                key={contract._id.toString()}
                sx={{ mb: 2, overflow: "hidden" }}
                elevation={1}
              >
                <ListItem
                  component={Link}
                  href={`/${username}/dashboard/contracts/${contract._id}`}
                  sx={{
                    textDecoration: "none",
                    color: "inherit",
                    p: 2,
                    "&:hover": {
                      backgroundColor: "rgba(0, 0, 0, 0.04)",
                    },
                  }}
                >
                  <ListItemText
                    primary={
                      <Box
                        display="flex"
                        justifyContent="space-between"
                        alignItems="center"
                      >
                        <Typography fontWeight="bold">
                          {contract.proposalSnapshot?.generalDescription.substring(
                            0,
                            50
                          )}
                          {contract.proposalSnapshot?.generalDescription
                            .length > 50
                            ? "..."
                            : ""}
                        </Typography>
                        <Chip
                          label={contract.status}
                          color={getStatusColor(contract.status) as any}
                          size="small"
                        />
                      </Box>
                    }
                    secondary={
                      <Box mt={1}>
                        <Typography variant="body2" component="span">
                          {role === "artist" ? "Client" : "Artist"}:{" "}
                          {otherParty}
                        </Typography>
                        <Typography variant="body2" component="div">
                          Created: {formatDate(contract.createdAt as Date)}
                        </Typography>
                        <Typography variant="body2" component="div">
                          Deadline: {formatDate(contract.deadlineAt)}
                        </Typography>
                        <Typography variant="body2" component="div">
                          Amount: {contract.finance.total}
                        </Typography>
                      </Box>
                    }
                  />
                </ListItem>
              </Paper>
            );
          })}
        </List>
      )}
    </Box>
  );
};

export default ContractListingPage;

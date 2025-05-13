"use client";

import React from "react";
import {
  ListItem,
  ListItemText,
  Chip,
  Box,
  Typography,
  Paper,
  Divider,
  Stack,
  useTheme,
  Button,
  Tooltip,
} from "@mui/material";
import Link from "next/link";
import {
  CalendarToday as CalendarIcon,
  AttachMoney as MoneyIcon,
  Person as PersonIcon,
  Brush as BrushIcon,
  Visibility as VisibilityIcon,
} from "@mui/icons-material";
import { IContract } from "@/lib/db/models/contract.model";

interface ContractListingItemProps {
  contract: IContract;
  username: string;
  isArtist: boolean;
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
  return new Date(date).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

// Format currency helper
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
};

const ContractListingItem: React.FC<ContractListingItemProps> = ({
  contract,
  username,
  isArtist,
}) => {
  const theme = useTheme();
  const role = isArtist ? "artist" : "client";
  const otherParty = isArtist
    ? contract.clientId.toString()
    : contract.artistId.toString();

  // Calculate days remaining or days overdue
  const currentDate = new Date();
  const deadlineDate = new Date(contract.deadlineAt);
  const daysRemaining = Math.ceil(
    (deadlineDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  const isOverdue = daysRemaining < 0;

  // Status display
  const statusText = contract.status.replace(/([A-Z])/g, " $1").trim();
  const formattedStatus =
    statusText.charAt(0).toUpperCase() + statusText.slice(1);

  return (
    <Paper
      sx={{
        mb: 2,
        overflow: "hidden",
        borderRadius: 1,
        boxShadow: theme.shadows[1],
        transition: "all 0.2s ease-in-out",
        "&:hover": {
          boxShadow: theme.shadows[3],
          transform: "translateY(-2px)",
        },
      }}
      elevation={1}
    >
      <ListItem
        component={Link}
        href={`/${username}/dashboard/contracts/${contract._id}`}
        sx={{
          textDecoration: "none",
          color: "inherit",
          p: 0,
          display: "block",
        }}
      >
        {/* Status header */}
        <Box
          sx={{
            p: 2,
            borderLeft: 6,
            borderColor: `${getStatusColor(contract.status)}.main`,
            backgroundColor: `${getStatusColor(contract.status)}.lighter`,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center" }}>
            {isArtist ? (
              <BrushIcon
                fontSize="small"
                sx={{ mr: 1, color: `${getStatusColor(contract.status)}.main` }}
              />
            ) : (
              <PersonIcon
                fontSize="small"
                sx={{ mr: 1, color: `${getStatusColor(contract.status)}.main` }}
              />
            )}
            <Typography
              variant="subtitle2"
              color={`${getStatusColor(contract.status)}.main`}
            >
              {role === "artist" ? "You are the Artist" : "You are the Client"}
            </Typography>
          </Box>
          <Chip
            label={formattedStatus}
            color={getStatusColor(contract.status) as any}
            size="small"
          />
        </Box>

        {/* Main content */}
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            {contract.proposalSnapshot?.generalDescription.substring(0, 60)}
            {contract.proposalSnapshot?.generalDescription.length > 60
              ? "..."
              : ""}
          </Typography>

          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={2}
            sx={{ mt: 2, mb: 2 }}
            divider={<Divider orientation="vertical" flexItem />}
          >
            <Box sx={{ display: "flex", alignItems: "center" }}>
              {role === "artist" ? (
                <PersonIcon
                  fontSize="small"
                  sx={{ mr: 1, color: "text.secondary" }}
                />
              ) : (
                <BrushIcon
                  fontSize="small"
                  sx={{ mr: 1, color: "text.secondary" }}
                />
              )}
              <Typography variant="body2" color="text.secondary">
                {role === "artist" ? "Client: " : "Artist: "}
                <Typography
                  component="span"
                  variant="body2"
                  fontWeight="medium"
                >
                  {otherParty}
                </Typography>
              </Typography>
            </Box>

            <Box sx={{ display: "flex", alignItems: "center" }}>
              <MoneyIcon
                fontSize="small"
                sx={{ mr: 1, color: "text.secondary" }}
              />
              <Typography variant="body2" color="text.secondary">
                Amount:
                <Typography
                  component="span"
                  variant="body2"
                  fontWeight="medium"
                  sx={{ ml: 0.5 }}
                >
                  {formatCurrency(contract.finance.total)}
                </Typography>
              </Typography>
            </Box>

            <Box sx={{ display: "flex", alignItems: "center" }}>
              <CalendarIcon
                fontSize="small"
                sx={{ mr: 1, color: "text.secondary" }}
              />
              <Tooltip
                title={`Created: ${formatDate(contract.createdAt as Date)}`}
              >
                <Typography variant="body2" color="text.secondary">
                  {isOverdue && contract.status === "active" ? (
                    <Typography
                      component="span"
                      variant="body2"
                      color="error.main"
                      fontWeight="medium"
                    >
                      Overdue by {Math.abs(daysRemaining)} days
                    </Typography>
                  ) : contract.status === "active" ? (
                    <>
                      Due:{" "}
                      <Typography
                        component="span"
                        variant="body2"
                        fontWeight="medium"
                      >
                        {formatDate(contract.deadlineAt)} ({daysRemaining} days
                        left)
                      </Typography>
                    </>
                  ) : (
                    <>
                      Deadline:{" "}
                      <Typography
                        component="span"
                        variant="body2"
                        fontWeight="medium"
                      >
                        {formatDate(contract.deadlineAt)}
                      </Typography>
                    </>
                  )}
                </Typography>
              </Tooltip>
            </Box>
          </Stack>

          {/* Milestone progress (if applicable) */}
          {contract.milestones && contract.milestones.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Progress:{" "}
                {contract.currentMilestoneIndex !== undefined
                  ? `${contract.currentMilestoneIndex + 1}/${
                      contract.milestones.length
                    } milestones`
                  : "Not started"}
              </Typography>
              <Box
                sx={{
                  height: 8,
                  bgcolor: "grey.100",
                  borderRadius: 5,
                  overflow: "hidden",
                  mt: 0.5,
                }}
              >
                <Box
                  sx={{
                    height: "100%",
                    width: `${contract.workPercentage}%`,
                    bgcolor: getStatusColor(contract.status) as string,
                    borderRadius: 5,
                  }}
                />
              </Box>
            </Box>
          )}

          {/* Action button */}
          <Box sx={{ mt: 3, textAlign: "right" }}>
            <Button
              variant="outlined"
              size="small"
              color="primary"
              endIcon={<VisibilityIcon />}
              sx={{
                borderRadius: 2,
                "&:hover": {
                  backgroundColor: "primary.lighter",
                },
              }}
            >
              View Details
            </Button>
          </Box>
        </Box>
      </ListItem>
    </Paper>
  );
};

export default ContractListingItem;

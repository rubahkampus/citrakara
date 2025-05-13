// src/components/dashboard/contracts/ContractActionButtons.tsx
"use client";

import React from "react";
import {
  Box,
  Button,
  Divider,
  Typography,
  Grid,
  Paper,
  Tooltip,
} from "@mui/material";
import Link from "next/link";
import { IContract } from "@/lib/db/models/contract.model";
// Import icons
import MonetizationOnIcon from "@mui/icons-material/MonetizationOn";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import CancelIcon from "@mui/icons-material/Cancel";
import BuildIcon from "@mui/icons-material/Build";
import WarningIcon from "@mui/icons-material/Warning";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import AssignmentIcon from "@mui/icons-material/Assignment";
import FolderIcon from "@mui/icons-material/Folder";

interface ContractActionButtonsProps {
  username: string;
  contract: IContract;
  isArtist: boolean;
  isClient: boolean;
}

const ContractActionButtons: React.FC<ContractActionButtonsProps> = ({
  username,
  contract,
  isArtist,
  isClient,
}) => {
  const isActive = contract.status === "active";
  const isTerminal = [
    "completed",
    "completedLate",
    "cancelledClient",
    "cancelledClientLate",
    "cancelledArtist",
    "cancelledArtistLate",
    "notCompleted",
  ].includes(contract.status);

  const contractId = contract._id.toString();

  // Check if client can claim funds
  const canClientClaimFunds =
    isClient && isTerminal && contract.finance.totalOwnedByClient > 0;

  // Check if artist can claim funds
  const canArtistClaimFunds =
    isArtist && isTerminal && contract.finance.totalOwnedByArtist > 0;

  // Check if artist can upload
  const canArtistUpload = isArtist && isActive;

  // Check if client can create tickets
  const canClientCreateTickets = isClient && isActive;

  // Check if artist can create tickets
  const canArtistCreateTickets = isArtist && isActive;

  // Flow is milestone
  const isMilestoneFlow =
    contract.proposalSnapshot.listingSnapshot.flow === "milestone";

  // Flow is standard
  const isStandardFlow =
    contract.proposalSnapshot.listingSnapshot.flow === "standard";

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  // Prepare action groups
  const renderFinancialActions = () => {
    if (!canClientClaimFunds && !canArtistClaimFunds) return null;

    return (
      <Box mb={2}>
        <Typography
          variant="subtitle2"
          sx={{ display: "flex", alignItems: "center", mb: 1 }}
        >
          <MonetizationOnIcon
            fontSize="small"
            sx={{ mr: 1, color: "primary.main" }}
          />
          Financial Actions
        </Typography>
        <Paper
          variant="outlined"
          sx={{
            p: 1.5,
            backgroundColor: "#f9f9f9",
            borderRadius: 2,
          }}
        >
          <Grid container spacing={1}>
            {canClientClaimFunds && (
              <Grid item>
                <Link
                  href={`/${username}/dashboard/contracts/${contractId}/claim?role=client`}
                  passHref
                >
                  <Tooltip title="Claim your available refund">
                    <Button
                      size="small"
                      variant="contained"
                      color="primary"
                      startIcon={<AttachMoneyIcon />}
                      sx={{ borderRadius: 1.5 }}
                    >
                      Claim Refund (
                      {formatCurrency(contract.finance.totalOwnedByClient)})
                    </Button>
                  </Tooltip>
                </Link>
              </Grid>
            )}

            {canArtistClaimFunds && (
              <Grid item>
                <Link
                  href={`/${username}/dashboard/contracts/${contractId}/claim?role=artist`}
                  passHref
                >
                  <Tooltip title="Claim your earned payment">
                    <Button
                      size="small"
                      variant="contained"
                      color="success"
                      startIcon={<AttachMoneyIcon />}
                      sx={{ borderRadius: 1.5 }}
                    >
                      Claim Payment (
                      {formatCurrency(contract.finance.totalOwnedByArtist)})
                    </Button>
                  </Tooltip>
                </Link>
              </Grid>
            )}
          </Grid>
        </Paper>
      </Box>
    );
  };

  const renderUploadActions = () => {
    if (!canArtistUpload) return null;

    return (
      <Box mb={2}>
        <Typography
          variant="subtitle2"
          sx={{ display: "flex", alignItems: "center", mb: 1 }}
        >
          <CloudUploadIcon
            fontSize="small"
            sx={{ mr: 1, color: "primary.main" }}
          />
          Upload Actions
        </Typography>
        <Paper
          variant="outlined"
          sx={{
            p: 1.5,
            backgroundColor: "#f9f9f9",
            borderRadius: 2,
          }}
        >
          <Grid container spacing={1}>
            {canArtistUpload && isStandardFlow && (
              <Grid item>
                <Link
                  href={`/${username}/dashboard/contracts/${contractId}/uploads/progress/new`}
                  passHref
                >
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<CloudUploadIcon />}
                    sx={{ borderRadius: 1.5 }}
                  >
                    Upload Progress
                  </Button>
                </Link>
              </Grid>
            )}

            {canArtistUpload &&
              isMilestoneFlow &&
              contract.currentMilestoneIndex && (
                <Grid item>
                  <Link
                    href={`/${username}/dashboard/contracts/${contractId}/uploads/milestone/new?milestoneIdx=${contract.currentMilestoneIndex}`}
                    passHref
                  >
                    <Tooltip
                      title={`Upload progress for milestone #${
                        contract.currentMilestoneIndex + 1
                      }`}
                    >
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<CloudUploadIcon />}
                        sx={{ borderRadius: 1.5 }}
                      >
                        Upload Milestone
                      </Button>
                    </Tooltip>
                  </Link>
                </Grid>
              )}

            {canArtistUpload && (
              <Grid item>
                <Link
                  href={`/${username}/dashboard/contracts/${contractId}/uploads/final/new`}
                  passHref
                >
                  <Tooltip title="Upload your completed work">
                    <Button
                      size="small"
                      variant="contained"
                      color="success"
                      startIcon={<CloudUploadIcon />}
                      sx={{ borderRadius: 1.5 }}
                    >
                      Upload Final Delivery
                    </Button>
                  </Tooltip>
                </Link>
              </Grid>
            )}
          </Grid>
        </Paper>
      </Box>
    );
  };

  const renderClientTicketActions = () => {
    if (!canClientCreateTickets) return null;

    return (
      <Box mb={2}>
        <Typography
          variant="subtitle2"
          sx={{ display: "flex", alignItems: "center", mb: 1 }}
        >
          <AssignmentIcon
            fontSize="small"
            sx={{ mr: 1, color: "primary.main" }}
          />
          Client Support Actions
        </Typography>
        <Paper
          variant="outlined"
          sx={{
            p: 1.5,
            backgroundColor: "#f9f9f9",
            borderRadius: 2,
          }}
        >
          <Grid container spacing={1}>
            {contract.proposalSnapshot.listingSnapshot.revisions?.type !==
              "none" && (
              <Grid item>
                <Link
                  href={`/${username}/dashboard/contracts/${contractId}/tickets/revision/new`}
                  passHref
                >
                  <Tooltip title="Request changes to the work">
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<BuildIcon />}
                      sx={{ borderRadius: 1.5 }}
                    >
                      Request Revision
                    </Button>
                  </Tooltip>
                </Link>
              </Grid>
            )}

            {contract.proposalSnapshot.listingSnapshot.allowContractChange && (
              <Grid item>
                <Link
                  href={`/${username}/dashboard/contracts/${contractId}/tickets/change/new`}
                  passHref
                >
                  <Tooltip title="Request changes to contract terms">
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<BuildIcon />}
                      sx={{ borderRadius: 1.5 }}
                    >
                      Request Contract Change
                    </Button>
                  </Tooltip>
                </Link>
              </Grid>
            )}

            <Grid item>
              <Link
                href={`/${username}/dashboard/contracts/${contractId}/tickets/cancel/new`}
                passHref
              >
                <Button
                  size="small"
                  variant="outlined"
                  color="error"
                  startIcon={<CancelIcon />}
                  sx={{ borderRadius: 1.5 }}
                >
                  Request Cancellation
                </Button>
              </Link>
            </Grid>

            <Grid item>
              <Link
                href={`/${username}/dashboard/contracts/${contractId}/tickets/resolution/new`}
                passHref
              >
                <Button
                  size="small"
                  variant="outlined"
                  color="warning"
                  startIcon={<WarningIcon />}
                  sx={{ borderRadius: 1.5 }}
                >
                  Open Dispute
                </Button>
              </Link>
            </Grid>
          </Grid>
        </Paper>
      </Box>
    );
  };

  const renderArtistTicketActions = () => {
    if (!canArtistCreateTickets) return null;

    return (
      <Box mb={2}>
        <Typography
          variant="subtitle2"
          sx={{ display: "flex", alignItems: "center", mb: 1 }}
        >
          <AssignmentIcon
            fontSize="small"
            sx={{ mr: 1, color: "primary.main" }}
          />
          Artist Support Actions
        </Typography>
        <Paper
          variant="outlined"
          sx={{
            p: 1.5,
            backgroundColor: "#f9f9f9",
            borderRadius: 2,
          }}
        >
          <Grid container spacing={1}>
            <Grid item>
              <Link
                href={`/${username}/dashboard/contracts/${contractId}/tickets/cancel/new`}
                passHref
              >
                <Button
                  size="small"
                  variant="outlined"
                  color="error"
                  startIcon={<CancelIcon />}
                  sx={{ borderRadius: 1.5 }}
                >
                  Request Cancellation
                </Button>
              </Link>
            </Grid>

            <Grid item>
              <Link
                href={`/${username}/dashboard/contracts/${contractId}/tickets/resolution/new`}
                passHref
              >
                <Button
                  size="small"
                  variant="outlined"
                  color="warning"
                  startIcon={<WarningIcon />}
                  sx={{ borderRadius: 1.5 }}
                >
                  Open Dispute
                </Button>
              </Link>
            </Grid>
          </Grid>
        </Paper>
      </Box>
    );
  };

  const renderViewActions = () => {
    return (
      <Box mb={1}>
        <Typography
          variant="subtitle2"
          sx={{ display: "flex", alignItems: "center", mb: 1 }}
        >
          <FolderIcon fontSize="small" sx={{ mr: 1, color: "primary.main" }} />
          View Documents
        </Typography>
        <Paper
          variant="outlined"
          sx={{
            p: 1.5,
            backgroundColor: "#f9f9f9",
            borderRadius: 2,
          }}
        >
          <Grid container spacing={1}>
            <Grid item>
              <Link
                href={`/${username}/dashboard/contracts/${contractId}/tickets`}
                passHref
              >
                <Button
                  size="small"
                  variant="text"
                  startIcon={<AssignmentIcon />}
                  sx={{ borderRadius: 1.5 }}
                >
                  View Tickets
                </Button>
              </Link>
            </Grid>

            <Grid item>
              <Link
                href={`/${username}/dashboard/contracts/${contractId}/uploads`}
                passHref
              >
                <Button
                  size="small"
                  variant="text"
                  startIcon={<FolderIcon />}
                  sx={{ borderRadius: 1.5 }}
                >
                  View Uploads
                </Button>
              </Link>
            </Grid>
          </Grid>
        </Paper>
      </Box>
    );
  };

  return (
    <Box>
      {renderFinancialActions()}
      {renderUploadActions()}
      {renderClientTicketActions()}
      {renderArtistTicketActions()}
      <Divider sx={{ my: 2 }} />
      {renderViewActions()}
    </Box>
  );
};

export default ContractActionButtons;

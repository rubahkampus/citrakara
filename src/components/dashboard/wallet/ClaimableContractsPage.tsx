// components/dashboard/wallet/ClaimableContractsPage.tsx
import React, { useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  Divider,
  Grid,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Snackbar,
} from "@mui/material";
import {
  MonetizationOn,
  ArrowDownward,
  Info,
  CheckCircle,
  Warning,
} from "@mui/icons-material";
import { useRouter } from "next/router";
import { axiosClient } from "@/lib/utils/axiosClient";

// Types
interface Finance {
  basePrice: number;
  optionFees: number;
  addons: number;
  rushFee: number;
  discount: number;
  surcharge: number;
  runtimeFees: number;
  total: number;
  totalPaid: number;
  totalOwnedByArtist: number;
  totalOwnedByClient: number;
}

interface Contract {
  _id: string;
  status:
    | "completed"
    | "completedLate"
    | "cancelledClient"
    | "cancelledClientLate"
    | "cancelledArtist"
    | "cancelledArtistLate"
    | "notCompleted";
  clientId: string;
  artistId: string;
  workPercentage: number;
  finance: Finance;
  proposalSnapshot: {
    listingSnapshot: {
      title: string;
    };
  };
  deadlineAt: string;
  graceEndsAt: string;
  cancelSummary?: {
    by: "client" | "artist";
    at: string;
    isLate: boolean;
    workPercentage: number;
    artistPayout: number;
    clientPayout: number;
  };
  createdAt: string;
  updatedAt: string;
}

interface ClaimableContractsPageProps {
  username: string;
  asArtist: Contract[];
  asClient: Contract[];
  userId: string;
}

// Main component
const ClaimableContractsPage: React.FC<ClaimableContractsPageProps> = ({
  username,
  asArtist,
  asClient,
  userId,
}) => {
  const router = useRouter();

  // State for tabs
  const [tabValue, setTabValue] = useState(0);

  // State for claim dialog
  const [claimDialogOpen, setClaimDialogOpen] = useState(false);
  const [contractToClaim, setContractToClaim] = useState<Contract | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // State for snackbar
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState<"success" | "error">(
    "success"
  );

  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Format currency
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Get status label
  const getStatusLabel = (status: Contract["status"]): string => {
    switch (status) {
      case "completed":
        return "Completed";
      case "completedLate":
        return "Completed Late";
      case "cancelledClient":
        return "Cancelled by Client";
      case "cancelledClientLate":
        return "Cancelled by Client (Late)";
      case "cancelledArtist":
        return "Cancelled by Artist";
      case "cancelledArtistLate":
        return "Cancelled by Artist (Late)";
      case "notCompleted":
        return "Not Completed";
      default:
        return status;
    }
  };

  // Get status color
  const getStatusColor = (status: Contract["status"]): string => {
    switch (status) {
      case "completed":
        return "success";
      case "completedLate":
        return "warning";
      case "notCompleted":
        return "error";
      default:
        return "default";
    }
  };

  // Get amount to claim
  const getClaimAmount = (
    contract: Contract,
    role: "artist" | "client"
  ): number => {
    if (role === "artist") {
      return contract.finance.totalOwnedByArtist;
    } else {
      return contract.finance.totalOwnedByClient;
    }
  };

  // Get claim explanation
  const getClaimExplanation = (
    contract: Contract,
    role: "artist" | "client"
  ): string => {
    const isLate = contract.status.includes("Late");
    const isCancelled = contract.status.includes("cancelled");

    if (role === "artist") {
      if (contract.status === "completed") {
        return `Full payment for completed work.`;
      } else if (contract.status === "completedLate") {
        return `Payment minus late penalty (${
          contract.finance.total - contract.finance.totalOwnedByArtist
        } IDR).`;
      } else if (isCancelled) {
        return `Partial payment based on ${contract.workPercentage}% work completed.`;
      }
    } else {
      // Client role
      if (contract.status === "completedLate") {
        return `Late penalty refund.`;
      } else if (contract.status === "notCompleted") {
        return `Full refund for incomplete work.`;
      } else if (isCancelled) {
        return `Partial refund for cancelled contract.`;
      }
    }

    return `Claimable amount based on contract terms.`;
  };

  // Handle claim button click
  const handleClaimClick = (contract: Contract) => {
    setContractToClaim(contract);
    setClaimDialogOpen(true);
  };

  // Handle claim confirmation
  const handleClaimConfirm = async () => {
    if (!contractToClaim) return;

    setIsProcessing(true);

    try {
      // Make API call to claim funds
      const response = await axiosClient.post(
        `/api/contract/${contractToClaim._id}/claim`
      );

      // Show success message
      setSnackbarMessage(
        "Funds claimed successfully! The amount will be added to your available balance."
      );
      setSnackbarSeverity("success");
      setSnackbarOpen(true);

      // Close dialog and reset state
      setClaimDialogOpen(false);
      setContractToClaim(null);

      // Redirect to the wallet page after a short delay
      setTimeout(() => {
        router.push(`/${username}/dashboard/wallet`);
      }, 2000);
    } catch (error) {
      console.error("Error claiming funds:", error);

      // Show error message
      setSnackbarMessage("Failed to claim funds. Please try again later.");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle dialog close
  const handleDialogClose = () => {
    setClaimDialogOpen(false);
    setContractToClaim(null);
  };

  // Handle snackbar close
  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  // Determine if there are any claimable contracts
  const hasArtistClaims = asArtist.length > 0;
  const hasClientClaims = asClient.length > 0;
  const hasNoClaims = !hasArtistClaims && !hasClientClaims;

  return (
    <Box>
      {/* Info banner */}
      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2">
          When a contract reaches its end-of-lifecycle status, you can claim the
          funds owed to you. The claimed amount will be added to your available
          wallet balance.
        </Typography>
      </Alert>

      {/* No claims message */}
      {hasNoClaims && (
        <Paper sx={{ p: 3, textAlign: "center" }}>
          <Info color="action" sx={{ fontSize: 48, mb: 2 }} />
          <Typography variant="h6">No Claimable Contracts</Typography>
          <Typography variant="body2" color="text.secondary">
            You don't have any contracts with claimable funds at the moment.
            When a contract is completed or cancelled, you'll be able to claim
            any funds owed to you here.
          </Typography>
        </Paper>
      )}

      {/* Tabs for artist/client views */}
      {(hasArtistClaims || hasClientClaims) && (
        <>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            sx={{ mb: 2 }}
            variant="fullWidth"
          >
            <Tab
              label={`As Artist (${asArtist.length})`}
              disabled={!hasArtistClaims}
            />
            <Tab
              label={`As Client (${asClient.length})`}
              disabled={!hasClientClaims}
            />
          </Tabs>

          {/* Artist claims */}
          {tabValue === 0 && (
            <Grid container spacing={2}>
              {asArtist.map((contract) => (
                <Grid item xs={12} key={contract._id}>
                  <Card>
                    <CardContent>
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          mb: 2,
                        }}
                      >
                        <Box>
                          <Typography variant="h6">
                            {contract.proposalSnapshot.listingSnapshot.title}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Contract ID: {contract._id.substring(0, 8)}...
                          </Typography>
                        </Box>
                        <Chip
                          label={getStatusLabel(contract.status)}
                          color={
                            getStatusColor(contract.status) as
                              | "default"
                              | "primary"
                              | "secondary"
                              | "error"
                              | "info"
                              | "success"
                              | "warning"
                          }
                          size="small"
                        />
                      </Box>

                      <Divider sx={{ my: 2 }} />

                      <Grid container spacing={2}>
                        <Grid item xs={6} md={3}>
                          <Typography variant="body2" color="text.secondary">
                            Contract Total
                          </Typography>
                          <Typography variant="body1" fontWeight="medium">
                            {formatCurrency(contract.finance.total)}
                          </Typography>
                        </Grid>
                        <Grid item xs={6} md={3}>
                          <Typography variant="body2" color="text.secondary">
                            Work Completed
                          </Typography>
                          <Typography variant="body1" fontWeight="medium">
                            {contract.workPercentage}%
                          </Typography>
                        </Grid>
                        <Grid item xs={6} md={3}>
                          <Typography variant="body2" color="text.secondary">
                            Deadline
                          </Typography>
                          <Typography variant="body1" fontWeight="medium">
                            {formatDate(contract.deadlineAt)}
                          </Typography>
                        </Grid>
                        <Grid item xs={6} md={3}>
                          <Typography variant="body2" color="text.secondary">
                            Claimable Amount
                          </Typography>
                          <Typography
                            variant="body1"
                            fontWeight="bold"
                            color="success.main"
                          >
                            {formatCurrency(getClaimAmount(contract, "artist"))}
                          </Typography>
                        </Grid>
                      </Grid>

                      <Box
                        sx={{
                          mt: 2,
                          p: 1,
                          bgcolor: "action.hover",
                          borderRadius: 1,
                        }}
                      >
                        <Typography variant="body2">
                          <Info
                            fontSize="small"
                            color="action"
                            sx={{ mr: 1, verticalAlign: "middle" }}
                          />
                          {getClaimExplanation(contract, "artist")}
                        </Typography>
                      </Box>
                    </CardContent>
                    <CardActions>
                      <Button
                        variant="contained"
                        color="primary"
                        startIcon={<MonetizationOn />}
                        onClick={() => handleClaimClick(contract)}
                        fullWidth
                      >
                        Claim{" "}
                        {formatCurrency(getClaimAmount(contract, "artist"))}
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </>
      )}

      {/* Claim confirmation dialog */}
      <Dialog
        open={claimDialogOpen}
        onClose={handleDialogClose}
        aria-labelledby="claim-dialog-title"
        aria-describedby="claim-dialog-description"
      >
        <DialogTitle id="claim-dialog-title">Confirm Fund Claim</DialogTitle>
        <DialogContent>
          <DialogContentText id="claim-dialog-description">
            {contractToClaim && (
              <>
                <Typography sx={{ mb: 2 }}>
                  You are about to claim
                  <strong>
                    {" "}
                    {formatCurrency(
                      contractToClaim.artistId === userId
                        ? contractToClaim.finance.totalOwnedByArtist
                        : contractToClaim.finance.totalOwnedByClient
                    )}{" "}
                  </strong>
                  from this contract.
                </Typography>
                <Typography sx={{ mb: 2 }}>
                  This amount will be added to your available wallet balance
                  immediately.
                </Typography>
                <Alert severity="warning" sx={{ mt: 2 }}>
                  This action cannot be undone. Once claimed, the contract will
                  be considered fully resolved.
                </Alert>
              </>
            )}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose} disabled={isProcessing}>
            Cancel
          </Button>
          <Button
            onClick={handleClaimConfirm}
            color="primary"
            variant="contained"
            disabled={isProcessing}
            startIcon={
              isProcessing ? <CircularProgress size={20} /> : <CheckCircle />
            }
          >
            {isProcessing ? "Processing..." : "Confirm Claim"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Result snackbar */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        message={snackbarMessage}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbarSeverity}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ClaimableContractsPage;

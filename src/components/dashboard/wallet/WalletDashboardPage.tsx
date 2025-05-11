// components/dashboard/wallet/WalletDashboardPage.tsx
import React from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Divider,
  Paper,
  Link as MuiLink,
} from "@mui/material";
import Link from "next/link";
import {
  AccountBalanceWallet,
  ArrowForward,
  ReceiptLong,
  LocalAtm,
} from "@mui/icons-material";

// Types
interface WalletSummary {
  available: number;
  escrowed: number;
  total: number;
}

interface WalletDashboardPageProps {
  username: string;
  walletSummary: WalletSummary;
}

// Main component
const WalletDashboardPage: React.FC<WalletDashboardPageProps> = ({
  username,
  walletSummary,
}) => {
  // Format currency
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <Box>
      {/* Main balance card */}
      <Card sx={{ mb: 4, overflow: "visible" }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
            <AccountBalanceWallet
              color="primary"
              sx={{ mr: 1, fontSize: 28 }}
            />
            <Typography variant="h6">Wallet Balance</Typography>
          </Box>

          <Grid container spacing={3}>
            {/* Available balance */}
            <Grid item xs={12} md={4}>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Available Balance
                </Typography>
                <Typography variant="h4" color="primary" fontWeight="bold">
                  {formatCurrency(walletSummary.available)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Ready to withdraw or spend
                </Typography>
              </Box>
            </Grid>

            {/* Escrowed balance */}
            <Grid item xs={12} md={4}>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Escrowed Balance
                </Typography>
                <Typography variant="h4" color="warning.main" fontWeight="bold">
                  {formatCurrency(walletSummary.escrowed)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Locked in active contracts
                </Typography>
              </Box>
            </Grid>

            {/* Total balance */}
            <Grid item xs={12} md={4}>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Total Balance
                </Typography>
                <Typography variant="h4" fontWeight="bold">
                  {formatCurrency(walletSummary.total)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Available + Escrowed
                </Typography>
              </Box>
            </Grid>
          </Grid>

          {/* Action buttons */}
          <Box sx={{ mt: 3, display: "flex", gap: 2 }}>
            <Button variant="contained" disabled startIcon={<LocalAtm />}>
              Add Funds
            </Button>
            <Button variant="outlined" disabled startIcon={<LocalAtm />}>
              Withdraw
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Quick links */}
      <Typography variant="h6" sx={{ mb: 2 }}>
        Quick Actions
      </Typography>
      <Grid container spacing={2}>
        {/* Transaction history link */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <ReceiptLong color="primary" sx={{ mr: 1 }} />
                <Typography variant="body1">Transaction History</Typography>
              </Box>
              <Link
                href={`/${username}/dashboard/wallet/transactions`}
                passHref
              >
                <MuiLink
                  component="button"
                  sx={{ display: "flex", alignItems: "center" }}
                >
                  <Typography variant="body2" color="primary">
                    View All
                  </Typography>
                  <ArrowForward fontSize="small" color="primary" />
                </MuiLink>
              </Link>
            </Box>
          </Paper>
        </Grid>

        {/* Claimable contracts link */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <AccountBalanceWallet color="primary" sx={{ mr: 1 }} />
                <Typography variant="body1">Claimable Contracts</Typography>
              </Box>
              <Link href={`/${username}/dashboard/wallet/contracts`} passHref>
                <MuiLink
                  component="button"
                  sx={{ display: "flex", alignItems: "center" }}
                >
                  <Typography variant="body2" color="primary">
                    View All
                  </Typography>
                  <ArrowForward fontSize="small" color="primary" />
                </MuiLink>
              </Link>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Help section */}
      <Paper sx={{ p: 2, mt: 4 }}>
        <Typography variant="subtitle2" color="text.secondary">
          Need help with your wallet?
        </Typography>
        <Typography variant="body2" color="text.secondary">
          For assistance with payments, withdrawals, or any other wallet-related
          issues, please contact our support team.
        </Typography>
      </Paper>
    </Box>
  );
};

export default WalletDashboardPage;

// components/dashboard/wallet/WalletDashboardPage.tsx
import React from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Paper,
  Link as MuiLink,
  Stack,
  Alert,
  Tooltip,
} from "@mui/material";
import Link from "next/link";
import {
  AccountBalanceWallet,
  ArrowForward,
  ReceiptLong,
  LocalAtm,
  Info,
  HelpOutline,
  CreditCard,
  AddCircle,
  ArrowUpward,
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
      {/* Navigation tabs - already handled by parent component */}

      {/* Main balance card with gradient background */}
      <Card
        sx={{
          mb: 4,
          borderRadius: 2,
          background: "linear-gradient(45deg, #303f9f 30%, #5c6bc0 90%)",
          boxShadow: "0 8px 16px rgba(0,0,0,0.1)",
        }}
      >
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
            <AccountBalanceWallet
              sx={{ mr: 2, fontSize: 32, color: "white" }}
            />
            <Typography variant="h5" fontWeight="500" color="white">
              Your Wallet
            </Typography>
          </Box>

          <Grid container spacing={4}>
            {/* Available balance */}
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 2, borderRadius: 2, height: "100%" }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Available Balance
                </Typography>
                <Typography variant="h4" color="primary.main" fontWeight="bold">
                  {formatCurrency(walletSummary.available)}
                </Typography>
                <Box sx={{ display: "flex", alignItems: "center", mt: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Ready to withdraw or spend
                  </Typography>
                  <Tooltip title="Funds you can withdraw or use for new commissions">
                    <Info fontSize="small" color="action" sx={{ ml: 1 }} />
                  </Tooltip>
                </Box>
              </Paper>
            </Grid>

            {/* Escrowed balance */}
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 2, borderRadius: 2, height: "100%" }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Escrowed Balance
                </Typography>
                <Typography variant="h4" color="warning.main" fontWeight="bold">
                  {formatCurrency(walletSummary.escrowed)}
                </Typography>
                <Box sx={{ display: "flex", alignItems: "center", mt: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Locked in active contracts
                  </Typography>
                  <Tooltip title="Funds held in escrow until contracts are completed">
                    <Info fontSize="small" color="action" sx={{ ml: 1 }} />
                  </Tooltip>
                </Box>
              </Paper>
            </Grid>

            {/* Total balance */}
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 2, borderRadius: 2, height: "100%" }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Total Balance
                </Typography>
                <Typography variant="h4" fontWeight="bold">
                  {formatCurrency(walletSummary.total)}
                </Typography>
                <Box sx={{ display: "flex", alignItems: "center", mt: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Available + Escrowed
                  </Typography>
                  <Tooltip title="Your total funds on the platform">
                    <Info fontSize="small" color="action" sx={{ ml: 1 }} />
                  </Tooltip>
                </Box>
              </Paper>
            </Grid>
          </Grid>

          {/* Action buttons */}
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={2}
            sx={{ mt: 3 }}
            justifyContent="center"
          >
            <Button
              variant="contained"
              disabled
              startIcon={<AddCircle />}
              sx={{
                bgcolor: "rgba(255,255,255,0.15)",
                color: "white",
                "&:hover": { bgcolor: "rgba(255,255,255,0.25)" },
                "&.Mui-disabled": { color: "rgba(255,255,255,0.5)" },
              }}
            >
              Add Funds
            </Button>
            <Button
              variant="outlined"
              disabled
              startIcon={<ArrowUpward />}
              sx={{
                borderColor: "rgba(255,255,255,0.5)",
                color: "white",
                "&:hover": { borderColor: "white" },
                "&.Mui-disabled": {
                  borderColor: "rgba(255,255,255,0.2)",
                  color: "rgba(255,255,255,0.5)",
                },
              }}
            >
              Withdraw
            </Button>
          </Stack>
        </CardContent>
      </Card>

      {/* Quick links */}
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 500 }}>
        Quick Actions
      </Typography>
      <Grid container spacing={2}>
        {/* Transaction history link */}
        <Grid item xs={12} md={6}>
          <Link href={`/${username}/dashboard/wallet/transactions`} passHref>
            <MuiLink underline="none" component="div">
              <Paper
                sx={{
                  p: 3,
                  borderRadius: 2,
                  transition: "transform 0.2s, box-shadow 0.2s",
                  "&:hover": {
                    transform: "translateY(-4px)",
                    boxShadow: "0 8px 16px rgba(0,0,0,0.1)",
                    cursor: "pointer",
                  },
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    <ReceiptLong color="primary" sx={{ mr: 2, fontSize: 28 }} />
                    <Box>
                      <Typography variant="h6" fontWeight="500">
                        Transaction History
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        View all your past transactions
                      </Typography>
                    </Box>
                  </Box>
                  <ArrowForward fontSize="small" color="primary" />
                </Box>
              </Paper>
            </MuiLink>
          </Link>
        </Grid>

        {/* Claimable contracts link */}
        <Grid item xs={12} md={6}>
          <Link href={`/${username}/dashboard/wallet/contracts`} passHref>
            <MuiLink underline="none" component="div">
              <Paper
                sx={{
                  p: 3,
                  borderRadius: 2,
                  transition: "transform 0.2s, box-shadow 0.2s",
                  "&:hover": {
                    transform: "translateY(-4px)",
                    boxShadow: "0 8px 16px rgba(0,0,0,0.1)",
                    cursor: "pointer",
                  },
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    <CreditCard color="primary" sx={{ mr: 2, fontSize: 28 }} />
                    <Box>
                      <Typography variant="h6" fontWeight="500">
                        Claimable Contracts
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Claim payments from completed contracts
                      </Typography>
                    </Box>
                  </Box>
                  <ArrowForward fontSize="small" color="primary" />
                </Box>
              </Paper>
            </MuiLink>
          </Link>
        </Grid>
      </Grid>

      {/* Help section */}
      <Alert
        severity="info"
        icon={<HelpOutline />}
        sx={{
          mt: 4,
          borderRadius: 2,
          boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
        }}
      >
        <Typography variant="subtitle2" fontWeight="500">
          Need help with your wallet?
        </Typography>
        <Typography variant="body2">
          For assistance with payments, withdrawals, or any other wallet-related
          issues, please contact our support team.
        </Typography>
      </Alert>
    </Box>
  );
};

export default WalletDashboardPage;

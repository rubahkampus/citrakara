// components/dashboard/wallet/WalletDashboardPage.tsx
"use client";

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
  Breadcrumbs,
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
  ArrowBack,
  Home,
  NavigateNext,
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
      {/* Navigation tabs - already handled by parent component */}
      <Box sx={{ mb: 3 }}>
        <Breadcrumbs separator={<NavigateNext fontSize="small" />}>
          <MuiLink
            component={Link}
            href={`/${username}/dashboard`}
            underline="hover"
            color="inherit"
            sx={{ display: "flex", alignItems: "center" }}
          >
            <Home fontSize="small" sx={{ mr: 0.5 }} />
            Dashboard
          </MuiLink>
          <Typography
            color="text.primary"
            sx={{ display: "flex", alignItems: "center" }}
          >
            <LocalAtm fontSize="small" sx={{ mr: 0.5 }} />
            Dompet
          </Typography>
        </Breadcrumbs>

        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mt: 2,
          }}
        >
          <Typography variant="h5" fontWeight="500">
            Dompet
          </Typography>
          <Button
            component={Link}
            href={`/${username}/dashboard`}
            variant="outlined"
            startIcon={<ArrowBack />}
            size="small"
          >
            Kembali ke Profil
          </Button>
        </Box>
      </Box>

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
              Dompetmu
            </Typography>
          </Box>

          <Grid container spacing={4}>
            {/* Available balance */}
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 2, borderRadius: 2, height: "100%" }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Saldo Tersedia
                </Typography>
                <Typography variant="h4" color="primary.main" fontWeight="bold">
                  {formatCurrency(walletSummary.available)}
                </Typography>
                <Box sx={{ display: "flex", alignItems: "center", mt: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Siap ditarik atau digunakan
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
                  Saldo Eskro
                </Typography>
                <Typography variant="h4" color="warning.main" fontWeight="bold">
                  {formatCurrency(walletSummary.escrowed)}
                </Typography>
                <Box sx={{ display: "flex", alignItems: "center", mt: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Tertahan di dalam kontrak
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
                  Saldo Total
                </Typography>
                <Typography variant="h4" fontWeight="bold">
                  {formatCurrency(walletSummary.total)}
                </Typography>
                <Box sx={{ display: "flex", alignItems: "center", mt: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Tersedia + Eskro
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
            {/* <Button
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
            </Button> */}
          </Stack>
        </CardContent>
      </Card>

      {/* Quick links */}
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 500 }}>
        Aksi
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
                        Riwayat Transaksi
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Lihat semua transaksi sebelumnya
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
                        Klaim Kontrak
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Klaim pembayaran atau uang kembali
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
    </Box>
  );
};

export default WalletDashboardPage;

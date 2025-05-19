// components/dashboard/wallet/ClaimableContractsPage.tsx
"use client";

import React, { useState, useMemo } from "react";
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
  Stack,
  Tooltip,
  IconButton,
  Breadcrumbs,
  Link as MuiLink,
  Badge,
  LinearProgress,
  Avatar,
} from "@mui/material";
import {
  MonetizationOn,
  Info,
  CheckCircle,
  LocalAtm,
  Home,
  NavigateNext,
  ArrowBack,
  CalendarToday,
  Assignment,
  Error,
  HelpOutline,
  WarningAmber,
  DoneAll,
  Cancel,
  Person,
  Launch,
} from "@mui/icons-material";
import { useRouter } from "next/navigation";
import { axiosClient } from "@/lib/utils/axiosClient";
import Link from "next/link";

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
    | "notCompleted"
    | "active"; // Added active status
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
    escrowTxnIds?: string[];
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
  const [snackbarSeverity, setSnackbarSeverity] = useState<
    "success" | "error" | "info" | "warning"
  >("success");

  // Filter active contracts
  const activeArtistContracts = useMemo(
    () => asArtist.filter((c) => c.status === "active"),
    [asArtist]
  );
  const activeClientContracts = useMemo(
    () => asClient.filter((c) => c.status === "active"),
    [asClient]
  );

  // Filter claimable contracts
  const claimableArtistContracts = useMemo(
    () =>
      asArtist.filter(
        (c) =>
          c.status !== "active" &&
          (!c.cancelSummary || !c.cancelSummary.escrowTxnIds)
      ),
    [asArtist]
  );

  const claimableClientContracts = useMemo(
    () =>
      asClient.filter(
        (c) =>
          c.status !== "active" &&
          (!c.cancelSummary || !c.cancelSummary.escrowTxnIds)
      ),
    [asClient]
  );

  // Filter completed/claimed contracts
  const completedArtistContracts = useMemo(
    () =>
      asArtist.filter(
        (c) =>
          c.status !== "active" &&
          c.cancelSummary &&
          c.cancelSummary.escrowTxnIds
      ),
    [asArtist]
  );

  const completedClientContracts = useMemo(
    () =>
      asClient.filter(
        (c) =>
          c.status !== "active" &&
          c.cancelSummary &&
          c.cancelSummary.escrowTxnIds
      ),
    [asClient]
  );

  // Calculate totals for display
  const totalClaimableAsArtist = useMemo(
    () =>
      claimableArtistContracts.reduce(
        (sum, contract) => sum + contract.finance.totalOwnedByArtist,
        0
      ),
    [claimableArtistContracts]
  );

  const totalClaimableAsClient = useMemo(
    () =>
      claimableClientContracts.reduce(
        (sum, contract) => sum + contract.finance.totalOwnedByClient,
        0
      ),
    [claimableClientContracts]
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

  // Is contract claimable by current user
  const isClaimable = (
    contract: Contract,
    role: "artist" | "client"
  ): boolean => {
    if (contract.status === "active") return false;
    if (contract.cancelSummary && contract.cancelSummary.escrowTxnIds)
      return false;

    const amount =
      role === "artist"
        ? contract.finance.totalOwnedByArtist
        : contract.finance.totalOwnedByClient;

    return amount > 0;
  };

  // Ambil label status (Bahasa Indonesia)
  const getStatusLabel = (status: Contract["status"]): string => {
    switch (status) {
      case "active":
        return "Aktif";
      case "completed":
        return "Selesai";
      case "completedLate":
        return "Selesai Terlambat";
      case "cancelledClient":
        return "Dibatalkan Klien";
      case "cancelledClientLate":
        return "Dibatalkan Klien (Terlambat)";
      case "cancelledArtist":
        return "Dibatalkan Ilustrator";
      case "cancelledArtistLate":
        return "Dibatalkan Ilustrator (Terlambat)";
      case "notCompleted":
        return "Gagal Diselesaikan";
      default:
        return status;
    }
  };

  // Ambil warna status (tidak perlu diubah jika tetap pakai skema warna bawaan)
  const getStatusColor = (status: Contract["status"]): string => {
    switch (status) {
      case "active":
        return "info";
      case "completed":
        return "success";
      case "completedLate":
        return "warning";
      case "notCompleted":
        return "error";
      case "cancelledClient":
      case "cancelledClientLate":
      case "cancelledArtist":
      case "cancelledArtistLate":
        return "warning";
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

  // Ambil penjelasan klaim (Bahasa Indonesia)
  const getClaimExplanation = (
    contract: Contract,
    role: "artist" | "client"
  ): string => {
    const isLate = contract.status.includes("Late");
    const isCancelled = contract.status.includes("cancelled");

    if (contract.status === "active") {
      return "Kontrak masih aktif.";
    }

    if (contract.cancelSummary && contract.cancelSummary.escrowTxnIds) {
      return "Dana sudah diklaim sebelumnya.";
    }

    if (role === "artist") {
      if (contract.status === "completed") {
        return `Pembayaran penuh untuk pekerjaan yang selesai.`;
      } else if (contract.status === "completedLate") {
        return `Pembayaran dikurangi denda keterlambatan (${formatCurrency(
          contract.finance.total - contract.finance.totalOwnedByArtist
        )}).`;
      } else if (isCancelled) {
        return `Pembayaran sebagian sesuai ${contract.workPercentage}% progres kerja.`;
      } else if (contract.status === "notCompleted") {
        return "Tidak ada pembayaran karena pekerjaan tidak selesai.";
      }
    } else {
      // Peran klien
      if (contract.status === "completedLate") {
        return `Pengembalian dana karena keterlambatan.`;
      } else if (contract.status === "notCompleted") {
        return `Pengembalian penuh karena pekerjaan tidak selesai.`;
      } else if (isCancelled) {
        return `Pengembalian sebagian karena kontrak dibatalkan.`;
      } else if (contract.status === "completed") {
        return "Tidak ada pengembalian karena pekerjaan telah selesai.";
      }
    }

    return `Jumlah yang dapat diklaim sesuai ketentuan kontrak.`;
  };

  // Get contract state chip
  const getContractStateChip = (contract: Contract) => {
    if (contract.status === "active") {
      return (
        <Chip label="In Progress" color="info" size="small" icon={<Info />} />
      );
    }

    if (contract.cancelSummary && contract.cancelSummary.escrowTxnIds) {
      return (
        <Chip label="Claimed" color="default" size="small" icon={<DoneAll />} />
      );
    }

    return (
      <Chip
        label="Claimable"
        color="success"
        size="small"
        icon={<MonetizationOn />}
        variant="outlined"
      />
    );
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
      setSnackbarMessage("Yay! Danamu sudah masuk! Cek saldo kamu sekarang.");
      setSnackbarSeverity("success");
      setSnackbarOpen(true);

      // Close dialog and reset state
      setClaimDialogOpen(false);
      setContractToClaim(null);

      // Redirect to the wallet page after a short delay
      setTimeout(() => {
        router.push(`/${username}/dashboard/wallet`);
      }, 2000);
    } catch (error: any) {
      console.error("Error claiming funds:", error);

      // Show error message
      setSnackbarMessage(
        error.response?.data?.message ||
          "Ups, terjadi kesalahan saat klaim dana. Coba lagi sebentar lagi ya!"
      );
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
      setClaimDialogOpen(false);
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle dialog close
  const handleDialogClose = () => {
    if (isProcessing) return; // Prevent closing during processing
    setClaimDialogOpen(false);
    setContractToClaim(null);
  };

  // Handle snackbar close
  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  // Determine if there are any claimable contracts
  const hasArtistContracts = asArtist.length > 0;
  const hasClientContracts = asClient.length > 0;
  const hasClaimableArtistContracts = claimableArtistContracts.length > 0;
  const hasClaimableClientContracts = claimableClientContracts.length > 0;
  const hasNoContracts = !hasArtistContracts && !hasClientContracts;

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
      {/* Navigation */}
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
          <MuiLink
            component={Link}
            href={`/${username}/dashboard/wallet`}
            underline="hover"
            color="inherit"
            sx={{ display: "flex", alignItems: "center" }}
          >
            <LocalAtm fontSize="small" sx={{ mr: 0.5 }} />
            Dompet
          </MuiLink>
          <Typography
            color="text.primary"
            sx={{ display: "flex", alignItems: "center" }}
          >
            Klaim Kontrak
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
            Klaim Kontrak
          </Typography>
          <Button
            component={Link}
            href={`/${username}/dashboard/wallet`}
            variant="outlined"
            startIcon={<ArrowBack />}
            size="small"
          >
            Kembali ke Dompet
          </Button>
        </Box>
      </Box>

      {/* Info banner */}
      <Alert
        severity="info"
        icon={<Info />}
        sx={{
          mb: 3,
          borderRadius: 2,
          "& .MuiAlert-message": { width: "100%" },
        }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography variant="body2">
            Begitu kontraknya selesai, kamu bisa klaim dananya! Saldo kamu akan
            langsung bertambah di dompet.
          </Typography>
          <Tooltip title="Learn more about contract payments">
            <IconButton size="small" color="info">
              <HelpOutline fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Alert>

      {/* Summary cards for claimable amounts */}
      {(hasClaimableArtistContracts || hasClaimableClientContracts) && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {hasClaimableArtistContracts && (
            <Grid item xs={12} md={6}>
              <Paper
                sx={{
                  p: 2,
                  borderRadius: 2,
                  display: "flex",
                  alignItems: "center",
                  bgcolor: "success.light",
                  color: "white",
                }}
              >
                <MonetizationOn sx={{ fontSize: 40, mr: 2 }} />
                <Box>
                  <Typography variant="body2">Klaim Sebagai Seniman</Typography>
                  <Typography variant="h5" fontWeight="bold">
                    {formatCurrency(totalClaimableAsArtist)}
                  </Typography>
                </Box>
                <Box sx={{ ml: "auto" }}>
                  <Chip
                    label={`${claimableArtistContracts.length} contract(s)`}
                    sx={{ bgcolor: "rgba(255,255,255,0.2)", color: "white" }}
                  />
                </Box>
              </Paper>
            </Grid>
          )}

          {hasClaimableClientContracts && (
            <Grid item xs={12} md={hasClaimableArtistContracts ? 6 : 12}>
              <Paper
                sx={{
                  p: 2,
                  borderRadius: 2,
                  display: "flex",
                  alignItems: "center",
                  bgcolor: "info.light",
                  color: "white",
                }}
              >
                <LocalAtm sx={{ fontSize: 40, mr: 2 }} />
                <Box>
                  <Typography variant="body2">Klaim Sebagai Klien</Typography>
                  <Typography variant="h5" fontWeight="bold">
                    {formatCurrency(totalClaimableAsClient)}
                  </Typography>
                </Box>
                <Box sx={{ ml: "auto" }}>
                  <Chip
                    label={`${claimableClientContracts.length} contract(s)`}
                    sx={{ bgcolor: "rgba(255,255,255,0.2)", color: "white" }}
                  />
                </Box>
              </Paper>
            </Grid>
          )}
        </Grid>
      )}

      {/* No contracts message */}
      {hasNoContracts && (
        <Paper sx={{ p: 4, textAlign: "center", borderRadius: 2 }}>
          <Info color="action" sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
          <Typography variant="h6">Belum Ada Kontrak</Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mt: 1, maxWidth: 500, mx: "auto" }}
          >
            Kamu belum memiliki kontrak apa pun. Setelah kamu terlibat dalam
            kontrak sebagai ilustrator atau klien, kamu bisa mengelola dan
            mengklaim pembayaran dari halaman ini.
          </Typography>
        </Paper>
      )}

      {/* Tabs for artist/client views */}
      {(hasArtistContracts || hasClientContracts) && (
        <>
          <Paper sx={{ borderRadius: 2, overflow: "hidden" }}>
            <Tabs
              value={tabValue}
              onChange={handleTabChange}
              variant="fullWidth"
              sx={{
                borderBottom: 1,
                borderColor: "divider",
                "& .MuiTab-root": { py: 2 },
              }}
            >
              <Tab
                label={
                  <Badge
                    badgeContent={claimableArtistContracts.length}
                    color="success"
                    showZero={false}
                  >
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      <Person sx={{ mr: 1 }} />
                      <Typography>
                        Sebagai Seniman ({asArtist.length})
                      </Typography>
                    </Box>
                  </Badge>
                }
                disabled={!hasArtistContracts}
                sx={{ textTransform: "none" }}
              />
              <Tab
                label={
                  <Badge
                    badgeContent={claimableClientContracts.length}
                    color="success"
                    showZero={false}
                  >
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      <Person sx={{ mr: 1 }} />
                      <Typography>Sebagai Klien ({asClient.length})</Typography>
                    </Box>
                  </Badge>
                }
                disabled={!hasClientContracts}
                sx={{ textTransform: "none" }}
              />
            </Tabs>

            {/* Contract sections */}
            <Box sx={{ p: { xs: 2, md: 3 } }}>
              {/* Artist view */}
              {tabValue === 0 && (
                <>
                  {/* Claimable contracts section */}
                  {claimableArtistContracts.length > 0 && (
                    <Box sx={{ mb: 4 }}>
                      <Box
                        sx={{ display: "flex", alignItems: "center", mb: 2 }}
                      >
                        <MonetizationOn color="success" sx={{ mr: 1 }} />
                        <Typography variant="h6" fontWeight="500">
                          Klaim Kontrak
                        </Typography>
                      </Box>
                      <Grid container spacing={2}>
                        {claimableArtistContracts.map((contract) => (
                          <Grid item xs={12} key={contract._id}>
                            <ContractCard
                              contract={contract}
                              role="artist"
                              userId={userId}
                              onClaimClick={handleClaimClick}
                              isClaimable={isClaimable(contract, "artist")}
                              formatCurrency={formatCurrency}
                              formatDate={formatDate}
                              getStatusLabel={getStatusLabel}
                              getStatusColor={getStatusColor}
                              getClaimAmount={getClaimAmount}
                              getClaimExplanation={getClaimExplanation}
                              getContractStateChip={getContractStateChip}
                            />
                          </Grid>
                        ))}
                      </Grid>
                    </Box>
                  )}

                  {/* Active contracts section */}
                  {activeArtistContracts.length > 0 && (
                    <Box sx={{ mb: 4 }}>
                      <Box
                        sx={{ display: "flex", alignItems: "center", mb: 2 }}
                      >
                        <Assignment color="info" sx={{ mr: 1 }} />
                        <Typography variant="h6" fontWeight="500">
                          Kontrak Aktif
                        </Typography>
                      </Box>
                      <Grid container spacing={2}>
                        {activeArtistContracts.map((contract) => (
                          <Grid item xs={12} key={contract._id}>
                            <ContractCard
                              contract={contract}
                              role="artist"
                              userId={userId}
                              onClaimClick={handleClaimClick}
                              isClaimable={false}
                              formatCurrency={formatCurrency}
                              formatDate={formatDate}
                              getStatusLabel={getStatusLabel}
                              getStatusColor={getStatusColor}
                              getClaimAmount={getClaimAmount}
                              getClaimExplanation={getClaimExplanation}
                              getContractStateChip={getContractStateChip}
                            />
                          </Grid>
                        ))}
                      </Grid>
                    </Box>
                  )}

                  {/* Completed contracts section */}
                  {completedArtistContracts.length > 0 && (
                    <Box>
                      <Box
                        sx={{ display: "flex", alignItems: "center", mb: 2 }}
                      >
                        <DoneAll color="action" sx={{ mr: 1 }} />
                        <Typography variant="h6" fontWeight="500">
                          Kontrak Selesai
                        </Typography>
                      </Box>
                      <Grid container spacing={2}>
                        {completedArtistContracts.map((contract) => (
                          <Grid item xs={12} key={contract._id}>
                            <ContractCard
                              contract={contract}
                              role="artist"
                              userId={userId}
                              onClaimClick={handleClaimClick}
                              isClaimable={false}
                              formatCurrency={formatCurrency}
                              formatDate={formatDate}
                              getStatusLabel={getStatusLabel}
                              getStatusColor={getStatusColor}
                              getClaimAmount={getClaimAmount}
                              getClaimExplanation={getClaimExplanation}
                              getContractStateChip={getContractStateChip}
                            />
                          </Grid>
                        ))}
                      </Grid>
                    </Box>
                  )}

                  {asArtist.length === 0 && (
                    <Alert severity="info">
                      Kamu tidak punya kontrak sebagai seniman{" "}
                    </Alert>
                  )}
                </>
              )}

              {/* Client view */}
              {tabValue === 1 && (
                <>
                  {/* Claimable contracts section */}
                  {claimableClientContracts.length > 0 && (
                    <Box sx={{ mb: 4 }}>
                      <Box
                        sx={{ display: "flex", alignItems: "center", mb: 2 }}
                      >
                        <MonetizationOn color="success" sx={{ mr: 1 }} />
                        <Typography variant="h6" fontWeight="500">
                          Klaim Kontrak{" "}
                        </Typography>
                      </Box>
                      <Grid container spacing={2}>
                        {claimableClientContracts.map((contract) => (
                          <Grid item xs={12} key={contract._id}>
                            <ContractCard
                              contract={contract}
                              role="client"
                              userId={userId}
                              onClaimClick={handleClaimClick}
                              isClaimable={isClaimable(contract, "client")}
                              formatCurrency={formatCurrency}
                              formatDate={formatDate}
                              getStatusLabel={getStatusLabel}
                              getStatusColor={getStatusColor}
                              getClaimAmount={getClaimAmount}
                              getClaimExplanation={getClaimExplanation}
                              getContractStateChip={getContractStateChip}
                            />
                          </Grid>
                        ))}
                      </Grid>
                    </Box>
                  )}

                  {/* Active contracts section */}
                  {activeClientContracts.length > 0 && (
                    <Box sx={{ mb: 4 }}>
                      <Box
                        sx={{ display: "flex", alignItems: "center", mb: 2 }}
                      >
                        <Assignment color="info" sx={{ mr: 1 }} />
                        <Typography variant="h6" fontWeight="500">
                          Kontrak Aktif{" "}
                        </Typography>
                      </Box>
                      <Grid container spacing={2}>
                        {activeClientContracts.map((contract) => (
                          <Grid item xs={12} key={contract._id}>
                            <ContractCard
                              contract={contract}
                              role="client"
                              userId={userId}
                              onClaimClick={handleClaimClick}
                              isClaimable={false}
                              formatCurrency={formatCurrency}
                              formatDate={formatDate}
                              getStatusLabel={getStatusLabel}
                              getStatusColor={getStatusColor}
                              getClaimAmount={getClaimAmount}
                              getClaimExplanation={getClaimExplanation}
                              getContractStateChip={getContractStateChip}
                            />
                          </Grid>
                        ))}
                      </Grid>
                    </Box>
                  )}

                  {/* Completed contracts section */}
                  {completedClientContracts.length > 0 && (
                    <Box>
                      <Box
                        sx={{ display: "flex", alignItems: "center", mb: 2 }}
                      >
                        <DoneAll color="action" sx={{ mr: 1 }} />
                        <Typography variant="h6" fontWeight="500">
                          Kontrak Selesai{" "}
                        </Typography>
                      </Box>
                      <Grid container spacing={2}>
                        {completedClientContracts.map((contract) => (
                          <Grid item xs={12} key={contract._id}>
                            <ContractCard
                              contract={contract}
                              role="client"
                              userId={userId}
                              onClaimClick={handleClaimClick}
                              isClaimable={false}
                              formatCurrency={formatCurrency}
                              formatDate={formatDate}
                              getStatusLabel={getStatusLabel}
                              getStatusColor={getStatusColor}
                              getClaimAmount={getClaimAmount}
                              getClaimExplanation={getClaimExplanation}
                              getContractStateChip={getContractStateChip}
                            />
                          </Grid>
                        ))}
                      </Grid>
                    </Box>
                  )}

                  {asClient.length === 0 && (
                    <Alert severity="info">
                      Kamu tidak punya kontrak sebagai klien{" "}
                    </Alert>
                  )}
                </>
              )}
            </Box>
          </Paper>
        </>
      )}

      {/* Claim confirmation dialog */}
      <Dialog
        open={claimDialogOpen}
        onClose={handleDialogClose}
        aria-labelledby="claim-dialog-title"
        aria-describedby="claim-dialog-description"
        PaperProps={{
          sx: { borderRadius: 2 },
        }}
      >
        <DialogTitle id="claim-dialog-title" sx={{ pb: 1 }}>
          Confirm Fund Claim
        </DialogTitle>
        <DialogContent>
          {isProcessing && <LinearProgress sx={{ mb: 2 }} />}
          <DialogContentText id="claim-dialog-description">
            {contractToClaim && (
              <>
                <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 500 }}>
                  {contractToClaim.proposalSnapshot.listingSnapshot.title}
                </Typography>

                <Typography sx={{ mb: 2 }}>
                  Kamu akan mengklaim{" "}
                  <Typography
                    component="span"
                    fontWeight="bold"
                    color="success.main"
                  >
                    {" "}
                    {formatCurrency(
                      contractToClaim.artistId === userId
                        ? contractToClaim.finance.totalOwnedByArtist
                        : contractToClaim.finance.totalOwnedByClient
                    )}{" "}
                  </Typography>
                  dari kontrak ini
                </Typography>

                <Box
                  sx={{ bgcolor: "action.hover", p: 2, borderRadius: 1, mb: 2 }}
                >
                  <Typography variant="body2">
                    <InfoRow
                      label="Contract Status"
                      value={getStatusLabel(contractToClaim.status)}
                    />
                    <InfoRow
                      label="Work Completed"
                      value={`${contractToClaim.workPercentage}%`}
                    />
                    <InfoRow
                      label="Contract Total"
                      value={formatCurrency(contractToClaim.finance.total)}
                    />
                  </Typography>
                </Box>
                <Typography sx={{ mb: 2 }}>
                  Jumlah ini akan langsung ditambahkan ke saldo dompetmu yang
                  tersedia.
                </Typography>

                <Alert severity="warning" sx={{ mt: 2 }}>
                  <Typography variant="body2">
                    Tindakan ini tidak dapat dibatalkan. Setelah diklaim,
                    kontrak akan dianggap selesai sepenuhnya.
                  </Typography>
                </Alert>
              </>
            )}
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button
            onClick={handleDialogClose}
            disabled={isProcessing}
            variant="outlined"
          >
            Batal
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
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
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

// Helper component for contract cards
interface ContractCardProps {
  contract: Contract;
  role: "artist" | "client";
  userId: string;
  onClaimClick: (contract: Contract) => void;
  isClaimable: boolean;
  formatCurrency: (amount: number) => string;
  formatDate: (dateString: string) => string;
  getStatusLabel: (status: Contract["status"]) => string;
  getStatusColor: (status: Contract["status"]) => string;
  getClaimAmount: (contract: Contract, role: "artist" | "client") => number;
  getClaimExplanation: (
    contract: Contract,
    role: "artist" | "client"
  ) => string;
  getContractStateChip: (contract: Contract) => React.ReactNode;
}

const ContractCard: React.FC<ContractCardProps> = ({
  contract,
  role,
  userId,
  onClaimClick,
  isClaimable,
  formatCurrency,
  formatDate,
  getStatusLabel,
  getStatusColor,
  getClaimAmount,
  getClaimExplanation,
  getContractStateChip,
}) => {
  const claimAmount = getClaimAmount(contract, role);
  const explanation = getClaimExplanation(contract, role);
  const isClaimed =
    contract.cancelSummary && contract.cancelSummary.escrowTxnIds;
  const isActive = contract.status === "active";

  return (
    <Card
      sx={{
        borderRadius: 2,
        transition: "transform 0.2s, box-shadow 0.2s",
        "&:hover": {
          transform: isClaimable ? "translateY(-2px)" : "none",
          boxShadow: isClaimable ? 4 : 1,
        },
        opacity: isClaimable ? 1 : 0.8,
        border: isClaimable ? "1px solid" : "none",
        borderColor: "success.main",
      }}
    >
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
              ID Kontrak: {contract._id.substring(0, 8)}...
            </Typography>
          </Box>
          <Stack direction="row" spacing={1} alignItems="center">
            {getContractStateChip(contract)}
            <Chip
              label={getStatusLabel(contract.status)}
              color={getStatusColor(contract.status) as any}
              size="small"
              variant="outlined"
            />
          </Stack>
        </Box>

        <Divider sx={{ my: 2 }} />

        <Grid container spacing={2}>
          <Grid item xs={6} md={3}>
            <Typography variant="body2" color="text.secondary">
              Total Kontrak
            </Typography>
            <Typography variant="body1" fontWeight="medium">
              {formatCurrency(contract.finance.total)}
            </Typography>
          </Grid>
          <Grid item xs={6} md={3}>
            <Typography variant="body2" color="text.secondary">
              Persentase Kerja Selesai
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
              {isActive ? "Current Balance" : "Claimable Amount"}
            </Typography>
            <Typography
              variant="body1"
              fontWeight="bold"
              color={isClaimable ? "success.main" : "text.primary"}
            >
              {formatCurrency(claimAmount)}
            </Typography>
          </Grid>
        </Grid>

        <Box
          sx={{
            mt: 2,
            p: 1.5,
            bgcolor: "action.hover",
            borderRadius: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center" }}>
            {isActive ? (
              <Info color="info" fontSize="small" sx={{ mr: 1 }} />
            ) : isClaimed ? (
              <DoneAll color="action" fontSize="small" sx={{ mr: 1 }} />
            ) : isClaimable ? (
              <MonetizationOn color="success" fontSize="small" sx={{ mr: 1 }} />
            ) : (
              <Cancel color="disabled" fontSize="small" sx={{ mr: 1 }} />
            )}
            <Typography variant="body2">{explanation}</Typography>
          </Box>

          {isActive && (
            <Link href={`/dashboard/contracts/${contract._id}`} passHref>
              <Button
                variant="outlined"
                size="small"
                endIcon={<Launch />}
                sx={{ ml: 2 }}
              >
                Lihat Kontrak
              </Button>
            </Link>
          )}
        </Box>
      </CardContent>

      {isClaimable && claimAmount > 0 && (
        <CardActions sx={{ px: 2, pb: 2, pt: 0 }}>
          <Button
            variant="contained"
            color="success"
            startIcon={<MonetizationOn />}
            onClick={() => onClaimClick(contract)}
            fullWidth
          >
            Claim {formatCurrency(claimAmount)}
          </Button>
        </CardActions>
      )}

      {!isClaimable && !isActive && (
        <CardActions sx={{ px: 2, pb: 2, pt: 0 }}>
          <Button
            variant="outlined"
            color="primary"
            disabled
            fullWidth
            startIcon={isClaimed ? <DoneAll /> : <Cancel />}
          >
            {isClaimed
              ? `Funds Claimed on ${formatDate(
                  contract.cancelSummary?.at || contract.updatedAt
                )}`
              : claimAmount <= 0
              ? "No Funds to Claim"
              : "Not Claimable"}
          </Button>
        </CardActions>
      )}

      {isActive && (
        <CardActions sx={{ px: 2, pb: 2, pt: 0 }}>
          <Button variant="outlined" color="primary" disabled fullWidth>
            Klaim Setelah Penyelesaian
          </Button>
        </CardActions>
      )}
    </Card>
  );
};

// Helper component for info rows
interface InfoRowProps {
  label: string;
  value: string | React.ReactNode;
}

const InfoRow: React.FC<InfoRowProps> = ({ label, value }) => (
  <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
    <Typography variant="body2" color="text.secondary">
      {label}:
    </Typography>
    <Typography variant="body2" fontWeight="medium">
      {value}
    </Typography>
  </Box>
);

export default ClaimableContractsPage;

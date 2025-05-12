// UniversalPaymentDialog.tsx
import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  RadioGroup,
  Radio,
  FormControlLabel,
  Divider,
  CircularProgress,
  Alert,
  Paper,
  Checkbox,
  FormGroup,
  Avatar,
} from "@mui/material";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import CreditCardIcon from "@mui/icons-material/CreditCard";
import PaymentIcon from "@mui/icons-material/Payment";
import { axiosClient } from "@/lib/utils/axiosClient";

interface WalletSummary {
  available: number;
  escrowed: number;
  total: number;
}

interface PaymentData {
  paymentMethod: string;
  secondaryMethod: string | null;
  walletAmount: number;
  remainingAmount: number;
  paymentAmount: number;
}

interface UniversalPaymentDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  totalAmount: number;
  onSubmit: (paymentData: PaymentData) => Promise<void>;
  description?: string;
}

// Simplified payment methods
const paymentMethods = [
  {
    value: "gopay",
    label: "GoPay",
    icon: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/86/Gopay_logo.svg/512px-Gopay_logo.svg.png",
    category: "ewallet",
  },
  {
    value: "ovo",
    label: "OVO",
    icon: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/eb/Logo_ovo_purple.svg/512px-Logo_ovo_purple.svg.png",
    category: "ewallet",
  },
  {
    value: "dana",
    label: "DANA",
    icon: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/72/Logo_dana_blue.svg/512px-Logo_dana_blue.svg.png",
    category: "ewallet",
  },
  {
    value: "bca",
    label: "BCA Virtual Account",
    icon: "https://upload.wikimedia.org/wikipedia/id/thumb/5/55/BCA_logo.svg/512px-BCA_logo.svg.png",
    category: "bank",
  },
  {
    value: "bni",
    label: "BNI Virtual Account",
    icon: "https://upload.wikimedia.org/wikipedia/id/thumb/5/55/BNI_logo.svg/512px-BNI_logo.svg.png",
    category: "bank",
  },
  {
    value: "mandiri",
    label: "Mandiri Virtual Account",
    icon: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/ad/Bank_Mandiri_logo_2016.svg/512px-Bank_Mandiri_logo_2016.svg.png",
    category: "bank",
  },
  {
    value: "card",
    label: "Kartu Kredit/Debit",
    icon: "",
    category: "card",
  },
];

export default function UniversalPaymentDialog({
  open,
  onClose,
  title,
  totalAmount,
  onSubmit,
  description,
}: UniversalPaymentDialogProps) {
  const [useWallet, setUseWallet] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState<string>("gopay");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [walletDetails, setWalletDetails] = useState<WalletSummary | null>(
    null
  );
  const [walletLoading, setWalletLoading] = useState(false);

  // Fetch wallet balance on component mount
  useEffect(() => {
    if (open) {
      fetchWalletBalance();
    }
  }, [open]);

  const fetchWalletBalance = async () => {
    setWalletLoading(true);
    try {
      const response = await axiosClient.get("/api/wallet/balance");
      setWalletDetails(response.data);

      // If wallet has insufficient funds, don't auto-select it
      if (response.data.available < totalAmount) {
        setUseWallet(false);
      }
    } catch (err) {
      console.error("Error fetching wallet details:", err);
      setError("Gagal memuat informasi dompet. Silakan coba lagi.");
      setUseWallet(false);
    } finally {
      setWalletLoading(false);
    }
  };

  const handleUseWalletChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setUseWallet(event.target.checked);
  };

  const handlePaymentMethodChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setPaymentMethod(event.target.value);
  };

  const handlePaymentSubmit = async () => {
    setLoading(true);
    setError(null);

    try {
      // Calculate how much to use from wallet
      const walletAmount =
        useWallet && walletDetails
          ? Math.min(walletDetails.available, totalAmount)
          : 0;

      const remainingAmount = totalAmount - walletAmount;
      const needsSecondaryPayment = remainingAmount > 0;

      // Prepare payment data for submission
      const paymentData: PaymentData = {
        paymentMethod:
          useWallet && !needsSecondaryPayment
            ? "wallet"
            : useWallet && needsSecondaryPayment
            ? "combo"
            : paymentMethod,
        secondaryMethod: useWallet && needsSecondaryPayment ? "card" : null,
        walletAmount,
        remainingAmount,
        paymentAmount: totalAmount,
      };

      // Call the provided onSubmit function
      await onSubmit(paymentData);

      // Close the dialog on success
      onClose();
    } catch (err: any) {
      console.error("Payment error:", err);
      setError(
        err.response?.data?.error ||
          "Gagal memproses pembayaran. Silakan coba lagi."
      );
    } finally {
      setLoading(false);
    }
  };

  // Check if user has sufficient wallet balance
  const hasSufficientFunds =
    walletDetails && walletDetails.available >= totalAmount;

  // Calculate wallet contribution and remaining amount
  const walletContribution =
    useWallet && walletDetails
      ? Math.min(walletDetails.available, totalAmount)
      : 0;
  const remainingAmount = totalAmount - walletContribution;
  const needsAdditionalPayment = useWallet && remainingAmount > 0;

  // Format currency as IDR
  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(amount);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{ sx: { borderRadius: 2 } }}
    >
      <DialogTitle
        sx={{ borderBottom: "1px solid", borderColor: "divider", pb: 2 }}
      >
        <Typography variant="h6" component="div">
          {title || "Pembayaran"}
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ p: 3, pt: 3 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {description && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {description}
          </Typography>
        )}

        <Box>
          {/* Wallet Option */}
          <Paper
            variant="outlined"
            sx={{
              mb: 3,
              p: 2,
              borderRadius: 1,
            }}
          >
            <FormGroup>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={useWallet}
                    onChange={handleUseWalletChange}
                    disabled={walletLoading || !walletDetails}
                  />
                }
                label={
                  <Box>
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      <AccountBalanceWalletIcon sx={{ mr: 1 }} />
                      <Typography variant="body1">
                        Gunakan Saldo Dompet
                      </Typography>
                    </Box>
                    {walletLoading ? (
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ ml: 4 }}
                      >
                        Memuat saldo dompet...
                      </Typography>
                    ) : walletDetails ? (
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ ml: 4 }}
                      >
                        Saldo: {formatCurrency(walletDetails.available)}
                        {useWallet && !hasSufficientFunds && (
                          <Box
                            component="span"
                            sx={{ color: "warning.main", fontWeight: "medium" }}
                          >
                            {` (${formatCurrency(
                              walletContribution
                            )} akan digunakan dari dompet)`}
                          </Box>
                        )}
                      </Typography>
                    ) : (
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ ml: 4 }}
                      >
                        Saldo dompet tidak tersedia
                      </Typography>
                    )}
                  </Box>
                }
              />
            </FormGroup>
          </Paper>

          {/* Additional Payment Method Section */}
          {(!useWallet || needsAdditionalPayment) && (
            <>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle1" fontWeight="medium">
                  {useWallet && needsAdditionalPayment
                    ? `Pilih Metode Pembayaran untuk ${formatCurrency(
                        remainingAmount
                      )}`
                    : "Pilih Metode Pembayaran"}
                </Typography>
              </Box>

              <RadioGroup
                value={paymentMethod}
                onChange={handlePaymentMethodChange}
              >
                <Paper variant="outlined" sx={{ p: 2, borderRadius: 1 }}>
                  {paymentMethods.map((method) => (
                    <FormControlLabel
                      key={method.value}
                      value={method.value}
                      control={<Radio size="small" />}
                      label={
                        <Box sx={{ display: "flex", alignItems: "center" }}>
                          {method.icon ? (
                            <Avatar
                              src={method.icon}
                              sx={{ width: 24, height: 24, mr: 1 }}
                              variant="square"
                            />
                          ) : (
                            <CreditCardIcon sx={{ fontSize: 24, mr: 1 }} />
                          )}
                          <Typography variant="body2">
                            {method.label}
                          </Typography>
                        </Box>
                      }
                      sx={{
                        display: "flex",
                        mb: 1,
                        width: { xs: "100%", sm: "50%" },
                        float: { xs: "none", sm: "left" },
                      }}
                    />
                  ))}
                </Paper>
              </RadioGroup>
            </>
          )}

          {/* Payment Summary */}
          <Box sx={{ mt: 3 }}>
            <Divider sx={{ my: 2 }} />
            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
              <Typography variant="body1">Total</Typography>
              <Typography variant="h6" color="primary.main" fontWeight="bold">
                {formatCurrency(totalAmount)}
              </Typography>
            </Box>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions
        sx={{ p: 2, borderTop: "1px solid", borderColor: "divider" }}
      >
        <Button onClick={onClose} color="inherit">
          Batal
        </Button>
        <Button
          onClick={handlePaymentSubmit}
          variant="contained"
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : <PaymentIcon />}
        >
          {loading ? "Memproses..." : "Bayar Sekarang"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

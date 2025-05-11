// ProposalPaymentDialog.tsx
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
  Card,
  CardContent,
  Stepper,
  Step,
  StepLabel,
  Avatar,
  Checkbox,
  FormGroup,
  Stack,
} from "@mui/material";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import CreditCardIcon from "@mui/icons-material/CreditCard";
import PaymentIcon from "@mui/icons-material/Payment";
import StorefrontIcon from "@mui/icons-material/Storefront";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { axiosClient } from "@/lib/utils/axiosClient";
import { useRouter } from "next/navigation";

interface WalletSummary {
  available: number;
  escrowed: number;
  total: number;
}

interface ProposalPaymentDialogProps {
  open: boolean;
  onClose: () => void;
  proposalId: string;
  totalAmount: number;
  proposalTitle: string;
  artistName: string;
}

// Indonesian payment methods
const indonesianPaymentMethods = [
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
    value: "linkaja",
    label: "LinkAja",
    icon: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/85/LinkAja.svg/512px-LinkAja.svg.png",
    category: "ewallet",
  },
  {
    value: "shopeepay",
    label: "ShopeePay",
    icon: "https://luckydraw.id/wp-content/uploads/2021/01/shopee-pay-logo.png",
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
    value: "bri",
    label: "BRI Virtual Account",
    icon: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2e/BRI_2020.svg/512px-BRI_2020.svg.png",
    category: "bank",
  },
  {
    value: "mandiri",
    label: "Mandiri Virtual Account",
    icon: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/ad/Bank_Mandiri_logo_2016.svg/512px-Bank_Mandiri_logo_2016.svg.png",
    category: "bank",
  },
  {
    value: "alfamart",
    label: "Alfamart",
    icon: "https://upload.wikimedia.org/wikipedia/id/thumb/9/9d/Logo_Alfamart.png/512px-Logo_Alfamart.png",
    category: "retail",
  },
  {
    value: "indomaret",
    label: "Indomaret",
    icon: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9d/Logo_Indomaret.png/512px-Logo_Indomaret.png",
    category: "retail",
  },
  {
    value: "card",
    label: "Kartu Kredit/Debit",
    icon: "",
    category: "card",
  },
];

export default function ProposalPaymentDialog({
  open,
  onClose,
  proposalId,
  totalAmount,
  proposalTitle,
  artistName,
}: ProposalPaymentDialogProps) {
  const router = useRouter();
  const [activeStep, setActiveStep] = useState(0);
  const [useWallet, setUseWallet] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState<string>("gopay");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [walletDetails, setWalletDetails] = useState<WalletSummary | null>(
    null
  );
  const [walletLoading, setWalletLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [contractId, setContractId] = useState<string | null>(null);

  // Steps for the payment process
  const steps = ["Pilih Metode Pembayaran", "Konfirmasi"];

  // Payment categories
  const paymentCategories = [
    { id: "ewallet", label: "E-Wallet" },
    { id: "bank", label: "Virtual Account Bank" },
    { id: "retail", label: "Minimarket" },
    { id: "card", label: "Kartu Kredit/Debit" },
  ];

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

  const handleNextStep = () => {
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBackStep = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleCreateContract = async () => {
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

      // Calls the contract creation endpoint with payment details
      const response = await axiosClient.post(
        `/api/contract/create-from-proposal`,
        {
          proposalId,
          paymentMethod:
            useWallet && !needsSecondaryPayment
              ? "wallet"
              : useWallet && needsSecondaryPayment
              ? "combo"
              : "card",
          secondaryMethod:
            useWallet && needsSecondaryPayment ? "card" : null,
          walletAmount,
          remainingAmount,
          paymentAmount: totalAmount,
        }
      );

      setContractId(response.data.contractId);
      setSuccess(true);
      setActiveStep(steps.length - 1); // Move to confirmation step
    } catch (err: any) {
      console.error("Error creating contract:", err);
      setError(
        err.response?.data?.error || "Gagal membuat kontrak. Silakan coba lagi."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCloseDialog = () => {
    if (success) {
      // If successful, redirect to the new contract
      if (contractId) {
        router.push(`/contracts/${contractId}`);
      } else {
        router.refresh();
      }
    }
    onClose();
  };

  const viewContract = () => {
    if (contractId) {
      router.push(`/contracts/${contractId}`);
    }
    onClose();
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

  // Render payment method selection
  const renderPaymentMethodSelection = () => (
    <Box sx={{ p: 1 }}>
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
                  <Typography variant="body1">Gunakan Saldo Dompet</Typography>
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
            <Typography variant="subtitle1" fontWeight="bold">
              {useWallet && needsAdditionalPayment
                ? `Pilih Metode Pembayaran untuk ${formatCurrency(
                    remainingAmount
                  )}`
                : "Pilih Metode Pembayaran"}
            </Typography>
          </Box>

          {/* Payment method categories */}
          <RadioGroup
            value={paymentMethod}
            onChange={handlePaymentMethodChange}
          >
            {paymentCategories.map((category) => {
              const methodsInCategory = indonesianPaymentMethods.filter(
                (method) => method.category === category.id
              );

              return (
                <Paper
                  key={category.id}
                  variant="outlined"
                  sx={{
                    mb: 2,
                    p: 2,
                    borderRadius: 1,
                  }}
                >
                  <Typography variant="body1" sx={{ mb: 1 }}>
                    {category.label}
                  </Typography>

                  <Stack
                    direction="row"
                    flexWrap="wrap"
                    gap={1}
                    sx={{
                      "& .MuiFormControlLabel-root": {
                        margin: 0,
                        minWidth: { xs: "45%", sm: "30%" },
                      },
                    }}
                  >
                    {methodsInCategory.map((method) => (
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
                      />
                    ))}
                  </Stack>
                </Paper>
              );
            })}
          </RadioGroup>
        </>
      )}
    </Box>
  );

  // Render confirmation page
  const renderConfirmation = () => (
    <Box sx={{ p: 1 }}>
      {success ? (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 2,
            py: 3,
          }}
        >
          <CheckCircleIcon color="success" sx={{ fontSize: 60 }} />
          <Typography variant="h6" color="success.main">
            Kontrak Berhasil Dibuat!
          </Typography>
          <Typography variant="body1" textAlign="center">
            Kontrak Anda dengan {artistName} telah berhasil dibuat dan didanai.
          </Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={viewContract}
            sx={{ mt: 2 }}
          >
            Lihat Kontrak
          </Button>
        </Box>
      ) : (
        <Box>
          <Typography variant="h6" gutterBottom>
            Ringkasan Pembayaran
          </Typography>

          <Card variant="outlined" sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="body2" color="text.secondary">
                Proposal
              </Typography>
              <Typography variant="body1" gutterBottom>
                {proposalTitle}
              </Typography>

              <Typography variant="body2" color="text.secondary">
                Seniman
              </Typography>
              <Typography variant="body1" gutterBottom>
                {artistName}
              </Typography>

              <Divider sx={{ my: 2 }} />

              <Typography variant="body2" color="text.secondary">
                Metode Pembayaran
              </Typography>

              {useWallet && (
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    mb: walletContribution < totalAmount ? 0.5 : 0,
                  }}
                >
                  <AccountBalanceWalletIcon sx={{ mr: 1, fontSize: 20 }} />
                  <Typography variant="body1">
                    Dompet: {formatCurrency(walletContribution)}
                  </Typography>
                </Box>
              )}

              {(needsAdditionalPayment || !useWallet) && (
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  {paymentMethod === "card" ? (
                    <CreditCardIcon sx={{ mr: 1, fontSize: 20 }} />
                  ) : ["alfamart", "indomaret"].includes(paymentMethod) ? (
                    <StorefrontIcon sx={{ mr: 1, fontSize: 20 }} />
                  ) : (
                    <PaymentIcon sx={{ mr: 1, fontSize: 20 }} />
                  )}
                  <Typography variant="body1">
                    {
                      indonesianPaymentMethods.find(
                        (m) => m.value === paymentMethod
                      )?.label
                    }
                    {needsAdditionalPayment
                      ? `: ${formatCurrency(remainingAmount)}`
                      : ""}
                  </Typography>
                </Box>
              )}

              <Divider sx={{ my: 2 }} />

              <Typography variant="body2" color="text.secondary">
                Total Pembayaran
              </Typography>
              <Typography
                variant="h6"
                color="primary.main"
                sx={{ fontWeight: "bold" }}
              >
                {formatCurrency(totalAmount)}
              </Typography>
            </CardContent>
          </Card>

          <Alert severity="info" sx={{ mb: 3 }}>
            Ini akan membuat kontrak dan mentransfer dana ke escrow. Seniman
            akan diberi tahu.
          </Alert>

          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", my: 2 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Button
              variant="contained"
              color="primary"
              onClick={handleCreateContract}
              fullWidth
              size="large"
            >
              Konfirmasi Pembayaran
            </Button>
          )}
        </Box>
      )}
    </Box>
  );

  return (
    <Dialog
      open={open}
      onClose={handleCloseDialog}
      maxWidth="sm"
      fullWidth
      PaperProps={{ sx: { borderRadius: 2 } }}
    >
      <DialogTitle
        sx={{ borderBottom: "1px solid", borderColor: "divider", pb: 2 }}
      >
        <Typography variant="h6" component="div">
          Pembayaran Kontrak
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        <Box>
          {activeStep === 0 && renderPaymentMethodSelection()}
          {activeStep === 1 && renderConfirmation()}
        </Box>
      </DialogContent>

      <DialogActions
        sx={{ p: 2, borderTop: "1px solid", borderColor: "divider" }}
      >
        <Button onClick={handleCloseDialog} color="inherit">
          {success ? "Tutup" : "Batal"}
        </Button>

        {!success && activeStep > 0 && activeStep < steps.length - 1 && (
          <Button onClick={handleBackStep}>Kembali</Button>
        )}

        {!success && activeStep < steps.length - 1 && (
          <Button onClick={handleNextStep} variant="contained">
            Lanjut
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}

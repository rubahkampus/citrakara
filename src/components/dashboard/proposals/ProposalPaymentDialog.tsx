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
  Stack,
  Chip,
  TextField,
  Stepper,
  Step,
  StepLabel,
} from "@mui/material";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import CreditCardIcon from "@mui/icons-material/CreditCard";
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
  const [paymentMethod, setPaymentMethod] = useState<"wallet" | "card">(
    "wallet"
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [walletDetails, setWalletDetails] = useState<WalletSummary | null>(
    null
  );
  const [walletLoading, setWalletLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [contractId, setContractId] = useState<string | null>(null);

  // Mock credit card state
  const [cardNumber, setCardNumber] = useState("");
  const [cardName, setCardName] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCVC, setCardCVC] = useState("");

  // Steps for the payment process
  const steps = ["Select Payment Method", "Payment Details", "Confirmation"];

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
    } catch (err) {
      console.error("Error fetching wallet details:", err);
      setError("Failed to load wallet information. Please try again.");
    } finally {
      setWalletLoading(false);
    }
  };

  const handlePaymentMethodChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setPaymentMethod(event.target.value as "wallet" | "card");
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
      // Calls the contract creation endpoint with payment details
      const response = await axiosClient.post(
        `/api/contract/create-from-proposal`,
        {
          proposalId,
          paymentMethod,
          paymentAmount: totalAmount,
          // Only include card details if using card payment method
          ...(paymentMethod === "card"
            ? {
                card: {
                  number: cardNumber,
                  name: cardName,
                  expiry: cardExpiry,
                  cvc: cardCVC,
                },
              }
            : {}),
        }
      );

      setContractId(response.data.contractId);
      setSuccess(true);
      setActiveStep(2); // Move to confirmation step
    } catch (err: any) {
      console.error("Error creating contract:", err);
      setError(
        err.response?.data?.error ||
          "Failed to create contract. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCloseDialog = () => {
    if (success) {
      // If successful, refresh the page or redirect to the new contract
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

  // Format currency as IDR
  const formatCurrency = (amount: number) => `IDR ${amount.toLocaleString()}`;

  // Render payment method selection
  const renderPaymentMethodSelection = () => (
    <Box sx={{ p: 1 }}>
      <Typography variant="subtitle1" gutterBottom>
        Choose Payment Method
      </Typography>

      <RadioGroup value={paymentMethod} onChange={handlePaymentMethodChange}>
        <Paper variant="outlined" sx={{ mb: 2, p: 2, borderRadius: 1 }}>
          <FormControlLabel
            value="wallet"
            control={<Radio />}
            label={
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <AccountBalanceWalletIcon sx={{ mr: 1 }} />
                <Box>
                  <Typography variant="body1">Pay from Wallet</Typography>
                  {walletLoading ? (
                    <Typography variant="body2" color="text.secondary">
                      Loading wallet balance...
                    </Typography>
                  ) : walletDetails ? (
                    <Typography
                      variant="body2"
                      color={hasSufficientFunds ? "success.main" : "error.main"}
                    >
                      Available: {formatCurrency(walletDetails.available)}
                    </Typography>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      Wallet balance unavailable
                    </Typography>
                  )}
                </Box>
              </Box>
            }
          />
        </Paper>

        <Paper variant="outlined" sx={{ p: 2, borderRadius: 1 }}>
          <FormControlLabel
            value="card"
            control={<Radio />}
            label={
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <CreditCardIcon sx={{ mr: 1 }} />
                <Typography variant="body1">Credit/Debit Card</Typography>
              </Box>
            }
          />
        </Paper>
      </RadioGroup>

      {paymentMethod === "wallet" && !hasSufficientFunds && walletDetails && (
        <Alert severity="warning" sx={{ mt: 2 }}>
          Insufficient funds in your wallet. Available:{" "}
          {formatCurrency(walletDetails.available)}, Required:{" "}
          {formatCurrency(totalAmount)}
        </Alert>
      )}
    </Box>
  );

  // Render payment details based on selected method
  const renderPaymentDetails = () => (
    <Box sx={{ p: 1 }}>
      {paymentMethod === "wallet" ? (
        <Box>
          <Typography variant="subtitle1" gutterBottom>
            Wallet Payment
          </Typography>

          <Card variant="outlined" sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="body2" color="text.secondary">
                Available Balance
              </Typography>
              <Typography variant="h6">
                {walletDetails
                  ? formatCurrency(walletDetails.available)
                  : "Loading..."}
              </Typography>

              <Divider sx={{ my: 2 }} />

              <Typography variant="body2" color="text.secondary">
                Payment Amount
              </Typography>
              <Typography variant="h6" color="primary.main">
                {formatCurrency(totalAmount)}
              </Typography>

              <Divider sx={{ my: 2 }} />

              <Typography variant="body2" color="text.secondary">
                Remaining Balance After Payment
              </Typography>
              <Typography
                variant="h6"
                color={hasSufficientFunds ? "text.primary" : "error.main"}
              >
                {walletDetails
                  ? formatCurrency(
                      Math.max(0, walletDetails.available - totalAmount)
                    )
                  : "Loading..."}
              </Typography>
            </CardContent>
          </Card>

          {!hasSufficientFunds && walletDetails && (
            <Alert severity="error">
              You don't have enough funds in your wallet. Please add more funds
              or use a different payment method.
            </Alert>
          )}
        </Box>
      ) : (
        <Box>
          <Typography variant="subtitle1" gutterBottom>
            Card Payment
          </Typography>

          <Box sx={{ mb: 2 }}>
            <TextField
              label="Card Number"
              variant="outlined"
              fullWidth
              margin="normal"
              placeholder="1234 5678 9012 3456"
              value={cardNumber}
              onChange={(e) => setCardNumber(e.target.value)}
              inputProps={{ maxLength: 19 }}
            />

            <TextField
              label="Cardholder Name"
              variant="outlined"
              fullWidth
              margin="normal"
              placeholder="John Doe"
              value={cardName}
              onChange={(e) => setCardName(e.target.value)}
            />

            <Box sx={{ display: "flex", gap: 2 }}>
              <TextField
                label="Expiry Date"
                variant="outlined"
                margin="normal"
                placeholder="MM/YY"
                value={cardExpiry}
                onChange={(e) => setCardExpiry(e.target.value)}
                inputProps={{ maxLength: 5 }}
                sx={{ flex: 1 }}
              />

              <TextField
                label="CVC"
                variant="outlined"
                margin="normal"
                placeholder="123"
                value={cardCVC}
                onChange={(e) => setCardCVC(e.target.value)}
                inputProps={{ maxLength: 3 }}
                sx={{ flex: 1 }}
              />
            </Box>
          </Box>

          <Alert severity="info" sx={{ mt: 2 }}>
            This is a mock payment system. No real payment will be processed.
            Any valid-looking card details will be accepted.
          </Alert>
        </Box>
      )}
    </Box>
  );

  // Render confirmation page
  const renderConfirmation = () => (
    <Box sx={{ p: 1, textAlign: "center" }}>
      {success ? (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 2,
          }}
        >
          <CheckCircleIcon color="success" sx={{ fontSize: 60 }} />
          <Typography variant="h6" color="success.main">
            Contract Created Successfully!
          </Typography>
          <Typography variant="body1">
            Your contract with {artistName} has been created and funded.
          </Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={viewContract}
            sx={{ mt: 2 }}
          >
            View Contract
          </Button>
        </Box>
      ) : (
        <Box>
          <Typography variant="h6" gutterBottom>
            Order Summary
          </Typography>

          <Card variant="outlined" sx={{ mb: 3, textAlign: "left" }}>
            <CardContent>
              <Typography variant="body2" color="text.secondary">
                Proposal
              </Typography>
              <Typography variant="body1" gutterBottom>
                {proposalTitle}
              </Typography>

              <Typography variant="body2" color="text.secondary">
                Artist
              </Typography>
              <Typography variant="body1" gutterBottom>
                {artistName}
              </Typography>

              <Typography variant="body2" color="text.secondary">
                Payment Method
              </Typography>
              <Typography variant="body1" gutterBottom>
                {paymentMethod === "wallet"
                  ? "Wallet Balance"
                  : "Credit/Debit Card"}
              </Typography>

              <Divider sx={{ my: 2 }} />

              <Typography variant="body2" color="text.secondary">
                Total Payment
              </Typography>
              <Typography variant="h6" color="primary.main">
                {formatCurrency(totalAmount)}
              </Typography>
            </CardContent>
          </Card>

          <Alert severity="info" sx={{ mb: 3 }}>
            This will create a contract and transfer funds to escrow. The artist
            will be notified.
          </Alert>

          {loading ? (
            <CircularProgress />
          ) : (
            <Button
              variant="contained"
              color="primary"
              onClick={handleCreateContract}
              fullWidth
              size="large"
              disabled={paymentMethod === "wallet" && !hasSufficientFunds}
            >
              Confirm Payment & Create Contract
            </Button>
          )}
        </Box>
      )}
    </Box>
  );

  return (
    <Dialog open={open} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
      <DialogTitle>Create Contract & Payment</DialogTitle>

      <DialogContent>
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
          {activeStep === 1 && renderPaymentDetails()}
          {activeStep === 2 && renderConfirmation()}
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={handleCloseDialog} color="inherit">
          {success ? "Close" : "Cancel"}
        </Button>

        {!success && activeStep > 0 && activeStep < 2 && (
          <Button onClick={handleBackStep}>Back</Button>
        )}

        {!success && activeStep < 1 && (
          <Button
            onClick={handleNextStep}
            variant="contained"
            disabled={paymentMethod === "wallet" && !hasSufficientFunds}
          >
            Next
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}

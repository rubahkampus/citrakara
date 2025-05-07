"use client";

import React, { useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Grid,
  Stack,
  InputAdornment,
  Chip,
} from "@mui/material";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import MoneyOffIcon from "@mui/icons-material/MoneyOff";
import PaymentIcon from "@mui/icons-material/Payment";
import { IProposal } from "@/lib/db/models/proposal.model";

interface ArtistRespondFormProps {
  proposal: IProposal;
  loading?: boolean;
  onSubmit: (decision: {
    acceptProposal: boolean;
    surcharge?: number;
    discount?: number;
    rejectionReason?: string;
  }) => void;
}

export default function ArtistRespondForm({
  proposal,
  onSubmit,
  loading = false,
}: ArtistRespondFormProps) {
  // Form state
  const [surcharge, setSurcharge] = useState<number>(0);
  const [discount, setDiscount] = useState<number>(0);
  const [rejectionReason, setRejectionReason] = useState("");
  const [activeView, setActiveView] = useState<"main" | "adjust" | "reject">(
    "main"
  );

  // Format currency helper
  const formatCurrency = (amount: number) => `IDR ${amount.toLocaleString()}`;

  // Action handlers
  const handleAccept = () => onSubmit({ acceptProposal: true });

  const handleSubmitAdjustment = () => {
    onSubmit({
      acceptProposal: true,
      surcharge: surcharge > 0 ? surcharge : undefined,
      discount: discount > 0 ? discount : undefined,
    });
  };

  const handleConfirmReject = () => {
    onSubmit({
      acceptProposal: false,
      rejectionReason: rejectionReason || "Artist declined the proposal",
    });
  };

  // Form reset handlers
  const resetAdjustmentForm = () => {
    setSurcharge(0);
    setDiscount(0);
    setActiveView("main");
  };

  const resetRejectionForm = () => {
    setRejectionReason("");
    setActiveView("main");
  };

  // Calculate new total with adjustments
  const calculateTotal = () =>
    proposal.calculatedPrice.total + surcharge - discount;

  return (
    <Box>
      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent>
          {activeView === "reject" ? (
            /* Rejection Form */
            <>
              <Typography variant="h6" gutterBottom>
                Reject Proposal
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Please provide a reason for rejecting this proposal.
              </Typography>

              <TextField
                label="Rejection reason"
                multiline
                rows={3}
                fullWidth
                required
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Explain why you're rejecting this proposal"
                sx={{ mb: 3 }}
                error={!rejectionReason}
                helperText={
                  !rejectionReason ? "Rejection reason is required" : ""
                }
              />

              <Stack direction="row" spacing={2} justifyContent="center">
                <Button
                  variant="outlined"
                  onClick={resetRejectionForm}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  variant="contained"
                  color="error"
                  onClick={handleConfirmReject}
                  disabled={loading || !rejectionReason}
                >
                  Confirm Rejection
                </Button>
              </Stack>
            </>
          ) : activeView === "adjust" ? (
            /* Adjustment Form */
            <>
              <Typography variant="h6" gutterBottom>
                Price Adjustment
              </Typography>

              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Add surcharge"
                    type="number"
                    fullWidth
                    value={surcharge || ""}
                    onChange={(e) => {
                      const value = Number(e.target.value);
                      setSurcharge(value);
                      // Clear discount if surcharge is entered
                      if (value > 0) setDiscount(0);
                    }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">IDR</InputAdornment>
                      ),
                      endAdornment: surcharge > 0 && (
                        <InputAdornment position="end">
                          <Chip
                            size="small"
                            color="error"
                            label={`+${(
                              (surcharge / proposal.calculatedPrice.total) *
                              100
                            ).toFixed(1)}%`}
                          />
                        </InputAdornment>
                      ),
                    }}
                    helperText="Additional charge for complexity"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Offer discount"
                    type="number"
                    fullWidth
                    value={discount || ""}
                    onChange={(e) => {
                      const value = Number(e.target.value);
                      setDiscount(value);
                      // Clear surcharge if discount is entered
                      if (value > 0) setSurcharge(0);
                    }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">IDR</InputAdornment>
                      ),
                      endAdornment: discount > 0 && (
                        <InputAdornment position="end">
                          <Chip
                            size="small"
                            color="success"
                            label={`-${(
                              (discount / proposal.calculatedPrice.total) *
                              100
                            ).toFixed(1)}%`}
                          />
                        </InputAdornment>
                      ),
                    }}
                    helperText="Discount to secure the commission"
                  />
                </Grid>
              </Grid>

              {(surcharge > 0 || discount > 0) && (
                <Box
                  sx={{
                    mb: 3,
                    p: 2,
                    bgcolor: "action.hover",
                    borderRadius: 1,
                    textAlign: "center",
                  }}
                >
                  <Typography
                    variant="subtitle2"
                    color="text.secondary"
                    gutterBottom
                  >
                    New Total
                  </Typography>
                  <Typography variant="h6" fontWeight="bold">
                    {formatCurrency(calculateTotal())}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Original: {formatCurrency(proposal.calculatedPrice.total)}
                    {surcharge > 0 && ` + ${formatCurrency(surcharge)}`}
                    {discount > 0 && ` - ${formatCurrency(discount)}`}
                  </Typography>
                </Box>
              )}

              <Stack direction="row" spacing={2} justifyContent="center">
                <Button
                  variant="outlined"
                  onClick={resetAdjustmentForm}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleSubmitAdjustment}
                  disabled={loading || (surcharge === 0 && discount === 0)}
                >
                  Submit Adjustment
                </Button>
              </Stack>
            </>
          ) : (
            /* Main Options View */
            <>
              <Typography variant="h6" gutterBottom>
                Your Response
              </Typography>

              <Box
                sx={{
                  mb: 3,
                  p: 2,
                  borderRadius: 1,
                  bgcolor: "action.hover",
                  textAlign: "center",
                }}
              >
                <Typography variant="subtitle2" color="text.secondary">
                  Project Total
                </Typography>
                <Typography variant="h6" fontWeight="bold">
                  {formatCurrency(proposal.calculatedPrice.total)}
                </Typography>
              </Box>

              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mb: 3, textAlign: "center" }}
              >
                You can accept as is, adjust the price, or reject the proposal
              </Typography>

              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={2}
                justifyContent="center"
              >
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<CloseIcon />}
                  onClick={() => setActiveView("reject")}
                  disabled={loading}
                  fullWidth
                >
                  Reject
                </Button>

                <Button
                  variant="outlined"
                  color="primary"
                  startIcon={surcharge > 0 ? <PaymentIcon /> : <MoneyOffIcon />}
                  onClick={() => setActiveView("adjust")}
                  disabled={loading}
                  fullWidth
                >
                  Adjust Price
                </Button>

                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<CheckIcon />}
                  onClick={handleAccept}
                  disabled={loading}
                  fullWidth
                >
                  Accept As Is
                </Button>
              </Stack>
            </>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}

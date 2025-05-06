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
  Divider,
} from "@mui/material";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
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
  const [surcharge, setSurcharge] = useState<number>(0);
  const [discount, setDiscount] = useState<number>(0);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [showAdjustmentForm, setShowAdjustmentForm] = useState(false);

  // Simple acceptance without any adjustments
  const handleAccept = () => {
    onSubmit({
      acceptProposal: true,
    });
  };

  // Show the adjustment form
  const handleShowAdjustment = () => {
    setShowAdjustmentForm(true);
  };

  // Submit with adjustments
  const handleSubmitAdjustment = () => {
    onSubmit({
      acceptProposal: true,
      surcharge: surcharge > 0 ? surcharge : undefined,
      discount: discount > 0 ? discount : undefined,
    });
  };

  // Cancel adjustments and return to main options
  const handleCancelAdjustment = () => {
    setShowAdjustmentForm(false);
    setSurcharge(0);
    setDiscount(0);
  };

  const handleRejectClick = () => {
    setShowRejectForm(true);
  };

  const handleConfirmReject = () => {
    onSubmit({
      acceptProposal: false,
      rejectionReason: rejectionReason || "Artist declined the proposal",
    });
  };

  const handleCancelReject = () => {
    setShowRejectForm(false);
    setRejectionReason("");
  };

  // Calculate new total with adjustments
  const calculateTotal = () => {
    return proposal.calculatedPrice.total + (surcharge || 0) - (discount || 0);
  };

  return (
    <Box>
      {showRejectForm ? (
        /* Rejection Form */
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Reject Proposal
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Please provide a reason for rejecting this proposal.
            </Typography>

            <TextField
              label="Rejection reason"
              multiline
              rows={4}
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

            <Stack
              direction="row"
              spacing={2}
              sx={{ justifyContent: "center" }}
            >
              <Button
                variant="outlined"
                onClick={handleCancelReject}
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
          </CardContent>
        </Card>
      ) : showAdjustmentForm ? (
        /* Adjustment Form */
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Price Adjustment
            </Typography>

            <Grid container spacing={3}>
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
                  }}
                  helperText="Add extra charge for additional complexity"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Or offer discount"
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
                  }}
                  helperText="Offer a discount to secure the commission"
                />
              </Grid>
            </Grid>

            {(surcharge > 0 || discount > 0) && (
              <Box
                sx={{
                  mt: 3,
                  p: 2,
                  backgroundColor: "action.hover",
                  borderRadius: 1,
                }}
              >
                <Typography variant="body1" sx={{ mb: 1 }}>
                  New Total:{" "}
                  <strong>IDR {calculateTotal().toLocaleString()}</strong>
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Original: IDR{" "}
                  {proposal.calculatedPrice.total.toLocaleString()}
                  {surcharge > 0 &&
                    ` + ${surcharge.toLocaleString()} (surcharge)`}
                  {discount > 0 && ` - ${discount.toLocaleString()} (discount)`}
                </Typography>
              </Box>
            )}

            <Stack
              direction="row"
              spacing={2}
              sx={{ justifyContent: "center", mt: 3 }}
            >
              <Button
                variant="outlined"
                onClick={handleCancelAdjustment}
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
          </CardContent>
        </Card>
      ) : (
        /* Main Options */
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Your Response
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              You can accept the proposal as is, adjust the price, or reject the
              proposal.
            </Typography>

            <Stack
              direction="row"
              spacing={2}
              sx={{ justifyContent: "center", mb: 3 }}
            >
              <Button
                variant="outlined"
                color="error"
                size="large"
                startIcon={<CloseIcon />}
                onClick={handleRejectClick}
                disabled={loading}
                sx={{ minWidth: 160 }}
              >
                Reject
              </Button>
              <Button
                variant="outlined"
                color="primary"
                size="large"
                onClick={handleShowAdjustment}
                disabled={loading}
                sx={{ minWidth: 160 }}
              >
                Adjust Price
              </Button>
              <Button
                variant="contained"
                color="primary"
                size="large"
                startIcon={<CheckIcon />}
                onClick={handleAccept}
                disabled={loading}
                sx={{ minWidth: 160 }}
              >
                Accept As Is
              </Button>
            </Stack>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}

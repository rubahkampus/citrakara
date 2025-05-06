"use client";

import React, { useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Stack,
  TextField,
  Paper,
  Alert,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import { IProposal } from "@/lib/db/models/proposal.model";

interface ClientRespondFormProps {
  proposal: IProposal;
  loading?: boolean;
  onSubmit: (decision: {
    acceptAdjustments?: boolean;
    cancel?: boolean;
  }) => void;
}

export default function ClientRespondForm({
  proposal,
  onSubmit,
  loading = false,
}: ClientRespondFormProps) {
  const [showCancelForm, setShowCancelForm] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);

  const handleAccept = () => {
    onSubmit({
      acceptAdjustments: true,
    });
  };

  const handleRejectClick = () => {
    setIsRejecting(true);
  };

  const handleConfirmReject = () => {
    onSubmit({
      acceptAdjustments: false,
    });
  };

  const handleCancelClick = () => {
    setShowCancelForm(true);
  };

  const handleConfirmCancel = () => {
    onSubmit({
      cancel: true,
    });
  };

  const handleProceedToPayment = () => {
    // This would lead to a payment flow outside this component
    // For now, just redirect to the payment page
    window.location.href = `/payment/${proposal._id}`;
  };

  const adjustments = proposal.artistAdjustments;
  const hasAdjustments = adjustments?.surcharge || adjustments?.discount;

  return (
    <Box>
      {/* Artist Adjustment Notice */}
      {hasAdjustments && proposal.status === "pendingClient" && (
        <Alert severity="info" sx={{ mb: 3 }}>
          The artist has adjusted the proposal price. Please review the changes
          below.
        </Alert>
      )}

      {/* Cancellation Form */}
      {showCancelForm ? (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom color="error">
              Cancel Proposal
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Are you sure you want to cancel this proposal? This action cannot
              be undone.
            </Typography>

            <Stack
              direction="row"
              spacing={2}
              sx={{ justifyContent: "center" }}
            >
              <Button
                variant="outlined"
                onClick={() => setShowCancelForm(false)}
                disabled={loading}
              >
                Back
              </Button>
              <Button
                variant="contained"
                color="error"
                onClick={handleConfirmCancel}
                disabled={loading}
              >
                Confirm Cancellation
              </Button>
            </Stack>
          </CardContent>
        </Card>
      ) : isRejecting ? (
        /* Rejection Form */
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom color="warning.main">
              Reject Artist's Adjustments
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Rejecting the adjustments will send the proposal back to the
              artist. They can make new adjustments or accept the original
              terms.
            </Typography>

            <Stack
              direction="row"
              spacing={2}
              sx={{ justifyContent: "center" }}
            >
              <Button
                variant="outlined"
                onClick={() => setIsRejecting(false)}
                disabled={loading}
              >
                Back
              </Button>
              <Button
                variant="contained"
                color="warning"
                onClick={handleConfirmReject}
                disabled={loading}
              >
                Reject Adjustments
              </Button>
            </Stack>
          </CardContent>
        </Card>
      ) : (
        /* Normal Response Form */
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              {proposal.status === "accepted"
                ? "Proceed to Payment"
                : "Respond to Proposal"}
            </Typography>

            {proposal.status === "pendingClient" && hasAdjustments && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" color="text.secondary">
                  Price Adjustments:
                </Typography>
                <Box sx={{ pl: 2 }}>
                  {adjustments?.surcharge && (
                    <Typography variant="body2" color="error.main">
                      Surcharge: +IDR{" "}
                      {adjustments.toLocaleString()}
                    </Typography>
                  )}
                  {adjustments?.discount && (
                    <Typography variant="body2" color="success.main">
                      Discount: -IDR{" "}
                      {adjustments.discount.toLocaleString()}
                    </Typography>
                  )}
                </Box>
              </Box>
            )}

            <Typography variant="body1" sx={{ mb: 2, fontWeight: "bold" }}>
              Final Total: IDR {proposal.calculatedPrice.total.toLocaleString()}
            </Typography>

            <Stack
              direction="row"
              spacing={2}
              sx={{ justifyContent: "center" }}
            >
              <Button
                variant="outlined"
                color="error"
                size="large"
                startIcon={<CancelIcon />}
                onClick={handleCancelClick}
                disabled={loading}
                sx={{ minWidth: 120 }}
              >
                Cancel Proposal
              </Button>

              {proposal.status === "pendingClient" && (
                <>
                  <Button
                    variant="outlined"
                    color="warning"
                    size="large"
                    onClick={handleRejectClick}
                    disabled={loading}
                    sx={{ minWidth: 120 }}
                  >
                    Reject Adjustments
                  </Button>
                  <Button
                    variant="contained"
                    color="primary"
                    size="large"
                    startIcon={<CheckCircleIcon />}
                    onClick={handleAccept}
                    disabled={loading}
                    sx={{ minWidth: 180 }}
                  >
                    Accept Adjustments
                  </Button>
                </>
              )}

              {proposal.status === "accepted" && (
                <Button
                  variant="contained"
                  color="primary"
                  size="large"
                  startIcon={<CheckCircleIcon />}
                  onClick={handleProceedToPayment}
                  disabled={loading}
                  sx={{ minWidth: 180 }}
                >
                  Proceed to Payment
                </Button>
              )}
            </Stack>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}

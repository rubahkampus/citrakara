"use client";

import React, { useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Stack,
  Alert,
  Chip,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import { IProposal } from "@/lib/db/models/proposal.model";
import UniversalPaymentDialog from "@/components/UniversalPaymentDialog";
import { useRouter } from "next/navigation";
import { axiosClient } from "@/lib/utils/axiosClient";

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
  const router = useRouter();

  const [activeView, setActiveView] = useState<"main" | "cancel" | "reject">(
    "main"
  );
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);

  // Format currency helper
  const formatCurrency = (amount: number) => `IDR ${amount.toLocaleString()}`;

  // Action handlers
  const handleAccept = () => onSubmit({ acceptAdjustments: true });
  const handleConfirmReject = () => onSubmit({ acceptAdjustments: false });
  const handleConfirmCancel = () => onSubmit({ cancel: true });
  const handleProceedToPayment = () => {
    setPaymentDialogOpen(true);
  };

  // Calculate adjustments data
  const adjustments = proposal.artistAdjustments;
  const hasSurcharge =
    adjustments?.proposedSurcharge || adjustments?.acceptedSurcharge;
  const hasDiscount =
    adjustments?.proposedDiscount || adjustments?.acceptedDiscount;
  const hasAdjustments = hasSurcharge || hasDiscount;

  // Get actual adjustment values (proposed or accepted)
  const surchargeAmount =
    adjustments?.acceptedSurcharge || adjustments?.proposedSurcharge || 0;
  const discountAmount =
    adjustments?.acceptedDiscount || adjustments?.proposedDiscount || 0;

  // Determine adjustment status
  const isAdjustmentProposed =
    adjustments?.proposedDate &&
    !adjustments?.acceptedDate &&
    proposal.status === "pendingClient";

  // Calculate final price
  const finalPrice = isAdjustmentProposed
    ? proposal.calculatedPrice.total + surchargeAmount - discountAmount
    : proposal.calculatedPrice.total;

  return (
    <Box sx={{ width: "100%" }}>
      {/* Adjustment Notice Alert */}
      {isAdjustmentProposed && (
        <Alert severity="info" sx={{ mb: 2 }}>
          The artist has proposed price adjustments. Please review and respond.
        </Alert>
      )}

      {/* Response Cards */}
      <Card variant="outlined" sx={{ mb: 3, width: "100%" }} elevation={2}>
        <CardContent>
          {activeView === "cancel" ? (
            /* Cancellation View */
            <>
              <Typography variant="h6" gutterBottom color="error">
                Cancel Proposal
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Are you sure you want to cancel this proposal? This action
                cannot be undone.
              </Typography>

              <Stack direction="row" spacing={2} justifyContent="center">
                <Button
                  variant="outlined"
                  onClick={() => setActiveView("main")}
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
            </>
          ) : activeView === "reject" ? (
            /* Rejection View */
            <>
              <Typography variant="h6" gutterBottom color="warning.main">
                Reject Artist's Adjustments
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Rejecting will send the proposal back to the artist. They can
                make new adjustments or accept the original terms.
              </Typography>

              <Stack direction="row" spacing={2} justifyContent="center">
                <Button
                  variant="outlined"
                  onClick={() => setActiveView("main")}
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
            </>
          ) : (
            /* Main Response View */
            <>
              <Typography variant="h6" gutterBottom>
                {proposal.status === "accepted"
                  ? "Proceed to Payment"
                  : "Respond to Proposal"}
              </Typography>

              {/* Price Adjustments Display */}
              {isAdjustmentProposed && hasAdjustments && (
                <Box
                  sx={{
                    mb: 3,
                    display: "flex",
                    flexDirection: "column",
                    gap: 1,
                  }}
                >
                  <Typography variant="body2" color="text.secondary">
                    Price Adjustments:
                  </Typography>

                  {hasSurcharge && (
                    <Chip
                      label={`Surcharge: +${formatCurrency(surchargeAmount)}`}
                      color="error"
                      variant="outlined"
                      size="small"
                      sx={{ alignSelf: "flex-start" }}
                    />
                  )}

                  {hasDiscount && (
                    <Chip
                      label={`Discount: -${formatCurrency(discountAmount)}`}
                      color="success"
                      variant="outlined"
                      size="small"
                      sx={{ alignSelf: "flex-start" }}
                    />
                  )}
                </Box>
              )}

              {/* Final Price Display */}
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
                  Final Total
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                  {formatCurrency(finalPrice)}
                </Typography>
              </Box>

              {/* Action Buttons */}
              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={2}
                justifyContent="center"
              >
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<CancelIcon />}
                  onClick={() => setActiveView("cancel")}
                  disabled={loading}
                  fullWidth
                >
                  Cancel Proposal
                </Button>

                {proposal.status === "pendingClient" && (
                  <>
                    <Button
                      variant="outlined"
                      color="warning"
                      onClick={() => setActiveView("reject")}
                      disabled={loading}
                      fullWidth
                    >
                      Reject Adjustments
                    </Button>
                    <Button
                      variant="contained"
                      color="primary"
                      startIcon={<CheckCircleIcon />}
                      onClick={handleAccept}
                      disabled={loading}
                      fullWidth
                    >
                      Accept Adjustments
                    </Button>
                  </>
                )}

                {proposal.status === "accepted" && (
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<CheckCircleIcon />}
                    disabled={true}
                    fullWidth
                  >
                    Accepted
                  </Button>
                )}
              </Stack>
            </>
          )}

          {(proposal.status === "accepted" || proposal.status === "paid") && (
            <Button
              variant="contained"
              color="primary"
              startIcon={<CheckCircleIcon />}
              onClick={handleProceedToPayment}
              disabled={loading && proposal.status == "paid"}
              fullWidth
              sx={{ mt: 2 }}
            >
              {proposal.status == "accepted"
                ? "Proceed to Payment"
                : "Proposal Paid"}
            </Button>
          )}

          <UniversalPaymentDialog
            open={paymentDialogOpen}
            onClose={() => setPaymentDialogOpen(false)}
            title="Pembayaran Proposal"
            totalAmount={finalPrice}
            description={`Pembayaran untuk: ${proposal.generalDescription.substring(
              0,
              50
            )}...`}
            onSubmit={async (paymentData) => {
              try {
                const response = await axiosClient.post(
                  "/api/contract/create-from-proposal",
                  {
                    ...paymentData,
                    proposalId: proposal._id.toString(),
                  }
                );

                // Handle success (you can add additional logic here)
                // For example, redirecting to the contract page
                if (response.data.contractId) {
                  router.push(`/contracts/${response.data.contractId}`);
                }
              } catch (err: any) {
                console.error("Error creating contract:", err);
                // The error handling is now done within the dialog component
              }
            }}
          />
        </CardContent>
      </Card>
    </Box>
  );
}

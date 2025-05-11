// src/components/dashboard/contracts/tickets/CancelTicketForm.tsx
"use client";

import { useState } from "react";
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Divider,
} from "@mui/material";
import { useRouter } from "next/navigation";
import { IContract } from "@/lib/db/models/contract.model";

interface CancelTicketFormProps {
  contract: IContract;
  userId: string;
  isArtist: boolean;
  isClient: boolean;
}

export default function CancelTicketForm({
  contract,
  userId,
  isArtist,
  isClient,
}: CancelTicketFormProps) {
  const router = useRouter();
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Format price for display
  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat("en-US").format(amount);
  };

  // Calculate approximate refund based on contract policy and status
  const calculateApproximateOutcome = () => {
    // This is a simplified estimation that should match backend logic
    const totalAmount = contract.finance.total;

    let artistAmount = 0;
    let clientAmount = 0;

    if (isClient) {
      // Client cancellation
      const cancellationFee =
        contract.proposalSnapshot.listingSnapshot.cancelationFee?.kind ===
        "flat"
          ? contract.proposalSnapshot.listingSnapshot.cancelationFee.amount
          : (totalAmount *
              contract.proposalSnapshot.listingSnapshot.cancelationFee
                ?.amount) /
            100;

      // Assuming 0% work progress for new cancellation
      artistAmount = cancellationFee;
      clientAmount = totalAmount - cancellationFee;
    } else {
      // Artist cancellation
      const cancellationFee =
        contract.proposalSnapshot.listingSnapshot.cancelationFee?.kind ===
        "flat"
          ? contract.proposalSnapshot.listingSnapshot.cancelationFee.amount
          : (totalAmount *
              contract.proposalSnapshot.listingSnapshot.cancelationFee
                ?.amount) /
            100;

      // Assuming 0% work progress for new cancellation
      artistAmount = 0;
      clientAmount = totalAmount;
    }

    return {
      totalAmount,
      artistAmount,
      clientAmount,
    };
  };

  const outcome = calculateApproximateOutcome();

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // Validate input
      if (!reason.trim()) {
        throw new Error("Please provide a reason for cancellation");
      }

      // Submit to API
      const response = await fetch(
        `/api/contract/${contract._id}/tickets/cancel/new`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reason }),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create cancellation ticket");
      }

      setSuccess(true);

      // Redirect after successful submission
      setTimeout(() => {
        router.push(`/dashboard/${userId}/contracts/${contract._id}/tickets`);
        router.refresh();
      }, 1500);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unknown error occurred"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Paper elevation={2} sx={{ p: 3 }}>
      {success ? (
        <Alert severity="success" sx={{ mb: 2 }}>
          Cancellation request submitted successfully! Redirecting...
        </Alert>
      ) : (
        <form onSubmit={handleSubmit}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" fontWeight="bold">
              Contract Information
            </Typography>
            <Typography variant="body2">Status: {contract.status}</Typography>
            <Typography variant="body2">
              Total Amount: {formatPrice(contract.finance.total)}
            </Typography>
          </Box>

          <Divider sx={{ mb: 3 }} />

          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>
              Cancellation Details
            </Typography>
            <Typography variant="body2" sx={{ mb: 2 }}>
              Please provide a clear and detailed reason for your cancellation
              request. The {isArtist ? "client" : "artist"} will need to review
              and accept your request.
            </Typography>

            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                Cancellation Fee:{" "}
                {contract.proposalSnapshot.listingSnapshot.cancelationFee
                  ?.kind === "flat"
                  ? formatPrice(
                      contract.proposalSnapshot.listingSnapshot.cancelationFee
                        .amount
                    )
                  : `${contract.proposalSnapshot.listingSnapshot.cancelationFee?.amount}% of total`}
              </Typography>
              <Typography variant="body2">
                {isClient
                  ? "You will pay this fee to the artist even if they haven't started work."
                  : "You will forfeit this fee to the client if you cancel."}
              </Typography>
            </Alert>

            <Alert severity="warning" sx={{ mb: 2 }}>
              <Typography variant="body2">
                Estimated outcome if accepted with no work done:
              </Typography>
              <Typography variant="body2">
                Artist receives: {formatPrice(outcome.artistAmount)}
              </Typography>
              <Typography variant="body2">
                Client receives: {formatPrice(outcome.clientAmount)}
              </Typography>
              <Typography variant="body2" fontStyle="italic" sx={{ mt: 1 }}>
                Note: Final amounts will be calculated based on actual work
                completed and will require final proof submission by the artist.
              </Typography>
            </Alert>
          </Box>

          <Box sx={{ mb: 3 }}>
            <TextField
              label="Reason for Cancellation"
              multiline
              rows={4}
              fullWidth
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explain why you need to cancel this contract"
              required
              disabled={isSubmitting}
            />
          </Box>

          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={isSubmitting}
            sx={{ minWidth: 120 }}
          >
            {isSubmitting ? (
              <CircularProgress size={24} />
            ) : (
              "Submit Cancellation Request"
            )}
          </Button>
        </form>
      )}
    </Paper>
  );
}

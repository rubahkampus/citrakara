// src/components/dashboard/contracts/tickets/CancelTicketForm.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import axios from "axios";
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Divider,
  Stack,
} from "@mui/material";
import { IContract } from "@/lib/db/models/contract.model";

interface CancelTicketFormProps {
  contract: IContract;
  userId: string;
  username: string;
  isArtist: boolean;
  isClient: boolean;
}

interface FormValues {
  reason: string;
}

export default function CancelTicketForm({
  contract,
  userId,
  username,
  isArtist,
  isClient,
}: CancelTicketFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const axiosClient = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || "",
  });

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      reason: "",
    },
  });

  // Check if this is a milestone contract
  const isMilestoneContract =
    contract.proposalSnapshot?.listingSnapshot?.flow === "milestone";
  console.log("Is milestone contract:", isMilestoneContract);

  // Check milestone status for milestone contracts
  const incompleteMilestones =
    isMilestoneContract && contract.milestones
      ? contract.milestones.filter(
          (milestone) => milestone.status !== "accepted"
        )
      : [];
  console.log("Incomplete milestones:", incompleteMilestones);

  const allMilestonesComplete =
    isMilestoneContract && incompleteMilestones.length === 0;
  console.log("All milestones complete:", allMilestonesComplete);

  // Calculate default work progress based on contract type
  const calculateDefaultWorkProgress = (): number => {
    console.log("Calculating default work progress...");
    // For cancellation with milestone flow
    if (
      isMilestoneContract &&
      contract.milestones &&
      contract.milestones.length > 0
    ) {
      // Sum up percentages from completed milestones
      const progress = contract.milestones.reduce((total, milestone) => {
        if (milestone.status === "accepted") {
          return total + milestone.percent;
        }
        return total;
      }, 0);
      console.log("Default work progress (milestone cancellation):", progress);
      return progress;
    }
    return 0;
  };

  // Format price for display
  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat("id-ID").format(amount);
  };

  function hasDatePassed(dateToCheck: Date) {
    // Create a Date object for the date you want to check
    const checkDate = new Date(dateToCheck);

    // Create a Date object for today, set to beginning of day (midnight)
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    // Return true if the date is before today (has passed)
    return checkDate < todayStart;
  }

  // Calculate approximate refund based on contract policy and status
  const calculateApproximateOutcome = () => {
    // This is a simplified estimation that should match backend logic
    const totalAmount = contract.finance.total;

    let artistAmount = 0;
    let clientAmount = 0;
    let workProgress = calculateDefaultWorkProgress();
    const latePenalty =
      contract.proposalSnapshot.listingSnapshot.latePenaltyPercent || 0;
    const isLate = hasDatePassed(contract.deadlineAt);

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

      if (isLate) {
        artistAmount =
          totalAmount * (workProgress / 100) -
          totalAmount * (latePenalty / 100);
        clientAmount =
          totalAmount * (workProgress / 100) +
          totalAmount * (latePenalty / 100);
      } else {
        artistAmount = totalAmount * (workProgress / 100) + cancellationFee;
        clientAmount = totalAmount * (workProgress / 100) - cancellationFee;
      }
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

      if (isLate) {
        artistAmount =
          totalAmount * (workProgress / 100) -
          totalAmount * (latePenalty / 100) -
          cancellationFee;
        clientAmount =
          totalAmount * (workProgress / 100) +
          totalAmount * (latePenalty / 100) +
          cancellationFee;
      } else {
        artistAmount = totalAmount * (workProgress / 100) - cancellationFee;
        clientAmount =
          totalAmount - totalAmount * (workProgress / 100) + cancellationFee;
      }
    }

    return {
      totalAmount,
      artistAmount,
      clientAmount,
    };
  };

  const outcome = calculateApproximateOutcome();

  // Handle form submission
  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    setError(null);

    try {
      // Validate input
      if (!data.reason.trim()) {
        throw new Error("Please provide a reason for cancellation");
      }

      // Submit to API using axios
      const response = await axiosClient.post(
        `/api/contract/${contract._id}/tickets/cancel/new`,
        { reason: data.reason },
        {
          headers: { "Content-Type": "application/json" },
        }
      );

      setSuccess(true);

      // Redirect after successful submission
      setTimeout(() => {
        router.push(`/${username}/dashboard/contracts/${contract._id}/tickets`);
        router.refresh();
      }, 1500);
    } catch (err) {
      if (axios.isAxiosError(err) && err.response) {
        setError(
          err.response.data.error || "Failed to create cancellation ticket"
        );
      } else {
        setError(
          err instanceof Error ? err.message : "An unknown error occurred"
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Detect if cancellation fee is configured
  const hasCancellationFee =
    !!contract.proposalSnapshot.listingSnapshot.cancelationFee;

  // Check if contract is in a state where it can be cancelled
  const canCancel = ["active"].includes(contract.status);

  if (!canCancel) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        This contract cannot be cancelled in its current state:{" "}
        {contract.status}
      </Alert>
    );
  }

  return (
    <Paper elevation={2} sx={{ p: 3 }}>
      {success ? (
        <Alert severity="success" sx={{ mb: 2 }}>
          Cancellation request submitted successfully! Redirecting...
        </Alert>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Contract Information
            </Typography>
            <Box sx={{ p: 2, bgcolor: "background.paper", borderRadius: 1 }}>
              <Typography variant="body2">
                <strong>Status:</strong> {contract.status}
              </Typography>
              <Typography variant="body2">
                <strong>Total Amount:</strong>{" "}
                {formatPrice(contract.finance.total)}
              </Typography>
              {contract.deadlineAt && (
                <Typography variant="body2">
                  <strong>Deadline:</strong>{" "}
                  {new Date(contract.deadlineAt).toLocaleDateString()}
                </Typography>
              )}
            </Box>
          </Box>

          <Divider sx={{ mb: 3 }} />

          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Cancellation Details
            </Typography>
            <Typography variant="body2" sx={{ mb: 2 }}>
              Please provide a clear and detailed reason for your cancellation
              request. The {isArtist ? "client" : "artist"} will need to review
              and accept your request.
            </Typography>

            {hasCancellationFee ? (
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
            ) : (
              <Alert severity="warning" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  No cancellation fee is configured for this contract. Final
                  amounts will be calculated based on work completed.
                </Typography>
              </Alert>
            )}

            <Alert severity="warning" sx={{ mb: 2 }}>
              <Typography variant="body2" fontWeight="bold">
                Estimated outcome if {isMilestoneContract ? "all finsihed milestones are accounted:" : "accepted with no work done:"}
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
            <Controller
              name="reason"
              control={control}
              rules={{
                required: "Please provide a reason for cancellation",
                minLength: {
                  value: 10,
                  message: "Reason must be at least 10 characters long",
                },
              }}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Reason for Cancellation"
                  multiline
                  rows={4}
                  fullWidth
                  placeholder="Explain why you need to cancel this contract"
                  error={!!errors.reason}
                  helperText={errors.reason?.message}
                  disabled={isSubmitting}
                />
              )}
            />
          </Box>

          <Stack direction="row" spacing={2}>
            <Button
              variant="outlined"
              onClick={() => router.back()}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
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
          </Stack>
        </form>
      )}
    </Paper>
  );
}

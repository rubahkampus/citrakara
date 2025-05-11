// src/components/dashboard/contracts/uploads/FinalUploadDetails.tsx
"use client";

import { useState, useEffect } from "react";
import {
  Box,
  Paper,
  Typography,
  Divider,
  Button,
  Chip,
  Alert,
  CircularProgress,
  Link,
  LinearProgress,
} from "@mui/material";
import { useRouter } from "next/navigation";
import { IContract } from "@/lib/db/models/contract.model";
import { IFinalUpload } from "@/lib/db/models/upload.model";
import { ICancelTicket } from "@/lib/db/models/ticket.model";

interface FinalUploadDetailsProps {
  contract: IContract;
  upload: IFinalUpload;
  userId: string;
  isArtist: boolean;
  isClient: boolean;
  canReview: boolean;
}

export default function FinalUploadDetails({
  contract,
  upload,
  userId,
  isArtist,
  isClient,
  canReview,
}: FinalUploadDetailsProps) {
  const router = useRouter();
  const [cancelTicket, setCancelTicket] = useState<ICancelTicket | null>(null);
  const [isLoadingTicket, setIsLoadingTicket] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isCompleteDelivery = upload.workProgress === 100;
  const isCancellationProof = upload.workProgress < 100;

  // Format date for display
  const formatDate = (date?: string | Date) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleString();
  };

  // Fetch cancel ticket if this is a cancellation proof
  useEffect(() => {
    if (upload.cancelTicketId) {
      const fetchCancelTicket = async () => {
        setIsLoadingTicket(true);
        try {
          const response = await fetch(
            `/api/contract/${contract._id}/tickets/cancel/${upload.cancelTicketId}`
          );
          if (!response.ok) {
            throw new Error("Failed to fetch cancellation ticket details");
          }
          const data = await response.json();
          setCancelTicket(data);
        } catch (err) {
          setError(
            err instanceof Error
              ? err.message
              : "An error occurred while fetching ticket"
          );
        } finally {
          setIsLoadingTicket(false);
        }
      };

      fetchCancelTicket();
    }
  }, [contract._id, upload.cancelTicketId]);

  // Handle review button click
  const handleReviewClick = () => {
    router.push(
      `/dashboard/${userId}/contracts/${contract._id}/uploads/final/${upload._id}?review=true`
    );
  };

  // Determine status colors
  const getStatusColor = (status: string) => {
    switch (status) {
      case "submitted":
        return "primary";
      case "accepted":
        return "success";
      case "rejected":
        return "error";
      case "forcedAccepted":
        return "warning";
      case "disputed":
        return "error";
      default:
        return "default";
    }
  };

  // Check if upload is past deadline
  const isPastDeadline =
    upload.expiresAt && new Date(upload.expiresAt) < new Date();

  return (
    <Paper elevation={2} sx={{ p: 3 }}>
      <Box
        sx={{
          mb: 3,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Box>
          <Typography variant="h6">
            {isCompleteDelivery ? "Final Delivery" : "Cancellation Proof"}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Uploaded by {isArtist ? "you" : "the artist"} on{" "}
            {formatDate(upload.createdAt)}
          </Typography>
        </Box>

        <Chip
          label={upload.status}
          color={getStatusColor(upload.status)}
          variant="outlined"
        />
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {upload.status === "submitted" && (
        <Alert severity="info" sx={{ mb: 3 }}>
          This {isCompleteDelivery ? "final delivery" : "cancellation proof"}{" "}
          requires {isClient ? "your" : "client"} review.
          {isPastDeadline &&
            " This upload is past its review deadline and may be automatically accepted."}
        </Alert>
      )}

      <Divider sx={{ mb: 3 }} />

      {/* Work Progress */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>
          Work Progress: {upload.workProgress}%
        </Typography>
        <LinearProgress
          variant="determinate"
          value={upload.workProgress}
          color={isCompleteDelivery ? "success" : "warning"}
          sx={{ height: 10, borderRadius: 1, mb: 1 }}
        />

        {isCancellationProof && (
          <Typography variant="body2" color="text.secondary">
            This is a partial delivery for cancellation. Payment will be split
            according to the work percentage and contract policy.
          </Typography>
        )}
      </Box>

      {/* Cancellation Ticket Details */}
      {isCancellationProof && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" fontWeight="bold">
            Cancellation Details
          </Typography>

          {isLoadingTicket ? (
            <CircularProgress size={20} sx={{ mt: 1 }} />
          ) : cancelTicket ? (
            <>
              <Typography variant="body2">
                Requested by:{" "}
                {cancelTicket.requestedBy === "client"
                  ? isClient
                    ? "you"
                    : "the client"
                  : isArtist
                  ? "you"
                  : "the artist"}
              </Typography>
              <Typography variant="body2">
                Status: {cancelTicket.status}
              </Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>
                Reason: {cancelTicket.reason}
              </Typography>

              <Box sx={{ mt: 2 }}>
                <Link
                  href={`/dashboard/${userId}/contracts/${contract._id}/tickets/cancel/${cancelTicket._id}`}
                  underline="hover"
                >
                  View full cancellation request
                </Link>
              </Box>
            </>
          ) : (
            <Typography variant="body2">
              Cancellation details not available
            </Typography>
          )}
        </Box>
      )}

      {/* Images */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>
          {isCompleteDelivery
            ? "Final Delivery Images"
            : "Current Progress Images"}
        </Typography>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
          {upload.images.map((url, index) => (
            <Box
              key={index}
              component="a"
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              sx={{
                display: "block",
                width: {
                  xs: "100%",
                  sm: "calc(50% - 8px)",
                  md: "calc(33.33% - 11px)",
                },
              }}
            >
              <Box
                component="img"
                src={url}
                alt={`Final Image ${index + 1}`}
                sx={{
                  width: "100%",
                  height: "auto",
                  maxHeight: 300,
                  objectFit: "contain",
                  borderRadius: 1,
                  border: "1px solid #eee",
                }}
              />
            </Box>
          ))}
        </Box>
      </Box>

      {/* Description */}
      {upload.description && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>
            Artist's Description
          </Typography>
          <Typography variant="body1" sx={{ whiteSpace: "pre-line" }}>
            {upload.description}
          </Typography>
        </Box>
      )}

      {/* Contract Terms */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>
          Contract Terms
        </Typography>
        <Typography variant="body2">
          Contract Status: {contract.status}
        </Typography>
        <Typography variant="body2">
          Created: {formatDate(contract.createdAt)}
        </Typography>
        <Typography variant="body2">
          Deadline: {formatDate(contract.deadlineAt)}
        </Typography>
        <Typography variant="body2">
          Grace Period Ends: {formatDate(contract.graceEndsAt)}
        </Typography>
      </Box>

      {/* Action Button for Client */}
      {isClient && canReview && (
        <Box sx={{ mb: 3 }}>
          <Button
            variant="contained"
            color="primary"
            onClick={handleReviewClick}
          >
            Review{" "}
            {isCompleteDelivery ? "Final Delivery" : "Cancellation Proof"}
          </Button>
        </Box>
      )}

      {/* Status History */}
      <Box>
        <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>
          Upload Status
        </Typography>
        <Typography variant="body2">
          Created: {formatDate(upload.createdAt)}
        </Typography>
        <Typography variant="body2">
          Review Deadline: {formatDate(upload.expiresAt)}
        </Typography>
        {upload.closedAt && (
          <Typography variant="body2">
            Closed: {formatDate(upload.closedAt)}
          </Typography>
        )}
        {upload.status !== "submitted" && (
          <Typography variant="body2">Final Status: {upload.status}</Typography>
        )}
      </Box>
    </Paper>
  );
}

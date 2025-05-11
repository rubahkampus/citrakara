// src/components/dashboard/contracts/uploads/RevisionUploadDetails.tsx
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
} from "@mui/material";
import { useRouter } from "next/navigation";
import { IContract } from "@/lib/db/models/contract.model";
import { IRevisionUpload } from "@/lib/db/models/upload.model";
import { IRevisionTicket } from "@/lib/db/models/ticket.model";

interface RevisionUploadDetailsProps {
  contract: IContract;
  upload: IRevisionUpload;
  userId: string;
  isArtist: boolean;
  isClient: boolean;
  canReview: boolean;
}

export default function RevisionUploadDetails({
  contract,
  upload,
  userId,
  isArtist,
  isClient,
  canReview,
}: RevisionUploadDetailsProps) {
  const router = useRouter();
  const [ticket, setTicket] = useState<IRevisionTicket | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Format date for display
  const formatDate = (date?: string | Date) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleString();
  };

  // Fetch the associated revision ticket
  useEffect(() => {
    const fetchTicket = async () => {
      try {
        const response = await fetch(
          `/api/contract/${contract._id}/tickets/revision/${upload.revisionTicketId}`
        );
        if (!response.ok) {
          throw new Error("Failed to fetch revision ticket details");
        }
        const data = await response.json();
        setTicket(data);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "An error occurred while fetching ticket"
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchTicket();
  }, [contract._id, upload.revisionTicketId]);

  // Handle review button click
  const handleReviewClick = () => {
    router.push(
      `/dashboard/${userId}/contracts/${contract._id}/uploads/revision/${upload._id}?review=true`
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

  if (isLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

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
          <Typography variant="h6">Revision Upload</Typography>
          <Typography variant="body2" color="text.secondary">
            Uploaded by {isArtist ? "you" : "the artist"} on{" "}
            {formatDate(upload.createdAt)}
          </Typography>
          {ticket?.milestoneIdx !== undefined && (
            <Typography variant="body2">
              For Milestone:{" "}
              {contract.milestones?.[ticket.milestoneIdx]?.title ||
                `#${ticket.milestoneIdx}`}
            </Typography>
          )}
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
          This revision upload requires {isClient ? "your" : "client"} review.
          {isPastDeadline &&
            " This upload is past its review deadline and may be automatically accepted."}
        </Alert>
      )}

      <Divider sx={{ mb: 3 }} />

      {/* Revision Ticket Details */}
      {ticket && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" fontWeight="bold">
            Revision Request Details
          </Typography>
          <Typography variant="body2">Status: {ticket.status}</Typography>
          <Typography variant="body2">
            Created: {formatDate(ticket.createdAt)}
          </Typography>
          {ticket.paidFee !== undefined && (
            <Typography variant="body2">
              Paid Revision: Yes (Fee: {ticket.paidFee})
            </Typography>
          )}
          <Typography variant="body2" sx={{ mt: 1 }}>
            Client's request:
          </Typography>
          <Typography variant="body2" sx={{ mt: 0.5, mb: 1 }}>
            {ticket.description}
          </Typography>

          <Box sx={{ mb: 2 }}>
            <Link
              href={`/dashboard/${userId}/contracts/${contract._id}/tickets/revision/${ticket._id}`}
              underline="hover"
            >
              View full revision ticket
            </Link>
          </Box>
        </Box>
      )}

      {/* Images */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>
          Revision Images
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
                alt={`Revision ${index + 1}`}
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

      {/* Action Button for Client */}
      {isClient && canReview && (
        <Box sx={{ mb: 3 }}>
          <Button
            variant="contained"
            color="primary"
            onClick={handleReviewClick}
          >
            Review Revision
          </Button>
        </Box>
      )}

      {/* Status History */}
      <Box>
        <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>
          Status History
        </Typography>
        <Typography variant="body2">
          Created: {formatDate(upload.createdAt)}
        </Typography>
        {upload.resolvedAt && (
          <Typography variant="body2">
            Resolved: {formatDate(upload.resolvedAt)}
          </Typography>
        )}
        {upload.status !== "submitted" && (
          <Typography variant="body2">Final Status: {upload.status}</Typography>
        )}
      </Box>
    </Paper>
  );
}

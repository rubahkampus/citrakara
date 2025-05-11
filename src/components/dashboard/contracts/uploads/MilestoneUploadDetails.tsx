// src/components/dashboard/contracts/uploads/MilestoneUploadDetails.tsx
"use client";

import {
  Box,
  Paper,
  Typography,
  Divider,
  Button,
  Chip,
  Alert,
} from "@mui/material";
import { useRouter } from "next/navigation";
import { IContract } from "@/lib/db/models/contract.model";
import { IProgressUploadMilestone } from "@/lib/db/models/upload.model";

interface MilestoneUploadDetailsProps {
  contract: IContract;
  upload: IProgressUploadMilestone;
  userId: string;
  isArtist: boolean;
  isClient: boolean;
  canReview: boolean;
}

export default function MilestoneUploadDetails({
  contract,
  upload,
  userId,
  isArtist,
  isClient,
  canReview,
}: MilestoneUploadDetailsProps) {
  const router = useRouter();

  // Format date for display
  const formatDate = (date?: string | Date) => {
    if (!date) return "N/A";
    const parsedDate = typeof date === "string" ? new Date(date) : date;
    return parsedDate.toLocaleString();
  };

  // Get milestone information
  const milestone = contract.milestones?.[upload.milestoneIdx];

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

  // Handle review button click
  const handleReviewClick = () => {
    router.push(
      `/dashboard/${userId}/contracts/${contract._id}/uploads/milestone/${upload._id}?review=true`
    );
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
            Milestone: {milestone?.title || `#${upload.milestoneIdx}`}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Uploaded by {isArtist ? "you" : "the artist"} on{" "}
            {formatDate(upload.createdAt)}
          </Typography>
        </Box>

        {upload.isFinal && (
          <Chip
            label={upload.status || "Progress"}
            color={getStatusColor(upload.status || "")}
            variant="outlined"
          />
        )}
      </Box>

      {upload.isFinal && upload.status === "submitted" && (
        <Alert severity="info" sx={{ mb: 3 }}>
          This is a final milestone upload and requires{" "}
          {isClient ? "your" : "client"} review.
          {isPastDeadline &&
            " This upload is past its review deadline and may be automatically accepted."}
        </Alert>
      )}

      <Divider sx={{ mb: 3 }} />

      {/* Milestone Progress Details */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle1" fontWeight="bold">
          Milestone Details
        </Typography>
        <Typography variant="body2">
          Percentage: {milestone?.percent || 0}% of total contract
        </Typography>
        <Typography variant="body2">
          Final delivery: {upload.isFinal ? "Yes" : "No"}
        </Typography>
        {upload.isFinal && upload.expiresAt && (
          <Typography variant="body2">
            Review deadline: {formatDate(upload.expiresAt)}
          </Typography>
        )}
      </Box>

      {/* Images */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>
          Images
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
                alt={`Milestone ${index + 1}`}
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
            Description
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
            Review Milestone
          </Button>
        </Box>
      )}

      {/* Status History */}
      {upload.isFinal && (
        <Box>
          <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>
            Status History
          </Typography>
          <Typography variant="body2">
            Created: {formatDate(upload.createdAt)}
          </Typography>
          {upload.closedAt && (
            <Typography variant="body2">
              Closed: {formatDate(upload.closedAt)}
            </Typography>
          )}
        </Box>
      )}
    </Paper>
  );
}

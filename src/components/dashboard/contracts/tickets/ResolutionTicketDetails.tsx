// src/components/dashboard/contracts/tickets/ResolutionTicketDetails.tsx
"use client";

import { useState } from "react";
import {
  Box,
  Paper,
  Typography,
  Button,
  Alert,
  CircularProgress,
  Divider,
  Chip,
  TextField,
  Link,
} from "@mui/material";
import { useRouter } from "next/navigation";
import { IContract } from "@/lib/db/models/contract.model";
import { IResolutionTicket } from "@/lib/db/models/ticket.model";

interface ResolutionTicketDetailsProps {
  contract: IContract;
  ticket: IResolutionTicket;
  userId: string;
  isArtist: boolean;
  isClient: boolean;
}

export default function ResolutionTicketDetails({
  contract,
  ticket,
  userId,
  isArtist,
  isClient,
}: ResolutionTicketDetailsProps) {
  const router = useRouter();
  const [counterDescription, setCounterDescription] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Determine if user is the submitter or counterparty
  const isSubmitter = ticket.submittedBy === (isClient ? "client" : "artist");
  const isCounterparty = !isSubmitter;

  // Format date for display
  const formatDate = (date?: string | Date) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleString();
  };

  // Determine if user can submit counterproof
  const canSubmitCounterproof = () => {
    return (
      isCounterparty &&
      ticket.status === "open" &&
      !ticket.counterDescription &&
      new Date(ticket.counterExpiresAt) > new Date()
    );
  };

  // Handle file input change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      setFiles(selectedFiles);

      // Create and set preview URLs
      const newPreviewUrls = selectedFiles.map((file) =>
        URL.createObjectURL(file)
      );
      setPreviewUrls((prevUrls) => {
        // Revoke previous URLs to avoid memory leaks
        prevUrls.forEach((url) => URL.revokeObjectURL(url));
        return newPreviewUrls;
      });
    }
  };

  // Handle counterproof submission
  const handleSubmitCounterproof = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // Validate input
      if (!counterDescription.trim()) {
        throw new Error("Please provide your counterproof description");
      }

      // Create FormData
      const formData = new FormData();
      formData.append("counterDescription", counterDescription);

      // Add counterproof images
      files.forEach((file) => {
        formData.append("counterProofImages[]", file);
      });

      // Submit to API
      const response = await fetch(
        `/api/contract/${contract._id}/resolution/${ticket._id}/counterproof`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to submit counterproof");
      }

      setSuccess(true);

      // Refresh the page after successful submission
      setTimeout(() => {
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

  // Get status color based on status
  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "primary";
      case "awaitingReview":
        return "warning";
      case "resolved":
        return ticket.decision === "favorClient"
          ? isClient
            ? "success"
            : "error"
          : isArtist
          ? "success"
          : "error";
      case "cancelled":
        return "default";
      default:
        return "default";
    }
  };

  // Get readable status
  const getReadableStatus = (status: string) => {
    switch (status) {
      case "open":
        return "Open - Awaiting Counterproof";
      case "awaitingReview":
        return "Awaiting Admin Review";
      case "resolved":
        return ticket.decision === "favorClient"
          ? "Resolved in Favor of Client"
          : "Resolved in Favor of Artist";
      case "cancelled":
        return "Cancelled";
      default:
        return status;
    }
  };

  // Check if past counterproof deadline
  const isPastCounterDeadline = new Date(ticket.counterExpiresAt) < new Date();

  // Get target type display name
  const getTargetTypeDisplay = (type: string) => {
    switch (type) {
      case "cancel":
        return "Cancellation Request";
      case "revision":
        return "Revision Request";
      case "final":
        return "Final Delivery";
      case "milestone":
        return "Milestone Upload";
      default:
        return type;
    }
  };

  return (
    <Paper elevation={2} sx={{ p: 3 }}>
      <Box
        sx={{
          mb: 3,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}
      >
        <Box>
          <Typography variant="h6">
            Resolution Request: {getTargetTypeDisplay(ticket.targetType)}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Submitted by:{" "}
            {ticket.submittedBy === "client"
              ? isClient
                ? "you"
                : "the client"
              : isArtist
              ? "you"
              : "the artist"}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Created: {formatDate(ticket.createdAt)}
          </Typography>
          {ticket.resolvedAt && (
            <Typography variant="body2" color="text.secondary">
              Resolved: {formatDate(ticket.resolvedAt)}
            </Typography>
          )}
        </Box>
        <Chip
          label={getReadableStatus(ticket.status)}
          color={getStatusColor(ticket.status)}
          variant="outlined"
        />
      </Box>

      {/* Counterproof deadline warning */}
      {ticket.status === "open" && !isPastCounterDeadline && (
        <Alert severity="info" sx={{ mb: 3 }}>
          Counterproof deadline: {formatDate(ticket.counterExpiresAt)}
        </Alert>
      )}

      {ticket.status === "open" && isPastCounterDeadline && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          The counterproof deadline has passed. This ticket will now go to admin
          review.
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          Your counterproof has been submitted successfully.
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Divider sx={{ mb: 3 }} />

      {/* Submitter's Case */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>
          {isSubmitter
            ? "Your"
            : ticket.submittedBy === "client"
            ? "Client's"
            : "Artist's"}{" "}
          Position
        </Typography>
        <Typography variant="body1" sx={{ mb: 2, whiteSpace: "pre-line" }}>
          {ticket.description}
        </Typography>

        {/* Proof Images */}
        {ticket.proofImages && ticket.proofImages.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 1 }}>
              Supporting Evidence:
            </Typography>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
              {ticket.proofImages.map((url, index) => (
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
                    alt={`Evidence ${index + 1}`}
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
        )}
      </Box>

      {/* Counterparty's Case - only shown if provided */}
      {ticket.counterDescription && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>
            {isCounterparty
              ? "Your"
              : ticket.counterparty === "client"
              ? "Client's"
              : "Artist's"}{" "}
            Response
          </Typography>
          <Typography variant="body1" sx={{ mb: 2, whiteSpace: "pre-line" }}>
            {ticket.counterDescription}
          </Typography>

          {/* Counterproof Images */}
          {ticket.counterProofImages &&
            ticket.counterProofImages.length > 0 && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" fontWeight="bold" sx={{ mb: 1 }}>
                  Supporting Evidence:
                </Typography>
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
                  {ticket.counterProofImages.map((url, index) => (
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
                        alt={`Counter Evidence ${index + 1}`}
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
            )}
        </Box>
      )}

      {/* Admin Decision - only shown if resolved */}
      {ticket.status === "resolved" && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>
            Admin Decision
          </Typography>
          <Typography variant="body2" fontWeight="bold">
            Decision:{" "}
            {ticket.decision === "favorClient"
              ? "In favor of the client"
              : "In favor of the artist"}
          </Typography>
          {ticket.resolutionNote && (
            <Typography variant="body1" sx={{ mt: 1, whiteSpace: "pre-line" }}>
              {ticket.resolutionNote}
            </Typography>
          )}
        </Box>
      )}

      {/* Counterproof Form - Only shown if user is counterparty and can submit */}
      {canSubmitCounterproof() && (
        <Box sx={{ mb: 3 }}>
          <Divider sx={{ mb: 3 }} />
          <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2 }}>
            Submit Your Response
          </Typography>

          <form onSubmit={handleSubmitCounterproof}>
            <Box sx={{ mb: 3 }}>
              <Typography variant="body2" sx={{ mb: 2 }}>
                Please provide your perspective on this issue. Include any
                relevant details that support your position.
              </Typography>

              <TextField
                label="Your Response"
                multiline
                rows={4}
                fullWidth
                value={counterDescription}
                onChange={(e) => setCounterDescription(e.target.value)}
                placeholder="Provide your side of the story..."
                required
                disabled={isSubmitting}
                sx={{ mb: 2 }}
              />
            </Box>

            {/* File upload section */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Supporting Evidence (Optional)
              </Typography>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileChange}
                disabled={isSubmitting}
                style={{ marginBottom: "16px" }}
              />

              {previewUrls.length > 0 && (
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 2 }}>
                  {previewUrls.map((url, index) => (
                    <Box
                      key={index}
                      component="img"
                      src={url}
                      alt={`Preview ${index}`}
                      sx={{
                        width: 100,
                        height: 100,
                        objectFit: "cover",
                        borderRadius: 1,
                      }}
                    />
                  ))}
                </Box>
              )}
            </Box>

            <Alert severity="warning" sx={{ mb: 3 }}>
              <Typography variant="body2">
                You have until {formatDate(ticket.counterExpiresAt)} to submit
                your response. After this deadline, the ticket will
                automatically proceed to admin review.
              </Typography>
            </Alert>

            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={!counterDescription.trim() || isSubmitting}
            >
              {isSubmitting ? (
                <CircularProgress size={24} />
              ) : (
                "Submit Response"
              )}
            </Button>
          </form>
        </Box>
      )}

      {/* Awaiting decision message */}
      {ticket.status === "awaitingReview" && (
        <Box sx={{ mb: 3 }}>
          <Divider sx={{ mb: 3 }} />
          <Alert severity="info">
            <Typography variant="body2">
              This resolution request is now under review by administrators. You
              will be notified when a decision has been made.
            </Typography>
          </Alert>
        </Box>
      )}

      {/* Target item link */}
      <Box sx={{ mt: 3 }}>
        <Divider sx={{ mb: 3 }} />
        <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>
          Related Item
        </Typography>
        <Link
          href={`/dashboard/${userId}/contracts/${contract._id}/tickets/${ticket.targetType}/${ticket.targetId}`}
          underline="hover"
        >
          View {getTargetTypeDisplay(ticket.targetType)}
        </Link>
      </Box>
    </Paper>
  );
}

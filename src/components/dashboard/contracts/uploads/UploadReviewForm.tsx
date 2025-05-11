// src/components/dashboard/contracts/uploads/UploadReviewForm.tsx
"use client";

import { useState } from "react";
import {
  Box,
  Paper,
  Typography,
  Divider,
  Button,
  TextField,
  RadioGroup,
  Radio,
  FormControlLabel,
  FormControl,
  FormLabel,
  Alert,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from "@mui/material";
import { useRouter } from "next/navigation";
import { IContract } from "@/lib/db/models/contract.model";

interface UploadReviewFormProps {
  contract: IContract;
  upload: any; // Could be milestone, revision, or final upload
  uploadType: "milestone" | "revision" | "final";
  userId: string;
  isPastDeadline: boolean;
}

export default function UploadReviewForm({
  contract,
  upload,
  uploadType,
  userId,
  isPastDeadline,
}: UploadReviewFormProps) {
  const router = useRouter();
  const [decision, setDecision] = useState<"accept" | "reject" | "">("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // For cancel confirmation dialog
  const [showEscalateDialog, setShowEscalateDialog] = useState(false);

  // For completed contract dialog
  const [showCompletedDialog, setShowCompletedDialog] = useState(false);

  // Determine if this is a final delivery with workProgress = 100%
  const isContractCompletion =
    uploadType === "final" && upload.workProgress === 100;

  // Determine if this is a cancellation proof
  const isCancellationProof =
    uploadType === "final" && upload.workProgress < 100;

  // Format date for display
  const formatDate = (dateString?: string) => {
    return dateString ? new Date(dateString).toLocaleString() : "N/A";
  };

  // Handle decision change
  const handleDecisionChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setDecision(event.target.value as "accept" | "reject");
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // Validate inputs
      if (!decision) {
        throw new Error(
          "Please select whether to accept or reject this upload"
        );
      }

      if (decision === "reject" && !rejectionReason.trim()) {
        throw new Error("Please provide a reason for rejection");
      }

      // Prepare request body
      const requestBody = {
        action: decision,
        reason: decision === "reject" ? rejectionReason : undefined,
      };

      // Submit to API
      const response = await fetch(
        `/api/contract/${contract._id}/uploads/${uploadType}/${upload._id}/review`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestBody),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || `Failed to ${decision} upload`);
      }

      const data = await response.json();
      setSuccess(true);

      // Show completed dialog if this was a contract completion
      if (isContractCompletion && decision === "accept") {
        setShowCompletedDialog(true);
      } else {
        // Redirect after successful submission (with delay)
        setTimeout(() => {
          router.push(`/dashboard/${userId}/contracts/${contract._id}/uploads`);
          router.refresh();
        }, 1500);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unknown error occurred"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle escalation request
  const handleEscalation = () => {
    setShowEscalateDialog(true);
  };

  // Confirm escalation
  const confirmEscalation = () => {
    setShowEscalateDialog(false);
    router.push(
      `/dashboard/${userId}/resolution/new?contractId=${contract._id}&targetType=${uploadType}&targetId=${upload._id}`
    );
  };

  // Handle completion dialog close
  const handleCompletedDialogClose = () => {
    setShowCompletedDialog(false);
    router.push(`/dashboard/${userId}/contracts/${contract._id}`);
    router.refresh();
  };

  return (
    <Paper elevation={2} sx={{ p: 3 }}>
      {success ? (
        <Alert severity="success" sx={{ mb: 2 }}>
          You have successfully {decision}ed this {uploadType} upload.
          {!isContractCompletion && " Redirecting..."}
        </Alert>
      ) : (
        <form onSubmit={handleSubmit}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {isPastDeadline && (
            <Alert severity="warning" sx={{ mb: 3 }}>
              This upload is past its review deadline (
              {formatDate(upload.expiresAt)}) and may be automatically accepted
              if not reviewed soon.
            </Alert>
          )}

          {/* Upload Type Title */}
          <Typography variant="h6" sx={{ mb: 2 }}>
            Review{" "}
            {uploadType === "milestone"
              ? "Milestone Delivery"
              : uploadType === "revision"
              ? "Revision"
              : isContractCompletion
              ? "Final Delivery"
              : "Cancellation Proof"}
          </Typography>

          {/* Special alert for contract completion */}
          {isContractCompletion && (
            <Alert severity="info" sx={{ mb: 3 }}>
              This is the final delivery for the entire contract. By accepting
              this upload, you are confirming that the contract is complete and
              ready for payment processing.
            </Alert>
          )}

          {/* Special alert for cancellation proof */}
          {isCancellationProof && (
            <Alert severity="info" sx={{ mb: 3 }}>
              This is a cancellation proof showing {upload.workProgress}% work
              completion. By accepting this upload, you are agreeing to cancel
              the contract with payment split according to the work percentage
              and contract policy.
            </Alert>
          )}

          <Divider sx={{ mb: 3 }} />

          {/* Display Images */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>
              Submitted Images
            </Typography>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
              {upload.images.map((url: string, index: number) => (
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
                    alt={`Image ${index + 1}`}
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

          <Divider sx={{ my: 3 }} />

          {/* Decision Radio Buttons */}
          <FormControl component="fieldset" sx={{ mb: 3 }}>
            <FormLabel component="legend">Your Decision</FormLabel>
            <RadioGroup
              name="decision"
              value={decision}
              onChange={handleDecisionChange}
            >
              <FormControlLabel
                value="accept"
                control={<Radio />}
                label={`Accept this ${
                  uploadType === "final"
                    ? isContractCompletion
                      ? "final delivery"
                      : "cancellation proof"
                    : uploadType + " upload"
                }`}
              />
              <FormControlLabel
                value="reject"
                control={<Radio />}
                label={`Reject and request changes`}
              />
            </RadioGroup>
          </FormControl>

          {/* Rejection Reason (only shown if reject is selected) */}
          {decision === "reject" && (
            <Box sx={{ mb: 3 }}>
              <TextField
                label="Reason for Rejection"
                multiline
                rows={4}
                fullWidth
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                required
                placeholder="Please explain what changes are needed"
                disabled={isSubmitting}
              />
            </Box>
          )}

          {/* Action Buttons */}
          <Box sx={{ display: "flex", gap: 2 }}>
            <Button
              type="submit"
              variant="contained"
              color={
                decision === "accept"
                  ? "success"
                  : decision === "reject"
                  ? "error"
                  : "primary"
              }
              disabled={!decision || isSubmitting}
              sx={{ minWidth: 120 }}
            >
              {isSubmitting ? (
                <CircularProgress size={24} />
              ) : decision === "accept" ? (
                "Accept"
              ) : decision === "reject" ? (
                "Reject"
              ) : (
                "Submit"
              )}
            </Button>

            <Button
              type="button"
              variant="outlined"
              color="warning"
              onClick={handleEscalation}
              disabled={isSubmitting}
            >
              Escalate to Resolution
            </Button>
          </Box>
        </form>
      )}

      {/* Escalation Confirmation Dialog */}
      <Dialog
        open={showEscalateDialog}
        onClose={() => setShowEscalateDialog(false)}
      >
        <DialogTitle>Escalate to Resolution?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Escalating this issue will create a resolution ticket for admin
            review. You will need to provide evidence and explain your position.
            Do you want to proceed with escalation?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowEscalateDialog(false)}>Cancel</Button>
          <Button onClick={confirmEscalation} color="warning">
            Proceed to Resolution
          </Button>
        </DialogActions>
      </Dialog>

      {/* Contract Completed Dialog */}
      <Dialog open={showCompletedDialog} onClose={handleCompletedDialogClose}>
        <DialogTitle>Contract Completed Successfully!</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Congratulations! You have accepted the final delivery and completed
            the contract. Payment will now be processed according to the
            contract terms.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={handleCompletedDialogClose}
            color="primary"
            autoFocus
          >
            Go to Contract Page
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}

"use client";

import { useState } from "react";
import {
  Box,
  Typography,
  Button,
  TextField,
  RadioGroup,
  FormControlLabel,
  Radio,
  Alert,
  CircularProgress,
  FormControl,
  FormLabel,
  Paper,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from "@mui/material";
import { useRouter } from "next/navigation";

// Types for the props passed to this component
interface AdminResolutionFormProps {
  ticket: ResolutionTicket;
  contract: Contract;
  userId: string;
}

// Types for the resolution ticket
interface ResolutionTicket {
  _id: string;
  contractId: string;
  submittedBy: "client" | "artist";
  submittedById: string;
  targetType: "cancel" | "revision" | "final" | "milestone";
  targetId: string;
  description: string;
  proofImages?: string[];
  counterparty: "client" | "artist";
  counterDescription?: string;
  counterProofImages?: string[];
  counterExpiresAt: string;
  status: "open" | "awaitingReview" | "resolved" | "cancelled";
  decision?: "favorClient" | "favorArtist";
  resolutionNote?: string;
  resolvedBy?: string;
  resolvedAt?: string;
  createdAt: string;
}

// Simplified Contract type
interface Contract {
  _id: string;
  status: string;
  clientId: string;
  artistId: string;
  deadlineAt: string;
  graceEndsAt: string;
  workPercentage: number;
  finance?: {
    total: number;
  };
}

export default function AdminResolutionForm({
  ticket,
  contract,
  userId,
}: AdminResolutionFormProps) {
  const router = useRouter();
  const [decision, setDecision] = useState<"favorClient" | "favorArtist" | "">(
    ""
  );
  const [resolutionNote, setResolutionNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [noteError, setNoteError] = useState(false);

  // Cannot resolve if not in awaiting review status
  const canResolve = ticket.status === "awaitingReview";

  // Handle decision change
  const handleDecisionChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setDecision(event.target.value as "favorClient" | "favorArtist");
  };

  // Handle resolution note change
  const handleNoteChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setResolutionNote(event.target.value);
    setNoteError(event.target.value.trim().length < 20);
  };

  // Show confirmation dialog
  const handleConfirmOpen = () => {
    // Validate form
    if (!decision) {
      setError("Please select a decision");
      return;
    }

    if (resolutionNote.trim().length < 20) {
      setNoteError(true);
      setError(
        "Please provide a detailed explanation (at least 20 characters)"
      );
      return;
    }

    setError(null);
    setConfirmDialogOpen(true);
  };

  // Close confirmation dialog
  const handleConfirmClose = () => {
    setConfirmDialogOpen(false);
  };

  // Submit the resolution
  const handleSubmit = async () => {
    setConfirmDialogOpen(false);
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/admin/resolution/${ticket._id}/resolve`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            decision,
            resolutionNote,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to resolve ticket");
      }

      // Handle success
      setSuccess(true);

      // Redirect after a short delay
      setTimeout(() => {
        router.push(`/admin/resolution`);
        router.refresh();
      }, 2000);
    } catch (err) {
      console.error("Error resolving ticket:", err);
      setError(
        err instanceof Error ? err.message : "An unknown error occurred"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get guidance based on target type
  const getResolutionGuidance = () => {
    switch (ticket.targetType) {
      case "cancel":
        return "You're deciding whether to approve a contract cancellation. If you favor the cancellation requester, the contract will be cancelled with the associated payment distribution.";
      case "revision":
        return "You're deciding on a revision dispute. If you favor the client, the artist will be required to make the requested revisions. If you favor the artist, the revision request will be rejected.";
      case "final":
        return "You're deciding on a final delivery dispute. If you favor the client, the submission will be rejected with an option for the artist to resubmit. If you favor the artist, the delivery will be marked as accepted.";
      case "milestone":
        return "You're deciding on a milestone dispute. If you favor the client, the milestone will be rejected and the artist must revise. If you favor the artist, the milestone will be marked as accepted.";
      default:
        return "Please review all evidence thoroughly before making a decision.";
    }
  };

  // Get consequences based on decision
  const getDecisionConsequences = () => {
    if (!decision) return null;

    if (decision === "favorClient") {
      switch (ticket.targetType) {
        case "cancel":
          return "The contract will be cancelled with payment split based on work percentage. The client may receive a refund for remaining work.";
        case "revision":
          return "The artist will be required to perform the requested revisions.";
        case "final":
          return "The final delivery will be rejected, and the artist must submit a revised version.";
        case "milestone":
          return "The milestone will be rejected, and the artist must submit a revised version.";
      }
    } else if (decision === "favorArtist") {
      switch (ticket.targetType) {
        case "cancel":
          return "The cancellation request will be rejected, and the contract will continue as normal.";
        case "revision":
          return "The revision request will be rejected, and the artist will not be required to make changes.";
        case "final":
          return "The final delivery will be automatically accepted, and the artist will receive payment.";
        case "milestone":
          return "The milestone will be automatically accepted, and the contract will move to the next stage.";
      }
    }

    return null;
  };

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          Resolution submitted successfully! Redirecting...
        </Alert>
      )}

      <Paper elevation={1} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Resolution Guidance
        </Typography>
        <Alert severity="info" sx={{ mb: 2 }}>
          {getResolutionGuidance()}
        </Alert>

        <Divider sx={{ my: 2 }} />

        <Box component="form" noValidate>
          <FormControl component="fieldset" sx={{ mb: 3 }} fullWidth>
            <FormLabel component="legend">Decision</FormLabel>
            <RadioGroup
              name="decision"
              value={decision}
              onChange={handleDecisionChange}
              row
            >
              <FormControlLabel
                value="favorClient"
                control={<Radio />}
                label="Favor Client"
                disabled={isSubmitting || success || !canResolve}
              />
              <FormControlLabel
                value="favorArtist"
                control={<Radio />}
                label="Favor Artist"
                disabled={isSubmitting || success || !canResolve}
              />
            </RadioGroup>
          </FormControl>

          {decision && (
            <Alert
              severity={decision === "favorClient" ? "info" : "warning"}
              sx={{ mb: 3 }}
            >
              <Typography variant="body2">
                <strong>Consequence:</strong> {getDecisionConsequences()}
              </Typography>
            </Alert>
          )}

          <FormControl fullWidth sx={{ mb: 3 }}>
            <FormLabel>Resolution Note (Required)</FormLabel>
            <TextField
              multiline
              rows={6}
              value={resolutionNote}
              onChange={handleNoteChange}
              placeholder="Provide a detailed explanation of your decision. This will be visible to both parties."
              fullWidth
              disabled={isSubmitting || success || !canResolve}
              error={noteError}
              helperText={
                noteError
                  ? "Please provide a detailed explanation (at least 20 characters)"
                  : "Your explanation should be clear, neutral, and reference specific evidence"
              }
              variant="outlined"
              margin="normal"
            />
          </FormControl>

          <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleConfirmOpen}
              disabled={
                isSubmitting ||
                success ||
                !canResolve ||
                !decision ||
                resolutionNote.trim().length < 20
              }
            >
              {isSubmitting ? (
                <CircularProgress size={24} />
              ) : (
                "Submit Resolution"
              )}
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialogOpen} onClose={handleConfirmClose}>
        <DialogTitle>Confirm Resolution Decision</DialogTitle>
        <DialogContent>
          <DialogContentText>
            You are about to resolve this dispute in favor of the{" "}
            <strong>{decision === "favorClient" ? "CLIENT" : "ARTIST"}</strong>.
            This action cannot be undone and will immediately affect the
            contract status and escrow funds.
          </DialogContentText>
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2">Your Resolution Note:</Typography>
            <Paper
              variant="outlined"
              sx={{ p: 2, mt: 1, backgroundColor: "#f5f5f5" }}
            >
              <Typography variant="body2">{resolutionNote}</Typography>
            </Paper>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleConfirmClose} color="primary">
            Cancel
          </Button>
          <Button onClick={handleSubmit} color="error" variant="contained">
            Confirm Resolution
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

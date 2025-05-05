// src/components/dashboard/proposals/ArtistRespondForm.tsx
/**
 * ArtistRespondForm
 * ------------------
 * Renders UI for artist to accept or reject a proposal.
 *
 * Props:
 *   - proposal: ProposalUI
 *   - onSubmit: (decision: { accept: boolean; surcharge?: number; discount?: number; reason?: string }) => void
 *   - loading?: boolean
 *
 * UI Elements:
 *   - Number inputs for surcharge and discount (in cents)
 *   - Text input for reason
 *   - Buttons: Accept, Reject
 */
import React, { useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Grid,
  Divider,
  Stack,
  InputAdornment,
} from "@mui/material";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import { ProposalUI } from "@/types/proposal";

interface ArtistRespondFormProps {
  proposal: ProposalUI;
  loading?: boolean;
  onSubmit: (decision: {
    accept: boolean;
    surcharge?: number;
    discount?: number;
    reason?: string;
  }) => void;
}

export default function ArtistRespondForm({
  proposal,
  onSubmit,
  loading = false,
}: ArtistRespondFormProps) {
  const [surcharge, setSurcharge] = useState<number>(0);
  const [discount, setDiscount] = useState<number>(0);
  const [reason, setReason] = useState("");

  const handleAccept = () => {
    onSubmit({
      accept: true,
      surcharge: surcharge || undefined,
      discount: discount || undefined,
      reason: reason || undefined,
    });
  };

  const handleReject = () => {
    onSubmit({
      accept: false,
      reason: reason || "Artist declined the proposal",
    });
  };

  // Calculate new total with adjustments
  const calculateTotal = () => {
    return (
      proposal.priceBreakdown.finalTotal + (surcharge || 0) - (discount || 0)
    );
  };

  return (
    <Box sx={{ maxWidth: 800, mx: "auto" }}>
      {/* Proposal Details */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Commission Proposal - {proposal.listingTitle}
          </Typography>

          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">
                Deadline
              </Typography>
              <Typography variant="body1">
                {new Date(proposal.deadline).toLocaleDateString()}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">
                Current Price
              </Typography>
              <Typography variant="body1">
                IDR {proposal.priceBreakdown.finalTotal.toLocaleString()}
              </Typography>
            </Grid>
          </Grid>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Project Description
          </Typography>
          <Typography
            variant="body1"
            sx={{
              backgroundColor: "action.hover",
              p: 2,
              borderRadius: 1,
              mb: 2,
            }}
          >
            {proposal.generalDescription}
          </Typography>

          {proposal.referenceImages?.length > 0 && (
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Reference Images ({proposal.referenceImages.length})
              </Typography>
              <Typography variant="body2" color="text.primary">
                {proposal.referenceImages.length} image
                {proposal.referenceImages.length > 1 ? "s" : ""} attached
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Adjustment Form */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Adjust Price (Optional)
          </Typography>

          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Add surcharge"
                type="number"
                fullWidth
                value={surcharge || ""}
                onChange={(e) => setSurcharge(Number(e.target.value))}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">IDR</InputAdornment>
                  ),
                }}
                helperText="Add extra charge for additional complexity"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Or offer discount"
                type="number"
                fullWidth
                value={discount || ""}
                onChange={(e) => setDiscount(Number(e.target.value))}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">IDR</InputAdornment>
                  ),
                }}
                helperText="Offer a discount to secure the commission"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Reason for adjustment (optional)"
                multiline
                rows={3}
                fullWidth
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Explain why you're adding a surcharge or discount"
              />
            </Grid>
          </Grid>

          {(surcharge > 0 || discount > 0) && (
            <Box
              sx={{
                mt: 3,
                p: 2,
                backgroundColor: "action.hover",
                borderRadius: 1,
              }}
            >
              <Typography variant="body1" sx={{ mb: 1 }}>
                New Total:{" "}
                <strong>IDR {calculateTotal().toLocaleString()}</strong>
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Original: IDR{" "}
                {proposal.priceBreakdown.finalTotal.toLocaleString()}
                {surcharge > 0 &&
                  ` + ${surcharge.toLocaleString()} (surcharge)`}
                {discount > 0 && ` - ${discount.toLocaleString()} (discount)`}
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <Stack direction="row" spacing={2} sx={{ justifyContent: "center" }}>
        <Button
          variant="outlined"
          color="error"
          size="large"
          startIcon={<CloseIcon />}
          onClick={handleReject}
          disabled={loading}
          sx={{ minWidth: 200 }}
        >
          Reject Proposal
        </Button>
        <Button
          variant="contained"
          color="primary"
          size="large"
          startIcon={<CheckIcon />}
          onClick={handleAccept}
          disabled={loading}
          sx={{ minWidth: 200 }}
        >
          Accept Proposal
        </Button>
      </Stack>
    </Box>
  );
}

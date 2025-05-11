// src/components/dashboard/resolution/ResolutionTicketDetails
"use client";

import { useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Divider,
  Chip,
  Button,
  Alert,
  CircularProgress,
  Grid,
  Card,
  CardMedia,
  CardContent,
  Dialog,
  DialogContent,
} from "@mui/material";
import { useRouter } from "next/navigation";
import CounterproofForm from "./CounterproofForm";

// Types for the props passed to this component
interface ResolutionTicketDetailsProps {
  ticket: ResolutionTicket;
  contract?: Contract | null;
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

// Simplified Contract type - only include fields we need
interface Contract {
  _id: string;
  status: string;
  clientId: string;
  artistId: string;
  deadlineAt: string;
  workPercentage: number;
}

export default function ResolutionTicketDetails({
  ticket,
  contract,
  userId,
}: ResolutionTicketDetailsProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showCounterproofForm, setShowCounterproofForm] = useState(false);

  // Check if the current user is the submitter or counterparty
  const isSubmitter = ticket.submittedById === userId;
  const isCounterparty = !isSubmitter;

  // Calculate if counterproof can be submitted
  const canSubmitCounterproof =
    ticket.status === "open" &&
    isCounterparty &&
    !ticket.counterDescription &&
    new Date(ticket.counterExpiresAt) > new Date();

  // Format dates for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Get status label with proper formatting
  const getStatusLabel = () => {
    switch (ticket.status) {
      case "open":
        return "Open - Awaiting Counterparty Response";
      case "awaitingReview":
        return "Awaiting Admin Review";
      case "resolved":
        return `Resolved - In Favor of ${
          ticket.decision === "favorClient" ? "Client" : "Artist"
        }`;
      case "cancelled":
        return "Cancelled";
      default:
        return ticket.status;
    }
  };

  // Show an enlarged image
  const handleImageClick = (imageUrl: string) => {
    setSelectedImage(imageUrl);
  };

  const handleCloseImage = () => {
    setSelectedImage(null);
  };

  // Show counterproof form
  const handleSubmitCounterproof = () => {
    setShowCounterproofForm(true);
  };

  // Handle successful counterproof submission
  const handleCounterproofSubmitted = () => {
    setShowCounterproofForm(false);
    // Refresh the page to show the new counterproof
    // In a real app, you might use a state management solution or SWR/React Query to refresh data
    router.refresh();
  };

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Status Banner */}
      <Paper
        elevation={0}
        sx={{
          p: 2,
          mb: 3,
          backgroundColor:
            ticket.status === "open"
              ? "primary.light"
              : ticket.status === "awaitingReview"
              ? "warning.light"
              : ticket.status === "resolved"
              ? "success.light"
              : "error.light",
          color: "white",
        }}
      >
        <Typography variant="h6">{getStatusLabel()}</Typography>
        {ticket.status === "open" && (
          <Typography variant="body2">
            Counterparty has until {formatDate(ticket.counterExpiresAt)} to
            respond
          </Typography>
        )}
      </Paper>

      {/* Main Content */}
      <Grid container spacing={3}>
        {/* Left Column - Ticket Info */}
        <Grid item xs={12} md={4}>
          <Paper elevation={1} sx={{ p: 2, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Ticket Information
            </Typography>
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Ticket ID
              </Typography>
              <Typography variant="body2">{ticket._id}</Typography>
            </Box>
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Created On
              </Typography>
              <Typography variant="body2">
                {formatDate(ticket.createdAt)}
              </Typography>
            </Box>
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Target Type
              </Typography>
              <Chip
                label={
                  ticket.targetType.charAt(0).toUpperCase() +
                  ticket.targetType.slice(1)
                }
                size="small"
                color={
                  ticket.targetType === "cancel"
                    ? "error"
                    : ticket.targetType === "revision"
                    ? "info"
                    : ticket.targetType === "final"
                    ? "success"
                    : "warning"
                }
                sx={{ mt: 0.5 }}
              />
            </Box>
            {contract && (
              <>
                <Divider sx={{ my: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Contract Info
                </Typography>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Contract ID
                  </Typography>
                  <Typography variant="body2" sx={{ wordBreak: "break-all" }}>
                    {contract._id}
                  </Typography>
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Contract Status
                  </Typography>
                  <Typography variant="body2">
                    {contract.status.charAt(0).toUpperCase() +
                      contract.status.slice(1)}
                  </Typography>
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Work Progress
                  </Typography>
                  <Typography variant="body2">
                    {contract.workPercentage}%
                  </Typography>
                </Box>
              </>
            )}

            {ticket.status === "resolved" && (
              <>
                <Divider sx={{ my: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Resolution Details
                </Typography>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Decision
                  </Typography>
                  <Chip
                    label={
                      ticket.decision === "favorClient"
                        ? "In Favor of Client"
                        : "In Favor of Artist"
                    }
                    size="small"
                    color={
                      ticket.decision === "favorClient" ? "info" : "warning"
                    }
                    sx={{ mt: 0.5 }}
                  />
                </Box>
                {ticket.resolvedAt && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Resolved On
                    </Typography>
                    <Typography variant="body2">
                      {formatDate(ticket.resolvedAt)}
                    </Typography>
                  </Box>
                )}
              </>
            )}
          </Paper>

          {/* Action Buttons for Counterparty */}
          {canSubmitCounterproof && (
            <Paper elevation={1} sx={{ p: 2, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Actions
              </Typography>
              <Alert severity="info" sx={{ mb: 2 }}>
                You can submit your response until{" "}
                {formatDate(ticket.counterExpiresAt)}
              </Alert>
              <Button
                variant="contained"
                fullWidth
                onClick={handleSubmitCounterproof}
                disabled={isLoading}
              >
                {isLoading ? (
                  <CircularProgress size={24} />
                ) : (
                  "Submit Counterproof"
                )}
              </Button>
            </Paper>
          )}
        </Grid>

        {/* Right Column - Claim and Counterproof */}
        <Grid item xs={12} md={8}>
          {/* Submitter's Claim */}
          <Paper elevation={1} sx={{ p: 2, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              {isSubmitter ? "Your Claim" : "Submitted Claim"}
            </Typography>
            <Typography variant="subtitle2" color="text.secondary">
              Submitted by: {ticket.submittedBy.toUpperCase()}
            </Typography>
            <Typography variant="body1" sx={{ mt: 2, whiteSpace: "pre-line" }}>
              {ticket.description}
            </Typography>

            {/* Proof Images */}
            {ticket.proofImages && ticket.proofImages.length > 0 && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Evidence Images ({ticket.proofImages.length})
                </Typography>
                <Grid container spacing={1}>
                  {ticket.proofImages.map((image, idx) => (
                    <Grid item xs={4} sm={3} md={2} key={`proof-${idx}`}>
                      <Card
                        sx={{
                          cursor: "pointer",
                          height: "100%",
                          display: "flex",
                          flexDirection: "column",
                        }}
                        onClick={() => handleImageClick(image)}
                      >
                        <CardMedia
                          component="img"
                          height="100"
                          image={image}
                          alt={`Proof ${idx + 1}`}
                          sx={{ objectFit: "cover" }}
                        />
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            )}
          </Paper>

          {/* Counterparty Response */}
          <Paper elevation={1} sx={{ p: 2, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              {isCounterparty ? "Your Response" : "Counterparty Response"}
            </Typography>

            {ticket.counterDescription ? (
              <>
                <Typography
                  variant="subtitle2"
                  color="text.secondary"
                  gutterBottom
                >
                  Submitted by: {ticket.counterparty.toUpperCase()}
                </Typography>
                <Typography
                  variant="body1"
                  sx={{ mt: 2, whiteSpace: "pre-line" }}
                >
                  {ticket.counterDescription}
                </Typography>

                {/* Counterproof Images */}
                {ticket.counterProofImages &&
                  ticket.counterProofImages.length > 0 && (
                    <Box sx={{ mt: 3 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Evidence Images ({ticket.counterProofImages.length})
                      </Typography>
                      <Grid container spacing={1}>
                        {ticket.counterProofImages.map((image, idx) => (
                          <Grid
                            item
                            xs={4}
                            sm={3}
                            md={2}
                            key={`counter-${idx}`}
                          >
                            <Card
                              sx={{
                                cursor: "pointer",
                                height: "100%",
                                display: "flex",
                                flexDirection: "column",
                              }}
                              onClick={() => handleImageClick(image)}
                            >
                              <CardMedia
                                component="img"
                                height="100"
                                image={image}
                                alt={`Counterproof ${idx + 1}`}
                                sx={{ objectFit: "cover" }}
                              />
                            </Card>
                          </Grid>
                        ))}
                      </Grid>
                    </Box>
                  )}
              </>
            ) : (
              <Typography variant="body1" color="text.secondary">
                {canSubmitCounterproof
                  ? "Please submit your response using the form."
                  : ticket.status === "open"
                  ? "No response has been submitted yet."
                  : "No response was submitted before the deadline."}
              </Typography>
            )}
          </Paper>

          {/* Admin Decision */}
          {ticket.status === "resolved" && ticket.resolutionNote && (
            <Paper elevation={1} sx={{ p: 2, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Administrator's Decision
              </Typography>
              <Box
                sx={{
                  p: 2,
                  backgroundColor: "grey.100",
                  borderRadius: 1,
                  border: "1px solid",
                  borderColor: "grey.300",
                }}
              >
                <Typography
                  variant="body1"
                  sx={{ whiteSpace: "pre-line" }}
                  gutterBottom
                >
                  {ticket.resolutionNote}
                </Typography>
              </Box>
            </Paper>
          )}
        </Grid>
      </Grid>

      {/* Image Preview Dialog */}
      <Dialog
        open={!!selectedImage}
        onClose={handleCloseImage}
        maxWidth="md"
        fullWidth
      >
        <DialogContent sx={{ p: 0 }}>
          {selectedImage && (
            <img
              src={selectedImage}
              alt="Full size"
              style={{ width: "100%", height: "auto" }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Counterproof Form Dialog */}
      {showCounterproofForm && (
        <Dialog
          open={showCounterproofForm}
          onClose={() => setShowCounterproofForm(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogContent>
            <CounterproofForm
              ticketId={ticket._id}
              onSubmitted={handleCounterproofSubmitted}
              onCancel={() => setShowCounterproofForm(false)}
            />
          </DialogContent>
        </Dialog>
      )}
    </Box>
  );
}

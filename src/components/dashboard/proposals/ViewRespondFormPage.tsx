"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Alert,
  Snackbar,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableRow,
  Button,
  Chip,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { axiosClient } from "@/lib/utils/axiosClient";
import { IProposal } from "@/lib/db/models/proposal.model";
import ArtistRespondForm from "./ArtistRespondForm";
import ClientRespondForm from "./ClientRespondForm";

interface ViewRespondFormPageProps {
  username: string;
  role: "artist" | "client";
  proposal: IProposal;
}

export default function ViewRespondFormPage({
  username,
  role,
  proposal,
}: ViewRespondFormPageProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Status display mapping
  const statusMap = {
    pendingArtist: { text: "Pending Artist Response", color: "warning.main" },
    pendingClient: { text: "Pending Client Response", color: "warning.main" },
    accepted: { text: "Accepted", color: "success.main" },
    rejectedArtist: { text: "Rejected by Artist", color: "error.main" },
    rejectedClient: { text: "Rejected by Client", color: "error.main" },
    expired: { text: "Expired", color: "text.disabled" },
    paid: { text: "Paid", color: "success.dark" },
  };

  // Handle artist response submission
  const handleArtistSubmit = async (decision: {
    acceptProposal: boolean;
    surcharge?: number;
    discount?: number;
    rejectionReason?: string;
  }) => {
    setLoading(true);
    setError(null);

    try {
      await axiosClient.patch(`/api/proposal/${proposal._id}/respond`, {
        role: "artist",
        ...decision,
      });

      setSuccess(true);
      setTimeout(() => router.push(`/${username}/dashboard/proposals`), 1500);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to submit response");
    } finally {
      setLoading(false);
    }
  };

  // Handle client response submission
  const handleClientSubmit = async (decision: {
    acceptAdjustments?: boolean;
    cancel?: boolean;
  }) => {
    setLoading(true);
    setError(null);

    try {
      await axiosClient.patch(`/api/proposal/${proposal._id}/respond`, {
        role: "client",
        ...decision,
      });

      setSuccess(true);
      setTimeout(() => router.push(`/${username}/dashboard/proposals`), 1500);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to submit response");
    } finally {
      setLoading(false);
    }
  };

  // Determine if user can respond based on role and status
  const canArtistRespond =
    role === "artist" &&
    ["pendingArtist", "rejectedClient"].includes(proposal.status);

  const canClientRespond =
    role === "client" &&
    ["pendingClient", "accepted", "pendingArtist"].includes(proposal.status);

  // Format currency helper
  const formatCurrency = (amount: number) => `IDR ${amount.toLocaleString()}`;

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Response Form Section */}
      {canArtistRespond || canClientRespond ? (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            Your Response
          </Typography>
          {role === "artist" && canArtistRespond ? (
            <ArtistRespondForm
              proposal={proposal}
              onSubmit={handleArtistSubmit}
              loading={loading}
            />
          ) : role === "client" && canClientRespond ? (
            <ClientRespondForm
              proposal={proposal}
              onSubmit={handleClientSubmit}
              loading={loading}
            />
          ) : null}
        </Box>
      ) : (
        <Alert severity="info" sx={{ mb: 4 }}>
          {proposal.status === "accepted"
            ? "This proposal has been accepted."
            : proposal.status === "rejectedArtist"
            ? "This proposal has been rejected by the artist."
            : proposal.status === "rejectedClient"
            ? "You have rejected the artist's adjustments. The artist may propose new adjustments."
            : proposal.status === "expired"
            ? "This proposal has expired."
            : proposal.status === "paid"
            ? "This proposal has been paid."
            : "Waiting for the other party to respond."}
        </Alert>
      )}

      {/* Cancel Proposal Button (for clients only) */}
      {role === "client" &&
        !["expired", "rejectedArtist", "rejectedClient", "paid"].includes(
          proposal.status
        ) &&
        !canClientRespond && (
          <Box sx={{ mb: 4 }}>
            <Button
              variant="outlined"
              color="error"
              onClick={() => handleClientSubmit({ cancel: true })}
              disabled={loading}
            >
              Cancel Proposal
            </Button>
          </Box>
        )}

      {/* Proposal Details Section with Status */}
      <Box sx={{ mt: 3 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 3,
          }}
        >
          <Typography variant="h6">Proposal Details</Typography>
          <Chip
            label={statusMap[proposal.status]?.text || "Unknown"}
            color={
              statusMap[proposal.status]?.color.includes("success")
                ? "success"
                : statusMap[proposal.status]?.color.includes("error")
                ? "error"
                : "warning"
            }
            variant="filled"
            sx={{ fontWeight: "medium" }}
          />
        </Box>

        <Box sx={{ mb: 3 }}>
          <Typography variant="body2" color="text.secondary">
            Created: {new Date(proposal.createdAt).toLocaleDateString()}
          </Typography>
          {proposal.expiresAt && (
            <Typography variant="body2" color="warning.main">
              Expires: {new Date(proposal.expiresAt).toLocaleDateString()}
            </Typography>
          )}
        </Box>

        {/* Basic Info Accordion */}
        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle1">Basic Information</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  Project
                </Typography>
                <Typography variant="body1" sx={{ mb: 1 }}>
                  {proposal.listingSnapshot.title}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  Deadline
                </Typography>
                <Typography variant="body1" sx={{ mb: 1 }}>
                  {new Date(proposal.deadline).toLocaleDateString()}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary">
                  Project Description
                </Typography>
                <Paper sx={{ bgcolor: "action.hover", p: 2, borderRadius: 1 }}>
                  <Typography variant="body2">
                    {proposal.generalDescription}
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>

        {/* Price Breakdown Accordion */}
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle1">Price Breakdown</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Table size="small">
              <TableBody>
                <TableRow>
                  <TableCell>Base Price</TableCell>
                  <TableCell align="right">
                    {formatCurrency(proposal.calculatedPrice.base)}
                  </TableCell>
                </TableRow>
                {proposal.calculatedPrice.optionGroups > 0 && (
                  <TableRow>
                    <TableCell>Option Groups</TableCell>
                    <TableCell align="right">
                      {formatCurrency(proposal.calculatedPrice.optionGroups)}
                    </TableCell>
                  </TableRow>
                )}
                {proposal.calculatedPrice.addons > 0 && (
                  <TableRow>
                    <TableCell>Add-ons</TableCell>
                    <TableCell align="right">
                      {formatCurrency(proposal.calculatedPrice.addons)}
                    </TableCell>
                  </TableRow>
                )}
                {proposal.calculatedPrice.rush > 0 && (
                  <TableRow>
                    <TableCell>Rush Fee</TableCell>
                    <TableCell align="right">
                      {formatCurrency(proposal.calculatedPrice.rush)}
                    </TableCell>
                  </TableRow>
                )}
                {proposal.calculatedPrice.discount > 0 && (
                  <TableRow>
                    <TableCell>Discount</TableCell>
                    <TableCell align="right" sx={{ color: "success.main" }}>
                      -{formatCurrency(proposal.calculatedPrice.discount)}
                    </TableCell>
                  </TableRow>
                )}
                {proposal.artistAdjustments?.acceptedSurcharge && (
                  <TableRow>
                    <TableCell>Artist Surcharge</TableCell>
                    <TableCell align="right" sx={{ color: "error.main" }}>
                      +
                      {formatCurrency(
                        proposal.artistAdjustments.acceptedSurcharge
                      )}
                    </TableCell>
                  </TableRow>
                )}
                {proposal.artistAdjustments?.acceptedDiscount && (
                  <TableRow>
                    <TableCell>Artist Discount</TableCell>
                    <TableCell align="right" sx={{ color: "success.main" }}>
                      -
                      {formatCurrency(
                        proposal.artistAdjustments.acceptedDiscount
                      )}
                    </TableCell>
                  </TableRow>
                )}
                <TableRow>
                  <TableCell sx={{ fontWeight: "bold" }}>
                    Total Amount
                  </TableCell>
                  <TableCell
                    align="right"
                    sx={{ fontWeight: "bold", fontSize: "1.1rem" }}
                  >
                    {formatCurrency(proposal.calculatedPrice.total)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </AccordionDetails>
        </Accordion>

        {/* Reference Images Accordion */}
        {proposal.referenceImages && proposal.referenceImages.length > 0 && (
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle1">
                Reference Images ({proposal.referenceImages.length})
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                {proposal.referenceImages.map((imgUrl, index) => (
                  <Grid item xs={12} sm={6} md={4} key={index}>
                    <Box
                      component="img"
                      src={imgUrl}
                      alt={`Reference ${index + 1}`}
                      sx={{
                        width: "100%",
                        height: "auto",
                        borderRadius: 1,
                        border: "1px solid",
                        borderColor: "divider",
                      }}
                    />
                  </Grid>
                ))}
              </Grid>
            </AccordionDetails>
          </Accordion>
        )}

        {/* Options Selected Accordion */}
        {(proposal.generalOptions || proposal.subjectOptions) && (
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle1">Selected Options</Typography>
            </AccordionSummary>
            <AccordionDetails>
              {/* General Options */}
              {proposal.generalOptions && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    General Options
                  </Typography>

                  {/* Option Groups */}
                  {proposal.generalOptions.optionGroups &&
                    proposal.generalOptions.optionGroups.length > 0 && (
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                          Option Groups
                        </Typography>
                        <Table size="small">
                          <TableBody>
                            {proposal.generalOptions.optionGroups.map(
                              (group) => (
                                <TableRow key={group.id}>
                                  <TableCell>{`Group #${group.groupId}`}</TableCell>
                                  <TableCell>
                                    {group.selectedSelectionLabel}
                                  </TableCell>
                                  <TableCell align="right">
                                    {formatCurrency(group.price)}
                                  </TableCell>
                                </TableRow>
                              )
                            )}
                          </TableBody>
                        </Table>
                      </Box>
                    )}

                  {/* Add-ons */}
                  {proposal.generalOptions.addons &&
                    proposal.generalOptions.addons.length > 0 && (
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                          Add-ons
                        </Typography>
                        <Table size="small">
                          <TableBody>
                            {proposal.generalOptions.addons.map((addon) => (
                              <TableRow key={addon.id}>
                                <TableCell>{`Add-on #${addon.addonId}`}</TableCell>
                                <TableCell align="right">
                                  {formatCurrency(addon.price)}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </Box>
                    )}

                  {/* Answers */}
                  {proposal.generalOptions.answers &&
                    proposal.generalOptions.answers.length > 0 && (
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Additional Information
                        </Typography>
                        {proposal.generalOptions.answers.map((item) => (
                          <Box key={item.id} sx={{ mb: 1 }}>
                            <Typography
                              variant="body2"
                              fontWeight="bold"
                            >{`Question #${item.questionId}`}</Typography>
                            <Typography variant="body2">
                              {item.answer}
                            </Typography>
                          </Box>
                        ))}
                      </Box>
                    )}
                </Box>
              )}

              {/* Subject Options */}
              {proposal.subjectOptions &&
                proposal.subjectOptions.length > 0 && (
                  <Box>
                    <Typography variant="subtitle2" gutterBottom>
                      Subject Options
                    </Typography>

                    {proposal.subjectOptions.map((subject) => (
                      <Box key={subject.subjectId} sx={{ mb: 3 }}>
                        <Typography variant="body1" fontWeight="bold">
                          Subject #{subject.subjectId} (
                          {subject.instances.length} instances)
                        </Typography>

                        {subject.instances.map((instance, idx) => (
                          <Box
                            key={instance.id}
                            sx={{
                              mt: 1,
                              mb: 2,
                              p: 2,
                              border: "1px solid",
                              borderColor: "divider",
                              borderRadius: 1,
                            }}
                          >
                            <Typography variant="body2" color="text.secondary">
                              Instance #{idx + 1}
                            </Typography>

                            {/* Option Groups */}
                            {instance.optionGroups &&
                              instance.optionGroups.length > 0 && (
                                <Box sx={{ my: 1 }}>
                                  <Typography
                                    variant="body2"
                                    color="text.secondary"
                                  >
                                    Options:
                                  </Typography>
                                  <Table size="small">
                                    <TableBody>
                                      {instance.optionGroups.map((group) => (
                                        <TableRow key={group.id}>
                                          <TableCell>{`Group #${group.groupId}`}</TableCell>
                                          <TableCell>
                                            {group.selectedSelectionLabel}
                                          </TableCell>
                                          <TableCell align="right">
                                            {formatCurrency(group.price)}
                                          </TableCell>
                                        </TableRow>
                                      ))}
                                    </TableBody>
                                  </Table>
                                </Box>
                              )}

                            {/* Add-ons */}
                            {instance.addons && instance.addons.length > 0 && (
                              <Box sx={{ my: 1 }}>
                                <Typography
                                  variant="body2"
                                  color="text.secondary"
                                >
                                  Add-ons:
                                </Typography>
                                <Table size="small">
                                  <TableBody>
                                    {instance.addons.map((addon) => (
                                      <TableRow key={addon.id}>
                                        <TableCell>{`Add-on #${addon.addonId}`}</TableCell>
                                        <TableCell align="right">
                                          {formatCurrency(addon.price)}
                                        </TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </Box>
                            )}

                            {/* Answers */}
                            {instance.answers &&
                              instance.answers.length > 0 && (
                                <Box sx={{ mt: 1 }}>
                                  <Typography
                                    variant="body2"
                                    color="text.secondary"
                                  >
                                    Details:
                                  </Typography>
                                  {instance.answers.map((item) => (
                                    <Box key={item.id} sx={{ ml: 2, mb: 1 }}>
                                      <Typography
                                        variant="body2"
                                        fontWeight="bold"
                                      >
                                        {`Question #${item.questionId}`}
                                      </Typography>
                                      <Typography variant="body2">
                                        {item.answer}
                                      </Typography>
                                    </Box>
                                  ))}
                                </Box>
                              )}
                          </Box>
                        ))}
                      </Box>
                    ))}
                  </Box>
                )}
            </AccordionDetails>
          </Accordion>
        )}

        {/* Rejection Reason (if applicable) */}
        {proposal.rejectionReason && (
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle1" sx={{ color: "error.main" }}>
                Rejection Reason
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Paper
                sx={{
                  backgroundColor: "error.light",
                  color: "error.contrastText",
                  p: 2,
                  borderRadius: 1,
                }}
              >
                <Typography variant="body2">
                  {proposal.rejectionReason}
                </Typography>
              </Paper>
            </AccordionDetails>
          </Accordion>
        )}
      </Box>

      <Snackbar
        open={success}
        message="Response submitted successfully!"
        autoHideDuration={2000}
        onClose={() => setSuccess(false)}
      />
    </Box>
  );
}

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
        acceptProposal: decision.acceptProposal,
        surcharge: decision.surcharge,
        discount: decision.discount,
        rejectionReason: decision.rejectionReason,
      });

      setSuccess(true);
      // Redirect after showing success message
      setTimeout(() => {
        router.push(`/${username}/dashboard/proposals`);
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to submit response");
    } finally {
      setLoading(false);
    }
  };

  const handleClientSubmit = async (decision: {
    acceptAdjustments?: boolean;
    cancel?: boolean;
  }) => {
    setLoading(true);
    setError(null);

    try {
      await axiosClient.patch(`/api/proposal/${proposal._id}/respond`, {
        role: "client",
        acceptAdjustments: decision.acceptAdjustments,
        cancel: decision.cancel,
      });

      setSuccess(true);
      // Redirect after showing success message
      setTimeout(() => {
        router.push(`/${username}/dashboard/proposals`);
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to submit response");
    } finally {
      setLoading(false);
    }
  };

  const renderStatus = () => {
    let statusText = "";
    let statusColor = "";

    switch (proposal.status) {
      case "pendingArtist":
        statusText = "Pending Artist Response";
        statusColor = "warning.main";
        break;
      case "pendingClient":
        statusText = "Pending Client Response";
        statusColor = "warning.main";
        break;
      case "accepted":
        statusText = "Accepted";
        statusColor = "success.main";
        break;
      case "rejectedArtist":
        statusText = "Rejected by Artist";
        statusColor = "error.main";
        break;
      case "rejectedClient":
        statusText = "Rejected by Client";
        statusColor = "error.main";
        break;
      case "expired":
        statusText = "Expired";
        statusColor = "text.disabled";
        break;
      default:
        statusText = "Unknown";
        statusColor = "text.disabled";
    }

    return (
      <Typography
        variant="subtitle1"
        sx={{ color: statusColor, fontWeight: "bold" }}
      >
        Status: {statusText}
      </Typography>
    );
  };

  // Check if the user should be able to respond based on role and status
  const canArtistRespond =
    role === "artist" &&
    (proposal.status === "pendingArtist" ||
      proposal.status === "rejectedClient");

  const canClientRespond =
    role === "client" &&
    (proposal.status === "pendingClient" ||
      proposal.status === "accepted" || // Added accepted status
      // Client can always cancel
      ["pendingArtist"].includes(proposal.status));

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
            : "Waiting for the other party to respond."}
        </Alert>
      )}

      {/* Cancel Proposal Button (for clients, available at any status) */}
      {role === "client" &&
        !["expired", "rejectedArtist", "rejectedClient"].includes(
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

      {/* Proposal Details Section in Accordions */}
      <Box sx={{ mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          Proposal Details
        </Typography>

        {/* Status Bar */}
        <Box sx={{ mb: 3 }}>
          {renderStatus()}
          <Typography variant="body2" color="text.secondary">
            Created: {new Date(proposal.createdAt).toLocaleDateString()}
          </Typography>
          {proposal.expiresAt && (
            <Typography variant="body2" color="warning.main">
              Expires: {new Date(proposal.expiresAt).toLocaleDateString()}
            </Typography>
          )}
        </Box>

        {/* Rest of the component remains largely the same */}
        {/* Proposal Details Section in Accordions */}
        <Box sx={{ mt: 3 }}>
          <Typography variant="h6" gutterBottom>
            Proposal Details
          </Typography>

          {/* Status Bar */}
          <Box sx={{ mb: 3 }}>
            {renderStatus()}
            <Typography variant="body2" color="text.secondary">
              Created: {new Date(proposal.createdAt).toLocaleDateString()}
            </Typography>
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
                  <Paper
                    sx={{
                      backgroundColor: "action.hover",
                      p: 2,
                      borderRadius: 1,
                    }}
                  >
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
              <Table>
                <TableBody>
                  <TableRow>
                    <TableCell>Base Price</TableCell>
                    <TableCell align="right">
                      IDR {proposal.calculatedPrice.base.toLocaleString()}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Option Groups</TableCell>
                    <TableCell align="right">
                      IDR{" "}
                      {proposal.calculatedPrice.optionGroups.toLocaleString()}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Add-ons</TableCell>
                    <TableCell align="right">
                      IDR {proposal.calculatedPrice.addons.toLocaleString()}
                    </TableCell>
                  </TableRow>
                  {proposal.calculatedPrice.rush > 0 && (
                    <TableRow>
                      <TableCell>Rush Fee</TableCell>
                      <TableCell align="right">
                        IDR {proposal.calculatedPrice.rush.toLocaleString()}
                      </TableCell>
                    </TableRow>
                  )}
                  {proposal.calculatedPrice.discount > 0 && (
                    <TableRow>
                      <TableCell>Discount</TableCell>
                      <TableCell align="right" sx={{ color: "success.main" }}>
                        -IDR{" "}
                        {proposal.calculatedPrice.discount.toLocaleString()}
                      </TableCell>
                    </TableRow>
                  )}
                  {proposal.artistAdjustments?.surcharge && (
                    <TableRow>
                      <TableCell>
                        Artist Surcharge
                      </TableCell>
                      <TableCell align="right" sx={{ color: "error.main" }}>
                        +IDR{" "}
                        {proposal.artistAdjustments.surcharge.toLocaleString()}
                      </TableCell>
                    </TableRow>
                  )}
                  {proposal.artistAdjustments?.discount && (
                    <TableRow>
                      <TableCell>
                        Artist Discount
                      </TableCell>
                      <TableCell align="right" sx={{ color: "success.main" }}>
                        -IDR{" "}
                        {proposal.artistAdjustments.discount.toLocaleString()}
                      </TableCell>
                    </TableRow>
                  )}
                  <TableRow>
                    <TableCell sx={{ fontWeight: "bold" }}>
                      Total Amount
                    </TableCell>
                    <TableCell
                      align="right"
                      sx={{ fontWeight: "bold", fontSize: "1.2rem" }}
                    >
                      IDR {proposal.calculatedPrice.total.toLocaleString()}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </AccordionDetails>
          </Accordion>

          {/* Reference Images Accordion (if any) */}
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
                    {proposal.generalOptions.optionGroups &&
                      Object.keys(proposal.generalOptions.optionGroups).length >
                        0 && (
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="body2" color="text.secondary">
                            Option Groups
                          </Typography>
                          <Table size="small">
                            <TableBody>
                              {Object.entries(
                                proposal.generalOptions.optionGroups
                              ).map(([key, value]) => (
                                <TableRow key={key}>
                                  <TableCell>{key}</TableCell>
                                  <TableCell>{value.selectedLabel}</TableCell>
                                  <TableCell align="right">
                                    IDR {value.price.toLocaleString()}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </Box>
                      )}

                    {proposal.generalOptions.addons &&
                      Object.keys(proposal.generalOptions.addons).length >
                        0 && (
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="body2" color="text.secondary">
                            Add-ons
                          </Typography>
                          <Table size="small">
                            <TableBody>
                              {Object.entries(
                                proposal.generalOptions.addons
                              ).map(([key, value]) => (
                                <TableRow key={key}>
                                  <TableCell>{key}</TableCell>
                                  <TableCell align="right">
                                    IDR {value.toLocaleString()}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </Box>
                      )}

                    {proposal.generalOptions.answers &&
                      Object.keys(proposal.generalOptions.answers).length >
                        0 && (
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            Additional Information
                          </Typography>
                          {Object.entries(proposal.generalOptions.answers).map(
                            ([question, answer]) => (
                              <Box key={question} sx={{ mb: 1 }}>
                                <Typography variant="body2" fontWeight="bold">
                                  {question}
                                </Typography>
                                <Typography variant="body2">
                                  {answer}
                                </Typography>
                              </Box>
                            )
                          )}
                        </Box>
                      )}
                  </Box>
                )}

                {/* Subject Options */}
                {proposal.subjectOptions &&
                  Object.keys(proposal.subjectOptions).length > 0 && (
                    <Box>
                      <Typography variant="subtitle2" gutterBottom>
                        Subject Options
                      </Typography>
                      {Object.entries(proposal.subjectOptions).map(
                        ([subjectTitle, subjectData]) => (
                          <Box key={subjectTitle} sx={{ mb: 3 }}>
                            <Typography variant="body1" fontWeight="bold">
                              {subjectTitle} ({subjectData.instances.length})
                            </Typography>

                            {subjectData.instances.map((instance, idx) => (
                              <Box
                                key={idx}
                                sx={{
                                  mt: 1,
                                  mb: 2,
                                  p: 2,
                                  border: "1px solid",
                                  borderColor: "divider",
                                  borderRadius: 1,
                                }}
                              >
                                <Typography
                                  variant="body2"
                                  color="text.secondary"
                                >
                                  Instance #{idx + 1}
                                </Typography>

                                {instance.optionGroups &&
                                  Object.keys(instance.optionGroups).length >
                                    0 && (
                                    <Box sx={{ my: 1 }}>
                                      <Typography
                                        variant="body2"
                                        color="text.secondary"
                                      >
                                        Options:
                                      </Typography>
                                      <Table size="small">
                                        <TableBody>
                                          {Object.entries(
                                            instance.optionGroups
                                          ).map(([key, value]) => (
                                            <TableRow key={key}>
                                              <TableCell>{key}</TableCell>
                                              <TableCell>
                                                {value.selectedLabel}
                                              </TableCell>
                                              <TableCell align="right">
                                                IDR{" "}
                                                {value.price.toLocaleString()}
                                              </TableCell>
                                            </TableRow>
                                          ))}
                                        </TableBody>
                                      </Table>
                                    </Box>
                                  )}

                                {instance.addons &&
                                  Object.keys(instance.addons).length > 0 && (
                                    <Box sx={{ my: 1 }}>
                                      <Typography
                                        variant="body2"
                                        color="text.secondary"
                                      >
                                        Add-ons:
                                      </Typography>
                                      <Table size="small">
                                        <TableBody>
                                          {Object.entries(instance.addons).map(
                                            ([key, value]) => (
                                              <TableRow key={key}>
                                                <TableCell>{key}</TableCell>
                                                <TableCell align="right">
                                                  IDR {value.toLocaleString()}
                                                </TableCell>
                                              </TableRow>
                                            )
                                          )}
                                        </TableBody>
                                      </Table>
                                    </Box>
                                  )}

                                {instance.answers &&
                                  Object.keys(instance.answers).length > 0 && (
                                    <Box sx={{ mt: 1 }}>
                                      <Typography
                                        variant="body2"
                                        color="text.secondary"
                                      >
                                        Details:
                                      </Typography>
                                      {Object.entries(instance.answers).map(
                                        ([question, answer]) => (
                                          <Box
                                            key={question}
                                            sx={{ ml: 2, mb: 1 }}
                                          >
                                            <Typography
                                              variant="body2"
                                              fontWeight="bold"
                                            >
                                              {question}
                                            </Typography>
                                            <Typography variant="body2">
                                              {answer}
                                            </Typography>
                                          </Box>
                                        )
                                      )}
                                    </Box>
                                  )}
                              </Box>
                            ))}
                          </Box>
                        )
                      )}
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

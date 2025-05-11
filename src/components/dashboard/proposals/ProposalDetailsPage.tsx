"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Alert,
  Snackbar,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  Divider,
  Grid,
  Stepper,
  Step,
  StepLabel,
  Link,
  CircularProgress,
  Card,
  CardContent,
  CardMedia,
  IconButton,
  Tooltip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineContent,
  TimelineDot,
  TimelineConnector,
} from "@mui/lab";
import {
  ExpandMore as ExpandMoreIcon,
  AccessTime as AccessTimeIcon,
  AttachMoney as AttachMoneyIcon,
  Description as DescriptionIcon,
  Image as ImageIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  ArrowBack as ArrowBackIcon,
  CalendarToday as CalendarTodayIcon,
  Info as InfoIcon,
  Person as PersonIcon,
  MessageOutlined as MessageOutlinedIcon,
  Edit as EditIcon,
} from "@mui/icons-material";
import { axiosClient } from "@/lib/utils/axiosClient";
import { IProposal } from "@/lib/db/models/proposal.model";
import ArtistRespondForm from "./ArtistRespondForm";
import ClientRespondForm from "./ClientRespondForm";
import CommissionDetails from "./CommissionDetailsPage";
import {
  IAddon,
  IOptionGroup,
  IQuestion,
} from "@/lib/db/models/commissionListing.model";

interface ContractDetailsPageProps {
  username: string;
  role: "artist" | "client";
  proposal: IProposal;
}

export default function ProposalDetailsPage({
  username,
  role,
  proposal,
  otherPartyInfo,
}: ContractDetailsPageProps & {
  otherPartyInfo?: { username: string; avatarUrl: string };
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | false>(
    "basicInfo"
  );
  const [enlargedImage, setEnlargedImage] = useState<string | null>(null);

  // Handle section expansion
  const handleSectionToggle =
    (section: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
      setExpandedSection(isExpanded ? section : false);
    };

  // Status display mapping
  const statusMap = {
    pendingArtist: {
      text: "Pending Artist Response",
      color: "warning.main",
      icon: <AccessTimeIcon />,
      description: "The artist needs to review and respond to this proposal.",
    },
    pendingClient: {
      text: "Pending Client Response",
      color: "warning.main",
      icon: <AccessTimeIcon />,
      description: "The client needs to review the artist's adjustments.",
    },
    accepted: {
      text: "Accepted",
      color: "success.main",
      icon: <CheckCircleIcon />,
      description: "Both parties have agreed to the terms of this contract.",
    },
    rejectedArtist: {
      text: "Rejected by Artist",
      color: "error.main",
      icon: <CancelIcon />,
      description: "The artist has declined this commission proposal.",
    },
    rejectedClient: {
      text: "Rejected by Client",
      color: "error.main",
      icon: <CancelIcon />,
      description: "The client has rejected the artist's proposed adjustments.",
    },
    expired: {
      text: "Expired",
      color: "text.disabled",
      icon: <AccessTimeIcon />,
      description: "This proposal has expired without receiving a response.",
    },
    paid: {
      text: "Paid",
      color: "success.dark",
      icon: <AttachMoneyIcon />,
      description: "Payment has been received for this commission.",
    },
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

  // Determine if user can edit the proposal
  const canEditProposal =
    role === "client" &&
    !["rejectedArtist", "expired", "accepted", "paid"].includes(
      proposal.status
    );

  // Format currency helper
  const formatCurrency = (amount: number) => `IDR ${amount.toLocaleString()}`;

  // Format date helper with time
  const formatDate = (dateInput: string | Date) => {
    const date =
      typeof dateInput === "string" ? new Date(dateInput) : dateInput;
    return date.toLocaleString("id-ID", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Format date helper without time
  const formatDateNoTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("id-ID", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Calculate days remaining until deadline
  const calculateDaysRemaining = (deadline: string) => {
    const deadlineDate = new Date(deadline);
    const today = new Date();
    const diffTime = deadlineDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysRemaining = calculateDaysRemaining(
    new Date(proposal.deadline).toISOString()
  );

  // Get contract timeline steps
  const getTimelineSteps = () => {
    const steps = [
      {
        label: "Proposal Created",
        date: formatDate(proposal.createdAt),
        completed: true,
        icon: <DescriptionIcon />,
      },
      {
        label: "Artist Response",
        date:
          proposal.updatedAt !== proposal.createdAt
            ? formatDate(proposal.updatedAt)
            : "Pending",
        completed: proposal.status !== "pendingArtist",
        icon:
          proposal.status === "rejectedArtist" ? (
            <CancelIcon color="error" />
          ) : (
            <CheckCircleIcon
              color={
                proposal.status !== "pendingArtist" ? "success" : "disabled"
              }
            />
          ),
      },
      {
        label: "Client Confirmation",
        date:
          proposal.status === "pendingClient"
            ? "Pending"
            : proposal.artistAdjustments?.acceptedDate
            ? formatDate(proposal.artistAdjustments.acceptedDate)
            : "N/A",
        completed: ["accepted", "paid"].includes(proposal.status),
        icon: (
          <CheckCircleIcon
            color={
              ["accepted", "paid"].includes(proposal.status)
                ? "success"
                : "disabled"
            }
          />
        ),
      },
      {
        label: "Payment",
        date: proposal.status === "paid" ? "Completed" : "Pending",
        completed: proposal.status === "paid",
        icon: (
          <AttachMoneyIcon
            color={proposal.status === "paid" ? "success" : "disabled"}
          />
        ),
      },
    ];

    return steps;
  };

  // Helper to find option group, selection, or addon details from the listing snapshot
  const findOptionDetails = (type: string, id: number) => {
    if (type === "group") {
      return proposal.listingSnapshot.generalOptions?.optionGroups?.find(
        (group) => group.id === id
      );
    } else if (type === "addon") {
      return proposal.listingSnapshot.generalOptions?.addons?.find(
        (addon) => addon.id === id
      );
    } else if (type === "question") {
      return proposal.listingSnapshot.generalOptions?.questions?.find(
        (question) => question.id === id
      );
    }
    return null;
  };

  // Helper to find subject option details from the listing snapshot
  const findSubjectDetails = (subjectId: number) => {
    return proposal.listingSnapshot.subjectOptions?.find(
      (subject) => subject.id === subjectId
    );
  };

  // Helper to find subject option group, selection, or addon details
  const findSubjectOptionDetails = (
    subjectId: number,
    type: string,
    id: number
  ) => {
    const subject = findSubjectDetails(subjectId);
    if (!subject) return null;

    if (type === "group") {
      return subject.optionGroups?.find((group) => group.id === id);
    } else if (type === "addon") {
      return subject.addons?.find((addon) => addon.id === id);
    } else if (type === "question") {
      return subject.questions?.find((question) => question.id === id);
    }
    return null;
  };

  // Helper to find selection details from a group
  const findSelectionDetails = (groupDetails: any, selectionId: number) => {
    if (!groupDetails || !groupDetails.selections) return null;
    return groupDetails.selections.find(
      (selection: any) => selection.id === selectionId
    );
  };

  // Render general options in a more intuitive way
  const renderGeneralOptions = () => {
    if (!proposal.generalOptions) {
      return <Typography>No options selected</Typography>;
    }

    return (
      <Card sx={{ mb: 3, overflow: "visible" }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: "bold" }}>
            General Options
          </Typography>

          {/* Option Groups */}
          {proposal.generalOptions.optionGroups &&
            proposal.generalOptions.optionGroups.length > 0 && (
              <Box sx={{ mb: 3 }}>
                <Typography
                  variant="subtitle1"
                  sx={{ mb: 1, fontWeight: "medium", color: "primary.main" }}
                >
                  Option Groups
                </Typography>
                <TableContainer
                  component={Paper}
                  variant="outlined"
                  sx={{ borderRadius: 1 }}
                >
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: "background.default" }}>
                        <TableCell>Option</TableCell>
                        <TableCell>Selection</TableCell>
                        <TableCell align="right">Price</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {proposal.generalOptions.optionGroups.map((option) => {
                        const groupDetails = findOptionDetails(
                          "group",
                          option.groupId
                        ) as IOptionGroup;
                        const selectionDetails = groupDetails
                          ? findSelectionDetails(
                              groupDetails,
                              option.selectedSelectionID
                            )
                          : null;

                        return (
                          <TableRow key={option.id}>
                            <TableCell>
                              {groupDetails?.title ||
                                `Option Group ${option.groupId}`}
                            </TableCell>
                            <TableCell>
                              {option.selectedSelectionLabel}
                            </TableCell>
                            <TableCell align="right">
                              {formatCurrency(option.price)}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}

          {/* Add-ons */}
          {proposal.generalOptions.addons &&
            proposal.generalOptions.addons.length > 0 && (
              <Box sx={{ mb: 3 }}>
                <Typography
                  variant="subtitle1"
                  sx={{ mb: 1, fontWeight: "medium", color: "primary.main" }}
                >
                  Add-ons
                </Typography>
                <TableContainer
                  component={Paper}
                  variant="outlined"
                  sx={{ borderRadius: 1 }}
                >
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: "background.default" }}>
                        <TableCell>Add-on</TableCell>
                        <TableCell align="right">Price</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {proposal.generalOptions.addons.map((addon) => {
                        const addonDetails = findOptionDetails(
                          "addon",
                          addon.addonId
                        ) as IAddon;

                        return (
                          <TableRow key={addon.id}>
                            <TableCell>
                              {addonDetails?.label || `Add-on ${addon.addonId}`}
                            </TableCell>
                            <TableCell align="right">
                              {formatCurrency(addon.price)}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}

          {/* Answers */}
          {proposal.generalOptions.answers &&
            proposal.generalOptions.answers.length > 0 && (
              <Box>
                <Typography
                  variant="subtitle1"
                  sx={{ mb: 1, fontWeight: "medium", color: "primary.main" }}
                >
                  Client Responses
                </Typography>
                {proposal.generalOptions.answers.map((answer) => {
                  const questionDetails = findOptionDetails(
                    "question",
                    answer.questionId
                  ) as IQuestion;

                  return (
                    <Box
                      key={answer.id}
                      sx={{
                        mb: 2,
                        bgcolor: "background.default",
                        p: 2,
                        borderRadius: 1,
                      }}
                    >
                      <Typography
                        variant="subtitle2"
                        color="text.secondary"
                        gutterBottom
                      >
                        {questionDetails?.text ||
                          `Question ${answer.questionId}`}
                      </Typography>
                      <Typography variant="body1">{answer.answer}</Typography>
                    </Box>
                  );
                })}
              </Box>
            )}
        </CardContent>
      </Card>
    );
  };

  // Render subject options in a more intuitive way
  const renderSubjectOptions = () => {
    if (!proposal.subjectOptions || proposal.subjectOptions.length === 0) {
      return (
        <Typography variant="body2">No subject options selected</Typography>
      );
    }

    return proposal.subjectOptions.map((subject) => {
      const subjectDetails = findSubjectDetails(subject.subjectId);

      return (
        <Card key={subject.subjectId} sx={{ mb: 3, overflow: "visible" }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: "bold" }}>
              {subjectDetails?.title || `Subject ${subject.subjectId}`}
            </Typography>

            {subject.instances.map((instance) => (
              <Box
                key={instance.id}
                sx={{
                  mb: 3,
                  pl: 2,
                  borderLeft: "2px solid",
                  borderColor: "primary.light",
                }}
              >
                <Typography
                  variant="subtitle1"
                  sx={{ mb: 2, fontWeight: "medium" }}
                >
                  Instance {instance.id}
                </Typography>

                {/* Instance Option Groups */}
                {instance.optionGroups && instance.optionGroups.length > 0 && (
                  <Box sx={{ mb: 3 }}>
                    <Typography
                      variant="subtitle2"
                      sx={{ mb: 1, color: "primary.main" }}
                    >
                      Options
                    </Typography>
                    <TableContainer
                      component={Paper}
                      variant="outlined"
                      sx={{ borderRadius: 1 }}
                    >
                      <Table size="small">
                        <TableHead>
                          <TableRow sx={{ bgcolor: "background.default" }}>
                            <TableCell>Option</TableCell>
                            <TableCell>Selection</TableCell>
                            <TableCell align="right">Price</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {instance.optionGroups.map((option) => {
                            const groupDetails = findSubjectOptionDetails(
                              subject.subjectId,
                              "group",
                              option.groupId
                            ) as IOptionGroup;
                            const selectionDetails = groupDetails
                              ? findSelectionDetails(
                                  groupDetails,
                                  option.selectedSelectionID
                                )
                              : null;

                            return (
                              <TableRow key={option.id}>
                                <TableCell>
                                  {groupDetails?.title ||
                                    `Option ${option.groupId}`}
                                </TableCell>
                                <TableCell>
                                  {option.selectedSelectionLabel}
                                </TableCell>
                                <TableCell align="right">
                                  {formatCurrency(option.price)}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Box>
                )}

                {/* Instance Add-ons */}
                {instance.addons && instance.addons.length > 0 && (
                  <Box sx={{ mb: 3 }}>
                    <Typography
                      variant="subtitle2"
                      sx={{ mb: 1, color: "primary.main" }}
                    >
                      Add-ons
                    </Typography>
                    <TableContainer
                      component={Paper}
                      variant="outlined"
                      sx={{ borderRadius: 1 }}
                    >
                      <Table size="small">
                        <TableHead>
                          <TableRow sx={{ bgcolor: "background.default" }}>
                            <TableCell>Add-on</TableCell>
                            <TableCell align="right">Price</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {instance.addons.map((addon) => {
                            const addonDetails = findSubjectOptionDetails(
                              subject.subjectId,
                              "addon",
                              addon.addonId
                            ) as IAddon;

                            return (
                              <TableRow key={addon.id}>
                                <TableCell>
                                  {addonDetails?.label ||
                                    `Add-on ${addon.addonId}`}
                                </TableCell>
                                <TableCell align="right">
                                  {formatCurrency(addon.price)}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Box>
                )}

                {/* Instance Answers */}
                {instance.answers && instance.answers.length > 0 && (
                  <Box>
                    <Typography
                      variant="subtitle2"
                      sx={{ mb: 1, color: "primary.main" }}
                    >
                      Client Responses
                    </Typography>
                    {instance.answers.map((answer) => {
                      const questionDetails = findSubjectOptionDetails(
                        subject.subjectId,
                        "question",
                        answer.questionId
                      ) as IQuestion;

                      return (
                        <Box
                          key={answer.id}
                          sx={{
                            mb: 2,
                            bgcolor: "background.default",
                            p: 2,
                            borderRadius: 1,
                          }}
                        >
                          <Typography
                            variant="subtitle2"
                            color="text.secondary"
                            gutterBottom
                          >
                            {questionDetails?.text ||
                              `Question ${answer.questionId}`}
                          </Typography>
                          <Typography variant="body1">
                            {answer.answer}
                          </Typography>
                        </Box>
                      );
                    })}
                  </Box>
                )}
              </Box>
            ))}
          </CardContent>
        </Card>
      );
    });
  };

  return (
    <Box sx={{ maxWidth: 1200, mx: "auto", px: 2, py: 4 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Back button and header */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          mb: 3,
          justifyContent: "space-between",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <IconButton
            onClick={() => router.push(`/${username}/dashboard/proposals`)}
            sx={{ mr: 2 }}
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h4" fontWeight="bold">
            Commission Contract
          </Typography>
        </Box>

        {/* Edit button */}
        {canEditProposal && (
          <Button
            variant="outlined"
            color="primary"
            startIcon={<EditIcon />}
            onClick={() =>
              router.push(
                `/${username}/dashboard/proposals/${proposal._id}/edit`
              )
            }
            sx={{ borderRadius: 2 }}
          >
            Edit Proposal
          </Button>
        )}
      </Box>

      {/* Status card */}
      <Paper
        elevation={3}
        sx={{
          p: 3,
          mb: 4,
          bgcolor: "background.paper",
          borderRadius: 2,
          position: "relative",
          overflow: "hidden",
          borderLeft: 5,
          borderColor: proposal.status.includes("reject")
            ? "error.main"
            : proposal.status === "accepted" || proposal.status === "paid"
            ? "success.main"
            : "warning.main",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
          {statusMap[proposal.status]?.icon}
          <Typography variant="h5" fontWeight="medium" sx={{ ml: 1 }}>
            {statusMap[proposal.status]?.text || "Unknown Status"}
          </Typography>
          <Chip
            label={statusMap[proposal.status]?.text || "Unknown"}
            color={
              proposal.status.includes("reject")
                ? "error"
                : proposal.status === "accepted" || proposal.status === "paid"
                ? "success"
                : "warning"
            }
            sx={{ ml: "auto", fontWeight: "medium", px: 1 }}
          />
        </Box>

        <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
          {statusMap[proposal.status]?.description}
        </Typography>

        <Divider sx={{ my: 2 }} />

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <DescriptionIcon
                fontSize="small"
                color="primary"
                sx={{ mr: 1 }}
              />
              <Typography variant="body2" color="text.secondary">
                Project
              </Typography>
            </Box>
            <Typography
              variant="body1"
              sx={{ fontWeight: "medium", ml: 4, mb: 2 }}
            >
              {proposal.listingSnapshot.title}
            </Typography>
          </Grid>

          <Grid item xs={12} md={6}>
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <CalendarTodayIcon
                fontSize="small"
                color="primary"
                sx={{ mr: 1 }}
              />
              <Typography variant="body2" color="text.secondary">
                Deadline
              </Typography>
            </Box>
            <Typography
              variant="body1"
              sx={{
                fontWeight: "medium",
                ml: 4,
                mb: 2,
                color:
                  daysRemaining < 3
                    ? "error.main"
                    : daysRemaining < 7
                    ? "warning.main"
                    : "inherit",
              }}
            >
              {formatDate(new Date(proposal.deadline).toISOString())}
              {daysRemaining > 0
                ? ` (${daysRemaining} days left)`
                : " (Due today!)"}
            </Typography>
          </Grid>

          <Grid item xs={12} md={6}>
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <PersonIcon fontSize="small" color="primary" sx={{ mr: 1 }} />
              <Typography variant="body2" color="text.secondary">
                {role === "client" ? "Artist" : "Client"}
              </Typography>
            </Box>
            <Typography
              variant="body1"
              sx={{ fontWeight: "medium", ml: 4, mb: 2 }}
            >
              {role === "client"
                ? otherPartyInfo?.username || "Artist"
                : otherPartyInfo?.username || "Client"}
            </Typography>
          </Grid>

          <Grid item xs={12} md={6}>
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <AttachMoneyIcon
                fontSize="small"
                color="primary"
                sx={{ mr: 1 }}
              />
              <Typography variant="body2" color="text.secondary">
                Total Price
              </Typography>
            </Box>
            <Typography
              variant="body1"
              sx={{ fontWeight: "medium", ml: 4, mb: 2 }}
            >
              {formatCurrency(proposal.calculatedPrice.total)}
            </Typography>
          </Grid>
        </Grid>

        {/* Timeline for proposal progress */}
        <Box
          sx={{ mt: 3, pt: 2, borderTop: "1px dashed", borderColor: "divider" }}
        ></Box>
      </Paper>

      {/* Response Form Section */}
      {(canArtistRespond || canClientRespond) && (
        <Box sx={{ mb: 4 }}>
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
      )}

      {/* Status Message */}
      {!(canArtistRespond || canClientRespond) && (
        <Alert
          severity={
            proposal.status === "accepted"
              ? "success"
              : proposal.status === "rejectedArtist" ||
                proposal.status === "rejectedClient"
              ? "error"
              : proposal.status === "expired"
              ? "warning"
              : proposal.status === "paid"
              ? "success"
              : "info"
          }
          sx={{ mb: 4 }}
          icon={statusMap[proposal.status]?.icon}
        >
          <Typography variant="body1">
            {proposal.status === "accepted"
              ? "This proposal has been accepted. The artist will begin work according to the agreed timeline."
              : proposal.status === "rejectedArtist"
              ? "This proposal has been rejected by the artist. You may want to submit a new proposal with different requirements."
              : proposal.status === "rejectedClient"
              ? "You have rejected the artist's adjustments. The artist may propose new adjustments."
              : proposal.status === "expired"
              ? "This proposal has expired and can no longer be accepted."
              : proposal.status === "paid"
              ? "This proposal has been paid. The artist will now complete the work as agreed."
              : "Waiting for the other party to respond to this proposal."}
          </Typography>
        </Alert>
      )}

      {/* Cancel Proposal Button (for clients only) */}
      {role === "client" &&
        !["expired", "rejectedArtist", "rejectedClient", "paid"].includes(
          proposal.status
        ) &&
        !canClientRespond && (
          <Box sx={{ mb: 4, display: "flex", justifyContent: "flex-end" }}>
            <Button
              variant="outlined"
              color="error"
              onClick={() => handleClientSubmit({ cancel: true })}
              disabled={loading}
              startIcon={<CancelIcon />}
              sx={{ borderRadius: 2 }}
            >
              Cancel Proposal
            </Button>
          </Box>
        )}

      {/* Project Description */}
      <Paper
        elevation={2}
        sx={{
          p: 3,
          mb: 4,
          borderRadius: 2,
          bgcolor: "background.paper",
        }}
      >
        <Typography
          variant="h5"
          color="primary"
          sx={{ mb: 2, fontWeight: "medium" }}
        >
          Project Description
        </Typography>
        <Typography variant="body1" paragraph>
          {proposal.generalDescription}
        </Typography>
      </Paper>

      {/* Selected Options */}
      <Paper
        elevation={2}
        sx={{
          p: 3,
          mb: 4,
          borderRadius: 2,
          bgcolor: "background.paper",
        }}
      >
        <Typography
          variant="h5"
          color="primary"
          sx={{ mb: 3, fontWeight: "medium" }}
        >
          Selected Options
        </Typography>
        {renderGeneralOptions()}
        {renderSubjectOptions()}
      </Paper>

      {/* Commission Details */}
      <Accordion
        expanded={expandedSection === "listingDetails"}
        onChange={handleSectionToggle("listingDetails")}
        sx={{ mb: 2, borderRadius: "8px !important", overflow: "hidden" }}
      >
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          sx={{ bgcolor: "background.paper" }}
        >
          <Typography
            variant="h6"
            color="primary"
            sx={{ display: "flex", alignItems: "center" }}
          >
            <DescriptionIcon sx={{ mr: 1 }} /> Commission Listing Details
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <CommissionDetails listing={proposal.listingSnapshot} />
        </AccordionDetails>
      </Accordion>

      {/* Price Breakdown */}
      <Paper
        elevation={2}
        sx={{
          p: 3,
          mb: 4,
          borderRadius: 2,
          bgcolor: "background.paper",
        }}
      >
        <Typography
          variant="h5"
          color="primary"
          sx={{ mb: 3, fontWeight: "medium" }}
        >
          Price Breakdown
        </Typography>

        <TableContainer sx={{ mb: 3 }}>
          <Table>
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
                  <TableCell>
                    <Tooltip
                      title={`Rush fee for ${proposal.rush?.days} rushed days`}
                    >
                      <Box sx={{ display: "flex", alignItems: "center" }}>
                        Rush Fee{" "}
                        <InfoIcon
                          fontSize="small"
                          sx={{ ml: 1, color: "text.secondary" }}
                        />
                      </Box>
                    </Tooltip>
                  </TableCell>
                  <TableCell align="right" sx={{ color: "warning.main" }}>
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
              <TableRow
                sx={{
                  "& td": {
                    fontWeight: "bold",
                    py: 2,
                    borderTop: "1px solid rgba(224, 224, 224, 1)",
                    fontSize: "1.1rem",
                  },
                }}
              >
                <TableCell>Total Amount</TableCell>
                <TableCell align="right">
                  {formatCurrency(proposal.calculatedPrice.total)}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Rush Details if applicable */}
      {proposal.rush && (
        <Paper
          elevation={2}
          sx={{
            p: 3,
            mb: 4,
            borderRadius: 2,
            bgcolor: proposal.rush.fee ? "warning.lighter" : "background.paper",
            borderLeft: proposal.rush.fee ? 5 : 0,
            borderColor: "warning.main",
          }}
        >
          <Typography
            variant="h5"
            sx={{
              mb: 3,
              fontWeight: "medium",
              color: proposal.rush.fee ? "warning.dark" : "primary.main",
            }}
          >
            Rush Details
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={4}>
              <Typography variant="body2" color="text.secondary">
                Rush Days
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: "medium" }}>
                {proposal.rush.days < 0 ? 0 : proposal.rush.days}
              </Typography>
            </Grid>
            {proposal.rush.paidDays !== undefined && (
              <Grid item xs={12} sm={4}>
                <Typography variant="body2" color="text.secondary">
                  Paid Rush Days
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: "medium" }}>
                  {proposal.rush.paidDays}
                </Typography>
              </Grid>
            )}
            {proposal.rush.fee && (
              <Grid item xs={12} sm={4}>
                <Typography variant="body2" color="text.secondary">
                  Rush Fee
                </Typography>
                <Typography
                  variant="body1"
                  sx={{ fontWeight: "medium", color: "warning.dark" }}
                >
                  {formatCurrency(proposal.rush.fee)}
                </Typography>
              </Grid>
            )}
          </Grid>
        </Paper>
      )}

      {/* Reference Images */}
      {proposal.referenceImages && proposal.referenceImages.length > 0 && (
        <Paper
          elevation={2}
          sx={{
            p: 3,
            mb: 4,
            borderRadius: 2,
            bgcolor: "background.paper",
          }}
        >
          <Typography
            variant="h5"
            color="primary"
            sx={{ mb: 3, fontWeight: "medium" }}
          >
            Reference Images
          </Typography>
          <Grid container spacing={2}>
            {proposal.referenceImages.map((imgUrl, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <Card
                  sx={{
                    height: "100%",
                    cursor: "pointer",
                    transition: "transform 0.2s",
                    "&:hover": {
                      transform: "scale(1.02)",
                      boxShadow: 3,
                    },
                    borderRadius: 1,
                    overflow: "hidden",
                  }}
                  onClick={() => setEnlargedImage(imgUrl)}
                >
                  <CardMedia
                    component="img"
                    image={imgUrl}
                    alt={`Reference ${index + 1}`}
                    sx={{
                      height: 200,
                      objectFit: "cover",
                    }}
                  />
                  <CardContent sx={{ p: 1, bgcolor: "background.default" }}>
                    <Typography variant="caption" color="text.secondary">
                      Reference Image {index + 1}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {/* Image Modal */}
          {enlargedImage && (
            <Box
              sx={{
                position: "fixed",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                bgcolor: "rgba(0, 0, 0, 0.8)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 9999,
                p: 4,
              }}
              onClick={() => setEnlargedImage(null)}
            >
              <Box
                component="img"
                src={enlargedImage}
                alt="Enlarged reference"
                sx={{
                  maxWidth: "90%",
                  maxHeight: "90%",
                  objectFit: "contain",
                  borderRadius: 1,
                }}
              />
              <IconButton
                sx={{
                  position: "absolute",
                  top: 16,
                  right: 16,
                  color: "white",
                  bgcolor: "rgba(0, 0, 0, 0.3)",
                  "&:hover": {
                    bgcolor: "rgba(0, 0, 0, 0.5)",
                  },
                }}
                onClick={() => setEnlargedImage(null)}
              >
                <CancelIcon />
              </IconButton>
            </Box>
          )}
        </Paper>
      )}

      {/* Rejection Reason (if applicable) */}
      {proposal.rejectionReason && (
        <Paper
          elevation={2}
          sx={{
            p: 3,
            mb: 4,
            borderRadius: 2,
            bgcolor: "error.lighter",
            borderLeft: 5,
            borderColor: "error.main",
          }}
        >
          <Typography
            variant="h5"
            sx={{ mb: 3, fontWeight: "medium", color: "error.main" }}
          >
            Rejection Reason
          </Typography>
          <Typography variant="body1">{proposal.rejectionReason}</Typography>
        </Paper>
      )}

      {/* Action Buttons */}
      <Box
        sx={{ display: "flex", justifyContent: "space-between", mt: 4, mb: 2 }}
      >
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => router.push(`/${username}/dashboard/proposals`)}
          sx={{ borderRadius: 2 }}
        >
          Back to Proposals
        </Button>

        {proposal.status === "accepted" && (
          <Button
            variant="contained"
            color="primary"
            startIcon={<MessageOutlinedIcon />}
            onClick={() =>
              router.push(
                `/${username}/messages/${
                  role === "artist" ? proposal.clientId : proposal.artistId
                }`
              )
            }
            sx={{ borderRadius: 2 }}
          >
            Message {role === "artist" ? "Client" : "Artist"}
          </Button>
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

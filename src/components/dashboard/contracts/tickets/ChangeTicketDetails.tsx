// src/components/dashboard/contracts/tickets/ChangeTicketDetails.tsx
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
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Stack,
  Grid,
  Card,
  CardMedia,
  CardContent,
  IconButton,
  Tooltip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Tab,
  Tabs,
} from "@mui/material";
import { useRouter } from "next/navigation";
import { IContract } from "@/lib/db/models/contract.model";
import { IChangeTicket } from "@/lib/db/models/ticket.model";
import { axiosClient } from "@/lib/utils/axiosClient";
import {
  IOptionGroup,
  IAddon,
  IQuestion,
} from "@/lib/db/models/commissionListing.model";
import ThumbUpIcon from "@mui/icons-material/ThumbUp";
import ThumbDownIcon from "@mui/icons-material/ThumbDown";
import WarningIcon from "@mui/icons-material/Warning";
import ImageIcon from "@mui/icons-material/Image";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import HistoryIcon from "@mui/icons-material/History";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import InfoIcon from "@mui/icons-material/Info";
import PaymentIcon from "@mui/icons-material/Payment";
import CompareArrowsIcon from "@mui/icons-material/CompareArrows";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import DescriptionIcon from "@mui/icons-material/Description";
import QueryBuilderIcon from "@mui/icons-material/QueryBuilder";
import SyncAltIcon from "@mui/icons-material/SyncAlt";
import UniversalPaymentDialog from "@/components/UniversalPaymentDialog";

interface ChangeTicketDetailsProps {
  contract: IContract;
  ticket: IChangeTicket;
  userId: string;
  isArtist: boolean;
  isClient: boolean;
  username: string
}

export default function ChangeTicketDetails({
  contract,
  ticket,
  userId,
  isArtist,
  isClient,
  username
}: ChangeTicketDetailsProps) {
  const router = useRouter();
  const [response, setResponse] = useState<
    "accept" | "reject" | "propose" | ""
  >("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [proposedFee, setProposedFee] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showEscalateDialog, setShowEscalateDialog] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | false>(
    "description"
  );
  const [comparisonTab, setComparisonTab] = useState(0);

  // Format date for display
  const formatDate = (date?: string | Date) => {
    if (!date) return "N/A";
    const parsedDate = typeof date === "string" ? new Date(date) : date;
    return parsedDate.toLocaleString();
  };

  // Format price for display
  const formatPrice = (amount?: number) => {
    if (amount === undefined) return "N/A";
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Handle section expansion
  const handleSectionToggle =
    (section: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
      setExpandedSection(isExpanded ? section : false);
    };

  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setComparisonTab(newValue);
  };

  // Calculate time remaining until expiry
  const calculateTimeRemaining = () => {
    if (!ticket.expiresAt) return null;

    const expiryDate = new Date(ticket.expiresAt);
    const now = new Date();
    const diffMs = expiryDate.getTime() - now.getTime();

    if (diffMs <= 0) return "Expired";

    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (diffHrs > 24) {
      const days = Math.floor(diffHrs / 24);
      return `${days} day${days > 1 ? "s" : ""} remaining`;
    }

    return `${diffHrs}h ${diffMins}m remaining`;
  };

  // Determine if this is a paid change
  const isPaidChange = (ticket.paidFee ?? 0) > 0;

  // Determine if user can respond to this ticket
  const canRespond = () => {
    // Artist can respond to pendingArtist tickets
    if (
      isArtist &&
      (ticket.status === "pendingArtist" ||
        ticket.status === "rejectedClient") &&
      !isPastExpiry
    )
      return true;

    // Client can respond to pendingClient tickets (when artist proposes a fee)
    if (isClient && ticket.status === "pendingClient" && !isPastExpiry)
      return true;

    return false;
  };

  // Determine if client can pay for this change
  const canPay = () => {
    return (
      isClient &&
      ticket.status === "pendingClient" &&
      isPaidChange &&
      !ticket.escrowTxnId
    );
  };

  // Handle response submission (for artist or client)
  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      // Validate input
      if (!response) {
        throw new Error("Please select a response option");
      }

      if (response === "reject" && !rejectionReason.trim()) {
        throw new Error("Please provide a reason for rejection");
      }

      if (response === "propose" && (proposedFee <= 0 || isNaN(proposedFee))) {
        throw new Error("Please provide a valid fee amount");
      }

      // Prepare request body
      const requestBody: any = {
        response,
      };

      if (response === "reject") {
        requestBody.reason = rejectionReason;
      } else if (response === "propose") {
        requestBody.paidFee = proposedFee;
      }

      // Submit to API using axios
      await axiosClient.post(
        `/api/contract/${contract._id}/tickets/change/${ticket._id}/respond`,
        requestBody
      );

      setSuccess(true);

      // Refresh the page after successful submission
      setTimeout(() => {
        router.refresh();
      }, 1000);
    } catch (err: any) {
      setError(
        err.response?.data?.error || err.message || "An unknown error occurred"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle payment submission (for client)
  const handlePayment = async (paymentData: any) => {
    setIsSubmitting(true);
    setError(null);

    try {
      // Submit payment to API using the universal payment data
      await axiosClient.post(
        `/api/contract/${contract._id}/tickets/change/${ticket._id}/pay`,
        paymentData
      );

      setSuccess(true);
      setShowPaymentDialog(false);

      // Refresh the page after successful payment
      setTimeout(() => {
        router.refresh();
      }, 1000);
    } catch (err: any) {
      setError(
        err.response?.data?.error || err.message || "An unknown error occurred"
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
      `/${username}/dashboard/contracts/${contract._id}/resolution/new?targetType=change&targetId=${ticket._id}`
    );
  };

  // Get status color based on status
  const getStatusColor = (status: string) => {
    switch (status) {
      case "pendingArtist":
        return "primary";
      case "pendingClient":
        return "primary";
      case "acceptedArtist":
        return "success";
      case "forcedAcceptedClient":
      case "forcedAcceptedArtist":
        return "warning";
      case "paid":
        return "success";
      case "rejectedArtist":
      case "rejectedClient":
        return "error";
      case "cancelled":
        return "default";
      default:
        return "default";
    }
  };

  // Get readable status
  const getReadableStatus = (status: string) => {
    switch (status) {
      case "pendingArtist":
        return "Pending Artist Review";
      case "pendingClient":
        return "Pending Client Payment";
      case "acceptedArtist":
        return "Accepted by Artist";
      case "rejectedArtist":
        return "Rejected by Artist";
      case "rejectedClient":
        return "Rejected by Client";
      case "forcedAcceptedClient":
        return "Forced Accept (Client)";
      case "forcedAcceptedArtist":
        return "Forced Accept (Artist)";
      case "paid":
        return "Paid & Applied";
      case "cancelled":
        return "Cancelled";
      default:
        return status;
    }
  };

  // Check if ticket is past expiration
  const isPastExpiry =
    ticket.expiresAt && new Date(ticket.expiresAt) < new Date();

  // Check if approaching expiry (less than 12 hours remaining)
  const isApproachingExpiry = () => {
    if (!ticket.expiresAt) return false;

    const expiryDate = new Date(ticket.expiresAt);
    const now = new Date();
    const diffMs = expiryDate.getTime() - now.getTime();
    const diffHrs = diffMs / (1000 * 60 * 60);

    return diffHrs > 0 && diffHrs < 12;
  };

  // Get the current contract terms
  const currentContractTerms =
    contract.contractTerms[contract.contractTerms.length - 1];

  // Helper functions for option details
  const findOptionDetails = (options: any, type: string, id: number) => {
    if (!options) return null;

    if (type === "group") {
      return options.optionGroups?.find((group: any) => group.id === id);
    } else if (type === "addon") {
      return options.addons?.find((addon: any) => addon.id === id);
    } else if (type === "question") {
      return options.questions?.find((question: any) => question.id === id);
    }
    return null;
  };

  const findSelectionDetails = (groupDetails: any, selectionId: number) => {
    if (!groupDetails || !groupDetails.selections) return null;
    return groupDetails.selections.find(
      (selection: any) => selection.id === selectionId
    );
  };

  const findSubjectDetails = (options: any, subjectId: number) => {
    if (!options) return null;
    return options.find((subject: any) => subject.id === subjectId);
  };

  // Render general options comparison
  const renderGeneralOptionsComparison = () => {
    const oldGeneralOptions = currentContractTerms.generalOptions;
    const newGeneralOptions = ticket.changeSet.generalOptions;

    if (!oldGeneralOptions && !newGeneralOptions) {
      return <Typography>No general options to compare</Typography>;
    }

    return (
      <Box>
        <Tabs
          value={comparisonTab}
          onChange={handleTabChange}
          aria-label="options comparison tabs"
          sx={{ mb: 2, borderBottom: 1, borderColor: "divider" }}
        >
          <Tab
            icon={<DescriptionIcon fontSize="small" />}
            iconPosition="start"
            label="Current Options"
          />
          <Tab
            icon={<SyncAltIcon fontSize="small" />}
            iconPosition="start"
            label="Changed Options"
          />
        </Tabs>

        {comparisonTab === 0 && (
          <Box>
            <Typography
              variant="subtitle1"
              fontWeight="medium"
              color="primary.main"
              gutterBottom
            >
              Current General Options
            </Typography>
            {renderGeneralOptions(
              oldGeneralOptions,
              contract.proposalSnapshot.listingSnapshot.generalOptions
            )}
          </Box>
        )}

        {comparisonTab === 1 && (
          <Box>
            <Typography
              variant="subtitle1"
              fontWeight="medium"
              color="primary.main"
              gutterBottom
            >
              New General Options
            </Typography>
            {renderGeneralOptions(
              newGeneralOptions,
              contract.proposalSnapshot.listingSnapshot.generalOptions
            )}
          </Box>
        )}
      </Box>
    );
  };

  // Render subject options comparison
  const renderSubjectOptionsComparison = () => {
    const oldSubjectOptions = currentContractTerms.subjectOptions;
    const newSubjectOptions = ticket.changeSet.subjectOptions;

    if (!oldSubjectOptions && !newSubjectOptions) {
      return <Typography>No subject options to compare</Typography>;
    }

    return (
      <Box>
        <Tabs
          value={comparisonTab}
          onChange={handleTabChange}
          aria-label="options comparison tabs"
          sx={{ mb: 2, borderBottom: 1, borderColor: "divider" }}
        >
          <Tab
            icon={<DescriptionIcon fontSize="small" />}
            iconPosition="start"
            label="Current Options"
          />
          <Tab
            icon={<SyncAltIcon fontSize="small" />}
            iconPosition="start"
            label="Changed Options"
          />
        </Tabs>

        {comparisonTab === 0 && (
          <Box>
            <Typography
              variant="subtitle1"
              fontWeight="medium"
              color="primary.main"
              gutterBottom
            >
              Current Subject Options
            </Typography>
            {renderSubjectOptions(
              oldSubjectOptions,
              contract.proposalSnapshot.listingSnapshot.subjectOptions
            )}
          </Box>
        )}

        {comparisonTab === 1 && (
          <Box>
            <Typography
              variant="subtitle1"
              fontWeight="medium"
              color="primary.main"
              gutterBottom
            >
              New Subject Options
            </Typography>
            {renderSubjectOptions(
              newSubjectOptions,
              contract.proposalSnapshot.listingSnapshot.subjectOptions
            )}
          </Box>
        )}
      </Box>
    );
  };

  // Render general options helper
  const renderGeneralOptions = (generalOptions: any, listingOptions: any) => {
    if (!generalOptions) {
      return <Typography>No options selected</Typography>;
    }

    return (
      <Card sx={{ mb: 3, overflow: "visible" }}>
        <CardContent>
          {/* Option Groups */}
          {generalOptions.optionGroups &&
            generalOptions.optionGroups.length > 0 && (
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
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {generalOptions.optionGroups.map((option: any) => {
                        const groupDetails = findOptionDetails(
                          listingOptions,
                          "group",
                          option.groupId
                        ) as IOptionGroup;

                        return (
                          <TableRow key={option.id}>
                            <TableCell>
                              {groupDetails?.title ||
                                `Option Group ${option.groupId}`}
                            </TableCell>
                            <TableCell>
                              {option.selectedSelectionLabel}
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
          {generalOptions.addons && generalOptions.addons.length > 0 && (
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
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {generalOptions.addons.map((addon: any) => {
                      const addonDetails = findOptionDetails(
                        listingOptions,
                        "addon",
                        addon.addonId
                      ) as IAddon;

                      return (
                        <TableRow key={addon.id}>
                          <TableCell>
                            {addonDetails?.label || `Add-on ${addon.addonId}`}
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
          {generalOptions.answers && generalOptions.answers.length > 0 && (
            <Box>
              <Typography
                variant="subtitle1"
                sx={{ mb: 1, fontWeight: "medium", color: "primary.main" }}
              >
                Client Responses
              </Typography>
              {generalOptions.answers.map((answer: any) => {
                const questionDetails = findOptionDetails(
                  listingOptions,
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
                      {questionDetails?.text || `Question ${answer.questionId}`}
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

  // Render subject options helper
  const renderSubjectOptions = (
    subjectOptions: any,
    listingSubjectOptions: any
  ) => {
    if (!subjectOptions || subjectOptions.length === 0) {
      return (
        <Typography variant="body2">No subject options selected</Typography>
      );
    }

    return subjectOptions.map((subject: any) => {
      const subjectDetails = findSubjectDetails(
        listingSubjectOptions,
        subject.subjectId
      );

      return (
        <Card key={subject.subjectId} sx={{ mb: 3, overflow: "visible" }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: "bold" }}>
              {subjectDetails?.title || `Subject ${subject.subjectId}`}
            </Typography>

            {subject.instances.map((instance: any) => (
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
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {instance.optionGroups.map((option: any) => {
                            const groupDetails =
                              subjectDetails?.optionGroups?.find(
                                (group: any) => group.id === option.groupId
                              );

                            return (
                              <TableRow key={option.id}>
                                <TableCell>
                                  {groupDetails?.title ||
                                    `Option ${option.groupId}`}
                                </TableCell>
                                <TableCell>
                                  {option.selectedSelectionLabel}
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
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {instance.addons.map((addon: any) => {
                            const addonDetails = subjectDetails?.addons?.find(
                              (a: any) => a.id === addon.addonId
                            );

                            return (
                              <TableRow key={addon.id}>
                                <TableCell>
                                  {addonDetails?.label ||
                                    `Add-on ${addon.addonId}`}
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
                    {instance.answers.map((answer: any) => {
                      const questionDetails = subjectDetails?.questions?.find(
                        (q: any) => q.id === answer.questionId
                      );

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

  // Determine what changes have been requested
  const hasDescriptionChange = !!ticket.changeSet.generalDescription && ticket.changeSet.generalDescription !== currentContractTerms.generalDescription;
  const hasDeadlineChange = !!ticket.changeSet.deadlineAt && JSON.stringify(ticket.changeSet.deadlineAt) !== JSON.stringify(contract.deadlineAt);
  const hasGeneralOptionsChange =
    ticket.changeSet.generalOptions &&
    Object.keys(ticket.changeSet.generalOptions).length > 0 && JSON.stringify(ticket.changeSet.generalOptions) !== JSON.stringify(currentContractTerms.generalOptions);
  const hasSubjectOptionsChange =
    ticket.changeSet.subjectOptions &&
    Object.keys(ticket.changeSet.subjectOptions).length > 0 && JSON.stringify(ticket.changeSet.subjectOptions) !== JSON.stringify(currentContractTerms.subjectOptions);
  const hasReferenceImagesChange =
    ticket.changeSet.referenceImages &&
    ticket.changeSet.referenceImages.length > 0;

  return (
    <Paper elevation={2} sx={{ p: 3 }}>
      {/* Header Section with Status */}
      <Box
        sx={{
          mb: 3,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}
      >
        <Box>
          <Typography variant="h5" gutterBottom fontWeight="medium">
            Contract Change Request
          </Typography>

          <Stack direction="row" spacing={2} alignItems="center" sx={{ mt: 1 }}>
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <CalendarTodayIcon
                sx={{ fontSize: 18, mr: 0.5, color: "text.secondary" }}
              />
              <Typography variant="body2" color="text.secondary">
                Created: {formatDate(ticket.createdAt)}
              </Typography>
            </Box>

            {ticket.resolvedAt && (
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <CheckCircleIcon
                  sx={{ fontSize: 18, mr: 0.5, color: "success.main" }}
                />
                <Typography variant="body2" color="text.secondary">
                  Resolved: {formatDate(ticket.resolvedAt)}
                </Typography>
              </Box>
            )}

            {(ticket.status === "pendingArtist" ||
              ticket.status === "pendingClient") &&
              ticket.expiresAt && (
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  <AccessTimeIcon
                    sx={{
                      fontSize: 18,
                      mr: 0.5,
                      color: isPastExpiry
                        ? "error.main"
                        : isApproachingExpiry()
                        ? "warning.main"
                        : "info.main",
                    }}
                  />
                  <Typography
                    variant="body2"
                    color={
                      isPastExpiry
                        ? "error"
                        : isApproachingExpiry()
                        ? "warning.main"
                        : "text.secondary"
                    }
                  >
                    {calculateTimeRemaining()}
                  </Typography>
                </Box>
              )}

            {ticket.contractVersionBefore !== undefined &&
              ticket.contractVersionAfter !== undefined && (
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  <CompareArrowsIcon
                    sx={{ fontSize: 18, mr: 0.5, color: "info.main" }}
                  />
                  <Typography variant="body2" color="text.secondary">
                    Version {ticket.contractVersionBefore} →{" "}
                    {ticket.contractVersionAfter}
                  </Typography>
                </Box>
              )}
          </Stack>
        </Box>

        <Chip
          label={getReadableStatus(ticket.status)}
          color={getStatusColor(ticket.status)}
          sx={{ fontWeight: "medium", px: 1 }}
        />
      </Box>

      {/* Alert Messages */}
      {(ticket.status === "pendingArtist" ||
        ticket.status === "pendingClient") &&
        !isPastExpiry &&
        ticket.expiresAt &&
        isApproachingExpiry() && (
          <Alert severity="warning" sx={{ mb: 3 }} icon={<AccessTimeIcon />}>
            <Typography variant="body2">
              This change request will expire soon - on{" "}
              {formatDate(ticket.expiresAt)}.
              {isArtist &&
                ticket.status === "pendingArtist" &&
                " Please respond as soon as possible."}
              {isClient &&
                ticket.status === "pendingClient" &&
                " Please pay or reject the fee as soon as possible."}
            </Typography>
          </Alert>
        )}

      {(ticket.status === "pendingArtist" ||
        ticket.status === "pendingClient") &&
        isPastExpiry &&
        ticket.expiresAt && (
          <Alert severity="error" sx={{ mb: 3 }}>
            <Typography variant="body2">
              This change request has expired on {formatDate(ticket.expiresAt)}.
              {isClient &&
                " You may need to submit a new request or escalate to resolution."}
            </Typography>
          </Alert>
        )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }} icon={<CheckCircleIcon />}>
          Your action has been processed successfully.
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Divider sx={{ mb: 3 }} />

      {/* Main Content Area */}
      <Grid container spacing={3}>
        {/* Left Column: Change Request Details */}
        <Grid item xs={12} md={7}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom fontWeight="medium">
              Change Request Details
            </Typography>

            <Paper
              variant="outlined"
              sx={{ p: 2, borderRadius: 1, bgcolor: "background.paper", mb: 2 }}
            >
              <Typography variant="body1" sx={{ whiteSpace: "pre-line" }}>
                {ticket.reason}
              </Typography>
            </Paper>

            {isPaidChange && (
              <Paper
                variant="outlined"
                sx={{
                  p: 2,
                  borderRadius: 1,
                  bgcolor: ticket.escrowTxnId ? "success.50" : "warning.50",
                  borderColor: ticket.escrowTxnId
                    ? "success.200"
                    : "warning.200",
                  mb: 2,
                }}
              >
                <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                  {ticket.escrowTxnId
                    ? "Paid Change"
                    : "Paid Change - Payment Required"}
                </Typography>
                <Typography variant="body2">
                  Fee: {formatPrice(ticket.paidFee)}
                </Typography>
                <Typography variant="body2">
                  Payment Status:{" "}
                  {ticket.escrowTxnId ? "Paid" : "Pending payment"}
                </Typography>
              </Paper>
            )}
          </Box>

          {/* Requested Changes Accordions */}
          {hasDeadlineChange && (
            <Accordion
              expanded={expandedSection === "deadline"}
              onChange={handleSectionToggle("deadline")}
              sx={{ mb: 2, borderRadius: 1, overflow: "hidden" }}
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography
                  variant="subtitle1"
                  sx={{ display: "flex", alignItems: "center" }}
                >
                  <QueryBuilderIcon sx={{ mr: 1 }} fontSize="small" /> Deadline
                  Change
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Paper variant="outlined" sx={{ p: 2, borderRadius: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Current Deadline:
                      </Typography>
                      <Typography variant="body1">
                        {formatDate(contract.deadlineAt)}
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={6}>
                    <Paper
                      variant="outlined"
                      sx={{
                        p: 2,
                        borderRadius: 1,
                        bgcolor: "primary.50",
                        borderColor: "primary.200",
                      }}
                    >
                      <Typography variant="body2" color="text.secondary">
                        Requested Deadline:
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {formatDate(ticket.changeSet.deadlineAt)}
                      </Typography>
                    </Paper>
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>
          )}

          {hasDescriptionChange && (
            <Accordion
              expanded={expandedSection === "description"}
              onChange={handleSectionToggle("description")}
              sx={{ mb: 2, borderRadius: 1, overflow: "hidden" }}
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography
                  variant="subtitle1"
                  sx={{ display: "flex", alignItems: "center" }}
                >
                  <DescriptionIcon sx={{ mr: 1 }} fontSize="small" />{" "}
                  Description Change
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Typography
                      variant="subtitle2"
                      color="text.secondary"
                      gutterBottom
                    >
                      Current Description:
                    </Typography>
                    <Paper
                      variant="outlined"
                      sx={{ p: 2, borderRadius: 1, height: "100%" }}
                    >
                      <Typography
                        variant="body2"
                        sx={{ whiteSpace: "pre-line" }}
                      >
                        {currentContractTerms.generalDescription}
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography
                      variant="subtitle2"
                      color="text.secondary"
                      gutterBottom
                    >
                      New Description:
                    </Typography>
                    <Paper
                      variant="outlined"
                      sx={{
                        p: 2,
                        borderRadius: 1,
                        bgcolor: "primary.50",
                        borderColor: "primary.200",
                        height: "100%",
                      }}
                    >
                      <Typography
                        variant="body2"
                        sx={{ whiteSpace: "pre-line" }}
                      >
                        {ticket.changeSet.generalDescription}
                      </Typography>
                    </Paper>
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>
          )}

          {hasGeneralOptionsChange && (
            <Accordion
              expanded={expandedSection === "generalOptions"}
              onChange={handleSectionToggle("generalOptions")}
              sx={{ mb: 2, borderRadius: 1, overflow: "hidden" }}
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography
                  variant="subtitle1"
                  sx={{ display: "flex", alignItems: "center" }}
                >
                  <SyncAltIcon sx={{ mr: 1 }} fontSize="small" /> General
                  Options Changes
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                {renderGeneralOptionsComparison()}
              </AccordionDetails>
            </Accordion>
          )}

          {hasSubjectOptionsChange && (
            <Accordion
              expanded={expandedSection === "subjectOptions"}
              onChange={handleSectionToggle("subjectOptions")}
              sx={{ mb: 2, borderRadius: 1, overflow: "hidden" }}
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography
                  variant="subtitle1"
                  sx={{ display: "flex", alignItems: "center" }}
                >
                  <SyncAltIcon sx={{ mr: 1 }} fontSize="small" /> Subject
                  Options Changes
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                {renderSubjectOptionsComparison()}
              </AccordionDetails>
            </Accordion>
          )}

          {/* Artist Response Form - Only shown if user is artist and ticket is pendingArtist */}
          {canRespond() &&
            isArtist &&
            (ticket.status === "pendingArtist" ||
              ticket.status === "rejectedClient") && (
              <Box sx={{ mb: 3 }}>
                <Divider sx={{ mb: 3 }} />
                <Typography variant="h6" fontWeight="medium" gutterBottom>
                  Your Response
                </Typography>

                <Box sx={{ mb: 3 }}>
                  <Stack direction="row" spacing={2}>
                    <Button
                      variant={response === "accept" ? "contained" : "outlined"}
                      color="success"
                      onClick={() => setResponse("accept")}
                      disabled={isSubmitting}
                      startIcon={<ThumbUpIcon />}
                      sx={{ flexGrow: 1 }}
                      size="large"
                    >
                      Accept Without Fee
                    </Button>
                    <Button
                      variant={
                        response === "propose" ? "contained" : "outlined"
                      }
                      color="primary"
                      onClick={() => setResponse("propose")}
                      disabled={isSubmitting}
                      startIcon={<PaymentIcon />}
                      sx={{ flexGrow: 1 }}
                      size="large"
                    >
                      Propose Fee
                    </Button>
                    <Button
                      variant={response === "reject" ? "contained" : "outlined"}
                      color="error"
                      onClick={() => setResponse("reject")}
                      disabled={isSubmitting}
                      startIcon={<ThumbDownIcon />}
                      sx={{ flexGrow: 1 }}
                      size="large"
                    >
                      Reject Changes
                    </Button>
                  </Stack>
                </Box>

                {response === "accept" && (
                  <Alert severity="info" sx={{ mb: 3 }} icon={<InfoIcon />}>
                    <Typography variant="body2">
                      By accepting this change request, you are agreeing to
                      modify the contract as requested without any additional
                      fees.
                    </Typography>
                  </Alert>
                )}

                {response === "propose" && (
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="body2" sx={{ mb: 2 }}>
                      You can propose a fee for implementing these changes. The
                      client will need to pay this fee before the changes are
                      applied.
                    </Typography>
                    <TextField
                      label="Proposed Fee"
                      type="number"
                      inputProps={{ min: 0, step: 1000 }}
                      fullWidth
                      value={proposedFee}
                      onChange={(e) => setProposedFee(Number(e.target.value))}
                      placeholder="Enter fee amount"
                      required
                      disabled={isSubmitting}
                      error={
                        response === "propose" &&
                        (proposedFee <= 0 || isNaN(proposedFee))
                      }
                      helperText={
                        response === "propose" &&
                        (proposedFee <= 0 || isNaN(proposedFee))
                          ? "Please enter a valid fee amount"
                          : ""
                      }
                      sx={{ mb: 2 }}
                    />
                  </Box>
                )}

                {response === "reject" && (
                  <Box sx={{ mb: 3 }}>
                    <TextField
                      label="Reason for Rejection"
                      multiline
                      rows={3}
                      fullWidth
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="Explain why you are rejecting these changes"
                      required
                      disabled={isSubmitting}
                      error={
                        response === "reject" && rejectionReason.trim() === ""
                      }
                      helperText={
                        response === "reject" && rejectionReason.trim() === ""
                          ? "Rejection reason is required"
                          : ""
                      }
                      sx={{ mb: 2 }}
                    />
                  </Box>
                )}

                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleSubmit}
                  disabled={
                    !response ||
                    (response === "reject" && !rejectionReason.trim()) ||
                    (response === "propose" &&
                      (proposedFee <= 0 || isNaN(proposedFee))) ||
                    isSubmitting
                  }
                  sx={{ minWidth: 120 }}
                >
                  {isSubmitting ? (
                    <CircularProgress size={24} />
                  ) : (
                    "Submit Response"
                  )}
                </Button>
              </Box>
            )}

          {/* Client Response Form - Only shown if user is client and ticket is pendingClient */}
          {canRespond() && isClient && ticket.status === "pendingClient" && (
            <Box sx={{ mb: 3 }}>
              <Divider sx={{ mb: 3 }} />
              <Typography variant="h6" fontWeight="medium" gutterBottom>
                Your Response
              </Typography>

              <Alert severity="info" sx={{ mb: 3 }} icon={<InfoIcon />}>
                <Typography variant="body2" fontWeight="bold">
                  The artist has proposed a fee for this change.
                </Typography>
                <Typography variant="body2">
                  Fee: {formatPrice(ticket.paidFee)}
                </Typography>
                <Typography variant="body2">
                  You can pay this fee to proceed with the changes, or reject
                  the proposal.
                </Typography>
              </Alert>

              <Box sx={{ mb: 3, display: "flex", gap: 2 }}>
                <Button
                  variant="contained"
                  color="success"
                  onClick={() => setShowPaymentDialog(true)}
                  disabled={isSubmitting}
                  startIcon={<PaymentIcon />}
                  sx={{ flexGrow: 1 }}
                  size="large"
                >
                  Pay Fee
                </Button>
                <Button
                  variant={response === "reject" ? "contained" : "outlined"}
                  color="error"
                  onClick={() => setResponse("reject")}
                  disabled={isSubmitting}
                  startIcon={<ThumbDownIcon />}
                  sx={{ flexGrow: 1 }}
                  size="large"
                >
                  Reject Fee
                </Button>
              </Box>

              {response === "reject" && (
                <Box sx={{ mb: 3 }}>
                  <TextField
                    label="Reason for Rejection"
                    multiline
                    rows={3}
                    fullWidth
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Explain why you are rejecting this fee"
                    required
                    disabled={isSubmitting}
                    error={
                      response === "reject" && rejectionReason.trim() === ""
                    }
                    helperText={
                      response === "reject" && rejectionReason.trim() === ""
                        ? "Rejection reason is required"
                        : ""
                    }
                    sx={{ mb: 2 }}
                  />
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleSubmit}
                    disabled={!rejectionReason.trim() || isSubmitting}
                  >
                    {isSubmitting ? (
                      <CircularProgress size={24} />
                    ) : (
                      "Submit Rejection"
                    )}
                  </Button>
                </Box>
              )}
            </Box>
          )}

          {/* Payment Dialog */}
          {canPay() && (
            <UniversalPaymentDialog
              open={showPaymentDialog}
              onClose={() => setShowPaymentDialog(false)}
              title="Pay Change Fee"
              totalAmount={ticket.paidFee || 0}
              onSubmit={handlePayment}
              description={`Payment for contract change request.`}
            />
          )}

          {/* Escalate to Resolution section */}
          {ticket.status !== "paid" &&
            ticket.status !== "cancelled" &&
            ticket.status !== "acceptedArtist" && (
              <Box sx={{ mt: 4 }}>
                <Divider sx={{ mb: 3 }} />
                <Typography
                  variant="subtitle1"
                  fontWeight="medium"
                  gutterBottom
                >
                  Not satisfied with the process?
                </Typography>
                <Button
                  variant="outlined"
                  color="warning"
                  onClick={handleEscalation}
                  disabled={isSubmitting}
                  startIcon={<WarningIcon />}
                >
                  Escalate to Resolution
                </Button>

                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ display: "block", mt: 1 }}
                >
                  Escalation will be reviewed by our support team to help
                  resolve any issues.
                </Typography>
              </Box>
            )}
        </Grid>

        {/* Right Column: Reference Images */}
        <Grid item xs={12} md={5}>
          {hasReferenceImagesChange ? (
            <Box>
              <Typography variant="h6" gutterBottom fontWeight="medium">
                Reference Images
              </Typography>
              <Grid container spacing={2}>
                {ticket.changeSet.referenceImages.map((url, index) => (
                  <Grid item xs={12} sm={6} key={index}>
                    <Card variant="outlined" sx={{ height: "100%" }}>
                      <CardMedia
                        component="img"
                        image={url}
                        alt={`Reference ${index + 1}`}
                        sx={{
                          height: 200,
                          objectFit: "cover",
                        }}
                        onClick={() => window.open(url, "_blank")}
                      />
                      <CardContent sx={{ p: 1, "&:last-child": { pb: 1 } }}>
                        <Typography variant="caption" color="text.secondary">
                          Reference Image {index + 1}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>
          ) : (
            <Box sx={{ mt: { xs: 0, md: 4 } }}>
              <Paper
                variant="outlined"
                sx={{
                  p: 3,
                  borderRadius: 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  bgcolor: "background.paper",
                  minHeight: 200,
                }}
              >
                <ImageIcon
                  sx={{ fontSize: 48, color: "text.disabled", mb: 2 }}
                />
                <Typography
                  variant="body2"
                  color="text.secondary"
                  align="center"
                >
                  No reference images were provided with this change request.
                </Typography>
              </Paper>
            </Box>
          )}
        </Grid>
      </Grid>

      {/* Escalation Dialog */}
      <Dialog
        open={showEscalateDialog}
        onClose={() => setShowEscalateDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <WarningIcon sx={{ mr: 1, color: "warning.main" }} />
            Escalate to Resolution?
          </Box>
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Escalating this issue will create a resolution ticket for admin
            review. You will need to provide evidence and explain your position.
            <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
              When should you escalate?
            </Typography>
            <Typography variant="body2">
              • If communication has broken down
              <br />
              • If there's a disagreement about contract terms
              <br />• If you believe the other party isn't fulfilling their
              obligations
            </Typography>
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowEscalateDialog(false)} color="inherit">
            Cancel
          </Button>
          <Button
            onClick={confirmEscalation}
            color="warning"
            variant="contained"
          >
            Proceed to Resolution
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}

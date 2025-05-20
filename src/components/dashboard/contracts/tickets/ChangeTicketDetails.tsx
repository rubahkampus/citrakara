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
  isAdmin: boolean;
  username: string;
  canReview: boolean;
}

export default function ChangeTicketDetails({
  contract,
  ticket,
  userId,
  isArtist,
  isClient,
  isAdmin,
  username,
  canReview
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
    if (isAdmin) return false;
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
        throw new Error("Tolong pilih respon");
      }

      if (response === "reject" && !rejectionReason.trim()) {
        throw new Error("Tolong berikan alasan");
      }

      if (response === "propose" && (proposedFee <= 0 || isNaN(proposedFee))) {
        throw new Error("Tolong masukkan tagihan yang valid");
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
        return "Menunggu Tinjauan Seniman";
      case "pendingClient":
        return "Menunggu Pembayaran Klien";
      case "acceptedArtist":
        return "Diterima oleh Seniman";
      case "rejectedArtist":
        return "Ditolak oleh Seniman";
      case "rejectedClient":
        return "Ditolak oleh Klien";
      case "forcedAcceptedClient":
        return "Penerimaan Paksa (Klien)";
      case "forcedAcceptedArtist":
        return "Penerimaan Paksa (Seniman)";
      case "paid":
        return "Dibayar & Diterapkan";
      case "cancelled":
        return "Dibatalkan";
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
    contract.contractTerms[
      ticket.contractVersionBefore !== undefined
        ? ticket.contractVersionBefore
        : contract.contractTerms.length - 1
    ];

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
      return <Typography>Tidak opsi umum untuk dibandingkan</Typography>;
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
              Opsi umum saat ini
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
              Opsi umum baru
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
      return <Typography>Tidak ada opsi subjek untuk dibandingkan</Typography>;
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
              Opsi Subjek Saat Ini
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
              Opsi Subjek Baru
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
      return <Typography>Tidak ada opsi yang dipilih</Typography>;
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
                  Kelompok Opsi
                </Typography>
                <TableContainer
                  component={Paper}
                  variant="outlined"
                  sx={{ borderRadius: 1 }}
                >
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: "background.default" }}>
                        <TableCell>Opsi</TableCell>
                        <TableCell>Pilihan</TableCell>
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
                                `Kelompok Opsi ${option.groupId}`}
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
                Tambahan
              </Typography>
              <TableContainer
                component={Paper}
                variant="outlined"
                sx={{ borderRadius: 1 }}
              >
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: "background.default" }}>
                      <TableCell>Tambahan</TableCell>
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
                            {addonDetails?.label || `Tambahan ${addon.addonId}`}
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
                Jawaban Klien
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
                      {questionDetails?.text ||
                        `Pertanyaan ${answer.questionId}`}
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
        <Typography variant="body2">
          Tidak ada opsi subjek yang dipilih
        </Typography>
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
              {subjectDetails?.title || `Subjek ${subject.subjectId}`}
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
                  {subjectDetails?.title} {instance.id}
                </Typography>

                {/* Instance Option Groups */}
                {instance.optionGroups && instance.optionGroups.length > 0 && (
                  <Box sx={{ mb: 3 }}>
                    <Typography
                      variant="subtitle2"
                      sx={{ mb: 1, color: "primary.main" }}
                    >
                      Opsi
                    </Typography>
                    <TableContainer
                      component={Paper}
                      variant="outlined"
                      sx={{ borderRadius: 1 }}
                    >
                      <Table size="small">
                        <TableHead>
                          <TableRow sx={{ bgcolor: "background.default" }}>
                            <TableCell>Opsi</TableCell>
                            <TableCell>Pilihan</TableCell>
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
                                    `Kelompok Opsi ${option.groupId}`}
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
                      Tambahan
                    </Typography>
                    <TableContainer
                      component={Paper}
                      variant="outlined"
                      sx={{ borderRadius: 1 }}
                    >
                      <Table size="small">
                        <TableHead>
                          <TableRow sx={{ bgcolor: "background.default" }}>
                            <TableCell>Tambahan</TableCell>
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
                                    `Tambahan ${addon.addonId}`}
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
                      Jawaban Klien
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
                              `Pertanyaan ${answer.questionId}`}
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
  const hasDescriptionChange =
    !!ticket.changeSet.generalDescription &&
    ticket.changeSet.generalDescription !==
      currentContractTerms.generalDescription;
  const hasDeadlineChange =
    !!ticket.changeSet.deadlineAt &&
    JSON.stringify(ticket.changeSet.deadlineAt) !==
      JSON.stringify(contract.deadlineAt);
  const hasGeneralOptionsChange =
    ticket.changeSet.generalOptions &&
    Object.keys(ticket.changeSet.generalOptions).length > 0 &&
    JSON.stringify(ticket.changeSet.generalOptions) !==
      JSON.stringify(currentContractTerms.generalOptions);
  const hasSubjectOptionsChange =
    ticket.changeSet.subjectOptions &&
    Object.keys(ticket.changeSet.subjectOptions).length > 0 &&
    JSON.stringify(ticket.changeSet.subjectOptions) !==
      JSON.stringify(currentContractTerms.subjectOptions);
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
            Permintaan Perubahan Kontrak
          </Typography>

          <Stack direction="row" spacing={2} alignItems="center" sx={{ mt: 1 }}>
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <CalendarTodayIcon
                sx={{ fontSize: 18, mr: 0.5, color: "text.secondary" }}
              />
              <Typography variant="body2" color="text.secondary">
                Dibuat: {formatDate(ticket.createdAt)}
              </Typography>
            </Box>

            {ticket.resolvedAt && (
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <CheckCircleIcon
                  sx={{ fontSize: 18, mr: 0.5, color: "success.main" }}
                />
                <Typography variant="body2" color="text.secondary">
                  Diselesaikan: {formatDate(ticket.resolvedAt)}
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
                    Versi {ticket.contractVersionBefore} →{" "}
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

      {/* Pesan Peringatan */}
      {(ticket.status === "pendingArtist" ||
        ticket.status === "pendingClient") &&
        !isPastExpiry &&
        ticket.expiresAt &&
        isApproachingExpiry() && (
          <Alert severity="warning" sx={{ mb: 3 }} icon={<AccessTimeIcon />}>
            <Typography variant="body2">
              Permintaan perubahan ini akan segera kedaluwarsa - pada{" "}
              {formatDate(ticket.expiresAt)}.
              {isArtist &&
                ticket.status === "pendingArtist" &&
                " Harap tanggapi sesegera mungkin."}
              {isClient &&
                ticket.status === "pendingClient" &&
                " Harap bayar atau tolak biaya sesegera mungkin."}
            </Typography>
          </Alert>
        )}

      {(ticket.status === "pendingArtist" ||
        ticket.status === "pendingClient") &&
        isPastExpiry &&
        ticket.expiresAt && (
          <Alert severity="error" sx={{ mb: 3 }}>
            <Typography variant="body2">
              Permintaan perubahan ini telah kedaluwarsa pada{" "}
              {formatDate(ticket.expiresAt)}.
              {isClient &&
                " Anda mungkin perlu mengajukan permintaan baru atau mengeskalasi ke resolusi."}
            </Typography>
          </Alert>
        )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }} icon={<CheckCircleIcon />}>
          Tindakan Anda telah diproses dengan sukses.
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
              Detail Permintaan Perubahan
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
                    ? "Perubahan Berbayar"
                    : "Perubahan Berbayar - Pembayaran Dibutuhman"}
                </Typography>
                <Typography variant="body2">
                  Tagihan: {formatPrice(ticket.paidFee)}
                </Typography>
                <Typography variant="body2">
                  Status Pembayaran:{" "}
                  {ticket.escrowTxnId ? "Telah Dibayar" : "Menunggu Pembayaran"}
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
                  Perubahan
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Paper variant="outlined" sx={{ p: 2, borderRadius: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Deadline Lama:
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
                        Deadline Baru:
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
                  <DescriptionIcon sx={{ mr: 1 }} fontSize="small" /> Perubahan
                  Deskripsi
                </Typography>
              </AccordionSummary>
              <AccordionDetails sx={{pb:10}}>
                <Grid container spacing={10} mb={2}>
                  <Grid item xs={12} md={12}>
                    <Typography
                      variant="subtitle2"
                      color="text.secondary"
                      gutterBottom
                    >
                      Deskripsi Lama
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
                  <Grid item xs={12} md={12}>
                    <Typography
                      variant="subtitle2"
                      color="text.secondary"
                      gutterBottom
                    >
                      Deskripsi Baru:
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
                  <SyncAltIcon sx={{ mr: 1 }} fontSize="small" />
                  Perubahan Opsi Umum
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
                  <SyncAltIcon sx={{ mr: 1 }} fontSize="small" /> 
                  Perubahan Opsi Subjek
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
                  Respon Anda
                </Typography>

                <Box sx={{ mb: 3 }}>
                  <Stack direction="row" spacing={2}>
                    <Button
                      variant={response === "accept" ? "contained" : "outlined"}
                      color="success"
                      onClick={() => setResponse("accept")}
                      disabled={isAdmin || canReview || isSubmitting}
                      startIcon={<ThumbUpIcon />}
                      sx={{ flexGrow: 1 }}
                      size="large"
                    >
                      Terima Tanpa Tagihan
                    </Button>
                    <Button
                      variant={
                        response === "propose" ? "contained" : "outlined"
                      }
                      color="primary"
                      onClick={() => setResponse("propose")}
                      disabled={isAdmin || canReview || isSubmitting}
                      startIcon={<PaymentIcon />}
                      sx={{ flexGrow: 1 }}
                      size="large"
                    >
                      Tawarkan Tagihan
                    </Button>
                    <Button
                      variant={response === "reject" ? "contained" : "outlined"}
                      color="error"
                      onClick={() => setResponse("reject")}
                      disabled={isAdmin || canReview || isSubmitting}
                      startIcon={<ThumbDownIcon />}
                      sx={{ flexGrow: 1 }}
                      size="large"
                    >
                      Tolak Perubahan
                    </Button>
                  </Stack>
                </Box>

                {response === "accept" && (
                  <Alert severity="info" sx={{ mb: 3 }} icon={<InfoIcon />}>
                    <Typography variant="body2">
                      Dengan menerima permintaan perubahan ini, Anda setuju
                      untuk mengubah kontrak seperti yang diminta tanpa biaya
                      tambahan.
                    </Typography>
                  </Alert>
                )}

                {response === "propose" && (
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="body2" sx={{ mb: 2 }}>
                      Anda dapat mengajukan biaya untuk menerapkan perubahan
                      ini. Klien harus membayar biaya ini sebelum perubahan
                      diterapkan.
                    </Typography>
                    <TextField
                      label="Biaya yang Diusulkan"
                      type="number"
                      inputProps={{ min: 0, step: 1000 }}
                      fullWidth
                      value={proposedFee}
                      onChange={(e) => setProposedFee(Number(e.target.value))}
                      placeholder="Masukkan jumlah biaya"
                      required
                      disabled={isAdmin || canReview || isSubmitting}
                      error={
                        response === "propose" &&
                        (proposedFee <= 0 || isNaN(proposedFee))
                      }
                      helperText={
                        response === "propose" &&
                        (proposedFee <= 0 || isNaN(proposedFee))
                          ? "Harap masukkan jumlah biaya yang valid"
                          : ""
                      }
                      sx={{ mb: 2 }}
                    />
                  </Box>
                )}

                {response === "reject" && (
                  <Box sx={{ mb: 3 }}>
                    <TextField
                      label="Alasan Penolakan"
                      multiline
                      rows={3}
                      fullWidth
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="Jelaskan mengapa Anda menolak perubahan ini"
                      required
                      disabled={isAdmin || canReview || isSubmitting}
                      error={
                        response === "reject" && rejectionReason.trim() === ""
                      }
                      helperText={
                        response === "reject" && rejectionReason.trim() === ""
                          ? "Alasan penolakan diperlukan"
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
                    isAdmin || canReview ||
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
                    "Kirim Respon"
                  )}
                </Button>
              </Box>
            )}

          {/* Client Response Form - Only shown if user is client and ticket is pendingClient */}
          {canRespond() && isClient && ticket.status === "pendingClient" && (
            <Box sx={{ mb: 3 }}>
              <Divider sx={{ mb: 3 }} />
              <Typography variant="h6" fontWeight="medium" gutterBottom>
                Respon Anda
              </Typography>

              <Alert severity="info" sx={{ mb: 3 }} icon={<InfoIcon />}>
                <Typography variant="body2" fontWeight="bold">
                  Seniman telah mengajukan biaya untuk perubahan ini.
                </Typography>
                <Typography variant="body2">
                  Biaya: {formatPrice(ticket.paidFee)}
                </Typography>
                <Typography variant="body2">
                  Anda dapat membayar biaya ini untuk melanjutkan perubahan,
                  atau menolak proposal ini.
                </Typography>
              </Alert>

              <Box sx={{ mb: 3, display: "flex", gap: 2 }}>
                <Button
                  variant="contained"
                  color="success"
                  onClick={() => setShowPaymentDialog(true)}
                  disabled={isAdmin || canReview || isSubmitting}
                  startIcon={<PaymentIcon />}
                  sx={{ flexGrow: 1 }}
                  size="large"
                >
                  Bayar Tagihan
                </Button>
                <Button
                  variant={response === "reject" ? "contained" : "outlined"}
                  color="error"
                  onClick={() => setResponse("reject")}
                  disabled={isAdmin || canReview || isSubmitting}
                  startIcon={<ThumbDownIcon />}
                  sx={{ flexGrow: 1 }}
                  size="large"
                >
                  Tolak Tagihan
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
                    disabled={isAdmin || canReview || isSubmitting}
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
                    disabled={
                      isAdmin || canReview || !rejectionReason.trim() || isSubmitting
                    }
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
                  Tidak puas dengan prosesnya?
                </Typography>
                <Button
                  variant="outlined"
                  color="warning"
                  onClick={handleEscalation}
                  disabled={isAdmin || isSubmitting}
                  startIcon={<WarningIcon />}
                >
                  Tingkatkan ke Resolusi
                </Button>

                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ display: "block", mt: 1 }}
                >
                  Eskalasi akan ditinjau oleh tim dukungan kami untuk membantu
                  menyelesaikan masalah.
                </Typography>
              </Box>
            )}
        </Grid>

        {/* Right Column: Reference Images */}
        <Grid item xs={12} md={5}>
          {hasReferenceImagesChange ? (
            <Box>
              <Typography variant="h6" gutterBottom fontWeight="medium">
                Gambar Referensi
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
                          Gambar Referensi {index + 1}
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
                  Tidak ada gambar referensi dalam permintaan Perubahan ini
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
            Tingkatkan ke Resolusi?
          </Box>
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Meningkatkan masalah ini akan membuat tiket resolusi untuk tinjauan
            admin. Anda perlu memberikan bukti dan menjelaskan posisi Anda.
            <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
              Kapan Anda harus meningkatkan?
            </Typography>
            <Typography variant="body2">
              • Jika komunikasi terputus
              <br />
              • Jika ada ketidaksepakatan tentang syarat kontrak
              <br />• Jika Anda percaya pihak lain tidak memenuhi kewajibannya
            </Typography>
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowEscalateDialog(false)} color="inherit">
            Batal
          </Button>
          <Button
            onClick={confirmEscalation}
            color="warning"
            variant="contained"
          >
            Lanjutkan ke Resolusi
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}

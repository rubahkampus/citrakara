"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Alert,
  Snackbar,
  Typography,
  Paper,
  Button,
  Chip,
  Divider,
  Grid,
  IconButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Breadcrumbs,
  Link,
} from "@mui/material";
import {
  ExpandMore as ExpandMoreIcon,
  AccessTime as AccessTimeIcon,
  AttachMoney as AttachMoneyIcon,
  Description as DescriptionIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  ArrowBack as ArrowBackIcon,
  CalendarToday as CalendarTodayIcon,
  Person as PersonIcon,
  Edit as EditIcon,
  ArrowBack,
  DescriptionRounded,
  Home,
  NavigateNext,
} from "@mui/icons-material";
import { axiosClient } from "@/lib/utils/axiosClient";
import { IProposal } from "@/lib/db/models/proposal.model";
import ArtistRespondForm from "./ArtistRespondForm";
import ClientRespondForm from "./ClientRespondForm";
import CommissionDetails from "./CommissionDetailsPage";
import ProposalOptionsDetails from "./ProposalOptionsDetails";

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

  // Handle section expansion
  const handleSectionToggle =
    (section: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
      setExpandedSection(isExpanded ? section : false);
    };

  // Check if the proposal is expired
  const isExpired = () => {
    if (!proposal.expiresAt) return false;

    // If status is paid or rejectedArtist, never consider expired
    if (proposal.status === "paid" || proposal.status === "rejectedArtist") {
      return false;
    }

    const now = new Date();
    const expiresAt = new Date(proposal.expiresAt);

    return now > expiresAt;
  };

  proposal.status = isExpired() ? "expired" : proposal.status;

  // Status display mapping
  const statusMap = {
    pendingArtist: {
      text: "Menunggu Respons Seniman",
      color: "warning.main",
      icon: <AccessTimeIcon />,
      description: "Seniman perlu meninjau dan merespons proposal ini.",
    },
    pendingClient: {
      text: "Menunggu Respons Klien",
      color: "warning.main",
      icon: <AccessTimeIcon />,
      description: "Klien perlu meninjau penyesuaian yang diajukan seniman.",
    },
    accepted: {
      text: "Diterima",
      color: "white",
      icon: <CheckCircleIcon />,
      description:
        "Kedua belah pihak telah menyetujui persyaratan kontrak ini.",
    },
    rejectedArtist: {
      text: "Ditolak oleh Seniman",
      color: "error.main",
      icon: <CancelIcon />,
      description: "Seniman telah menolak proposal komisi ini.",
    },
    rejectedClient: {
      text: "Ditolak oleh Klien",
      color: "error.main",
      icon: <CancelIcon />,
      description:
        "Klien telah menolak penyesuaian yang diajukan oleh seniman.",
    },
    expired: {
      text: "Kedaluwarsa",
      color: "text.disabled",
      icon: <AccessTimeIcon />,
      description: "Proposal ini telah kedaluwarsa tanpa mendapatkan respons.",
    },
    paid: {
      text: "Dibayar",
      color: "success.dark",
      icon: <AttachMoneyIcon />,
      description: "Pembayaran telah diterima untuk komisi ini.",
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
      setTimeout(() => {
        router.refresh();
      }, 1000);
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
      setTimeout(() => {
        router.refresh();
      }, 1000);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to submit response");
    } finally {
      setLoading(false);
    }
  };

  // Determine if user can respond based on role and status
  const canArtistRespond =
    !isExpired() &&
    role === "artist" &&
    ["pendingArtist", "rejectedClient"].includes(proposal.status);

  const canClientRespond =
    !isExpired() &&
    role === "client" &&
    ["pendingClient", "accepted", "pendingArtist"].includes(proposal.status);

  // Determine if user can edit the proposal
  const canEditProposal =
    !isExpired() &&
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

  return (
    <Box sx={{ mx: "auto", py: 4 }}>
      <Box
        sx={{
          mb: 3,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <Breadcrumbs separator={<NavigateNext fontSize="small" />}>
            <Link
              component={Link}
              href={`/${username}/dashboard`}
              underline="hover"
              color="inherit"
              sx={{ display: "flex", alignItems: "center" }}
            >
              <Home fontSize="small" sx={{ mr: 0.5 }} />
              Dashboard
            </Link>
            <Link
              component={Link}
              href={`/${username}/dashboard/proposals`}
              underline="hover"
              color="inherit"
              sx={{ display: "flex", alignItems: "center" }}
            >
              <DescriptionRounded fontSize="small" sx={{ mr: 0.5 }} />
              Proposal
            </Link>
            <Typography
              color="text.primary"
              sx={{ display: "flex", alignItems: "center" }}
            >
              Detail Proposal
            </Typography>
          </Breadcrumbs>

          <Box display="flex" alignItems="center" mt={4} ml={-0.5}>
            <DescriptionRounded
              sx={{ mr: 1, color: "primary.main", fontSize: 32 }}
            />
            <Typography variant="h4" fontWeight="bold">
              Detail Proposal
            </Typography>
          </Box>
        </Box>

        <Button
          component={Link}
          href={`/${username}/dashboard/proposals`}
          variant="outlined"
          startIcon={<ArrowBack />}
          size="small"
          sx={{ mt: 1 }}
        >
          Kembali ke Daftar Proposal
        </Button>
      </Box>

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
            sx={{ borderRadius: 1 }}
          >
            Edit Proposal
          </Button>
        )}
      </Box>

      {/* Proposal status card */}
      <Paper
        component="div"
        sx={{
          p: 4,
          border: 1,
          borderColor: "divider",
          borderRadius: 2,
          boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
        }}
      >
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
            {statusMap[isExpired() ? "expired" : proposal.status]?.icon}
            <Typography variant="h5" fontWeight="medium" sx={{ ml: 1 }}>
              {statusMap[isExpired() ? "expired" : proposal.status]?.text ||
                "Status Tidak Dikenal"}
            </Typography>
            <Chip
              label={
                statusMap[isExpired() ? "expired" : proposal.status]?.text ||
                "Tidak Diketahui"
              }
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
            {statusMap[isExpired() ? "expired" : proposal.status]?.description}
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
                  Proyek
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
                  Tenggat Waktu
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
                  ? ` (${daysRemaining} hari lagi)`
                  : " (Hari terakhir!)"}
              </Typography>
            </Grid>

            <Grid item xs={12} md={6}>
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <PersonIcon fontSize="small" color="primary" sx={{ mr: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  {role === "client" ? "Ilustrator" : "Klien"}
                </Typography>
              </Box>
              <Typography
                variant="body1"
                sx={{ fontWeight: "medium", ml: 4, mb: 2 }}
              >
                {role === "client"
                  ? otherPartyInfo?.username || "Ilustrator"
                  : otherPartyInfo?.username || "Klien"}
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
                  Total Harga
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
        </Paper>

        {/* Response Form */}
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
                username={username}
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
            icon={statusMap[isExpired() ? "expired" : proposal.status]?.icon}
          >
            <Typography variant="body1">
              {proposal.status === "accepted"
                ? "Proposal ini telah diterima. Ilustrator akan mulai bekerja sesuai dengan jadwal yang disepakati."
                : proposal.status === "rejectedArtist"
                ? "Proposal ini ditolak oleh ilustrator. Anda dapat membuat proposal baru dengan kebutuhan yang berbeda."
                : proposal.status === "rejectedClient"
                ? "Anda menolak penyesuaian dari ilustrator. Ilustrator dapat mengajukan penyesuaian baru."
                : proposal.status === "expired"
                ? "Proposal ini telah kedaluwarsa dan tidak dapat diterima lagi."
                : proposal.status === "paid"
                ? "Proposal ini telah dibayar. Ilustrator akan menyelesaikan karya sesuai kesepakatan."
                : "Menunggu tanggapan dari pihak lainnya terhadap proposal ini."}
            </Typography>
          </Alert>
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
              Alasan Penolakan
            </Typography>
            <Typography variant="body1">{proposal.rejectionReason}</Typography>
          </Paper>
        )}

        {/* Cancel Proposal Button (client only) */}
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
                disabled={loading || isExpired()}
                startIcon={<CancelIcon />}
                sx={{ borderRadius: 2 }}
              >
                Batalkan Proposal
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
            Deskripsi Proyek
          </Typography>
          <Typography variant="body1" paragraph>
            {proposal.generalDescription}
          </Typography>
        </Paper>

        {/* Selected Options - Now using the separated component */}
        <ProposalOptionsDetails
          proposal={proposal}
          formatCurrency={formatCurrency}
          formatDate={formatDate}
        />

        {/* Commission Listing Details */}
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
              <DescriptionIcon sx={{ mr: 1 }} /> Rincian Listing Komisi
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <CommissionDetails listing={proposal.listingSnapshot} />
          </AccordionDetails>
        </Accordion>
        <Snackbar
          open={success}
          message="Response submitted successfully!"
          autoHideDuration={2000}
          onClose={() => setSuccess(false)}
        />
      </Paper>
    </Box>
  );
}

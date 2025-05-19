// src/components/dashboard/contracts/ContractActionButtons.tsx
"use client";

import React from "react";
import {
  Box,
  Button,
  Divider,
  Typography,
  Grid,
  Paper,
  Tooltip,
} from "@mui/material";
import Link from "next/link";
import { IContract } from "@/lib/db/models/contract.model";
// Import icons
import MonetizationOnIcon from "@mui/icons-material/MonetizationOn";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import CancelIcon from "@mui/icons-material/Cancel";
import BuildIcon from "@mui/icons-material/Build";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import AssignmentIcon from "@mui/icons-material/Assignment";
import FolderIcon from "@mui/icons-material/Folder";

// Types
interface ContractActionButtonsProps {
  username: string;
  contract: IContract;
  isArtist: boolean;
  isClient: boolean;
}

// Constants
const TERMINAL_STATUSES = [
  "completed",
  "completedLate",
  "cancelledClient",
  "cancelledClientLate",
  "cancelledArtist",
  "cancelledArtistLate",
  "notCompleted",
];

// Helper functions
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
  }).format(amount);
};

// Translations
const translations = {
  // Financial section
  financialActions: "Tindakan Keuangan",
  claimRefund: "Klaim Pengembalian",
  claimRefundTooltip: "Klaim pengembalian dana Anda yang tersedia",
  claimPayment: "Klaim Pembayaran",
  claimPaymentTooltip: "Klaim pembayaran yang sudah Anda peroleh",

  // Upload section
  uploadActions: "Tindakan Unggah",
  uploadProgress: "Unggah Progres",
  uploadMilestone: "Unggah Milestone",
  uploadMilestoneTooltip: "Unggah progres untuk milestone #",
  uploadFinalDelivery: "Unggah Hasil Akhir",
  uploadFinalDeliveryTooltip: "Unggah karya Anda yang sudah selesai",

  // Client support section
  clientSupportActions: "Tindakan Dukungan Klien",
  requestRevision: "Minta Revisi",
  requestRevisionTooltip: "Minta perubahan pada karya",
  requestContractChange: "Minta Perubahan Kontrak",
  requestContractChangeTooltip: "Minta perubahan pada persyaratan kontrak",
  requestCancellation: "Minta Pembatalan",

  // Artist support section
  artistSupportActions: "Tindakan Dukungan Seniman",

  // View documents section
  viewDocuments: "Lihat Dokumen",
  viewTickets: "Lihat Tiket",
  viewUploads: "Lihat Unggahan",
};

const ContractActionButtons: React.FC<ContractActionButtonsProps> = ({
  username,
  contract,
  isArtist,
  isClient,
}) => {
  const contractId = contract._id.toString();

  // Status checks
  const isActive = contract.status === "active";
  const isTerminal = TERMINAL_STATUSES.includes(contract.status);

  // Flow checks
  const isMilestoneFlow =
    contract.proposalSnapshot.listingSnapshot.flow === "milestone";
  const isStandardFlow =
    contract.proposalSnapshot.listingSnapshot.flow === "standard";

  // Permission checks
  const canClientClaimFunds =
    isClient && isTerminal && contract.finance.totalOwnedByClient > 0;
  const canArtistClaimFunds =
    isArtist && isTerminal && contract.finance.totalOwnedByArtist > 0;
  const canArtistUpload = isArtist && isActive;
  const canClientCreateTickets = isClient && isActive;
  const canArtistCreateTickets = isArtist && isActive;
  const allowRevisions =
    contract.proposalSnapshot.listingSnapshot.revisions?.type !== "none";
  const allowContractChange =
    contract.proposalSnapshot.listingSnapshot.allowContractChange;

  // Section components
  const ActionSection = ({
    title,
    icon,
    children,
    show = true,
  }: {
    title: string;
    icon: React.ReactNode;
    children: React.ReactNode;
    show?: boolean;
  }) => {
    if (!show) return null;

    return (
      <Box mb={2}>
        <Typography
          variant="subtitle2"
          sx={{
            display: "flex",
            alignItems: "center",
            mb: 1,
            fontWeight: 600,
          }}
        >
          {icon}
          {title}
        </Typography>
        <Paper
          variant="outlined"
          sx={{
            p: 1.5,
            backgroundColor: "#f9f9f9",
            borderRadius: 2,
            transition: "all 0.2s",
            "&:hover": {
              backgroundColor: "#f5f5f5",
              boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
            },
          }}
        >
          <Grid container spacing={1}>
            {children}
          </Grid>
        </Paper>
      </Box>
    );
  };

  const ActionButton = ({
    href,
    label,
    icon,
    color = "primary",
    variant = "outlined",
    tooltip,
  }: {
    href: string;
    label: string;
    icon: React.ReactNode;
    color?: "primary" | "secondary" | "success" | "error" | "info" | "warning";
    variant?: "text" | "outlined" | "contained";
    tooltip?: string;
  }) => {
    const button = (
      <Button
        size="small"
        variant={variant}
        color={color}
        startIcon={icon}
        sx={{
          borderRadius: 1.5,
          fontWeight: 500,
          transition: "all 0.2s",
          "&:hover": {
            transform: "translateY(-1px)",
          },
        }}
      >
        {label}
      </Button>
    );

    return (
      <Grid item>
        <Link href={href} passHref style={{ textDecoration: "none" }}>
          {tooltip ? (
            <Tooltip title={tooltip} arrow placement="top">
              {button}
            </Tooltip>
          ) : (
            button
          )}
        </Link>
      </Grid>
    );
  };

  // Render specific action groups
  const renderFinancialActions = () => {
    const iconComponent = (
      <MonetizationOnIcon
        fontSize="small"
        sx={{ mr: 1, color: "primary.main" }}
      />
    );

    return (
      <ActionSection
        title={translations.financialActions}
        icon={iconComponent}
        show={canClientClaimFunds || canArtistClaimFunds}
      >
        {canClientClaimFunds && (
          <ActionButton
            href={`/${username}/dashboard/contracts/${contractId}/claim?role=client`}
            label={`${translations.claimRefund} (${formatCurrency(
              contract.finance.totalOwnedByClient
            )})`}
            icon={<AttachMoneyIcon />}
            variant="contained"
            tooltip={translations.claimRefundTooltip}
          />
        )}

        {canArtistClaimFunds && (
          <ActionButton
            href={`/${username}/dashboard/contracts/${contractId}/claim?role=artist`}
            label={`${translations.claimPayment} (${formatCurrency(
              contract.finance.totalOwnedByArtist
            )})`}
            icon={<AttachMoneyIcon />}
            color="success"
            variant="contained"
            tooltip={translations.claimPaymentTooltip}
          />
        )}
      </ActionSection>
    );
  };

  const renderUploadActions = () => {
    const iconComponent = (
      <CloudUploadIcon fontSize="small" sx={{ mr: 1, color: "primary.main" }} />
    );

    return (
      <ActionSection
        title={translations.uploadActions}
        icon={iconComponent}
        show={canArtistUpload}
      >
        {canArtistUpload && isStandardFlow && (
          <ActionButton
            href={`/${username}/dashboard/contracts/${contractId}/uploads/progress/new`}
            label={translations.uploadProgress}
            icon={<CloudUploadIcon />}
          />
        )}

        {canArtistUpload &&
          isMilestoneFlow &&
          contract.currentMilestoneIndex !== undefined && (
            <ActionButton
              href={`/${username}/dashboard/contracts/${contractId}/uploads/milestone/new?milestoneIdx=${contract.currentMilestoneIndex}`}
              label={translations.uploadMilestone}
              icon={<CloudUploadIcon />}
              tooltip={`${translations.uploadMilestoneTooltip}${
                contract.currentMilestoneIndex + 1
              }`}
            />
          )}

        {canArtistUpload && (
          <ActionButton
            href={`/${username}/dashboard/contracts/${contractId}/uploads/final/new`}
            label={translations.uploadFinalDelivery}
            icon={<CloudUploadIcon />}
            color='primary'
            variant="contained"
            tooltip={translations.uploadFinalDeliveryTooltip}
          />
        )}
      </ActionSection>
    );
  };

  const renderClientTicketActions = () => {
    const iconComponent = (
      <AssignmentIcon fontSize="small" sx={{ mr: 1, color: "primary.main" }} />
    );

    return (
      <ActionSection
        title={translations.clientSupportActions}
        icon={iconComponent}
        show={canClientCreateTickets}
      >
        {allowRevisions && (
          <ActionButton
            href={`/${username}/dashboard/contracts/${contractId}/tickets/revision/new`}
            label={translations.requestRevision}
            icon={<BuildIcon />}
            tooltip={translations.requestRevisionTooltip}
          />
        )}

        {allowContractChange && (
          <ActionButton
            href={`/${username}/dashboard/contracts/${contractId}/tickets/change/new`}
            label={translations.requestContractChange}
            icon={<BuildIcon />}
            tooltip={translations.requestContractChangeTooltip}
          />
        )}

        <ActionButton
          href={`/${username}/dashboard/contracts/${contractId}/tickets/cancel/new`}
          label={translations.requestCancellation}
          icon={<CancelIcon />}
          color="error"
        />
      </ActionSection>
    );
  };

  const renderArtistTicketActions = () => {
    const iconComponent = (
      <AssignmentIcon fontSize="small" sx={{ mr: 1, color: "primary.main" }} />
    );

    return (
      <ActionSection
        title={translations.artistSupportActions}
        icon={iconComponent}
        show={canArtistCreateTickets}
      >
        <ActionButton
          href={`/${username}/dashboard/contracts/${contractId}/tickets/cancel/new`}
          label={translations.requestCancellation}
          icon={<CancelIcon />}
          color="error"
        />
      </ActionSection>
    );
  };

  const renderViewActions = () => {
    const iconComponent = (
      <FolderIcon fontSize="small" sx={{ mr: 1, color: "primary.main" }} />
    );

    return (
      <ActionSection
        title={translations.viewDocuments}
        icon={iconComponent}
        show={true}
      >
        <ActionButton
          href={`/${username}/dashboard/contracts/${contractId}/tickets`}
          label={translations.viewTickets}
          icon={<AssignmentIcon />}
          variant="text"
        />

        <ActionButton
          href={`/${username}/dashboard/contracts/${contractId}/uploads`}
          label={translations.viewUploads}
          icon={<FolderIcon />}
          variant="text"
        />
      </ActionSection>
    );
  };

  return (
    <Box sx={{ py: 1 }}>
      {renderFinancialActions()}
      {renderUploadActions()}
      {renderClientTicketActions()}
      {renderArtistTicketActions()}
      <Divider sx={{ my: 2 }} />
      {renderViewActions()}
    </Box>
  );
};

export default ContractActionButtons;

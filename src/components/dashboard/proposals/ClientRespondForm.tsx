"use client";

import React, { useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Stack,
  Alert,
  Chip,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import { IProposal } from "@/lib/db/models/proposal.model";
import UniversalPaymentDialog from "@/components/UniversalPaymentDialog";
import { useRouter } from "next/navigation";
import { axiosClient } from "@/lib/utils/axiosClient";

interface ClientRespondFormProps {
  proposal: IProposal;
  loading?: boolean;
  onSubmit: (decision: {
    acceptAdjustments?: boolean;
    cancel?: boolean;
  }) => void;
  username: string;
}

export default function ClientRespondForm({
  proposal,
  onSubmit,
  loading = false,
  username,
}: ClientRespondFormProps) {
  const router = useRouter();

  const [activeView, setActiveView] = useState<"main" | "cancel" | "reject">(
    "main"
  );
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);

  // Format currency helper
  const formatCurrency = (amount: number) => `IDR ${amount.toLocaleString()}`;

  // Action handlers
  const handleAccept = () => onSubmit({ acceptAdjustments: true });
  const handleConfirmReject = () => onSubmit({ acceptAdjustments: false });
  const handleConfirmCancel = () => onSubmit({ cancel: true });
  const handleProceedToPayment = () => {
    setPaymentDialogOpen(true);
  };

  // Calculate adjustments data
  const adjustments = proposal.artistAdjustments;
  const hasSurcharge =
    adjustments?.proposedSurcharge || adjustments?.acceptedSurcharge;
  const hasDiscount =
    adjustments?.proposedDiscount || adjustments?.acceptedDiscount;
  const hasAdjustments = hasSurcharge || hasDiscount;

  // Get actual adjustment values (proposed or accepted)
  const surchargeAmount =
    adjustments?.acceptedSurcharge || adjustments?.proposedSurcharge || 0;
  const discountAmount =
    adjustments?.acceptedDiscount || adjustments?.proposedDiscount || 0;

  // Determine adjustment status
  const isAdjustmentProposed =
    adjustments?.proposedDate &&
    !adjustments?.acceptedDate &&
    proposal.status === "pendingClient";

  // Calculate final price
  const finalPrice = isAdjustmentProposed
    ? proposal.calculatedPrice.total + surchargeAmount - discountAmount
    : proposal.calculatedPrice.total;

  return (
    <Box sx={{ width: "100%" }}>
      {/* Pemberitahuan Penyesuaian Harga */}
      {isAdjustmentProposed && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Seniman telah mengajukan penyesuaian harga. Silakan tinjau dan beri
          tanggapan.
        </Alert>
      )}

      {/* Kartu Tanggapan */}
      <Card variant="outlined" sx={{ mb: 3, width: "100%" }} elevation={2}>
        <CardContent>
          {activeView === "cancel" ? (
            /* Tampilan Pembatalan */
            <>
              <Typography variant="h6" gutterBottom color="error">
                Batalkan Proposal
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Apakah Anda yakin ingin membatalkan proposal ini? Tindakan ini
                tidak dapat dibatalkan.
              </Typography>

              <Stack direction="row" spacing={2} justifyContent="center">
                <Button
                  variant="outlined"
                  onClick={() => setActiveView("main")}
                  disabled={loading}
                >
                  Kembali
                </Button>
                <Button
                  variant="contained"
                  color="error"
                  onClick={handleConfirmCancel}
                  disabled={loading}
                >
                  Konfirmasi Pembatalan
                </Button>
              </Stack>
            </>
          ) : activeView === "reject" ? (
            /* Tampilan Penolakan */
            <>
              <Typography variant="h6" gutterBottom color="warning.main">
                Tolak Penyesuaian Seniman
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Menolak akan mengirim proposal kembali ke seniman. Mereka dapat
                melakukan penyesuaian baru atau menerima ketentuan asli.
              </Typography>

              <Stack direction="row" spacing={2} justifyContent="center">
                <Button
                  variant="outlined"
                  onClick={() => setActiveView("main")}
                  disabled={loading}
                >
                  Kembali
                </Button>
                <Button
                  variant="contained"
                  color="warning"
                  onClick={handleConfirmReject}
                  disabled={loading}
                >
                  Tolak Penyesuaian
                </Button>
              </Stack>
            </>
          ) : (
            /* Tampilan Tanggapan Utama */
            <>
              <Typography variant="h6" gutterBottom>
                {proposal.status === "accepted"
                  ? "Lanjutkan ke Pembayaran"
                  : "Tanggapi Proposal"}
              </Typography>

              {/* Tampilkan Penyesuaian Harga */}
              {isAdjustmentProposed && hasAdjustments && (
                <Box
                  sx={{
                    mb: 3,
                    display: "flex",
                    flexDirection: "column",
                    gap: 1,
                  }}
                >
                  <Typography variant="body2" color="text.secondary">
                    Penyesuaian Harga:
                  </Typography>

                  {hasSurcharge && (
                    <Chip
                      label={`Surcharge: +${formatCurrency(surchargeAmount)}`}
                      color="error"
                      variant="outlined"
                      size="small"
                      sx={{ alignSelf: "flex-start" }}
                    />
                  )}

                  {hasDiscount && (
                    <Chip
                      label={`Diskon: -${formatCurrency(discountAmount)}`}
                      color="success"
                      variant="outlined"
                      size="small"
                      sx={{ alignSelf: "flex-start" }}
                    />
                  )}
                </Box>
              )}

              {/* Final Price Display */}
              <Box
                sx={{
                  mb: 3,
                  p: 2,
                  borderRadius: 1,
                  bgcolor: "action.hover",
                  textAlign: "center",
                }}
              >
                <Typography variant="subtitle2" color="text.secondary">
                  Total Akhir
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                  {formatCurrency(finalPrice)}
                </Typography>
              </Box>

              {/* Tombol Aksi */}
              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={2}
                justifyContent="center"
              >
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<CancelIcon />}
                  onClick={() => setActiveView("cancel")}
                  disabled={loading}
                  fullWidth
                >
                  Batalkan Proposal
                </Button>

                {proposal.status === "pendingClient" && (
                  <>
                    <Button
                      variant="outlined"
                      color="warning"
                      onClick={() => setActiveView("reject")}
                      disabled={loading}
                      fullWidth
                    >
                      Tolak Penyesuaian
                    </Button>
                    <Button
                      variant="contained"
                      color="primary"
                      startIcon={<CheckCircleIcon />}
                      onClick={handleAccept}
                      disabled={loading}
                      fullWidth
                    >
                      Terima Penyesuaian
                    </Button>
                  </>
                )}

                {proposal.status === "accepted" && (
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<CheckCircleIcon />}
                    disabled={true}
                    fullWidth
                  >
                    Diterima
                  </Button>
                )}
              </Stack>
            </>
          )}

          {/* Tombol Lanjutkan Pembayaran */}
          {(proposal.status === "accepted" || proposal.status === "paid") && (
            <Button
              variant="contained"
              color="primary"
              startIcon={<CheckCircleIcon />}
              onClick={handleProceedToPayment}
              disabled={loading && proposal.status == "paid"}
              fullWidth
              sx={{ mt: 2 }}
            >
              {proposal.status == "accepted"
                ? "Lanjutkan ke Pembayaran"
                : "Proposal Telah Dibayar"}
            </Button>
          )}

          <UniversalPaymentDialog
            open={paymentDialogOpen}
            onClose={() => setPaymentDialogOpen(false)}
            title="Pembayaran Proposal"
            totalAmount={finalPrice}
            description={`Pembayaran untuk: ${proposal.generalDescription.substring(
              0,
              50
            )}...`}
            onSubmit={async (paymentData) => {
              try {
                const response = await axiosClient.post(
                  "/api/contract/create-from-proposal",
                  {
                    ...paymentData,
                    proposalId: proposal._id.toString(),
                  }
                );

                // Tangani keberhasilan (Anda bisa menambahkan logika tambahan di sini)
                // Misalnya, mengarahkan ke halaman kontrak
                if (response.data.contractId) {
                  window.location.href = `/${username}/contracts/${response.data.contractId}`;
                }
              } catch (err: any) {
                console.error("Error membuat kontrak:", err);
                // Penanganan kesalahan sekarang dilakukan di dalam komponen dialog
              }
            }}
          />
        </CardContent>
      </Card>
    </Box>
  );
}

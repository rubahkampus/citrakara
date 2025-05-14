"use client";

import React, { useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Grid,
  Stack,
  InputAdornment,
  Chip,
  Divider,
} from "@mui/material";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import MoneyOffIcon from "@mui/icons-material/MoneyOff";
import PaymentIcon from "@mui/icons-material/Payment";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { IProposal } from "@/lib/db/models/proposal.model";

interface ArtistRespondFormProps {
  proposal: IProposal;
  loading?: boolean;
  onSubmit: (decision: {
    acceptProposal: boolean;
    surcharge?: number;
    discount?: number;
    rejectionReason?: string;
  }) => void;
}

export default function ArtistRespondForm({
  proposal,
  onSubmit,
  loading = false,
}: ArtistRespondFormProps) {
  // Form state
  const [surcharge, setSurcharge] = useState<number>(0);
  const [discount, setDiscount] = useState<number>(0);
  const [rejectionReason, setRejectionReason] = useState("");
  const [activeView, setActiveView] = useState<"main" | "adjust" | "reject">(
    "main"
  );

  // Format currency helper
  const formatCurrency = (amount: number) => `IDR ${amount.toLocaleString()}`;

  // Action handlers
  const handleAccept = () => onSubmit({ acceptProposal: true });

  const handleSubmitAdjustment = () => {
    onSubmit({
      acceptProposal: true,
      surcharge: surcharge > 0 ? surcharge : undefined,
      discount: discount > 0 ? discount : undefined,
    });
  };

  const handleConfirmReject = () => {
    onSubmit({
      acceptProposal: false,
      rejectionReason: rejectionReason || "Artist declined the proposal",
    });
  };

  // Form reset handlers
  const resetAdjustmentForm = () => {
    setSurcharge(0);
    setDiscount(0);
    setActiveView("main");
  };

  const resetRejectionForm = () => {
    setRejectionReason("");
    setActiveView("main");
  };

  // Calculate new total with adjustments
  const calculateTotal = () =>
    proposal.calculatedPrice.total + surcharge - discount;

  return (
    <Box sx={{ width: "100%" }}>
      <Card
        elevation={2}
        variant="outlined"
        sx={{
          mb: 3,
          borderRadius: 2,
          boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
          overflow: "hidden",
          width: "100%",
        }}
      >
        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
          {activeView === "reject" ? (
            /* Formulir Penolakan */
            <>
              <Typography
                variant="h6"
                gutterBottom
                color="error.main"
                sx={{ display: "flex", alignItems: "center", gap: 1 }}
              >
                <CloseIcon fontSize="small" /> Tolak Proposal
              </Typography>

              <Divider sx={{ my: 2 }} />

              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Harap berikan alasan untuk menolak proposal ini.
              </Typography>

              <TextField
                label="Alasan Penolakan"
                multiline
                rows={3}
                fullWidth
                required
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Jelaskan mengapa Anda menolak proposal ini"
                sx={{
                  mb: 3,
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 1.5,
                    bgcolor: "background.paper",
                  },
                }}
                error={!rejectionReason}
                helperText={
                  !rejectionReason ? "Alasan penolakan wajib diisi" : ""
                }
              />

              <Stack direction="row" spacing={2} justifyContent="flex-end">
                <Button
                  variant="outlined"
                  startIcon={<ArrowBackIcon />}
                  onClick={resetRejectionForm}
                  disabled={loading}
                  sx={{ borderRadius: 1.5 }}
                >
                  Kembali
                </Button>
                <Button
                  variant="contained"
                  color="error"
                  startIcon={<CloseIcon />}
                  onClick={handleConfirmReject}
                  disabled={loading || !rejectionReason}
                  sx={{ borderRadius: 1.5 }}
                >
                  Konfirmasi Penolakan
                </Button>
              </Stack>
            </>
          ) : activeView === "adjust" ? (
            /* Form Penyesuaian */
            <>
              <Typography
                variant="h6"
                gutterBottom
                sx={{ display: "flex", alignItems: "center", gap: 1 }}
              >
                <PaymentIcon fontSize="small" /> Penyesuaian Harga
              </Typography>

              <Divider sx={{ my: 2 }} />

              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Tambahkan biaya tambahan"
                    type="number"
                    fullWidth
                    value={surcharge || ""}
                    onChange={(e) => {
                      const value = Number(e.target.value);
                      setSurcharge(value);
                      // Hapus diskon jika biaya tambahan dimasukkan
                      if (value > 0) setDiscount(0);
                    }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">IDR</InputAdornment>
                      ),
                      endAdornment: surcharge > 0 && (
                        <InputAdornment position="end">
                          <Chip
                            size="small"
                            color="error"
                            label={`+${(
                              (surcharge / proposal.calculatedPrice.total) *
                              100
                            ).toFixed(1)}%`}
                            sx={{ borderRadius: 1 }}
                          />
                        </InputAdornment>
                      ),
                    }}
                    helperText="Biaya tambahan untuk kompleksitas"
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        borderRadius: 1.5,
                        bgcolor: "background.paper",
                      },
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Tawarkan diskon"
                    type="number"
                    fullWidth
                    value={discount || ""}
                    onChange={(e) => {
                      const value = Number(e.target.value);
                      setDiscount(value);
                      // Hapus biaya tambahan jika diskon dimasukkan
                      if (value > 0) setSurcharge(0);
                    }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">IDR</InputAdornment>
                      ),
                      endAdornment: discount > 0 && (
                        <InputAdornment position="end">
                          <Chip
                            size="small"
                            color="success"
                            label={`-${(
                              (discount / proposal.calculatedPrice.total) *
                              100
                            ).toFixed(1)}%`}
                            sx={{ borderRadius: 1 }}
                          />
                        </InputAdornment>
                      ),
                    }}
                    helperText="Diskon untuk mengamankan komisi"
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        borderRadius: 1.5,
                        bgcolor: "background.paper",
                      },
                    }}
                  />
                </Grid>
              </Grid>

              {(surcharge > 0 || discount > 0) && (
                <Box
                  sx={{
                    mb: 3,
                    p: 2.5,
                    bgcolor: surcharge > 0 ? "error.50" : "success.50",
                    borderRadius: 2,
                    textAlign: "center",
                    border: 1,
                    borderColor: surcharge > 0 ? "error.100" : "success.100",
                  }}
                >
                  <Typography
                    variant="subtitle2"
                    color="text.secondary"
                    gutterBottom
                  >
                    Total Baru
                  </Typography>
                  <Typography variant="h5" fontWeight="bold" sx={{ mb: 0.5 }}>
                    {formatCurrency(calculateTotal())}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Asli: {formatCurrency(proposal.calculatedPrice.total)}
                    {surcharge > 0 && ` + ${formatCurrency(surcharge)}`}
                    {discount > 0 && ` - ${formatCurrency(discount)}`}
                  </Typography>
                </Box>
              )}

              <Stack direction="row" spacing={2} justifyContent="flex-end">
                <Button
                  variant="outlined"
                  startIcon={<ArrowBackIcon />}
                  onClick={resetAdjustmentForm}
                  disabled={loading}
                  sx={{ borderRadius: 1.5 }}
                >
                  Kembali
                </Button>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<PaymentIcon />}
                  onClick={handleSubmitAdjustment}
                  disabled={loading || (surcharge === 0 && discount === 0)}
                  sx={{ borderRadius: 1.5 }}
                >
                  Kirim Penyesuaian
                </Button>
              </Stack>
            </>
          ) : (
            /* Tampilan Opsi Utama */
            <>
              <Typography
                variant="h6"
                gutterBottom
                sx={{ display: "flex", alignItems: "center", gap: 1 }}
              >
                Tanggapan Anda
              </Typography>

              <Divider sx={{ my: 2 }} />

              <Box
                sx={{
                  mb: 3,
                  p: 3,
                  borderRadius: 2,
                  bgcolor: "primary.50",
                  textAlign: "center",
                  border: 1,
                  borderColor: "primary.100",
                }}
              >
                <Typography
                  variant="subtitle2"
                  color="text.secondary"
                  gutterBottom
                >
                  Total Proyek
                </Typography>
                <Typography variant="h5" fontWeight="bold">
                  {formatCurrency(proposal.calculatedPrice.total)}
                </Typography>
              </Box>

              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mb: 3, textAlign: "center" }}
              >
                Anda bisa menerima sebagaimana adanya, menyesuaikan harga, atau
                menolak proposal
              </Typography>

              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={2}
                justifyContent="center"
              >
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<CloseIcon />}
                  onClick={() => setActiveView("reject")}
                  disabled={loading}
                  fullWidth
                  sx={{ borderRadius: 1.5, py: 1 }}
                >
                  Tolak
                </Button>

                <Button
                  variant="outlined"
                  color="primary"
                  startIcon={<MoneyOffIcon />}
                  onClick={() => setActiveView("adjust")}
                  disabled={loading}
                  fullWidth
                  sx={{ borderRadius: 1.5, py: 1 }}
                >
                  Sesuaikan Harga
                </Button>

                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<CheckIcon />}
                  onClick={handleAccept}
                  disabled={loading}
                  fullWidth
                  sx={{ borderRadius: 1.5, py: 1 }}
                >
                  Terima Sebagaimana Adanya
                </Button>
              </Stack>
            </>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}

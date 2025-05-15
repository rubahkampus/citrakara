"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  Box,
  Typography,
  useTheme,
  useMediaQuery,
  Slide,
  Grid,
  Stack,
  Fab,
  CircularProgress,
  Tooltip,
  Checkbox,
  FormControlLabel,
  IconButton,
  Button,
  Tab,
  Tabs,
  Chip,
} from "@mui/material";
import {
  Close,
  Chat,
  Send,
  Star,
  Info,
  Gavel,
  ChevronLeft,
  ChevronRight,
} from "@mui/icons-material";
import { TransitionProps } from "@mui/material/transitions";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { axiosClient } from "@/lib/utils/axiosClient";
import type { ICommissionListing } from "@/lib/db/models/commissionListing.model";
import ListingInfoSection from "./listing/ListingInfoSection";
import ListingReviewSection from "./listing/ListingReviewSection";

const TosDialog = dynamic(() => import("./TosDialog"));

interface AuthResponse {
  username: string;
  email: string;
}

const Transition = React.forwardRef(function Transition(
  props: TransitionProps & { children: React.ReactElement },
  ref: React.Ref<unknown>
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

interface CommissionDialogProps {
  open: boolean;
  onClose: () => void;
  commissionId?: string;
  mode?: "view";
  isOwner?: boolean;
  initialData?: ICommissionListing;
}

export default function CommissionDialog({
  open,
  onClose,
  commissionId,
  mode = "view",
  isOwner = false,
  initialData,
}: CommissionDialogProps) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("lg"));
  const router = useRouter();

  const [commission, setCommission] = useState<ICommissionListing | null>(
    initialData || null
  );
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState<string | null>(null);
  const [tosOpen, setTosOpen] = useState(false);
  const [tosAccepted, setTosAccepted] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [ownUsername, setOwnUsername] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);

  // Separate useEffect for authentication status that runs when the dialog opens
  useEffect(() => {
    if (!open) return;

    // Set loading state
    setAuthLoading(true);

    // Check authentication status
    axiosClient
      .get<AuthResponse>("/api/auth/me")
      .then((res) => {
        console.log("Auth success:", res.data); // Debug logging

        // Check if response and user object exist before accessing properties
        if (res?.data?.username) {
          setIsLoggedIn(true);
          setOwnUsername(res.data.username);
        } else {
          console.warn("Auth response missing expected user data structure");
          setIsLoggedIn(false);
          setOwnUsername(null);
        }
      })
      .catch((err) => {
        console.error("Auth check failed:", err); // Debug logging
        setIsLoggedIn(false);
        setOwnUsername(null);
      })
      .finally(() => {
        setAuthLoading(false);
      });
  }, [open]);

  // Separate useEffect for fetching commission data
  useEffect(() => {
    if (!commissionId || !open || initialData) return;

    setLoading(true);
    setError(null);

    axiosClient
      .get(`/api/commission/listing/${commissionId}`)
      .then((res) => {
        console.log("Commission data loaded:", res.data.listing); // Debug logging
        setCommission(res.data.listing);
      })
      .catch((err) => {
        console.error("Failed to load commission:", err); // Debug logging
        setError(err.response?.data?.error || "Gagal memuat komisi");
      })
      .finally(() => setLoading(false));
  }, [commissionId, open, initialData]);

  const formatPrice = (cents: number) =>
    `Rp ${new Intl.NumberFormat("id-ID").format(Math.floor(cents / 100))}`;

  const handleChat = () => {
    if (isOwner) {
      router.push("/dashboard/chat");
    } else {
      router.push("/dashboard/chat?with=" + commissionId);
    }
  };

  const handleRequest = () => {
    if (!commission) return;

    // Check if ToS is accepted
    if (!tosAccepted) {
      setTosOpen(true);
      return;
    }

    // Check if user is logged in
    if (!isLoggedIn || !ownUsername) {
      console.error("User not logged in or username not available");
      // Here you could show a login dialog or redirect to login
      return;
    }

    // Navigate to proposal creation page using the current user's username
    router.push(
      `/${ownUsername}/dashboard/proposals/new?listingId=${commission._id}`
    );

    // Close the dialog after sending to proposal page
    onClose();
  };

  const handleNavigateImage = (direction: "prev" | "next") => {
    if (!commission?.samples?.length) return;

    if (direction === "prev") {
      setActiveImageIndex((prev) =>
        prev === 0 ? commission.samples!.length - 1 : prev - 1
      );
    } else {
      setActiveImageIndex((prev) =>
        prev === commission.samples!.length - 1 ? 0 : prev + 1
      );
    }
  };

  const handleChangeTab = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  if (loading) {
    return (
      <Dialog
        open={open}
        onClose={onClose}
        fullScreen={fullScreen}
        maxWidth="xl"
        fullWidth
        TransitionComponent={Transition}
      >
        <Box sx={{ p: 4, textAlign: "center" }}>
          <CircularProgress />
        </Box>
      </Dialog>
    );
  }

  if (error) {
    return (
      <Dialog
        open={open}
        onClose={onClose}
        fullScreen={fullScreen}
        maxWidth="xl"
        fullWidth
        TransitionComponent={Transition}
      >
        <Box sx={{ p: 4, textAlign: "center" }}>
          <Typography color="error" variant="body1">
            {error}
          </Typography>
        </Box>
      </Dialog>
    );
  }

  if (!commission) return null;

  const { slots, slotsUsed, reviewsSummary, tos } = commission;

  const slotsAvailable = slots === -1 || slotsUsed < slots;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen={fullScreen}
      maxWidth="xl"
      fullWidth
      TransitionComponent={Transition}
      PaperProps={{
        sx: {
          borderRadius: fullScreen ? 0 : 2,
          height: fullScreen ? "100%" : "85vh",
          maxHeight: "85vh",
        },
      }}
    >
      <DialogContent sx={{ p: 0, height: "100%", overflow: 'hidden' }}>
        <Grid container sx={{ height: "100%" }}>
          {/* Image Section */}
          {activeTab === 0 && (
            <Grid
              item
              xs={12}
              md={5}
              lg={4}
              sx={{
                position: "relative",
                height: fullScreen ? "300px" : "100%",
                bgcolor: theme.palette.grey[900],
              }}
            >
              {commission.samples?.length > 0 ? (
                <Box sx={{ height: "100%", position: "relative" }}>
                  <img
                    src={commission.samples[activeImageIndex]}
                    alt={commission.title}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "contain",
                      maxHeight: "100%",
                    }}
                  />
                  {commission.samples.length > 1 && (
                    <>
                      <IconButton
                        sx={{
                          position: "absolute",
                          left: 16,
                          top: "50%",
                          transform: "translateY(-50%)",
                          bgcolor: "rgba(0,0,0,0.5)",
                          color: "white",
                          "&:hover": { bgcolor: "rgba(0,0,0,0.7)" },
                        }}
                        onClick={() => handleNavigateImage("prev")}
                      >
                        <ChevronLeft />
                      </IconButton>
                      <IconButton
                        sx={{
                          position: "absolute",
                          right: 16,
                          top: "50%",
                          transform: "translateY(-50%)",
                          bgcolor: "rgba(0,0,0,0.5)",
                          color: "white",
                          "&:hover": { bgcolor: "rgba(0,0,0,0.7)" },
                        }}
                        onClick={() => handleNavigateImage("next")}
                      >
                        <ChevronRight />
                      </IconButton>
                      <Box
                        sx={{
                          position: "absolute",
                          bottom: 16,
                          left: "50%",
                          transform: "translateX(-50%)",
                          bgcolor: "rgba(0,0,0,0.5)",
                          borderRadius: 5,
                          px: 2,
                          py: 1,
                        }}
                      >
                        <Typography variant="body2" color="white">
                          {activeImageIndex + 1} / {commission.samples.length}
                        </Typography>
                      </Box>
                    </>
                  )}
                </Box>
              ) : (
                <Box
                  sx={{
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Typography color="text.secondary" variant="body1">
                    Tidak Ada Gambar
                  </Typography>
                </Box>
              )}
            </Grid>
          )}

          {/* Content Section */}
          <Grid
            item
            xs={12}
            md={activeTab === 0 ? 7 : 12}
            lg={activeTab === 0 ? 8 : 12}
            sx={{
              display: "flex",
              flexDirection: "column",
              position: "relative",
              height: fullScreen
                ? activeTab === 0
                  ? "calc(100% - 300px)"
                  : "100%"
                : "100%",
            }}
          >
            {/* Close button */}
            <IconButton
              aria-label="close"
              onClick={onClose}
              sx={{
                position: "absolute",
                right: 8,
                top: 8,
                zIndex: 1,
                bgcolor: "background.paper",
                boxShadow: 1,
                "&:hover": { bgcolor: "grey.100" },
              }}
            >
              <Close />
            </IconButton>

            {/* Tabs */}
            <Box sx={{ borderBottom: 1, borderColor: "divider", px: 3, mt: 1 }}>
              <Tabs
                value={activeTab}
                onChange={handleChangeTab}
                aria-label="Tabs komisaris"
              >
                <Tab
                  icon={<Info />}
                  iconPosition="start"
                  label="Informasi"
                  id="tab-0"
                  aria-controls="tabpanel-0"
                />
                <Tab
                  icon={<Star />}
                  iconPosition="start"
                  label={`Ulasan (${reviewsSummary?.count || 0})`}
                  id="tab-1"
                  aria-controls="tabpanel-1"
                />
              </Tabs>
            </Box>

            {/* Tab Panels */}
            <Box
              role="tabpanel"
              hidden={activeTab !== 0}
              id="tabpanel-0"
              aria-labelledby="tab-0"
              sx={{
                flexGrow: 1,
                overflow: "auto",
                display: activeTab === 0 ? "block" : "none",
              }}
            >
              {activeTab === 0 && (
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    height: "100%",
                  }}
                >
                  {/* Header */}
                  <Box sx={{ p: 3, pb: 2 }}>
                    <Typography
                      variant="h5"
                      gutterBottom
                      sx={{ fontWeight: 600, maxWidth: "90%" }}
                    >
                      {commission.title}
                    </Typography>

                    <Stack
                      direction="row"
                      spacing={2}
                      alignItems="center"
                      sx={{ mb: 1.5 }}
                    >
                      <Typography
                        variant="h6"
                        color="primary"
                        sx={{ fontWeight: 600 }}
                      >
                        {formatPrice(commission.price.min)}
                        {commission.price.min !== commission.price.max
                          ? ` - ${formatPrice(commission.price.max)}`
                          : ""}
                      </Typography>
                      <Chip
                        label={
                          commission.type === "template"
                            ? "Karakter Anda (YCH)"
                            : "Komisi Kustom"
                        }
                        size="small"
                        color={
                          commission.type === "template"
                            ? "primary"
                            : "secondary"
                        }
                        sx={{ fontWeight: 600 }}
                      />
                      <Chip
                        label={
                          commission.flow === "standard"
                            ? "Alur Kerja Standar"
                            : "Berbasis Milestone"
                        }
                        size="small"
                        color={
                          commission.flow === "standard" ? "default" : "info"
                        }
                        sx={{ fontWeight: 600 }}
                      />
                      {reviewsSummary?.count > 0 && (
                        <Stack
                          direction="row"
                          alignItems="center"
                          spacing={0.5}
                        >
                          <Star fontSize="small" color="warning" />
                          <Typography variant="body2">
                            {reviewsSummary.avg.toFixed(1)} (
                            {reviewsSummary.count})
                          </Typography>
                        </Stack>
                      )}
                    </Stack>

                    <Stack
                      direction="row"
                      spacing={1}
                      sx={{ flexWrap: "wrap", gap: 1 }}
                    >
                      {commission.tags?.map((tag) => (
                        <Chip
                          key={tag}
                          label={tag}
                          size="small"
                          variant="outlined"
                        />
                      ))}
                    </Stack>
                  </Box>

                  {/* Content Info Section */}
                  <Box sx={{ p: 3, overflowY: "auto", flex: 1 }}>
                    <ListingInfoSection
                      commission={commission}
                      activeImageIndex={activeImageIndex}
                      handleNavigateImage={handleNavigateImage}
                      formatPrice={formatPrice}
                      fullScreen={fullScreen}
                    />

                    {/* TOS Acceptance */}
                    <Stack
                      direction="row"
                      alignItems="center"
                      spacing={2}
                      sx={{ mb: 2 }}
                    >
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={tosAccepted}
                            onChange={(e) => setTosAccepted(e.target.checked)}
                            color="primary"
                            disabled={isOwner}
                          />
                        }
                        label={
                          <Typography variant="body2" fontWeight={500}>
                            Saya telah membaca dan menerima persyaratan
                          </Typography>
                        }
                      />
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<Gavel />}
                        onClick={() => setTosOpen(true)}
                        sx={{ textTransform: "none" }}
                      >
                        Lihat Persyaratan Layanan
                      </Button>
                    </Stack>
                  </Box>
                </Box>
              )}
            </Box>

            <Box
              role="tabpanel"
              hidden={activeTab !== 1}
              id="tabpanel-1"
              aria-labelledby="tab-1"
              sx={{
                flexGrow: 1,
                overflow: "auto",
                display: activeTab === 1 ? "block" : "none",
              }}
            >
              {activeTab === 1 && (
                <ListingReviewSection
                  listingId={commission._id.toString()}
                  reviewsSummary={reviewsSummary || { avg: 0, count: 0 }}
                />
              )}
            </Box>

            {/* Action Buttons - Floating */}
            {!isOwner && (
              <Stack
                direction="row"
                spacing={2}
                sx={{
                  position: "absolute",
                  bottom: 24,
                  right: 24,
                  zIndex: 1,
                }}
              >
                <Tooltip
                  title={
                    authLoading
                      ? "Memeriksa status login..."
                      : !isLoggedIn
                      ? "Login diperlukan"
                      : "Mengobrol dengan seniman"
                  }
                >
                  <span>
                    <Fab
                      color="primary"
                      disabled={authLoading || !isLoggedIn}
                      onClick={handleChat}
                    >
                      {authLoading ? (
                        <CircularProgress size={24} color="inherit" />
                      ) : (
                        <Chat />
                      )}
                    </Fab>
                  </span>
                </Tooltip>
                <Tooltip
                  title={
                    authLoading
                      ? "Memeriksa status login..."
                      : !isLoggedIn
                      ? "Login diperlukan"
                      : !tosAccepted
                      ? "Terima persyaratan terlebih dahulu"
                      : !slotsAvailable
                      ? "Tidak ada slot tersedia"
                      : "Kirim proposal"
                  }
                >
                  <span>
                    <Fab
                      variant="extended"
                      color="primary"
                      disabled={
                        authLoading ||
                        !isLoggedIn ||
                        !tosAccepted ||
                        !slotsAvailable
                      }
                      onClick={handleRequest}
                      sx={{ minWidth: 140 }}
                    >
                      {authLoading ? (
                        <CircularProgress
                          size={24}
                          color="inherit"
                          sx={{ mr: 1 }}
                        />
                      ) : (
                        <Send sx={{ mr: 1 }} />
                      )}
                      {authLoading
                        ? "Memeriksa..."
                        : !slotsAvailable
                        ? "Tidak Ada Slot Kosong"
                        : !tosAccepted
                        ? "Terima Persyaratan"
                        : isLoggedIn
                        ? "Kirim Proposal"
                        : "Login Diperlukan"}
                    </Fab>
                  </span>
                </Tooltip>
              </Stack>
            )}
          </Grid>
        </Grid>
      </DialogContent>

      {/* TOS Dialog */}
      {tos && (
        <TosDialog
          open={tosOpen}
          onClose={() => setTosOpen(false)}
          tosId={tos as unknown as string}
          mode="view"
          isOwner={false}
        />
      )}
    </Dialog>
  );
}

// src/components/dialogs/CommissionDialog.tsx
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
  Chip,
  Stack,
  Fab,
  CircularProgress,
  Tooltip,
  Checkbox,
  FormControlLabel,
  IconButton,
  Paper,
  Divider,
  Button,
} from "@mui/material";
import {
  Close,
  Chat,
  Send,
  AccessTime,
  Receipt,
  Refresh,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Star,
  Info,
  Gavel,
  AssignmentOutlined,
  Description,
  Inventory, // NEW  ➜ icon for slots
} from "@mui/icons-material";
import { TransitionProps } from "@mui/material/transitions";
import Image from "next/image";
import dynamic from "next/dynamic";
import { useDialogStore } from "@/lib/stores";
import { useRouter } from "next/navigation";
import { axiosClient } from "@/lib/utils/axiosClient";
import type { ICommissionListing } from "@/lib/db/models/commissionListing.model";

const TosDialog = dynamic(() => import("./TosDialog"));

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
  mode?: "view" | "edit" | "create";
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
  const { open: openDialog } = useDialogStore();

  const [commission, setCommission] = useState<ICommissionListing | null>(
    initialData || null
  );
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState<string | null>(null);
  const [tosOpen, setTosOpen] = useState(false);
  const [tosAccepted, setTosAccepted] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    // Check login status
    axiosClient
      .get("/api/auth/me")
      .then(() => setIsLoggedIn(true))
      .catch(() => setIsLoggedIn(false));
  }, []);

  useEffect(() => {
    if (!commissionId || !open || initialData) return;
    setLoading(true);
    setError(null);
    axiosClient
      .get(`/api/commission/listing/${commissionId}`)
      .then((res) => setCommission(res.data.listing))
      .catch((err) =>
        setError(err.response?.data?.error || "Failed to load commission")
      )
      .finally(() => setLoading(false));
  }, [commissionId, open, initialData]);

  const formatPrice = (cents: number) =>
    `IDR ${new Intl.NumberFormat("id-ID").format(cents / 100)}`;

  const handleChat = () => {
    if (isOwner) {
      router.push("/dashboard/chat");
    } else {
      router.push("/dashboard/chat?with=" + commissionId);
    }
  };

  const handleRequest = () => {
    if (!commission) return;
    axiosClient
      .post("/api/commission/request", { listingId: commission._id })
      .then(() => {
        onClose();
        router.push("/dashboard/commissions/sent");
      })
      .catch((err) => {
        if (err.response?.status === 401) {
          onClose();
          openDialog("login");
        } else if (err.response?.data?.code === "TOS_NOT_ACCEPTED") {
          setTosOpen(true);
        } else {
          setError(err.response?.data?.error || "Failed to send request");
        }
      });
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

  const {
    title,
    tags,
    samples,
    price,
    description,
    type,
    flow,
    deadline,
    cancelationFee,
    revisions,
    milestones,
    allowContractChange,
    changeable,
    tos,
    slots,
    slotsUsed,
    reviewsSummary,
  } = commission;

  const priceDisplay =
    `${formatPrice(price.min)}` +
    (price.min !== price.max ? ` - ${formatPrice(price.max)}` : "");

  const slotsAvailable = slots === -1 || slotsUsed < slots;

  const slotsRemaining =
    slots === -1 ? "Unlimited" : `${Math.max(slots - slotsUsed, 0)} / ${slots}`;

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
      <DialogContent sx={{ p: 0, height: "100%" }}>
        <Grid container sx={{ height: "100%" }}>
          {/* Image Section */}
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
            {samples?.length > 0 ? (
              <Box sx={{ height: "100%", position: "relative" }}>
                <Image
                  src={samples[activeImageIndex]}
                  alt={title}
                  fill
                  style={{ objectFit: "contain" }}
                  unoptimized
                />
                {samples.length > 1 && (
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
                        {activeImageIndex + 1} / {samples.length}
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
                  No Image Available
                </Typography>
              </Box>
            )}
          </Grid>

          {/* Content Section */}
          <Grid
            item
            xs={12}
            md={7}
            lg={8}
            sx={{
              display: "flex",
              flexDirection: "column",
              position: "relative",
              height: fullScreen ? "calc(100% - 300px)" : "100%",
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

            {/* Header */}
            <Box sx={{ p: 3, pb: 2 }}>
              <Typography
                variant="h5"
                gutterBottom
                sx={{ fontWeight: 600, maxWidth: "90%" }}
              >
                {title}
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
                  {priceDisplay}
                </Typography>
                <Chip
                  label={
                    type === "template"
                      ? "Your Character Here (YCH)"
                      : "Custom Commission"
                  }
                  size="small"
                  color={type === "template" ? "primary" : "secondary"}
                  sx={{ fontWeight: 600 }}
                />
                <Chip
                  label={
                    flow === "standard"
                      ? "Standard Workflow"
                      : "Milestone-based"
                  }
                  size="small"
                  color={flow === "standard" ? "default" : "info"}
                  sx={{ fontWeight: 600 }}
                />
                {reviewsSummary?.count > 0 && (
                  <Stack direction="row" alignItems="center" spacing={0.5}>
                    <Star fontSize="small" color="warning" />
                    <Typography variant="body2">
                      {reviewsSummary.avg.toFixed(1)} ({reviewsSummary.count})
                    </Typography>
                  </Stack>
                )}
              </Stack>

              <Stack
                direction="row"
                spacing={1}
                sx={{ flexWrap: "wrap", gap: 1 }}
              >
                {tags?.map((tag) => (
                  <Chip key={tag} label={tag} size="small" variant="outlined" />
                ))}
              </Stack>
            </Box>

            {/* Content */}
            <Box sx={{ p: 3, overflowY: "auto", flex: 1 }}>
              {/* Slots */}
              <Paper elevation={0} variant="outlined" sx={{ p: 2, mb: 3 }}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Inventory fontSize="small" color="action" />
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Slots
                    </Typography>
                    <Typography variant="subtitle2">
                      {slotsRemaining}
                    </Typography>
                  </Box>
                </Stack>
              </Paper>
              {/* Description */}
              <Paper elevation={0} variant="outlined" sx={{ p: 2, mb: 3 }}>
                <Stack
                  direction="row"
                  alignItems="center"
                  spacing={1}
                  sx={{ mb: 2 }}
                >
                  <Description color="primary" />
                  <Typography variant="subtitle1" fontWeight={600}>
                    Commission Details
                  </Typography>
                </Stack>
                {description?.length ? (
                  description.map((d, i) => (
                    <Box key={i} sx={{ mb: 1.5 }}>
                      <Typography variant="subtitle2" fontWeight={500}>
                        {d.title}
                      </Typography>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ whiteSpace: "pre-wrap" }}
                      >
                        {d.detail}
                      </Typography>
                    </Box>
                  ))
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No description provided.
                  </Typography>
                )}
              </Paper>

              {/* Specs grid */}
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={4}>
                  <Paper elevation={0} variant="outlined" sx={{ p: 2 }}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <AccessTime fontSize="small" color="action" />
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Delivery Timeline
                        </Typography>
                        <Typography variant="subtitle2">
                          {deadline.min}-{deadline.max} days
                        </Typography>
                        {deadline.mode === "withRush" && deadline.rushFee && (
                          <Typography variant="caption" color="primary">
                            Rush delivery available (+
                            {deadline.rushFee.kind === "flat"
                              ? formatPrice(deadline.rushFee.amount)
                              : `${deadline.rushFee.amount}/day`}
                            )
                          </Typography>
                        )}
                      </Box>
                    </Stack>
                  </Paper>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Paper elevation={0} variant="outlined" sx={{ p: 2 }}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Refresh fontSize="small" color="action" />
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Revision Policy
                        </Typography>
                        <Typography variant="subtitle2">
                          {revisions?.type === "none"
                            ? "No revisions"
                            : revisions?.type === "standard"
                            ? revisions?.policy?.limit
                              ? revisions?.policy?.free == 0
                                ? "Paid Only"
                                : `${revisions.policy.free} free revisions`
                              : "Unlimited free revisions"
                            : "Milestone-based"}
                        </Typography>
                        {revisions?.policy?.limit &&
                          revisions.policy.extraAllowed && (
                            <Typography variant="caption" color="primary">
                              Paid revisions:{" "}
                              {formatPrice(revisions.policy.fee)} each
                            </Typography>
                          )}
                      </Box>
                    </Stack>
                  </Paper>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Paper elevation={0} variant="outlined" sx={{ p: 2 }}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Receipt fontSize="small" color="action" />
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Cancellation Fee
                        </Typography>
                        <Typography variant="subtitle2">
                          {cancelationFee.kind === "flat"
                            ? formatPrice(cancelationFee.amount)
                            : `${cancelationFee.amount}% of price`}
                        </Typography>
                      </Box>
                    </Stack>
                  </Paper>
                </Grid>
              </Grid>

              {/* Milestones (if flow is milestone) */}
              {flow === "milestone" && milestones && milestones.length > 0 && (
                <Paper elevation={0} variant="outlined" sx={{ p: 2, mb: 3 }}>
                  <Stack
                    direction="row"
                    alignItems="center"
                    spacing={1}
                    sx={{ mb: 2 }}
                  >
                    <AssignmentOutlined color="primary" />
                    <Typography variant="subtitle1" fontWeight={600}>
                      Milestone Schedule
                    </Typography>
                  </Stack>
                  <Grid container spacing={2}>
                    {milestones.map((milestone, i) => (
                      <Grid item xs={12} sm={6} md={4} key={i}>
                        <Paper
                          elevation={0}
                          variant="outlined"
                          sx={{ p: 2, bgcolor: theme.palette.grey[50] }}
                        >
                          <Typography variant="subtitle2" fontWeight={600}>
                            {i + 1}. {milestone.title}
                          </Typography>
                          <Typography variant="body2" color="primary">
                            {milestone.percent}% payment
                          </Typography>
                          {milestone.policy && (
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              {milestone.policy.limit
                                ? `${milestone.policy.free} free revisions`
                                : "Unlimited revisions"}
                              {milestone.policy.limit &&
                                milestone.policy.extraAllowed &&
                                `, then ${formatPrice(
                                  milestone.policy.fee
                                )} each`}
                            </Typography>
                          )}
                        </Paper>
                      </Grid>
                    ))}
                  </Grid>
                </Paper>
              )}

              {/* Contract Terms */}
              <Paper
                elevation={0}
                variant="outlined"
                sx={{
                  p: 2,
                  mb: 3,
                  bgcolor: theme.palette.primary.light,
                  color: theme.palette.primary.contrastText,
                }}
              >
                <Stack
                  direction="row"
                  alignItems="center"
                  spacing={1}
                  sx={{ mb: 2 }}
                >
                  <Gavel />
                  <Typography variant="subtitle1" fontWeight={600}>
                    Contract Terms
                  </Typography>
                </Stack>
                <Stack spacing={1}>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <CheckCircle fontSize="small" />
                    <Typography variant="body2">
                      Contract modifications:{" "}
                      {allowContractChange ? "Allowed" : "Not allowed"}
                    </Typography>
                  </Stack>
                  {allowContractChange &&
                    changeable &&
                    changeable.length > 0 && (
                      <Typography variant="body2" sx={{ ml: 4 }}>
                        Can modify:{" "}
                        {changeable
                          .map((item) =>
                            item
                              .replace(/([A-Z])/g, " $1")
                              .replace(/^./, (str) => str.toUpperCase())
                              .trim()
                          )
                          .join(", ")}
                      </Typography>
                    )}
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Info fontSize="small" />
                    <Typography variant="body2">
                      By proceeding, you agree to the artist's terms of service
                    </Typography>
                  </Stack>
                </Stack>
              </Paper>

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
                      I have read and accept the terms
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
                  View Terms of Service
                </Button>
              </Stack>
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
                  title={!isLoggedIn ? "Login required" : "Chat with artist"}
                >
                  <span>
                    <Fab
                      color="primary"
                      disabled={!isLoggedIn}
                      onClick={handleChat}
                    >
                      <Chat />
                    </Fab>
                  </span>
                </Tooltip>
                <Tooltip
                  title={
                    !isLoggedIn
                      ? "Login required"
                      : !tosAccepted
                      ? "Accept terms first"
                      : !slotsAvailable
                      ? "No slots available"
                      : "Send proposal"
                  }
                >
                  <span>
                    <Fab
                      variant="extended"
                      color="primary"
                      disabled={!isLoggedIn || !tosAccepted || !slotsAvailable}
                      onClick={handleRequest}
                      sx={{ minWidth: 140 }}
                    >
                      <Send sx={{ mr: 1 }} />
                      {!slotsAvailable
                        ? "No Empty Slot"
                        : !tosAccepted
                        ? "Accept Artist's TOS"
                        : isLoggedIn
                        ? "Send Proposal"
                        : "Login Required"}
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

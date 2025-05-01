// src/components/dialogs/CommissionDialog.tsx
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Divider,
  IconButton,
  useTheme,
  useMediaQuery,
  Slide,
  Grid,
  Paper,
  Tooltip,
  Chip,
} from "@mui/material";
import { Close as CloseIcon, Chat as ChatIcon } from "@mui/icons-material";
import { TransitionProps } from "@mui/material/transitions";
import React from "react";
import Image from "next/image";
import { KButton } from "@/components/KButton";
import { useDialogStore } from "@/lib/stores";
import { useRouter } from "next/navigation";
import { axiosClient } from "@/lib/utils/axiosClient";

// Interface for commission data
interface CommissionData {
  id: string;
  title: string;
  description: string;
  price: { min: number; max: number };
  currency: string;
  thumbnail: string;
  isActive: boolean;
  slots: number;
  slotsUsed: number;
}

// Mock data for commission details (can be replaced later)
const mockCommissionDetails: Record<string, CommissionData> = {
  c1: {
    id: "c1",
    title: "A Very, Very, Long Text for Reference Furry Commission 1",
    description:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus blandit nisi arcu, nec fringilla odio molestie tincidunt. Pellentesque id rutrum velit, non fermentum urna.\n\nThis commission includes:\n- Full color illustration\n- High resolution file\n- Commercial rights for personal use\n- Up to 2 characters\n\nThe expected delivery time is 2-3 weeks depending on complexity.",
    price: { min: 999999999, max: 999999999 },
    currency: "Rp",
    thumbnail: "/placeholders/comm1.jpg",
    isActive: true,
    slots: 5,
    slotsUsed: 2,
  },
  c2: {
    id: "c2",
    title: "A Very, Very, Long Text for Reference Furry Commission 2",
    description:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus blandit nisi arcu, nec fringilla odio molestie tincidunt. Pellentesque id rutrum velit, non fermentum urna.\n\nDetails:\n- Black and white illustration\n- Single character\n- Simple background\n- 2 free revisions included\n\nPlease note that additional characters or complex backgrounds will incur extra charges.",
    price: { min: 999999999, max: 999999999 },
    currency: "Rp",
    thumbnail: "/placeholders/comm2.jpg",
    isActive: true,
    slots: 3,
    slotsUsed: 3,
  },
};

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
  initialData?: any;
}

export default function CommissionDialog({
  open,
  onClose,
  commissionId,
  mode = "view",
  isOwner = false,
  initialData = null,
}: CommissionDialogProps) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("md"));
  const router = useRouter();
  const { open: openDialog } = useDialogStore();
  const [commission, setCommission] = useState<CommissionData | null>(null);
  const [loading, setLoading] = useState(false);

  // For real data, uncomment this and comment out the useEffect below
  /*
  useEffect(() => {
    if (!commissionId || !open) return;
    
    const fetchCommissionDetails = async () => {
      try {
        setLoading(true);
        const response = await axiosClient.get(`/api/commission/listing/${commissionId}`);
        setCommission(response.data.listing);
      } catch (error) {
        console.error('Error fetching commission details:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchCommissionDetails();
  }, [commissionId, open]);
  */

  // Mock data loading
  useEffect(() => {
    if (!commissionId || !open) return;

    setLoading(true);
    // Simulate API request
    setTimeout(() => {
      setCommission(mockCommissionDetails[commissionId] || null);
      setLoading(false);
    }, 500);
  }, [commissionId, open]);

  const handleChatClick = () => {
    // For owners, go to chat dashboard
    if (isOwner) {
      router.push("/dashboard/chat");
      onClose();
      return;
    }

    // For visitors, check login status first (mock for now)
    const isLoggedIn = true; // Replace with actual auth check

    if (isLoggedIn) {
      router.push("/dashboard/chat");
      onClose();
    } else {
      openDialog("login");
    }
  };

  const handleSendRequest = () => {
    // TODO: Implement request submission
    console.log("Sending request for commission:", commissionId);
    onClose();
  };

  // Format price range
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("id-ID").format(price);
  };

  if (!commission && mode !== "create") return null;

  const priceDisplay = commission
    ? `${commission.currency}${formatPrice(commission.price.min)}${
        commission.price.min !== commission.price.max
          ? ` - ${formatPrice(commission.price.max)}`
          : ""
      }`
    : "";

  // Check if slots are available
  const slotsAvailable = commission
    ? commission.slots === -1 || commission.slotsUsed < commission.slots
    : true;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen={fullScreen}
      maxWidth="md"
      fullWidth
      TransitionComponent={Transition}
      PaperProps={{
        sx: {
          borderRadius: fullScreen ? 0 : 3,
          overflow: "hidden",
        },
      }}
    >
      {/* Header */}
      <Box
        sx={{
          p: 3,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Typography variant="h6" fontWeight="bold">
          {mode === "create"
            ? "Create Commission"
            : mode === "edit"
            ? "Edit Commission"
            : "Commission Details"}
        </Typography>
        <IconButton onClick={onClose} edge="end">
          <CloseIcon />
        </IconButton>
      </Box>
      <Divider />

      <DialogContent sx={{ p: 0 }}>
        {mode === "create" ? (
          <Box sx={{ p: 3 }}>
            <Typography>Create commission form will go here</Typography>
          </Box>
        ) : mode === "edit" ? (
          <Box sx={{ p: 3 }}>
            <Typography>Edit commission form will go here</Typography>
          </Box>
        ) : (
          commission && (
            <Grid container>
              {/* Image section */}
              <Grid item xs={12} md={5}>
                <Box
                  sx={{
                    position: "relative",
                    height: { xs: 250, md: "100%" },
                    minHeight: { md: 400 },
                    bgcolor: "background.default",
                  }}
                >
                  {commission.thumbnail ? (
                    <Image
                      src={commission.thumbnail}
                      alt={commission.title}
                      layout="fill"
                      objectFit="cover"
                      unoptimized={true}
                    />
                  ) : (
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        height: "100%",
                        bgcolor: theme.palette.divider,
                      }}
                    >
                      <Typography variant="body1" color="text.secondary">
                        No Image
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Grid>

              {/* Details section */}
              <Grid item xs={12} md={7}>
                <Box sx={{ p: 3 }}>
                  <Typography variant="h5" fontWeight="bold" gutterBottom>
                    {commission.title}
                  </Typography>

                  <Box
                    sx={{ display: "flex", alignItems: "center", mt: 1, mb: 3 }}
                  >
                    <Typography
                      variant="h6"
                      fontWeight="bold"
                      color="primary.main"
                    >
                      {priceDisplay}
                    </Typography>

                    {!slotsAvailable && (
                      <Chip
                        label="Slot Unavailable"
                        size="small"
                        color="default"
                        sx={{ ml: 2 }}
                      />
                    )}
                  </Box>

                  <Typography variant="body1" fontWeight="medium" gutterBottom>
                    Description
                  </Typography>

                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      whiteSpace: "pre-line",
                      mb: 3,
                    }}
                  >
                    {commission.description}
                  </Typography>

                  {/* Slot information */}
                  <Paper
                    variant="outlined"
                    sx={{ p: 2, mb: 3, borderRadius: 2 }}
                  >
                    <Typography variant="body2" fontWeight="medium">
                      Availability
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {commission.slots === -1
                        ? "Unlimited slots available"
                        : `${commission.slots - commission.slotsUsed} out of ${
                            commission.slots
                          } slots available`}
                    </Typography>
                  </Paper>
                </Box>
              </Grid>
            </Grid>
          )
        )}
      </DialogContent>

      <Divider />

      {/* Actions */}
      <DialogActions sx={{ p: 3 }}>
        {mode === "view" && !isOwner && (
          <>
            <Tooltip title="Message about this commission">
              <KButton
                variantType="ghost"
                onClick={handleChatClick}
                startIcon={<ChatIcon />}
              >
                Message
              </KButton>
            </Tooltip>

            <KButton onClick={handleSendRequest} disabled={!slotsAvailable}>
              {slotsAvailable ? "Send Request" : "Unavailable"}
            </KButton>
          </>
        )}

        {(mode === "create" || mode === "edit") && (
          <>
            <KButton variantType="ghost" onClick={onClose}>
              Cancel
            </KButton>
            <KButton>
              {mode === "create" ? "Create Commission" : "Save Changes"}
            </KButton>
          </>
        )}

        {mode === "view" && isOwner && (
          <KButton onClick={onClose}>Close</KButton>
        )}
      </DialogActions>
    </Dialog>
  );
}

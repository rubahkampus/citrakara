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
import { ICommissionListing } from "@/lib/db/models/commissionListing.model";


// const mockCommissionDetails: Record<string, ICommissionListing> = {
//   c1: {
//     id: "c1",
//     title: "A Very, Very, Long Text for Reference Furry Commission 1",
//     // description:
//     //   "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus blandit nisi arcu, nec fringilla odio molestie tincidunt. Pellentesque id rutrum velit, non fermentum urna.\n\nThis commission includes:\n- Full color illustration\n- High resolution file\n- Commercial rights for personal use\n- Up to 2 characters\n\nThe expected delivery time is 2-3 weeks depending on complexity.",
//     price: { min: 999999999, max: 999999999 },
//     currency: "Rp",
//     samples: ["/placeholders/comm1.jpg"],
//     thumbnailIdx: 0,
//     isActive: true,
//     slots: 5,
//     slotsUsed: 2,
//   },
//   c2: {
//     id: "c2",
//     title: "A Very, Very, Long Text for Reference Furry Commission 2",
//     // description:
//     //   "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus blandit nisi arcu, nec fringilla odio molestie tincidunt. Pellentesque id rutrum velit, non fermentum urna.\n\nDetails:\n- Black and white illustration\n- Single character\n- Simple background\n- 2 free revisions included\n\nPlease note that additional characters or complex backgrounds will incur extra charges.",
//     price: { min: 999999999, max: 999999999 },
//     currency: "Rp",
//     samples: ["/placeholders/comm1.jpg"],
//     thumbnailIdx: 0,
//     isActive: true,
//     slots: 3,
//     slotsUsed: 3,
//   },
// };

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
  isOwner?: boolean;
}

export default function CommissionDialog({
  open,
  onClose,
  commissionId,
  isOwner = false,
}: CommissionDialogProps) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("md"));
  const router = useRouter();
  const { open: openDialog } = useDialogStore();
  const [commission, setCommission] = useState<ICommissionListing | null>(null);
  const [loading, setLoading] = useState(false);

  // useEffect(() => {
  //   if (!commissionId || !open) return;

  //   setLoading(true);
  //   setTimeout(() => {
  //     setCommission(mockCommissionDetails[commissionId] || null);
  //     setLoading(false);
  //   }, 500);
  // }, [commissionId, open]);

  const handleChatClick = () => {
    if (isOwner) {
      router.push("/dashboard/chat");
      onClose();
      return;
    }

    const isLoggedIn = true;
    if (isLoggedIn) {
      router.push("/dashboard/chat");
      onClose();
    } else {
      openDialog("login");
    }
  };

  const handleSendRequest = () => {
    console.log("Sending request for commission:", commissionId);
    onClose();
  };

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("id-ID").format(price);

  if (!commission) return null;

  const priceDisplay =
    `${commission.currency}${formatPrice(commission.price.min)}` +
    (commission.price.min !== commission.price.max
      ? ` - ${formatPrice(commission.price.max)}`
      : "");

  const slotsAvailable =
    commission.slots === -1 || commission.slotsUsed < commission.slots;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen={fullScreen}
      maxWidth="md"
      fullWidth
      TransitionComponent={Transition}
      PaperProps={{
        sx: { borderRadius: fullScreen ? 0 : 3, overflow: "hidden" },
      }}
    >
      <Box
        sx={{
          p: 3,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Typography variant="h6" fontWeight="bold">
          Commission Details
        </Typography>
        <IconButton onClick={onClose} edge="end">
          <CloseIcon />
        </IconButton>
      </Box>
      <Divider />

      <DialogContent sx={{ p: 0 }}>
        <Grid container>
          <Grid item xs={12} md={5}>
            <Box
              sx={{
                position: "relative",
                height: { xs: 250, md: "100%" },
                minHeight: { md: 400 },
                bgcolor: "background.default",
              }}
            >
              {commission.samples.length > 0 && commission.thumbnailIdx && (commission.samples.length >= commission.thumbnailIdx) ? (
                <Image
                  src={commission.samples[commission.thumbnailIdx]}
                  alt={commission.title}
                  layout="fill"
                  objectFit="cover"
                  unoptimized
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

          <Grid item xs={12} md={7}>
            <Box sx={{ p: 3 }}>
              <Typography variant="h5" fontWeight="bold" gutterBottom>
                {commission.title}
              </Typography>

              <Box sx={{ display: "flex", alignItems: "center", mt: 1, mb: 3 }}>
                <Typography variant="h6" fontWeight="bold" color="primary.main">
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
                sx={{ whiteSpace: "pre-line", mb: 3 }}
              >
                {Array.isArray(commission.description) ? (
                  commission.description.map((item, index) => (
                    <Box key={index} sx={{ mb: 1 }}>
                      <Typography variant="body2" fontWeight="bold">
                        {item.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {item.detail}
                      </Typography>
                    </Box>
                  ))
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    {commission.description}
                  </Typography>
                )}
              </Typography>

              <Paper variant="outlined" sx={{ p: 2, mb: 3, borderRadius: 2 }}>
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
      </DialogContent>

      <Divider />

      <DialogActions sx={{ p: 3 }}>
        {!isOwner ? (
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
        ) : (
          <KButton onClick={onClose}>Close</KButton>
        )}
      </DialogActions>
    </Dialog>
  );
}

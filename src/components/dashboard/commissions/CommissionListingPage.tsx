// src/components/dashboard/commissions/CommissionListingPage.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Grid,
  Paper,
  Typography,
  Alert,
  Button,
  Chip,
  Card,
  CardContent,
  CardMedia,
  CardActions,
  IconButton,
  Menu,
  MenuItem,
  Divider,
} from "@mui/material";
import {
  Add as AddIcon,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
} from "@mui/icons-material";
import { KButton } from "@/components/KButton";
import { axiosClient } from "@/lib/utils/axiosClient";

interface CommissionListingPageProps {
  username: string;
  listings: any[];
  error: string | null;
}

export default function CommissionListingPage({
  username,
  listings,
  error: initialError,
}: CommissionListingPageProps) {
  const router = useRouter();
  const [localListings, setLocalListings] = useState(listings);
  const [error, setError] = useState<string | null>(initialError);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState<Record<string, boolean>>({});

  // Menu state
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [activeListingId, setActiveListingId] = useState<string | null>(null);

  // Handlers
  const handleCreateNew = () => {
    router.push(`/${username}/dashboard/commissions/new`);
  };

  const handleMenuOpen = (
    e: React.MouseEvent<HTMLElement>,
    listingId: string
  ) => {
    e.stopPropagation();
    setMenuAnchorEl(e.currentTarget);
    setActiveListingId(listingId);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
    setActiveListingId(null);
  };

  const handleEditCommission = () => {
    if (activeListingId) {
      router.push(`/${username}/dashboard/commissions/${activeListingId}`);
    }
    handleMenuClose();
  };

  const handleToggleActive = async () => {
    if (!activeListingId) return;

    const listing = localListings.find((l) => l._id === activeListingId);
    if (!listing) return;

    setLoading((prev) => ({ ...prev, [activeListingId]: true }));

    try {
      const newStatus = !listing.isActive;
      const response = await axiosClient.patch(
        `/api/commission/listing/${activeListingId}`,
        { active: newStatus }
      );

      // Update the local state
      setLocalListings((prev) =>
        prev.map((l) =>
          l._id === activeListingId ? { ...l, isActive: newStatus } : l
        )
      );

      setSuccess(
        `Commission ${newStatus ? "activated" : "deactivated"} successfully`
      );
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(
        err.response?.data?.error || "Failed to update commission status"
      );
    } finally {
      setLoading((prev) => ({ ...prev, [activeListingId]: false }));
    }

    handleMenuClose();
  };

  const handleDeleteCommission = async () => {
    if (!activeListingId) return;

    // Confirm deletion
    if (
      !window.confirm(
        "Are you sure you want to delete this commission? This action cannot be undone."
      )
    ) {
      handleMenuClose();
      return;
    }

    setLoading((prev) => ({ ...prev, [activeListingId]: true }));

    try {
      await axiosClient.delete(`/api/commission/listing/${activeListingId}`);

      // Update the local state
      setLocalListings((prev) => prev.filter((l) => l._id !== activeListingId));

      setSuccess("Commission deleted successfully");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to delete commission");
    } finally {
      setLoading((prev) => ({ ...prev, [activeListingId]: false }));
    }

    handleMenuClose();
  };

  return (
    <Box>
      {/* Action button */}
      <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 3 }}>
        <KButton startIcon={<AddIcon />} onClick={handleCreateNew}>
          Create New Commission
        </KButton>
      </Box>

      {/* Error and success messages */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert
          severity="success"
          sx={{ mb: 3 }}
          onClose={() => setSuccess(null)}
        >
          {success}
        </Alert>
      )}

      {/* Commission listing grid */}
      {localListings.length === 0 ? (
        <Paper
          sx={{
            p: 4,
            textAlign: "center",
            borderRadius: 2,
            border: "1px solid",
            borderColor: "divider",
          }}
        >
          <Typography variant="body1" color="text.secondary" gutterBottom>
            You don't have any commission listings yet.
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleCreateNew}
            sx={{ mt: 2 }}
          >
            Create Your First Commission
          </Button>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {localListings.map((listing) => (
            <Grid item xs={12} sm={6} lg={4} key={listing._id}>
              <Card
                sx={{
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  borderRadius: 2,
                  position: "relative",
                  transition:
                    "transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out",
                  "&:hover": {
                    transform: "translateY(-4px)",
                    boxShadow: 3,
                  },
                  opacity: listing.isActive ? 1 : 0.7,
                }}
              >
                {!listing.isActive && (
                  <Chip
                    label="Inactive"
                    color="default"
                    size="small"
                    sx={{
                      position: "absolute",
                      top: 12,
                      left: 12,
                      zIndex: 1,
                    }}
                  />
                )}

                <IconButton
                  sx={{
                    position: "absolute",
                    top: 8,
                    right: 8,
                    bgcolor: "rgba(255,255,255,0.7)",
                    "&:hover": { bgcolor: "rgba(255,255,255,0.9)" },
                  }}
                  onClick={(e) => handleMenuOpen(e, listing._id)}
                >
                  <MoreVertIcon />
                </IconButton>

                <CardMedia
                  component="img"
                  height="180"
                  image={listing.thumbnail}
                  alt={listing.title}
                  sx={{ objectFit: "cover" }}
                />

                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography variant="h6" component="div" gutterBottom noWrap>
                    {listing.title}
                  </Typography>

                  <Typography
                    variant="body2"
                    color="text.secondary"
                    gutterBottom
                  >
                    {listing.flow === "standard"
                      ? "Standard Flow"
                      : "Milestone Flow"}
                  </Typography>

                  <Typography variant="h6" color="primary" gutterBottom>
                    {listing.currency} {listing.price.min.toLocaleString()}
                    {listing.price.min !== listing.price.max &&
                      ` - ${listing.price.max.toLocaleString()}`}
                  </Typography>

                  <Box
                    sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mt: 1 }}
                  >
                    {listing.tags.slice(0, 3).map((tag: string) => (
                      <Chip
                        key={tag}
                        label={tag}
                        size="small"
                        sx={{ fontSize: "0.7rem" }}
                      />
                    ))}
                    {listing.tags.length > 3 && (
                      <Chip
                        label={`+${listing.tags.length - 3}`}
                        size="small"
                        variant="outlined"
                        sx={{ fontSize: "0.7rem" }}
                      />
                    )}
                  </Box>
                </CardContent>

                <Divider />

                <CardActions sx={{ justifyContent: "space-between" }}>
                  <Button
                    size="small"
                    onClick={() =>
                      router.push(
                        `/${username}/dashboard/commissions/${listing._id}`
                      )
                    }
                  >
                    Edit
                  </Button>
                  <Typography variant="caption" color="text.secondary">
                    {listing.slots === -1
                      ? "Unlimited slots"
                      : `${listing.slots - listing.slotsUsed}/${
                          listing.slots
                        } slots available`}
                  </Typography>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Action menu */}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleEditCommission}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          Edit Commission
        </MenuItem>

        {activeListingId && (
          <MenuItem onClick={handleToggleActive}>
            <ListItemIcon>
              {localListings.find((l) => l._id === activeListingId)
                ?.isActive ? (
                <VisibilityOffIcon fontSize="small" />
              ) : (
                <VisibilityIcon fontSize="small" />
              )}
            </ListItemIcon>
            {localListings.find((l) => l._id === activeListingId)?.isActive
              ? "Deactivate"
              : "Activate"}
          </MenuItem>
        )}

        <MenuItem onClick={handleDeleteCommission} sx={{ color: "error.main" }}>
          <ListItemIcon sx={{ color: "error.main" }}>
            <DeleteIcon fontSize="small" />
          </ListItemIcon>
          Delete
        </MenuItem>
      </Menu>
    </Box>
  );
}

interface ListItemIconProps {
  children: React.ReactNode;
  sx?: any;
}

function ListItemIcon({ children, sx }: ListItemIconProps) {
  return (
    <Box
      sx={{
        mr: 2,
        display: "inline-flex",
        justifyContent: "center",
        ...sx,
      }}
    >
      {children}
    </Box>
  );
}

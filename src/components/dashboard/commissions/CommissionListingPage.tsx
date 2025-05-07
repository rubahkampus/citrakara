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
import { ICommissionListing } from "@/lib/db/models/commissionListing.model";

interface CommissionListingPageProps {
  username: string;
  listings: ICommissionListing[];
  error: string | null;
}

interface ListItemIconProps {
  children: React.ReactNode;
  sx?: any;
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
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [activeListingId, setActiveListingId] = useState<string | null>(null);

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

    const listing = localListings.find((l) => l._id.toString() === activeListingId);
    if (!listing) return;

    setLoading((prev) => ({ ...prev, [activeListingId]: true }));

    try {
      const newStatus = !listing.isActive;
      await axiosClient.patch(`/api/commission/listing/${activeListingId}`, {
        active: newStatus,
      });

      setLocalListings((prev) =>
        prev.map((l) =>
          l._id.toString() === activeListingId
            ? { ...l, isActive: newStatus } as ICommissionListing
            : l
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
      setLocalListings((prev) => prev.filter((l) => l._id.toString() !== activeListingId));
      setSuccess("Commission deleted successfully");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to delete commission");
    } finally {
      setLoading((prev) => ({ ...prev, [activeListingId]: false }));
    }

    handleMenuClose();
  };

  function ListItemIcon({ children, sx }: ListItemIconProps) {
    return (
      <Box
        sx={{ mr: 2, display: "inline-flex", justifyContent: "center", ...sx }}
      >
        {children}
      </Box>
    );
  }

  const activeListing = activeListingId
    ? localListings.find((l) => l._id.toString() === activeListingId)
    : null;

  return (
    <Box>
      {/* Header with action button */}
      <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 3 }}>
        <KButton startIcon={<AddIcon />} onClick={handleCreateNew}>
          Create New Commission
        </KButton>
      </Box>

      {/* Notifications */}
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

      {/* Commission listings */}
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
            <Grid item xs={12} sm={6} lg={4} key={listing._id.toString()}>
              <Card
                sx={{
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  borderRadius: 3,
                  position: "relative",
                  transition: "transform 0.3s ease, box-shadow 0.3s ease",
                  "&:hover": {
                    transform: "translateY(-6px)",
                    boxShadow: "0 12px 20px rgba(0, 0, 0, 0.1)",
                  },
                  overflow: "hidden",
                  bgcolor: "background.paper",
                  opacity: listing.isActive ? 1 : 0.85,
                }}
              >
                {/* Status indicator */}
                {!listing.isActive && (
                  <Chip
                    label="Inactive"
                    color="default"
                    size="small"
                    sx={{
                      position: "absolute",
                      top: 16,
                      left: 16,
                      zIndex: 2,
                      bgcolor: "rgba(100, 100, 100, 0.9)",
                      color: "#fff",
                      fontWeight: 500,
                      borderRadius: "16px",
                      boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                    }}
                  />
                )}

                {/* Menu button */}
                <IconButton
                  size="small"
                  sx={{
                    position: "absolute",
                    top: 12,
                    right: 12,
                    zIndex: 2,
                    bgcolor: "rgba(255, 255, 255, 0.85)",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.15)",
                    "&:hover": {
                      bgcolor: "rgba(255, 255, 255, 1)",
                      transform: "scale(1.05)",
                    },
                    transition: "all 0.2s ease",
                  }}
                  onClick={(e) => handleMenuOpen(e, listing._id.toString())}
                >
                  <MoreVertIcon fontSize="small" />
                </IconButton>

                {/* Card image with gradient overlay */}
                <Box sx={{ position: "relative" }}>
                  <CardMedia
                    component="img"
                    height="200"
                    image={listing.samples[listing.thumbnailIdx]}
                    alt={listing.title}
                    sx={{
                      objectFit: "cover",
                      transition: "transform 0.5s ease",
                      "&:hover": {
                        transform: "scale(1.03)",
                      },
                    }}
                  />
                  <Box
                    sx={{
                      position: "absolute",
                      bottom: 0,
                      left: 0,
                      right: 0,
                      height: "40px",
                      background:
                        "linear-gradient(to top, rgba(0,0,0,0.5), rgba(0,0,0,0))",
                    }}
                  />
                </Box>

                {/* Card content */}
                <CardContent sx={{ flexGrow: 1, p: 2.5 }}>
                  <Typography
                    variant="h6"
                    component="div"
                    gutterBottom
                    noWrap
                    sx={{
                      fontWeight: 600,
                      fontSize: "1.1rem",
                      mb: 1,
                    }}
                  >
                    {listing.title}
                  </Typography>

                  <Typography
                    variant="body2"
                    sx={{
                      color: "text.secondary",
                      mb: 1.5,
                      display: "flex",
                      alignItems: "center",
                      gap: 0.5,
                    }}
                  >
                    <Box
                      component="span"
                      sx={{
                        display: "inline-block",
                        width: 10,
                        height: 10,
                        borderRadius: "50%",
                        bgcolor:
                          listing.flow === "standard"
                            ? "success.main"
                            : "info.main",
                        mr: 0.5,
                      }}
                    />
                    {listing.flow === "standard"
                      ? "Standard Flow"
                      : "Milestone Flow"}
                  </Typography>

                  <Typography
                    variant="h6"
                    sx={{
                      color: "primary.main",
                      fontWeight: 700,
                      mb: 2,
                    }}
                  >
                    {listing.currency} {listing.price.min.toLocaleString()}
                    {listing.price.min !== listing.price.max &&
                      ` - ${listing.price.max.toLocaleString()}`}
                  </Typography>

                  {/* Tags */}
                  <Box
                    sx={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 0.8,
                      mt: 0.5,
                    }}
                  >
                    {listing.tags.slice(0, 3).map((tag: string) => (
                      <Chip
                        key={tag}
                        label={tag}
                        size="small"
                        sx={{
                          fontSize: "0.7rem",
                          fontWeight: 500,
                          borderRadius: "12px",
                          bgcolor: "rgba(0, 0, 0, 0.04)",
                          transition: "all 0.2s ease",
                          "&:hover": {
                            bgcolor: "rgba(0, 0, 0, 0.08)",
                          },
                        }}
                      />
                    ))}
                    {listing.tags.length > 3 && (
                      <Chip
                        label={`+${listing.tags.length - 3}`}
                        size="small"
                        variant="outlined"
                        sx={{
                          fontSize: "0.7rem",
                          borderRadius: "12px",
                        }}
                      />
                    )}
                  </Box>
                </CardContent>

                {/* Card actions with subtle divider */}
                <Box sx={{ mt: "auto" }}>
                  <Divider sx={{ opacity: 0.6 }} />
                  <CardActions
                    sx={{ justifyContent: "space-between", px: 2, py: 1.2 }}
                  >
                    <Button
                      size="small"
                      variant="contained"
                      disableElevation
                      sx={{
                        borderRadius: 6,
                        px: 2,
                        textTransform: "none",
                        fontWeight: 600,
                        boxShadow: "none",
                        "&:hover": {
                          boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
                        },
                      }}
                      onClick={() =>
                        router.push(
                          `/${username}/dashboard/commissions/${listing._id}`
                        )
                      }
                    >
                      Edit
                    </Button>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 0.5,
                      }}
                    >
                      {listing.slots !== -1 && (
                        <Box
                          component="span"
                          sx={{
                            width: 8,
                            height: 8,
                            borderRadius: "50%",
                            bgcolor:
                              listing.slots - listing.slotsUsed > 0
                                ? "success.main"
                                : "warning.main",
                            display: "inline-block",
                            mr: 0.5,
                          }}
                        />
                      )}
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ fontWeight: 500 }}
                      >
                        {listing.slots === -1
                          ? "Unlimited slots"
                          : `${listing.slots - listing.slotsUsed}/${
                              listing.slots
                            } slots available`}
                      </Typography>
                    </Box>
                  </CardActions>
                </Box>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Context menu */}
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

        {activeListing && (
          <MenuItem onClick={handleToggleActive}>
            <ListItemIcon>
              {activeListing.isActive ? (
                <VisibilityOffIcon fontSize="small" />
              ) : (
                <VisibilityIcon fontSize="small" />
              )}
            </ListItemIcon>
            {activeListing.isActive ? "Deactivate" : "Activate"}
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

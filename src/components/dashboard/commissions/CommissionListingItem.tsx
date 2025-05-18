// src/components/dashboard/commissions/CommissionListingItem.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useDialogStore } from "@/lib/stores";
import { Bookmark as BookmarkIcon, Palette } from "@mui/icons-material";
import {
  Box,
  Card,
  CardContent,
  CardMedia,
  CardActions,
  IconButton,
  Typography,
  Chip,
  Button,
  Menu,
  MenuItem,
  Divider,
  Tooltip,
  alpha,
  Badge,
  Paper,
  Stack,
  Skeleton,
} from "@mui/material";
import {
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  DriveFileRenameOutline as DriveFileRenameOutlineIcon,
  CalendarMonth as CalendarMonthIcon,
  LocalOffer as LocalOfferIcon,
  Launch as LaunchIcon,
  BarChart as BarChartIcon,
  BookmarkBorder as BookmarkBorderIcon,
  Chat as ChatIcon,
  Star as StarIcon,
} from "@mui/icons-material";
import { ICommissionListing } from "@/lib/db/models/commissionListing.model";

interface CommissionListingItemProps {
  listing: ICommissionListing;
  username: string;
  isOwner: boolean;
  isAuthenticated?: boolean;
  isBookmarked?: boolean;
  onToggleBookmark?: (
    listingId: string,
    action: "bookmark" | "unbookmark"
  ) => Promise<void>;
  onStatusToggle?: (listingId: string, newStatus: boolean) => Promise<void>;
  onDelete?: (listingId: string) => Promise<void>;
  loading?: boolean;
}

interface ListItemIconProps {
  children: React.ReactNode;
  sx?: any;
}

export const CommissionListingItem = ({
  listing,
  username,
  isOwner,
  isAuthenticated,
  isBookmarked,
  onToggleBookmark,
  onStatusToggle,
  onDelete,
  loading = false,
}: CommissionListingItemProps) => {
  const router = useRouter();
  const openDialog = useDialogStore((state) => state.open);
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [isHovering, setIsHovering] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  // Bookmark
  const [bookmarkState, setBookmarkState] = useState(isBookmarked || false);
  const [isBookmarking, setIsBookmarking] = useState(false);

  const handleToggleBookmark = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!isAuthenticated || !onToggleBookmark) return;

    try {
      setIsBookmarking(true);
      await onToggleBookmark(
        listing._id.toString(),
        bookmarkState ? "unbookmark" : "bookmark"
      );
      setBookmarkState(!bookmarkState);
    } catch (error) {
      console.error("Error toggling bookmark:", error);
    } finally {
      setIsBookmarking(false);
    }
  };

  const handleMenuOpen = (e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation();
    setMenuAnchorEl(e.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
  };

  const handleEditCommission = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (isOwner) {
      router.push(`/${username}/dashboard/commissions/${listing._id}`);
    }
    handleMenuClose();
  };

  const handleToggleActive = async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (isOwner && onStatusToggle) {
      await onStatusToggle(listing._id.toString(), !listing.isActive);
    }
    handleMenuClose();
  };

  const handleDeleteCommission = async () => {
    if (isOwner && onDelete) {
      await onDelete(listing._id.toString());
    }
    handleMenuClose();
    setDeleteConfirmOpen(false);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteConfirmOpen(true);
    handleMenuClose();
  };

  const handleDeleteCancel = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteConfirmOpen(false);
  };

  const handleCardClick = (e: React.MouseEvent) => {
    if (isOwner) {
      router.push(`/${username}`);
    } else {
      openDialog("viewCommission", listing._id.toString(), listing, isOwner);
    }
  };

  const handlePublicView = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isOwner) {
      router.push(`/${username}`);
    } else {
      openDialog("viewCommission", listing._id.toString(), listing, isOwner);
    }
    handleMenuClose();
  };

  const handleRequestCommission = (e: React.MouseEvent) => {
    e.stopPropagation();
    openDialog("viewCommission", listing._id.toString(), listing, isOwner);
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

  if (loading) {
    return (
      <Card
        sx={{
          height: "100%",
          display: "flex",
          flexDirection: "column",
          borderRadius: 3,
          overflow: "hidden",
          bgcolor: "background.paper",
        }}
      >
        <Skeleton
          variant="rectangular"
          height={200}
          width="100%"
          animation="wave"
        />
        <CardContent sx={{ flexGrow: 1, p: 2.5 }}>
          <Skeleton variant="text" width="70%" height={30} />
          <Skeleton variant="text" width="40%" height={20} sx={{ mt: 1 }} />
          <Skeleton variant="text" width="50%" height={30} sx={{ mt: 1 }} />
          <Box sx={{ display: "flex", gap: 1, mt: 2 }}>
            <Skeleton variant="rounded" width={60} height={24} />
            <Skeleton variant="rounded" width={60} height={24} />
            <Skeleton variant="rounded" width={60} height={24} />
          </Box>
        </CardContent>
        <CardActions sx={{ justifyContent: "space-between", px: 2, py: 1.2 }}>
          <Skeleton variant="rounded" width={80} height={36} />
          <Skeleton variant="text" width={120} height={20} />
        </CardActions>
      </Card>
    );
  }

  // Calculate how many slots are left
  const slotsLeft =
    listing.slots === -1 ? -1 : listing.slots - listing.slotsUsed;
  const slotsAvailable = listing.slots === -1 || slotsLeft > 0;

  // Determine status for slot display
  let slotStatus = "success";
  if (listing.slots !== -1) {
    if (slotsLeft === 0) slotStatus = "error";
    else if (slotsLeft <= Math.max(1, Math.floor(listing.slots * 0.25)))
      slotStatus = "warning";
  }

  return (
    <Card
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        borderRadius: 3,
        position: "relative",
        transition: "all 0.3s ease",
        "&:hover": {
          transform: "translateY(-6px)",
          boxShadow: (theme) =>
            `0 12px 24px ${alpha(theme.palette.primary.main, 0.15)}`,
        },
        overflow: "hidden",
        bgcolor: "background.paper",
        opacity: listing.isActive ? 1 : 0.8,
        filter: listing.isActive ? "none" : "grayscale(40%)",
        cursor: "pointer",
        border: (theme) => `1px solid ${alpha(theme.palette.divider, 0.1)}`,
      }}
      onClick={handleCardClick}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      elevation={isHovering ? 8 : 2}
    >
      {/* Top status badges */}
      <Box
        sx={{
          position: "absolute",
          top: 12,
          left: 12,
          zIndex: 2,
          display: "flex",
          gap: 1,
        }}
      >
        {!listing.isActive && isOwner && (
          <Chip
            label="Tidak Aktif"
            color="default"
            size="small"
            sx={{
              bgcolor: (theme) => alpha(theme.palette.grey[800], 0.85),
              color: "#fff",
              fontWeight: 600,
              borderRadius: "16px",
              backdropFilter: "blur(4px)",
              boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
              px: 1,
            }}
            icon={
              <VisibilityOffIcon
                fontSize="small"
                sx={{ color: "#fff !important" }}
              />
            }
          />
        )}
        <Chip
          label={listing.flow === "standard" ? "Standar" : "Milestone"}
          color={listing.flow === "standard" ? "success" : "info"}
          size="small"
          sx={{
            fontWeight: 600,
            borderRadius: "16px",
            backdropFilter: "blur(4px)",
            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
            px: 1,
            color: "white"
          }}
        />
      </Box>

      {/* Action buttons - only show for owner */}
      {isOwner && (
        <Box
          sx={{
            position: "absolute",
            top: 12,
            right: 12,
            zIndex: 3,
            display: "flex",
            gap: 1,
          }}
        >
          <Tooltip title="Edit Cepat">
            <IconButton
              size="small"
              sx={{
                bgcolor: (theme) => alpha(theme.palette.background.paper, 0.85),
                backdropFilter: "blur(8px)",
                boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
                "&:hover": {
                  bgcolor: (theme) =>
                    alpha(theme.palette.background.paper, 0.95),
                  transform: "scale(1.05)",
                },
                transition: "all 0.2s ease",
              }}
              onClick={(e) => handleEditCommission(e)}
            >
              <DriveFileRenameOutlineIcon fontSize="small" color="primary" />
            </IconButton>
          </Tooltip>

          <Tooltip title="Opsi Lainnya">
            <IconButton
              size="small"
              sx={{
                bgcolor: (theme) => alpha(theme.palette.background.paper, 0.85),
                backdropFilter: "blur(8px)",
                boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
                "&:hover": {
                  bgcolor: (theme) =>
                    alpha(theme.palette.background.paper, 0.95),
                  transform: "scale(1.05)",
                },
                transition: "all 0.2s ease",
              }}
              onClick={handleMenuOpen}
            >
              <MoreVertIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      )}

      {/* Public user actions */}
      {!isOwner && (
        <Box
          sx={{
            position: "absolute",
            top: 12,
            right: 12,
            zIndex: 3,
            display: "flex",
            gap: 1,
          }}
        >
          {isAuthenticated && (
            <Tooltip
              title={
                bookmarkState ? "Hapus dari tersimpan" : "Simpan untuk nanti"
              }
            >
              <IconButton
                size="small"
                sx={{
                  bgcolor: (theme) =>
                    alpha(theme.palette.background.paper, 0.85),
                  backdropFilter: "blur(8px)",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
                  "&:hover": {
                    bgcolor: (theme) =>
                      alpha(theme.palette.background.paper, 0.95),
                    transform: "scale(1.05)",
                  },
                  transition: "all 0.2s ease",
                }}
                onClick={handleToggleBookmark}
                disabled={isBookmarking}
              >
                {bookmarkState ? (
                  <BookmarkIcon fontSize="small" color="primary" />
                ) : (
                  <BookmarkBorderIcon fontSize="small" />
                )}
              </IconButton>
            </Tooltip>
          )}
        </Box>
      )}

      {/* Delete confirmation - conditionally rendered */}
      {deleteConfirmOpen && isOwner && (
        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            bgcolor: (theme) => alpha(theme.palette.background.paper, 0.85),
            backdropFilter: "blur(4px)",
            zIndex: 5,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            p: 2,
            textAlign: "center",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <DeleteIcon color="error" sx={{ fontSize: 40, mb: 2 }} />
          <Typography variant="subtitle1" gutterBottom fontWeight={600}>
            Hapus pesanan ini?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Tindakan ini tidak dapat dibatalkan.
          </Typography>
          <Stack direction="row" spacing={2}>
            <Button
              variant="outlined"
              onClick={handleDeleteCancel}
              sx={{ borderRadius: 8, px: 3 }}
            >
              Batal
            </Button>
            <Button
              variant="contained"
              color="error"
              onClick={handleDeleteCommission}
              sx={{ borderRadius: 8, px: 3 }}
            >
              Hapus
            </Button>
          </Stack>
        </Box>
      )}

      {/* Card image with gradient overlay */}
      <Box sx={{ position: "relative", overflow: "hidden" }}>
        <CardMedia
          component="img"
          height="200"
          image={listing.samples[listing.thumbnailIdx]}
          alt={listing.title}
          sx={{
            objectFit: "cover",
            transition: "transform 0.8s ease",
            ...(isHovering && { transform: "scale(1.08)" }),
          }}
        />
        <Box
          sx={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: "80px",
            background:
              "linear-gradient(to top, rgba(0,0,0,0.65), rgba(0,0,0,0))",
          }}
        />

        {/* Price badge overlaid on image */}
        <Paper
          elevation={4}
          sx={{
            position: "absolute",
            bottom: 12,
            right: 12,
            borderRadius: "12px",
            px: 1.5,
            py: 0.8,
            display: "flex",
            alignItems: "center",
            backdropFilter: "blur(8px)",
            bgcolor: (theme) => alpha(theme.palette.background.paper, 0.85),
            border: (theme) =>
              `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
          }}
        >
          <Typography
            variant="subtitle2"
            sx={{
              fontWeight: 700,
              color: "primary.main",
              display: "flex",
              alignItems: "center",
            }}
          >
            <LocalOfferIcon sx={{ fontSize: 16, mr: 0.5 }} />
            {listing.currency} {listing.price.min.toLocaleString()}
            {listing.price.min !== listing.price.max &&
              ` - ${listing.price.max.toLocaleString()}`}
          </Typography>
        </Paper>
      </Box>

      {/* Card content */}
      <CardContent sx={{ flexGrow: 1, p: 2.5 }}>
        <Typography
          variant="h6"
          component="div"
          gutterBottom
          sx={{
            fontWeight: 700,
            fontSize: "1.1rem",
            mb: 1.5,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            textOverflow: "ellipsis",
            lineHeight: 1.3,
            minHeight: "2.6rem",
          }}
        >
          {listing.title}
        </Typography>

        {/* Artist name for public view */}
        {!isOwner && (
          <Typography
            variant="body2"
            sx={{
              mb: 1.5,
              display: "flex",
              alignItems: "center",
              fontWeight: 500,
            }}
          >
            <Palette sx={{ fontSize: 16, mr: 0.5, color: "warning.main" }} />
            oleh {username}
          </Typography>
        )}

        {/* Slot availability with badge */}
        <Box
          sx={{
            mb: 2,
            display: "flex",
            alignItems: "center",
          }}
        >
          <Badge
            color={slotStatus as "success" | "warning" | "error" | "default"}
            variant="dot"
            invisible={listing.slots === -1}
            sx={{ mr: 1 }}
          >
            <CalendarMonthIcon fontSize="small" color="action" />
          </Badge>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ fontWeight: 500 }}
          >
            {listing.slots === -1
              ? "Slot tidak terbatas"
              : `${slotsLeft}/${listing.slots} slot tersedia`}
          </Typography>
        </Box>

        {/* Last updated date - only show for owner */}
        {isOwner && (
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{
              display: "flex",
              alignItems: "center",
              mb: 2,
              fontSize: "0.7rem",
            }}
          >
            <BarChartIcon sx={{ fontSize: 14, mr: 0.5 }} />
            Diperbarui {new Date(listing.updatedAt).toLocaleDateString()}
          </Typography>
        )}

        {/* Tags */}
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            gap: 0.8,
            mt: 1,
          }}
        >
          {listing.tags.slice(0, 3).map((tag: string) => (
            <Chip
              key={tag}
              label={tag}
              size="small"
              sx={{
                fontSize: "0.75rem",
                fontWeight: 500,
                borderRadius: "12px",
                bgcolor: (theme) => alpha(theme.palette.primary.main, 0.08),
                color: "primary.main",
                transition: "all 0.2s ease",
                "&:hover": {
                  bgcolor: (theme) => alpha(theme.palette.primary.main, 0.12),
                  transform: "translateY(-2px)",
                },
              }}
            />
          ))}
          {listing.tags.length > 3 && (
            <Tooltip title={listing.tags.slice(3).join(", ")} placement="top">
              <Chip
                label={`+${listing.tags.length - 3}`}
                size="small"
                variant="outlined"
                sx={{
                  fontSize: "0.75rem",
                  borderRadius: "12px",
                  cursor: "help",
                }}
              />
            </Tooltip>
          )}
        </Box>
      </CardContent>

      {/* Card actions with subtle divider */}
      <Box sx={{ mt: "auto" }}>
        <Divider sx={{ opacity: 0.8 }} />
        <CardActions
          sx={{
            justifyContent: "space-between",
            px: 2,
            py: 1.2,
            bgcolor: (theme) => alpha(theme.palette.background.default, 0.4),
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Owner actions */}
          {isOwner ? (
            <>
              <Stack direction="row" spacing={1}>
                <Button
                  size="small"
                  variant="contained"
                  disableElevation
                  startIcon={<EditIcon />}
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
                  onClick={(e) => handleEditCommission(e)}
                >
                  Edit
                </Button>

                <Tooltip
                  title={
                    listing.isActive ? "Nonaktifkan daftar" : "Aktifkan daftar"
                  }
                >
                  <Button
                    size="small"
                    variant="outlined"
                    color={listing.isActive ? "warning" : "success"}
                    onClick={(e) => handleToggleActive(e)}
                    sx={{
                      minWidth: 0,
                      width: 36,
                      height: 36,
                      borderRadius: "50%",
                      p: 0,
                    }}
                  >
                    {listing.isActive ? (
                      <VisibilityOffIcon fontSize="small" />
                    ) : (
                      <VisibilityIcon fontSize="small" />
                    )}
                  </Button>
                </Tooltip>
              </Stack>

              <Tooltip title="Lihat halaman publik">
                <Button
                  size="small"
                  variant="text"
                  color="primary"
                  endIcon={<LaunchIcon fontSize="small" />}
                  onClick={handlePublicView}
                  sx={{
                    textTransform: "none",
                    fontWeight: 500,
                    fontSize: "0.8rem",
                  }}
                >
                  Pratinjau
                </Button>
              </Tooltip>
            </>
          ) : (
            /* Public user actions */
            <>
              {/* <Button
                size="small"
                variant="text"
                color="primary"
                endIcon={<LaunchIcon fontSize="small" />}
                onClick={handlePublicView}
                sx={{
                  textTransform: "none",
                  fontWeight: 500,
                  fontSize: "0.8rem",
                }}
              >
                Lihat Detail
              </Button> */}
            </>
          )}
        </CardActions>
      </Box>

      {/* Context menu - only for owner */}
      {isOwner && (
        <Menu
          anchorEl={menuAnchorEl}
          open={Boolean(menuAnchorEl)}
          onClose={handleMenuClose}
          onClick={(e) => e.stopPropagation()}
          elevation={6}
          anchorOrigin={{
            vertical: "bottom",
            horizontal: "right",
          }}
          transformOrigin={{
            vertical: "top",
            horizontal: "right",
          }}
          PaperProps={{
            sx: {
              minWidth: 200,
              borderRadius: 2,
              px: 0.5,
              py: 0.5,
              mt: 1.5,
            },
          }}
        >
          <MenuItem onClick={handleEditCommission} dense>
            <ListItemIcon>
              <EditIcon fontSize="small" />
            </ListItemIcon>
            Edit Pesanan
          </MenuItem>

          <MenuItem onClick={handlePublicView} dense>
            <ListItemIcon>
              <LaunchIcon fontSize="small" />
            </ListItemIcon>
            Lihat Halaman Publik
          </MenuItem>

          <Divider sx={{ my: 0.5 }} />

          <MenuItem onClick={handleToggleActive} dense>
            <ListItemIcon>
              {listing.isActive ? (
                <VisibilityOffIcon fontSize="small" />
              ) : (
                <VisibilityIcon fontSize="small" />
              )}
            </ListItemIcon>
            {listing.isActive ? "Nonaktifkan Daftar" : "Aktifkan Daftar"}
          </MenuItem>

          <Divider sx={{ my: 0.5 }} />

          <MenuItem
            onClick={handleDeleteClick}
            sx={{ color: "error.main" }}
            dense
          >
            <ListItemIcon sx={{ color: "error.main" }}>
              <DeleteIcon fontSize="small" />
            </ListItemIcon>
            Hapus Pesanan
          </MenuItem>
        </Menu>
      )}
    </Card>
  );
};

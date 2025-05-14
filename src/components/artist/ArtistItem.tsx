// src/components/artist/ArtistItem.tsx
"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  IconButton,
  Avatar,
  alpha,
  Tooltip,
  Button,
  Divider,
  Stack,
  useTheme,
} from "@mui/material";
import {
  BookmarkBorder as BookmarkBorderIcon,
  Bookmark as BookmarkIcon,
  Star as StarIcon,
  Chat as ChatIcon,
  PersonOutline as PersonIcon,
  Check as CheckIcon,
} from "@mui/icons-material";
import { useRouter } from "next/navigation";
import { IUser } from "@/lib/db/models/user.model";

interface ArtistItemProps {
  artist: IUser;
  isAuthenticated?: boolean;
  isBookmarked?: boolean;
  onToggleBookmark?: (
    artistId: string,
    action: "bookmark" | "unbookmark"
  ) => Promise<void>;
}

export default function ArtistItem({
  artist,
  isAuthenticated = false,
  isBookmarked = false,
  onToggleBookmark,
}: ArtistItemProps) {
  const [isHovering, setIsHovering] = useState(false);
  const [bookmarkState, setBookmarkState] = useState(isBookmarked);
  const [isBookmarking, setIsBookmarking] = useState(false);
  const router = useRouter();
  const theme = useTheme();

  const handleCardClick = () => {
    router.push(`/${artist.username}`);
  };

  const handleToggleBookmark = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!isAuthenticated || !onToggleBookmark) return;

    try {
      setIsBookmarking(true);
      await onToggleBookmark(
        artist._id.toString(),
        bookmarkState ? "unbookmark" : "bookmark"
      );
      setBookmarkState(!bookmarkState);
    } catch (error) {
      console.error("Error toggling bookmark:", error);
    } finally {
      setIsBookmarking(false);
    }
  };

  const gradientBg = `linear-gradient(135deg, ${alpha(
    theme.palette.primary.light,
    0.1
  )} 0%, ${alpha(theme.palette.primary.main, 0.05)} 100%)`;

  const availabilityStatus = artist.openForCommissions ? (
    <Stack
      direction="row"
      alignItems="center"
      spacing={0.5}
      sx={{
        color: "success.main",
        fontWeight: 600,
        fontSize: "0.75rem",
      }}
    >
      <CheckIcon sx={{ fontSize: 16 }} />
      <Typography variant="caption" fontWeight="medium">
        Available for work
      </Typography>
    </Stack>
  ) : (
    <Typography variant="caption" color="text.secondary" fontWeight="medium">
      Not available for commissions
    </Typography>
  );

  return (
    <Card
      sx={{
        height: "100%",
        borderRadius: 2,
        cursor: "pointer",
        transition: "all 0.2s ease",
        overflow: "visible",
        backgroundColor: isHovering
          ? gradientBg
          : theme.palette.background.paper,
        "&:hover": {
          transform: "translateY(-4px)",
          boxShadow: `0 12px 24px ${alpha(theme.palette.primary.main, 0.08)}`,
        },
        position: "relative",
        border: `1px solid ${alpha(
          theme.palette.divider,
          isHovering ? 0.1 : 0.5
        )}`,
      }}
      onClick={handleCardClick}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      elevation={0}
    >
      {/* Header with avatar */}
      <Box
        sx={{
          p: 2.5,
          pb: 1.5,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Avatar
            src={artist.profilePicture}
            alt={artist.displayName}
            sx={{
              width: 48,
              height: 48,
              border: `2px solid ${theme.palette.background.paper}`,
              boxShadow: `0 3px 6px ${alpha(theme.palette.common.black, 0.08)}`,
            }}
          >
            {!artist.profilePicture && <PersonIcon />}
          </Avatar>
          <Stack>
            <Typography variant="subtitle1" fontWeight={600} noWrap>
              {artist.displayName}
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ lineHeight: 1.2 }}
            >
              @{artist.username}
            </Typography>
          </Stack>
        </Stack>

        {/* Bookmark button */}
        {isAuthenticated && (
          <IconButton
            sx={{
              backgroundColor: theme.palette.background.paper,
              boxShadow: isHovering
                ? `0 2px 8px ${alpha(theme.palette.common.black, 0.08)}`
                : "none",
              transition: "all 0.2s ease",
              "&:hover": {
                backgroundColor: theme.palette.background.paper,
                transform: "scale(1.1)",
              },
              width: 36,
              height: 36,
            }}
            size="small"
            onClick={handleToggleBookmark}
            disabled={isBookmarking}
            color={bookmarkState ? "primary" : "default"}
            aria-label={
              bookmarkState ? "Remove from bookmarks" : "Add to bookmarks"
            }
          >
            {bookmarkState ? (
              <BookmarkIcon fontSize="small" />
            ) : (
              <BookmarkBorderIcon fontSize="small" />
            )}
          </IconButton>
        )}
      </Box>

      <Divider sx={{ mx: 2.5, opacity: 0.6 }} />

      {/* Content */}
      <CardContent sx={{ pt: 1.5, pb: "16px !important" }}>
        {/* Bio */}
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            mb: 2,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            height: 40,
            lineHeight: 1.4,
            fontSize: "0.85rem",
          }}
        >
          {artist.bio || "No bio provided."}
        </Typography>

        {/* Stats */}
        {artist.rating && artist.rating.count > 0 && (
          <Stack
            direction="row"
            alignItems="center"
            spacing={0.5}
            sx={{ mb: 2 }}
          >
            <StarIcon
              sx={{
                color: "warning.main",
                fontSize: 16,
              }}
            />
            <Typography variant="body2" fontWeight={500} fontSize="0.85rem">
              {artist.rating.avg.toFixed(1)}
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              fontSize="0.85rem"
            >
              ({artist.rating.count} reviews)
              {artist.completedOrders > 0 &&
                ` • ${artist.completedOrders} completed`}
            </Typography>
          </Stack>
        )}

        {/* Tags */}
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            gap: 0.75,
            mb: 2.5,
            minHeight: 24,
          }}
        >
          {artist.tags?.slice(0, 3).map((tag) => (
            <Chip
              key={tag}
              label={tag}
              size="small"
              sx={{
                fontSize: "0.75rem",
                height: 24,
                borderRadius: 1,
                backgroundColor: alpha(theme.palette.primary.main, 0.08),
                color: "text.primary",
                fontWeight: 500,
                "& .MuiChip-label": { px: 1 },
              }}
            />
          ))}
          {artist.tags && artist.tags.length > 3 && (
            <Tooltip title={artist.tags.slice(3).join(", ")} arrow>
              <Chip
                label={`+${artist.tags.length - 3}`}
                size="small"
                variant="outlined"
                sx={{
                  fontSize: "0.75rem",
                  height: 24,
                  borderRadius: 1,
                  fontWeight: 500,
                  "& .MuiChip-label": { px: 1 },
                }}
              />
            </Tooltip>
          )}
        </Box>

        {/* Availability Status */}
        <Box mb={1.5}>{availabilityStatus}</Box>

        {/* Action Button */}
        <Button
          variant={artist.openForCommissions ? "contained" : "outlined"}
          fullWidth
          size="small"
          disableElevation
          startIcon={<ChatIcon />}
          disabled={!artist.openForCommissions}
          sx={{
            borderRadius: 1,
            textTransform: "none",
            fontWeight: 600,
            py: 0.75,
            ...(artist.openForCommissions && {
              background: theme.palette.primary.main,
              "&:hover": {
                background: theme.palette.primary.dark,
              },
            }),
          }}
        >
          {artist.openForCommissions ? "Request Commission" : "Not Available"}
        </Button>
      </CardContent>
    </Card>
  );
}

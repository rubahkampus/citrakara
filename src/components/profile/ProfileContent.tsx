// src/components/profile/ProfileContent.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Avatar,
  Box,
  Button,
  Chip,
  Container,
  Divider,
  IconButton,
  Paper,
  Stack,
  Tab,
  Tabs,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import {
  Message as MessageIcon,
  BookmarkBorder as BookmarkIcon,
  ChatBubbleOutline as ChatBubbleOutlineIcon,
  Edit as EditIcon,
  Dashboard as DashboardIcon,
} from "@mui/icons-material";

import { KButton } from "@/components/KButton";
import GallerySection from "@/components/profile/GallerySection";
import CommissionSection from "@/components/profile/CommissionSection";
import { useDialogStore } from "@/lib/stores";

// Helper to get social icon
import InstagramIcon from "@mui/icons-material/Instagram";
import TwitterIcon from "@mui/icons-material/Twitter";
import FacebookIcon from "@mui/icons-material/Facebook";
import PublicIcon from "@mui/icons-material/Public";
import LinkIcon from "@mui/icons-material/Link";

const getSocialIcon = (platform: string) => {
  switch (platform.toLowerCase()) {
    case "instagram":
      return <InstagramIcon fontSize="small" />;
    case "twitter":
    case "x":
      return <TwitterIcon fontSize="small" />;
    case "facebook":
      return <FacebookIcon fontSize="small" />;
    case "website":
      return <PublicIcon fontSize="small" />;
    default:
      return <LinkIcon fontSize="small" />;
  }
};

interface ProfileContentProps {
  profile: any;
  isOwner: boolean;
}

export default function ProfileContent({
  profile,
  isOwner,
}: ProfileContentProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const router = useRouter();
  const openDialog = useDialogStore((s) => s.open);
  const [activeTab, setActiveTab] = useState(0);

  const handleTabChange = (_: any, newVal: number) => {
    setActiveTab(newVal);
  };

  const handleEditProfile = () => {
    openDialog("editProfile", undefined, profile, isOwner);
  };

  const handleOpenDashboard = () => {
    router.push(`/${profile.username}/dashboard`);
  };

  const handleMessageCreator = () => {
    // Replace with real auth check
    const loggedIn = true;
    if (loggedIn) router.push("/dashboard/chat");
    else openDialog("login");
  };

  const bannerUrl = profile.banner || "/default-banner.jpg";
  const avatarUrl = profile.profilePicture || "/default-profile.png";

  return (
    <Box>
      {/* Banner */}
      <Box
        sx={{
          width: "100%",
          height: 250,
          backgroundImage: `url(${bannerUrl}?t=${Date.now()})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          position: "relative",
        }}
      />

      <Container
        maxWidth={false}
        disableGutters
        sx={{ backgroundColor: "#FAFAFA" }}
      >
        {/* Header */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            position: "relative",
          }}
        >
          <Box
            sx={{
              width: "80vw",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: 3,
            }}
          >
            <Stack direction="row" spacing={2.5} alignItems="flex-start">
              <Avatar
                src={`${avatarUrl}?t=${Date.now()}`}
                alt={profile.username}
                sx={{
                  width: { xs: 110, sm: 130, md: 150 },
                  height: { xs: 110, sm: 130, md: 150 },
                  border: "3px solid white",
                  top: -40,
                  boxShadow: "0 6px 16px rgba(0,0,0,0.15)",
                  transition: "transform 0.2s",
                  "&:hover": { transform: "scale(1.05)" },
                }}
              />

              <Box sx={{ pt: 1 }}>
                <Typography variant="h5" fontWeight="bold" sx={{ mb: 0.5 }}>
                  {profile.displayName || profile.username}
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 1 }}
                >
                  @{profile.username}
                </Typography>
                {profile.openForCommissions && (
                  <Typography
                    component="span"
                    variant="body2"
                    sx={{
                      display: "inline-flex",
                      alignItems: "center",
                      px: 1.5,
                      py: 0.75,
                      bgcolor: profile.openForCommissions
                        ? "success.light"
                        : "grey.300",
                      color: profile.openForCommissions
                        ? "white"
                        : "text.primary",
                      borderRadius: "12px",
                      fontWeight: 600,
                      boxShadow: profile.openForCommissions
                        ? "0 2px 4px rgba(0,0,0,0.08)"
                        : "none",
                      transition: "0.2s",
                      "&:hover": profile.openForCommissions
                        ? { bgcolor: "success.main", cursor: "pointer" }
                        : {},
                    }}
                  >
                    {profile.openForCommissions
                      ? "Open for commissions"
                      : "Not open for commissions"}
                  </Typography>
                )}
              </Box>
            </Stack>

            <Box sx={{ display: "flex", justifyContent: "flex-end", pt: 2.5 }}>
              {isOwner ? (
                <Stack direction="row" spacing={1.5}>
                  <Button
                    variant="outlined"
                    startIcon={<EditIcon />}
                    onClick={handleEditProfile}
                    sx={{ textTransform: "none", fontWeight: 500 }}
                  >
                    Edit Profile
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={<DashboardIcon />}
                    onClick={handleOpenDashboard}
                    sx={{ textTransform: "none", fontWeight: 500 }}
                  >
                    Open Dashboard
                  </Button>
                </Stack>
              ) : (
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Tooltip title="Bookmark Creator">
                    <IconButton>
                      <BookmarkIcon />
                    </IconButton>
                  </Tooltip>
                  <Button
                    variant="contained"
                    startIcon={<ChatBubbleOutlineIcon />}
                    onClick={handleMessageCreator}
                    sx={{ textTransform: "none", fontWeight: 500 }}
                  >
                    Message
                  </Button>
                </Stack>
              )}
            </Box>
          </Box>
        </Box>

        {/* Main Content */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            backgroundColor: "#EEEEEE",
          }}
        >
          <Box sx={{ mt: 4, width: "80vw", display: "flex", gap: 4 }}>
            {/* Sidebar */}
            <Box sx={{ width: 280, flexShrink: 0 }}>
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  borderRadius: 3,
                  border: "1px solid",
                  borderColor: "divider",
                }}
              >
                <Typography
                  variant="subtitle1"
                  fontWeight="bold"
                  sx={{
                    mb: 1.5,
                    position: "relative",
                    "&:after": {
                      content: '""',
                      position: "absolute",
                      bottom: -6,
                      left: 0,
                      width: 40,
                      height: 3,
                      borderRadius: 1.5,
                      bgcolor: "primary.main",
                    },
                  }}
                >
                  About
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{
                    mb: 3.5,
                    lineHeight: 1.6,
                    fontStyle: profile.bio ? "normal" : "italic",
                  }}
                >
                  {profile.bio || "No bio yet."}
                </Typography>
                <Divider sx={{ mb: 3 }} />
                <Typography
                  variant="subtitle1"
                  fontWeight="bold"
                  sx={{
                    mb: 1.5,
                    position: "relative",
                    "&:after": {
                      content: '""',
                      position: "absolute",
                      bottom: -6,
                      left: 0,
                      width: 40,
                      height: 3,
                      borderRadius: 1.5,
                      bgcolor: "primary.main",
                    },
                  }}
                >
                  Socials
                </Typography>
                <Box
                  sx={{ display: "flex", gap: 1.5, mb: 3.5, flexWrap: "wrap" }}
                >
                  {profile.socials?.length > 0 ? (
                    profile.socials.map((s: any, i: number) => (
                      <Tooltip key={i} title={s.label}>
                        <IconButton
                          href={s.url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {getSocialIcon(s.platform)}
                        </IconButton>
                      </Tooltip>
                    ))
                  ) : (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ fontStyle: "italic", py: 1 }}
                    >
                      No social links added
                    </Typography>
                  )}
                </Box>
                <Divider sx={{ mb: 3 }} />
                <Typography
                  variant="subtitle1"
                  fontWeight="bold"
                  sx={{
                    mb: 1.5,
                    position: "relative",
                    "&:after": {
                      content: '""',
                      position: "absolute",
                      bottom: -6,
                      left: 0,
                      width: 40,
                      height: 3,
                      borderRadius: 1.5,
                      bgcolor: "primary.main",
                    },
                  }}
                >
                  Tags
                </Typography>
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.8 }}>
                  {profile.tags?.length > 0 ? (
                    profile.tags.map((tag: string) => (
                      <Chip
                        key={tag}
                        label={tag}
                        size="small"
                        sx={{ fontSize: "0.75rem", height: 26 }}
                      />
                    ))
                  ) : (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ fontStyle: "italic", py: 1 }}
                    >
                      No tags added
                    </Typography>
                  )}
                </Box>
              </Paper>
            </Box>

            {/* Tabs and Sections */}
            <Box sx={{ flex: 1 }}>
              <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 2 }}>
                <Tabs
                  value={activeTab}
                  onChange={handleTabChange}
                  textColor="primary"
                  indicatorColor="primary"
                >
                  <Tab label="Commission" />
                  <Tab label="Gallery" />
                </Tabs>
              </Box>

              {activeTab === 0 && (
                <CommissionSection
                  username={profile.username}
                  isOwner={isOwner}
                />
              )}
              {activeTab === 1 && (
                <GallerySection username={profile.username} isOwner={isOwner} />
              )}
            </Box>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}

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
import { Message as MessageIcon } from "@mui/icons-material";

import BookmarkIcon from "@mui/icons-material/BookmarkBorder";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import EditIcon from "@mui/icons-material/Edit";
import DashboardIcon from "@mui/icons-material/Dashboard";

import { KButton } from "@/components/KButton";
import GallerySection from "@/components/profile/GallerySection";
import CommissionSection from "@/components/profile/CommissionSection";
import CommissionDialog from "@/components/profile/dialogs/CommissionDialog";
import UploadArtDialog from "@/components/profile/dialogs/UploadArtDialog";
import { useUserDialogStore } from "@/lib/stores/userDialogStore";
import { useAuthDialogStore } from "@/lib/stores/authDialogStore";
import LinkIcon from "@mui/icons-material/Link";
import InstagramIcon from "@mui/icons-material/Instagram";
import TwitterIcon from "@mui/icons-material/Twitter";
import FacebookIcon from "@mui/icons-material/Facebook";
import PublicIcon from "@mui/icons-material/Public";
import LocalOfferIcon from "@mui/icons-material/LocalOffer";

// Helper function to get social media icon
const getSocialIcon = (socialType: string) => {
  switch (socialType?.toLowerCase()) {
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
  const { open: openUserDialog } = useUserDialogStore();
  const { open: openAuthDialog } = useAuthDialogStore();
  const [activeTab, setActiveTab] = useState(0);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleEditProfile = () => {
    openUserDialog("editProfile");
  };

  const handleOpenDashboard = () => {
    router.push(`/${profile.username}/dashboard`);
  };

  const handleMessageCreator = () => {
    // Check if user is logged in (mock for now)
    const isLoggedIn = true; // Replace with actual auth check

    if (isLoggedIn) {
      router.push("/dashboard/chat");
    } else {
      openAuthDialog("login");
    }
  };

  return (
    <Box>
      {/* Banner */}
      <Box
        sx={{
          width: "100%",
          height: 250,
          backgroundImage: `url(${
            profile.banner || "/default-banner.jpg"
          }?t=${Date.now()})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          position: "relative",
        }}
      />

      {/* Profile Content Container */}
      <Container
        maxWidth={false}
        disableGutters
        sx={{
          backgroundColor: "#FAFAFA",
        }}
      >
        {/* Profile Header Section */}
        <Box
          sx={{
            position: "relative",
            display: "flex",
            justifyContent: "center",
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
            {/* Profile Picture and User Info */}
            <Stack direction="row" spacing={2.5} alignItems="flex-start">
              <Avatar
                src={`${
                  profile.profilePicture || "/default-profile.png"
                }?t=${Date.now()}`}
                alt={profile.username}
                sx={{
                  width: { xs: 110, sm: 130, md: 150 },
                  height: { xs: 110, sm: 130, md: 150 },
                  border: "3px solid white",
                  top: -40,
                  boxShadow: "0 6px 16px rgba(0,0,0,0.15)",
                  transition: "transform 0.2s ease-in-out",
                  "&:hover": {
                    transform: "scale(1.05)",
                  },
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

                {/* Commission Status Badge */}
                {profile.openForCommissions && (
                  <Box
                    sx={{
                      display: "inline-flex",
                      alignItems: "center",
                      px: 1.5,
                      py: 0.75,
                      bgcolor: "success.light",
                      color: "white",
                      borderRadius: "12px",
                      fontSize: "0.8rem",
                      fontWeight: "600",
                      boxShadow: "0 2px 4px rgba(0,0,0,0.08)",
                      transition: "all 0.2s ease",
                      "&:hover": {
                        bgcolor: "success.main",
                        color: "common.white",
                        cursor: "pointer",
                      },
                    }}
                  >
                    Open for Commissions
                  </Box>
                )}
              </Box>
            </Stack>

            {/* Action Buttons */}
            <Box
              sx={{
                display: "flex",
                justifyContent: "flex-end",
                pt: 2.5,
              }}
            >
              {isOwner ? (
                <Stack direction="row" spacing={1.5}>
                  <Button
                    variant="outlined"
                    color="primary"
                    startIcon={<EditIcon />}
                    onClick={handleEditProfile}
                    size="medium"
                    sx={{
                      borderRadius: 2,
                      px: 2,
                      textTransform: "none",
                      fontWeight: 500,
                      boxShadow: "0 2px 5px rgba(0,0,0,0.05)",
                      transition: "all 0.2s",
                      "&:hover": {
                        boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
                        transform: "translateY(-2px)",
                      },
                    }}
                  >
                    Edit Profile
                  </Button>
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<DashboardIcon />}
                    onClick={handleOpenDashboard}
                    size="medium"
                    sx={{
                      borderRadius: 2,
                      px: 2.5,
                      textTransform: "none",
                      fontWeight: 500,
                      boxShadow: "0 2px 5px rgba(58,53,225,0.3)",
                      transition: "all 0.2s",
                      "&:hover": {
                        boxShadow: "0 4px 10px rgba(58,53,225,0.4)",
                        transform: "translateY(-2px)",
                      },
                    }}
                  >
                    Open Dashboard
                  </Button>
                </Stack>
              ) : (
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Tooltip title="Bookmark Creator" arrow placement="top">
                    <IconButton
                      size="medium"
                      sx={{
                        border: "1px solid",
                        borderColor: "divider",
                        borderRadius: 2,
                        p: 1,
                        color: "text.secondary",
                        transition: "all 0.2s",
                        "&:hover": {
                          bgcolor: "action.hover",
                          transform: "translateY(-2px)",
                          boxShadow: "0 3px 6px rgba(0,0,0,0.1)",
                        },
                      }}
                    >
                      <BookmarkIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<ChatBubbleOutlineIcon />}
                    onClick={handleMessageCreator}
                    size="medium"
                    sx={{
                      borderRadius: 2,
                      px: 2.5,
                      py: 1,
                      textTransform: "none",
                      fontWeight: 500,
                      boxShadow: "0 2px 5px rgba(58,53,225,0.3)",
                      transition: "all 0.2s",
                      "&:hover": {
                        boxShadow: "0 4px 10px rgba(58,53,225,0.4)",
                        transform: "translateY(-2px)",
                      },
                    }}
                  >
                    Message Creator
                  </Button>
                </Stack>
              )}
            </Box>
          </Box>
        </Box>

        {/* Main Content Area */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            backgroundColor: "#EEEEEE",
          }}
        >
          <Box
            sx={{
              mt: 4,
              width: "80vw",
              display: "flex",
              gap: 4,
            }}
          >
            {/* Left Sidebar */}
            <Box sx={{ width: 280, flexShrink: 0 }}>
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  borderRadius: 3,
                  border: "1px solid",
                  borderColor: "divider",
                  transition: "box-shadow 0.3s ease",
                  "&:hover": {
                    boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                  },
                }}
              >
                {/* About Section */}
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
                    fontWeight: profile.bio ? 400 : 300,
                    fontStyle: profile.bio ? "normal" : "italic",
                  }}
                >
                  {profile.bio || "No bio yet."}
                </Typography>

                <Divider sx={{ mb: 3 }} />

                {/* Social Links */}
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
                    profile.socials.map((social: { label: string; url: string; platform: string }, index: number) => (
                      <Tooltip
                      key={index}
                      title={social.label}
                      arrow
                      placement="top"
                      >
                      <IconButton
                      size="small"
                      sx={{
                      bgcolor: "action.hover",
                      color: "text.primary",
                      transition: "all 0.2s ease",
                      "&:hover": {
                        bgcolor: "primary.main",
                        color: "white",
                        transform: "translateY(-3px)",
                        boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
                      },
                      width: 36,
                      height: 36,
                      }}
                      href={social.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      >
                      {getSocialIcon(social.platform)}
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

                {/* Tags */}
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
                  {profile.tags && profile.tags.length > 0 ? (
                    profile.tags.map((tag: string) => (
                      <Chip
                        key={tag}
                        label={tag}
                        size="small"
                        sx={{
                          fontSize: "0.75rem",
                          height: 26,
                          borderRadius: "12px",
                          fontWeight: 500,
                          bgcolor: "action.hover",
                          color: "text.primary",
                          transition: "all 0.2s ease",
                          "&:hover": {
                            bgcolor: "primary.light",
                            color: "primary.contrastText",
                            transform: "translateY(-2px)",
                            boxShadow: "0 2px 5px rgba(0,0,0,0.08)",
                          },
                        }}
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

            {/* Main Content */}
            <Box sx={{ flex: 1 }}>
              {/* Tabs Navigation */}
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

              {/* Tab Content */}
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

      {/* Dialogs */}
      <CommissionDialog isOwner={isOwner} />
      {isOwner && <UploadArtDialog />}
    </Box>
  );
}

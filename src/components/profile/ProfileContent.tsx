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
  Fade,
  Zoom,
} from "@mui/material";
import {
  Message as MessageIcon,
  BookmarkBorder as BookmarkIcon,
  ChatBubbleOutline as ChatBubbleOutlineIcon,
  Edit as EditIcon,
  Dashboard as DashboardIcon,
  LocationOn as LocationIcon,
  CalendarMonth as CalendarIcon,
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
    <Box sx={{ bgcolor: "#f5f7fa" }}>
      {/* Banner with gradient overlay */}
      <Box
        sx={{
          width: "100%",
          height: { xs: 200, sm: 250, md: 280 },
          backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.1), rgba(0,0,0,0.3)), url(${bannerUrl}?t=${Date.now()})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          position: "relative",
          transition: "all 0.3s ease",
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
          <Zoom in={true} timeout={500}>
            <Box
              sx={{
                width: { xs: "95vw", sm: "90vw", md: "85vw", lg: "80vw" },
                display: "flex",
                flexDirection: { xs: "column", md: "row" },
                justifyContent: "space-between",
                alignItems: { xs: "center", md: "flex-start" },
                gap: 3,
              }}
            >
              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={2.5}
                alignItems={{ xs: "center", sm: "flex-start" }}
                sx={{ width: { xs: "100%", md: "auto" } }}
              >
                <Avatar
                  src={`${avatarUrl}?t=${Date.now()}`}
                  alt={profile.username}
                  sx={{
                    width: { xs: 120, sm: 140, md: 160 },
                    height: { xs: 120, sm: 140, md: 160 },
                    border: "4px solid white",
                    top: { xs: -30, sm: -40, md: -50 },
                    boxShadow: "0 8px 20px rgba(0,0,0,0.15)",
                    transition: "transform 0.3s, box-shadow 0.3s",
                    "&:hover": {
                      transform: "scale(1.05)",
                      boxShadow: "0 12px 24px rgba(0,0,0,0.2)",
                    },
                  }}
                />

                <Box
                  sx={{
                    pt: { xs: 0, sm: 1 },
                    textAlign: { xs: "center", sm: "left" },
                    width: { xs: "100%", sm: "auto" },
                  }}
                >
                  <Typography
                    variant="h5"
                    fontWeight="bold"
                    sx={{
                      mb: 0.5,
                      fontSize: { xs: "1.5rem", sm: "1.75rem", md: "2rem" },
                    }}
                  >
                    {profile.displayName || profile.username}
                  </Typography>

                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 1.5 }}
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
                        px: 1.8,
                        py: 0.8,
                        mb: 1,
                        bgcolor: profile.openForCommissions
                          ? theme.palette.success.light
                          : "grey.300",
                        color: profile.openForCommissions
                          ? "white"
                          : "text.primary",
                        borderRadius: "16px",
                        fontWeight: 600,
                        boxShadow: profile.openForCommissions
                          ? "0 3px 5px rgba(0,0,0,0.1)"
                          : "none",
                        transition: "0.3s",
                        "&:hover": profile.openForCommissions
                          ? {
                              bgcolor: theme.palette.success.main,
                              cursor: "pointer",
                              transform: "translateY(-2px)",
                              boxShadow: "0 5px 10px rgba(0,0,0,0.15)",
                            }
                          : {},
                      }}
                    >
                      {profile.openForCommissions
                        ? "Tersedia untuk komisi"
                        : "Tidak tersedia untuk komisi"}
                    </Typography>
                  )}
                </Box>
              </Stack>

              <Box
                sx={{
                  display: "flex",
                  justifyContent: { xs: "center", md: "flex-end" },
                  pt: { xs: 1, sm: 2.5 },
                  width: { xs: "100%", md: "auto" },
                }}
              >
                {isOwner ? (
                  <Stack
                    direction={{ xs: "column", sm: "row" }}
                    spacing={1.5}
                    sx={{ width: { xs: "100%", sm: "auto" } }}
                  >
                    <Button
                      variant="outlined"
                      startIcon={<EditIcon />}
                      onClick={handleEditProfile}
                      sx={{
                        textTransform: "none",
                        fontWeight: 500,
                        borderRadius: "12px",
                        py: 1,
                        width: { xs: "100%", sm: "auto" },
                        transition: "all 0.3s ease",
                        "&:hover": {
                          transform: "translateY(-2px)",
                          boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
                        },
                      }}
                    >
                      Edit Profil
                    </Button>
                    <Button
                      variant="contained"
                      startIcon={<DashboardIcon />}
                      onClick={handleOpenDashboard}
                      sx={{
                        textTransform: "none",
                        fontWeight: 500,
                        borderRadius: "12px",
                        py: 1,
                        width: { xs: "100%", sm: "auto" },
                        boxShadow: "0 3px 5px rgba(0,0,0,0.1)",
                        transition: "all 0.3s ease",
                        "&:hover": {
                          transform: "translateY(-2px)",
                          boxShadow: "0 6px 12px rgba(0,0,0,0.15)",
                        },
                      }}
                    >
                      Buka Dashboard
                    </Button>
                  </Stack>
                ) : (
                  <Stack
                    direction={{ xs: "column", sm: "row" }}
                    spacing={1.5}
                    alignItems="center"
                    sx={{ width: { xs: "100%", sm: "auto" } }}
                  >
                    <Tooltip title="Simpan Kreator">
                      <IconButton
                        sx={{
                          transition: "all 0.3s ease",
                          "&:hover": {
                            transform: "translateY(-2px)",
                            color: theme.palette.primary.main,
                          },
                        }}
                      >
                        <BookmarkIcon />
                      </IconButton>
                    </Tooltip>
                    <Button
                      variant="contained"
                      startIcon={<ChatBubbleOutlineIcon />}
                      onClick={handleMessageCreator}
                      sx={{
                        textTransform: "none",
                        fontWeight: 500,
                        borderRadius: "12px",
                        py: 1,
                        width: { xs: "100%", sm: "auto" },
                        boxShadow: "0 3px 5px rgba(0,0,0,0.1)",
                        transition: "all 0.3s ease",
                        "&:hover": {
                          transform: "translateY(-2px)",
                          boxShadow: "0 6px 12px rgba(0,0,0,0.15)",
                        },
                      }}
                    >
                      Kirim Pesan
                    </Button>
                  </Stack>
                )}
              </Box>
            </Box>
          </Zoom>
        </Box>

        {/* Main Content */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            mt: -2,
            backgroundColor: "#EEEEEE",
          }}
        >
          <Box
            sx={{
              width: { xs: "95vw", sm: "90vw", md: "85vw", lg: "80vw" },
              display: "flex",
              flexDirection: { xs: "column", md: "row" },
              gap: 4,
              mt: 4
            }}
          >
            {/* Sidebar */}
            <Fade in={true} timeout={800}>
              <Box
                sx={{
                  width: { xs: "100%", md: 300 },
                  flexShrink: 0,
                  mb: { xs: 4, md: 0 },
                }}
              >
                <Paper
                  elevation={0}
                  sx={{
                    p: 3,
                    borderRadius: 4,
                    border: "1px solid",
                    borderColor: "divider",
                    boxShadow: "0 4px 20px rgba(0,0,0,0.04)",
                    transition: "transform 0.3s, box-shadow 0.3s",
                    "&:hover": {
                      boxShadow: "0 8px 30px rgba(0,0,0,0.08)",
                      transform: "translateY(-4px)",
                    },
                  }}
                >
                  <Typography
                    variant="subtitle1"
                    fontWeight="bold"
                    sx={{
                      mb: 2,
                      position: "relative",
                      "&:after": {
                        content: '""',
                        position: "absolute",
                        bottom: -8,
                        left: 0,
                        width: 40,
                        height: 3,
                        borderRadius: 1.5,
                        bgcolor: "primary.main",
                      },
                    }}
                  >
                    Tentang
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      mb: 3.5,
                      lineHeight: 1.8,
                      fontStyle: profile.bio ? "normal" : "italic",
                    }}
                  >
                    {profile.bio || "Belum ada bio."}
                  </Typography>

                  {/* Added extra profile details section */}
                  {(profile.location || profile.joinDate) && (
                    <>
                      <Box sx={{ mb: 3 }}>
                        {profile.location && (
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              mb: 1,
                            }}
                          >
                            <LocationIcon
                              fontSize="small"
                              sx={{ color: "text.secondary", mr: 1 }}
                            />
                            <Typography variant="body2" color="text.secondary">
                              {profile.location}
                            </Typography>
                          </Box>
                        )}
                        {profile.joinDate && (
                          <Box sx={{ display: "flex", alignItems: "center" }}>
                            <CalendarIcon
                              fontSize="small"
                              sx={{ color: "text.secondary", mr: 1 }}
                            />
                            <Typography variant="body2" color="text.secondary">
                              Bergabung {profile.joinDate || "Juli 2023"}
                            </Typography>
                          </Box>
                        )}
                      </Box>
                      <Divider sx={{ mb: 3 }} />
                    </>
                  )}

                  <Typography
                    variant="subtitle1"
                    fontWeight="bold"
                    sx={{
                      mb: 2,
                      position: "relative",
                      "&:after": {
                        content: '""',
                        position: "absolute",
                        bottom: -8,
                        left: 0,
                        width: 40,
                        height: 3,
                        borderRadius: 1.5,
                        bgcolor: "primary.main",
                      },
                    }}
                  >
                    Media Sosial
                  </Typography>
                  <Box
                    sx={{
                      display: "flex",
                      gap: 1.5,
                      mb: 3.5,
                      flexWrap: "wrap",
                      justifyContent: { xs: "center", md: "flex-start" },
                    }}
                  >
                    {profile.socials?.length > 0 ? (
                      profile.socials.map((s: any, i: number) => (
                        <Tooltip key={i} title={s.label}>
                          <IconButton
                            href={s.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            sx={{
                              transition: "all 0.3s ease",
                              "&:hover": {
                                transform: "translateY(-4px) scale(1.1)",
                                color: theme.palette.primary.main,
                              },
                            }}
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
                        Belum ada tautan media sosial
                      </Typography>
                    )}
                  </Box>
                  <Divider sx={{ mb: 3 }} />
                  <Typography
                    variant="subtitle1"
                    fontWeight="bold"
                    sx={{
                      mb: 2,
                      position: "relative",
                      "&:after": {
                        content: '""',
                        position: "absolute",
                        bottom: -8,
                        left: 0,
                        width: 40,
                        height: 3,
                        borderRadius: 1.5,
                        bgcolor: "primary.main",
                      },
                    }}
                  >
                    Tag
                  </Typography>
                  <Box
                    sx={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 1,
                      justifyContent: { xs: "center", md: "flex-start" },
                    }}
                  >
                    {profile.tags?.length > 0 ? (
                      profile.tags.map((tag: string) => (
                        <Chip
                          key={tag}
                          label={tag}
                          size="small"
                          sx={{
                            fontSize: "0.75rem",
                            height: 28,
                            borderRadius: "8px",
                            transition: "all 0.2s ease",
                            "&:hover": {
                              bgcolor: theme.palette.primary.light,
                              color: "white",
                              transform: "translateY(-2px)",
                              boxShadow: "0 3px 5px rgba(0,0,0,0.1)",
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
                        Belum ada tag
                      </Typography>
                    )}
                  </Box>
                </Paper>
              </Box>
            </Fade>

            {/* Tabs and Sections */}
            <Fade in={true} timeout={1000}>
              <Box sx={{ flex: 1 }}>
                <Paper
                  elevation={0}
                  sx={{
                    borderRadius: 4,
                    overflow: "hidden",
                    border: "1px solid",
                    borderColor: "divider",
                    boxShadow: "0 4px 20px rgba(0,0,0,0.04)",
                  }}
                >
                  <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
                    <Tabs
                      value={activeTab}
                      onChange={handleTabChange}
                      textColor="primary"
                      indicatorColor="primary"
                      sx={{
                        "& .MuiTab-root": {
                          textTransform: "none",
                          fontWeight: 600,
                          fontSize: "1rem",
                          py: 2,
                          transition: "all 0.2s",
                          "&:hover": {
                            color: theme.palette.primary.main,
                            opacity: 1,
                          },
                        },
                      }}
                    >
                      <Tab label="Komisi" sx={{px: 10}}/>
                      <Tab label="Galeri" sx={{px: 10}}/>
                    </Tabs>
                  </Box>

                  <Box sx={{ p: { xs: 2, sm: 3 } }}>
                    {activeTab === 0 && (
                      <CommissionSection
                        username={profile.username}
                        isOwner={isOwner}
                      />
                    )}
                    {activeTab === 1 && (
                      <GallerySection
                        username={profile.username}
                        isOwner={isOwner}
                      />
                    )}
                  </Box>
                </Paper>
              </Box>
            </Fade>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}

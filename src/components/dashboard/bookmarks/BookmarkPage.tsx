// src/components/dashboard/bookmarks/BookmarkPage.tsx
"use client";

import { useState, useEffect } from "react";
import {
  Box,
  Container,
  Typography,
  Grid,
  Tabs,
  Tab,
  CircularProgress,
  Button,
  Alert,
  Paper,
  useTheme,
  useMediaQuery,
  Breadcrumbs,
  Link,
} from "@mui/material";
import {
  Bookmark as BookmarkIcon,
  Person as PersonIcon,
  Palette as PaletteIcon,
  Refresh as RefreshIcon,
  CollectionsBookmark as EmptyBookmarkIcon,
  ArrowBack,
  Home,
  LocalAtm,
  NavigateNext,
  BookmarksOutlined,
} from "@mui/icons-material";
import { CommissionListingItem } from "../../dashboard/commissions/CommissionListingItem";
import ArtistItem from "../../artist/ArtistItem";

// Types
interface BookmarkPageProps {
  username: string;
  session?: any;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

// Component for tab panels
function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`bookmark-tabpanel-${index}`}
      aria-labelledby={`bookmark-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

// Empty state component
const EmptyState = ({
  message,
  buttonText,
  buttonLink,
}: {
  message: string;
  buttonText: string;
  buttonLink: string;
}) => (
  <Paper elevation={1} sx={{ p: 4, textAlign: "center", borderRadius: 2 }}>
    <EmptyBookmarkIcon
      sx={{ fontSize: 60, color: "text.secondary", mb: 2, opacity: 0.7 }}
    />
    <Typography variant="h6" color="text.secondary" mb={2}>
      {message}
    </Typography>
    <Button
      variant="contained"
      color="primary"
      onClick={() => (window.location.href = buttonLink)}
    >
      {buttonText}
    </Button>
  </Paper>
);

export default function BookmarkPage({ username, session }: BookmarkPageProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [bookmarkedArtists, setBookmarkedArtists] = useState<any[]>([]);
  const [bookmarkedCommissions, setBookmarkedCommissions] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchBookmarks = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/user/bookmarks");

      if (!response.ok) {
        throw new Error("Gagal mengambil bookmark");
      }

      const data = await response.json();

      setBookmarkedArtists(data.artists || []);
      setBookmarkedCommissions(data.commissions || []);
    } catch (error) {
      console.error("Error fetching bookmarks:", error);
      setError("Gagal memuat bookmark Anda. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookmarks();
  }, []);

  const handleChangeTab = (_: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleToggleArtistBookmark = async (
    artistId: string,
    action: "bookmark" | "unbookmark"
  ) => {
    try {
      const response = await fetch("/api/bookmark/artist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ artistId, action }),
      });

      if (!response.ok) {
        throw new Error("Gagal memperbarui bookmark");
      }

      // Remove the artist from the list if unbookmarked
      if (action === "unbookmark") {
        setBookmarkedArtists(
          bookmarkedArtists.filter((artist) => artist._id !== artistId)
        );
      }
    } catch (error) {
      console.error("Error toggling artist bookmark:", error);
    }
  };

  const handleToggleCommissionBookmark = async (
    commissionId: string,
    action: "bookmark" | "unbookmark"
  ) => {
    try {
      const response = await fetch("/api/bookmark/commission", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ commissionId, action }),
      });

      if (!response.ok) {
        throw new Error("Gagal memperbarui bookmark");
      }

      // Remove the commission from the list if unbookmarked
      if (action === "unbookmark") {
        setBookmarkedCommissions(
          bookmarkedCommissions.filter(
            (commission) => commission._id !== commissionId
          )
        );
      }
    } catch (error) {
      console.error("Error toggling commission bookmark:", error);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box
        sx={{
          mb: 3,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <Breadcrumbs separator={<NavigateNext fontSize="small" />}>
            <Link
              component={Link}
              href={`/${username}/dashboard`}
              underline="hover"
              color="inherit"
              sx={{ display: "flex", alignItems: "center" }}
            >
              <Home fontSize="small" sx={{ mr: 0.5 }} />
              Dashboard
            </Link>
            <Typography
              color="text.primary"
              sx={{ display: "flex", alignItems: "center" }}
            >
              <BookmarksOutlined fontSize="small" sx={{ mr: 0.5 }} />
              Bookmark
            </Typography>
          </Breadcrumbs>

          <Box display="flex" alignItems="center" mt={4} ml={-0.5}>
            <BookmarkIcon sx={{ mr: 1, color: "primary.main", fontSize: 32 }} />
            <Typography variant="h4" fontWeight="bold">
              Bookmark Saya
            </Typography>
          </Box>
        </Box>

        <Button
          component={Link}
          href={`/${username}/dashboard`}
          variant="outlined"
          startIcon={<ArrowBack />}
          size="small"
          mt={-1}
        >
          Kembali ke Profil
        </Button>
      </Box>

      <Paper sx={{ mb: 3, borderRadius: 2 }}>
        <Tabs
          value={activeTab}
          onChange={handleChangeTab}
          aria-label="bookmark tabs"
          variant={isMobile ? "fullWidth" : "standard"}
          sx={{
            borderBottom: 1,
            borderRadius: 2,
            borderColor: "divider",
            "& .MuiTab-root": {
              py: 2,
            },
          }}
        >
          <Tab
            icon={<PaletteIcon />}
            label="Komisi"
            iconPosition="start"
            id="bookmark-tab-0"
            aria-controls="bookmark-tabpanel-0"
            sx={{ px: 10 }}
          />
          <Tab
            icon={<PersonIcon />}
            label="Seniman"
            iconPosition="start"
            id="bookmark-tab-1"
            aria-controls="bookmark-tabpanel-1"
            sx={{ px: 10 }}
          />
        </Tabs>
      </Paper>

      {error && (
        <Alert
          severity="error"
          sx={{ mb: 3 }}
          action={
            <Button
              color="inherit"
              size="small"
              onClick={fetchBookmarks}
              startIcon={<RefreshIcon />}
            >
              Coba Lagi
            </Button>
          }
        >
          {error}
        </Alert>
      )}

      {loading ? (
        <Box
          display="flex"
          justifyContent="center"
          py={6}
          flexDirection="column"
          alignItems="center"
        >
          <CircularProgress size={60} thickness={4} />
          <Typography variant="body1" mt={2} color="text.secondary">
            Memuat bookmark...
          </Typography>
        </Box>
      ) : (
        <>
          {/* Commissions Tab */}
          <TabPanel value={activeTab} index={0}>
            <Typography variant="h6" mb={3} display="flex" alignItems="center">
              <PaletteIcon sx={{ mr: 1, color: "primary.main" }} />
              Komisi yang Disimpan ({bookmarkedCommissions.length})
            </Typography>

            {bookmarkedCommissions.length > 0 ? (
              <Grid container spacing={3}>
                {bookmarkedCommissions.map((commission) => (
                  <Grid item xs={12} sm={6} md={4} key={commission._id}>
                    <CommissionListingItem
                      listing={commission}
                      username={commission.artistId?.username || "unknown"}
                      isOwner={false}
                      isAuthenticated={true}
                      isBookmarked={true}
                      onToggleBookmark={handleToggleCommissionBookmark}
                    />
                  </Grid>
                ))}
              </Grid>
            ) : (
              <EmptyState
                message="Belum ada komisi yang disimpan"
                buttonText="Jelajahi Komisi"
                buttonLink="/search/commissions"
              />
            )}
          </TabPanel>

          {/* Artists Tab */}
          <TabPanel value={activeTab} index={1}>
            <Typography variant="h6" mb={3} display="flex" alignItems="center">
              <PersonIcon sx={{ mr: 1, color: "primary.main" }} />
              Seniman yang Disimpan ({bookmarkedArtists.length})
            </Typography>

            {bookmarkedArtists.length > 0 ? (
              <Grid container spacing={3}>
                {bookmarkedArtists.map((artist) => (
                  <Grid item xs={12} sm={6} md={4} key={artist._id}>
                    <ArtistItem
                      artist={artist}
                      isAuthenticated={true}
                      isBookmarked={true}
                      onToggleBookmark={handleToggleArtistBookmark}
                    />
                  </Grid>
                ))}
              </Grid>
            ) : (
              <EmptyState
                message="Belum ada seniman yang disimpan"
                buttonText="Jelajahi Seniman"
                buttonLink="/search/artists"
              />
            )}
          </TabPanel>
        </>
      )}
    </Container>
  );
}

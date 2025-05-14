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
  Divider,
  CircularProgress,
  Button,
  Alert,
} from "@mui/material";
import {
  Bookmark as BookmarkIcon,
  Person as PersonIcon,
  Palette as PaletteIcon,
  Refresh as RefreshIcon,
} from "@mui/icons-material";
import { CommissionListingItem } from "../../dashboard/commissions/CommissionListingItem";
import ArtistItem from "../../artist/ArtistItem";

interface BookmarkPageProps {
  username: string;
  session?: any;
}

export default function BookmarkPage({ username, session }: BookmarkPageProps) {
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
        throw new Error("Failed to fetch bookmarks");
      }

      const data = await response.json();

      setBookmarkedArtists(data.artists || []);
      setBookmarkedCommissions(data.commissions || []);
    } catch (error) {
      console.error("Error fetching bookmarks:", error);
      setError("Failed to load your bookmarks. Please try again.");
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
        throw new Error("Failed to update bookmark");
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
        throw new Error("Failed to update bookmark");
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
      <Box display="flex" alignItems="center" mb={3}>
        <BookmarkIcon sx={{ mr: 1, color: "primary.main" }} />
        <Typography variant="h4" fontWeight="bold">
          My Bookmarks
        </Typography>
      </Box>

      <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={handleChangeTab}
          aria-label="bookmark tabs"
        >
          <Tab
            icon={<PaletteIcon />}
            label="Commissions"
            iconPosition="start"
          />
          <Tab icon={<PersonIcon />} label="Artists" iconPosition="start" />
        </Tabs>
      </Box>

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
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      )}

      {loading ? (
        <Box display="flex" justifyContent="center" py={6}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {/* Commissions Tab */}
          <div role="tabpanel" hidden={activeTab !== 0}>
            {activeTab === 0 && (
              <>
                <Typography variant="h6" mb={3}>
                  Bookmarked Commissions ({bookmarkedCommissions.length})
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
                  <Box
                    py={6}
                    textAlign="center"
                    sx={{ bgcolor: "background.paper", borderRadius: 2 }}
                  >
                    <Typography variant="h6" color="text.secondary" mb={2}>
                      No bookmarked commissions yet
                    </Typography>
                    <Button
                      variant="contained"
                      onClick={() =>
                        (window.location.href = "/search/commissions")
                      }
                    >
                      Explore Commissions
                    </Button>
                  </Box>
                )}
              </>
            )}
          </div>

          {/* Artists Tab */}
          <div role="tabpanel" hidden={activeTab !== 1}>
            {activeTab === 1 && (
              <>
                <Typography variant="h6" mb={3}>
                  Bookmarked Artists ({bookmarkedArtists.length})
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
                  <Box
                    py={6}
                    textAlign="center"
                    sx={{ bgcolor: "background.paper", borderRadius: 2 }}
                  >
                    <Typography variant="h6" color="text.secondary" mb={2}>
                      No bookmarked artists yet
                    </Typography>
                    <Button
                      variant="contained"
                      onClick={() => (window.location.href = "/search/artists")}
                    >
                      Explore Artists
                    </Button>
                  </Box>
                )}
              </>
            )}
          </div>
        </>
      )}
    </Container>
  );
}

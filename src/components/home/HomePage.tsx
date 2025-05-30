// src/components/home/HomePage.tsx
"use client";

import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  Grid,
  Container,
  Stack,
  CircularProgress,
  Chip,
  TextField,
  InputAdornment,
  Paper,
  Tabs,
  Tab,
  useTheme,
  alpha,
  ButtonGroup,
  Alert,
} from "@mui/material";
import {
  Search as SearchIcon,
  TrendingUp as TrendingUpIcon,
  ArrowForward as ArrowForwardIcon,
  Palette as PaletteIcon,
  Person as PersonIcon,
} from "@mui/icons-material";
import { useRouter } from "next/navigation";
import { CommissionListingItem } from "../dashboard/commissions/CommissionListingItem";
import ArtistItem from "../artist/ArtistItem"; // Import ArtistItem component

interface HomePageProps {
  session?: any;
}

export default function HomePage({ session }: HomePageProps) {
  const router = useRouter();
  const theme = useTheme();
  const [featuredListings, setFeaturedListings] = useState<any[]>([]);
  const [popularArtists, setPopularArtists] = useState<any[]>([]);
  const [popularTags, setPopularTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookmarkLoading, setBookmarkLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState<"commissions" | "artists">(
    "commissions"
  );

  // Bookmark states
  const [bookmarkedCommissions, setBookmarkedCommissions] = useState<string[]>(
    []
  );
  const [bookmarkedArtists, setBookmarkedArtists] = useState<string[]>([]);

  const isAuthenticated = !!session;

  useEffect(() => {
    // Fetch featured listings and popular artists
    const fetchHomeData = async () => {
      try {
        setLoading(true);

        // Fetch both popular listings and artists in parallel
        const [listingsResponse, artistsResponse] = await Promise.all([
          fetch("/api/search/commissions?limit=4"),
          fetch("/api/search/artists?limit=4"),
        ]);

        const listingsData = await listingsResponse.json();
        const artistsData = await artistsResponse.json();

        if (listingsData.items) {
          setFeaturedListings(listingsData.items);

          // Extract unique tags from listings
          const allTags = listingsData.items.flatMap(
            (listing: any) => listing.tags || []
          );
          const uniqueTags = [...new Set(allTags)];
          setPopularTags(uniqueTags.slice(0, 8) as string[]); // Get top 8 tags
        }

        if (artistsData.artists) {
          setPopularArtists(artistsData.artists);
        }
      } catch (error) {
        console.error("Error fetching home data:", error);
        setErrorMessage("Gagal memuat data. Silakan coba lagi nanti.");
      } finally {
        setLoading(false);
      }
    };

    fetchHomeData();
  }, []);

  // Fetch user's bookmarks when authenticated
  useEffect(() => {
    const fetchBookmarks = async () => {
      if (!isAuthenticated) return;

      try {
        const response = await fetch("/api/user/bookmarks");
        if (!response.ok) throw new Error("Failed to fetch bookmarks");

        const data = await response.json();

        // Extract IDs from bookmark objects
        const commissionIds =
          data.commissions?.map((item: any) => item._id.toString()) || [];
        const artistIds =
          data.artists?.map((item: any) => item._id.toString()) || [];

        setBookmarkedCommissions(commissionIds);
        setBookmarkedArtists(artistIds);
      } catch (error) {
        console.error("Error fetching bookmarks:", error);
      }
    };

    fetchBookmarks();
  }, [isAuthenticated]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search/${searchType}?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleTagClick = (tag: string) => {
    router.push(`/search/commissions?tags=${encodeURIComponent(tag)}`);
  };

  const handleToggleBookmark = async (
    id: string,
    action: "bookmark" | "unbookmark",
    type: "commission" | "artist"
  ) => {
    if (!isAuthenticated) {
      // TODO
      return;
    }

    try {
      setBookmarkLoading(true);
      setErrorMessage(null);

      const endpoint =
        type === "commission"
          ? "/api/bookmark/commission"
          : "/api/bookmark/artist";
      const payload =
        type === "commission"
          ? { commissionId: id, action }
          : { artistId: id, action };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Failed to update bookmark");
      }

      // Update local state based on the action and type
      if (type === "commission") {
        if (action === "bookmark") {
          setBookmarkedCommissions((prev) => [...prev, id]);
        } else {
          setBookmarkedCommissions((prev) =>
            prev.filter((itemId) => itemId !== id)
          );
        }
      } else {
        if (action === "bookmark") {
          setBookmarkedArtists((prev) => [...prev, id]);
        } else {
          setBookmarkedArtists((prev) =>
            prev.filter((itemId) => itemId !== id)
          );
        }
      }
    } catch (error) {
      console.error("Error toggling bookmark:", error);
      setErrorMessage("Gagal memperbarui bookmark. Silakan coba lagi.");
    } finally {
      setBookmarkLoading(false);
    }
  };

  return (
    <Box>
      {/* Hero Section with improved search */}
      <Box
        sx={{
          background: `linear-gradient(135deg, ${theme.palette.primary.light} 0%, ${theme.palette.primary.main} 100%)`,
          color: "white",
          pt: { xs: 6, md: 10 },
          pb: { xs: 8, md: 12 },
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Decorative elements */}
        <Box
          sx={{
            position: "absolute",
            top: -100,
            right: -100,
            width: 300,
            height: 300,
            borderRadius: "50%",
            background: alpha(theme.palette.primary.light, 0.2),
            zIndex: 0,
          }}
        />
        <Box
          sx={{
            position: "absolute",
            bottom: -50,
            left: -50,
            width: 200,
            height: 200,
            borderRadius: "50%",
            background: alpha(theme.palette.primary.light, 0.1),
            zIndex: 0,
          }}
        />

        <Container maxWidth="md" sx={{ position: "relative", zIndex: 1 }}>
          <Typography
            variant="h2"
            component="h1"
            fontWeight="bold"
            mb={2}
            sx={{
              textAlign: "center",
              fontSize: { xs: "2.5rem", md: "3.5rem" },
              textShadow: "0 2px 10px rgba(0,0,0,0.1)",
            }}
          >
            Temukan Seniman Terbaik untuk Komisi Anda
          </Typography>

          <Typography
            variant="h6"
            mb={5}
            fontWeight="normal"
            sx={{
              textAlign: "center",
              maxWidth: "80%",
              mx: "auto",
              opacity: 0.9,
            }}
          >
            Hubungkan dengan seniman berbakat dan wujudkan ide Anda di KOMIS
          </Typography>

          <Paper
            elevation={4}
            sx={{
              p: 2,
              maxWidth: 700,
              mx: "auto",
              borderRadius: 4,
              boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
              background: "white",
            }}
          >
            <form onSubmit={handleSearch}>
              <Grid container spacing={1} alignItems="center">
                <Grid item xs={12} sm={8}>
                  <TextField
                    fullWidth
                    placeholder={
                      searchType === "commissions"
                        ? "Cari gaya komisi..."
                        : "Cari seniman berdasarkan nama atau gaya..."
                    }
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    variant="outlined"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon color="action" />
                        </InputAdornment>
                      ),
                      sx: {
                        borderRadius: 2,
                        "& .MuiOutlinedInput-notchedOutline": {
                          borderColor: "transparent",
                        },
                      },
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Box
                    sx={{ display: "flex", flexDirection: "column", gap: 1 }}
                  >
                    <ButtonGroup fullWidth variant="contained" disableElevation>
                      <Button
                        color={
                          searchType === "commissions" ? "primary" : "inherit"
                        }
                        onClick={() => setSearchType("commissions")}
                        startIcon={<PaletteIcon />}
                        sx={{
                          flexGrow: 1,
                          color:
                            searchType === "commissions"
                              ? "white"
                              : "text.secondary",
                          backgroundColor:
                            searchType === "commissions"
                              ? "primary.main"
                              : "background.paper",
                          "&:hover": {
                            backgroundColor:
                              searchType === "commissions"
                                ? "primary.dark"
                                : alpha(theme.palette.primary.main, 0.1),
                          },
                        }}
                      >
                        Komisi
                      </Button>
                      <Button
                        color={searchType === "artists" ? "primary" : "inherit"}
                        onClick={() => setSearchType("artists")}
                        startIcon={<PersonIcon />}
                        sx={{
                          flexGrow: 1,
                          color:
                            searchType === "artists"
                              ? "white"
                              : "text.secondary",
                          backgroundColor:
                            searchType === "artists"
                              ? "primary.main"
                              : "background.paper",
                          "&:hover": {
                            backgroundColor:
                              searchType === "artists"
                                ? "primary.dark"
                                : alpha(theme.palette.primary.main, 0.1),
                          },
                        }}
                      >
                        Seniman
                      </Button>
                    </ButtonGroup>
                    <Button
                      fullWidth
                      variant="contained"
                      type="submit"
                      size="large"
                      sx={{
                        py: 1.5,
                        borderRadius: 2,
                        background:
                          "linear-gradient(90deg, #A8FF00 0%, #00FFD1 100%)",
                        color: "white",
                        fontWeight: "bold",
                        "&:hover": {
                          background:
                            "linear-gradient(90deg, #9EF500 0%, #00F0C5 100%)",
                        },
                      }}
                    >
                      Cari Sekarang
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </form>
          </Paper>
        </Container>
      </Box>

      {/* Featured Commissions Section with Tabs */}
      <Box sx={{ bgcolor: "background.default", py: 8 }}>
        <Container>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            mb={4}
          >
            <Typography variant="h4" fontWeight="bold">
              <TrendingUpIcon sx={{ verticalAlign: "middle", mr: 1 }} />
              Jelajahi KOMIS
            </Typography>
          </Box>

          <Tabs
            value={false}
            indicatorColor="primary"
            textColor="primary"
            sx={{ mb: 4 }}
          >
            <Tab
              icon={<PaletteIcon />}
              label="Komisi Unggulan"
              onClick={() => router.push("/search/commissions")}
              iconPosition="start"
            />
            <Tab
              icon={<PersonIcon />}
              label="Seniman Populer"
              onClick={() => router.push("/search/artists")}
              iconPosition="start"
            />
          </Tabs>

          {loading ? (
            <Stack alignItems="center" py={4}>
              <CircularProgress />
            </Stack>
          ) : (
            <>
              {/* Featured Commissions */}
              <Typography variant="h5" fontWeight="bold" mb={3}>
                Komisi Unggulan
              </Typography>

              {errorMessage && (
                <Alert severity="error" sx={{ mb: 3 }}>
                  {errorMessage}
                </Alert>
              )}

              <Grid container spacing={3}>
                {featuredListings.map((listing) => (
                  <Grid item xs={12} sm={6} md={3} key={listing._id}>
                    <CommissionListingItem
                      listing={listing}
                      username={listing.artistId?.username || "unknown"}
                      isOwner={false}
                      isAuthenticated={isAuthenticated}
                      isBookmarked={bookmarkedCommissions.includes(
                        listing._id.toString()
                      )}
                      onToggleBookmark={async (listingId, action) => {
                        await handleToggleBookmark(
                          listingId,
                          action,
                          "commission"
                        );
                      }}
                      loading={bookmarkLoading}
                    />
                  </Grid>
                ))}

                {featuredListings.length === 0 && !loading && (
                  <Box width="100%" textAlign="center" py={4}>
                    <Typography variant="subtitle1" color="text.secondary">
                      Tidak ada komisi ditemukan. Periksa kembali nanti!
                    </Typography>
                  </Box>
                )}
              </Grid>

              <Box sx={{ textAlign: "center", mt: 4 }}>
                <Button
                  variant="contained"
                  size="large"
                  endIcon={<ArrowForwardIcon />}
                  onClick={() => router.push("/search/commissions")}
                  sx={{
                    borderRadius: 6,
                    px: 3,
                    py: 1.2,
                    background:
                      "linear-gradient(90deg, #A8FF00 0%, #00FFD1 100%)",
                    color: "white",
                    fontWeight: "bold",
                    "&:hover": {
                      background:
                        "linear-gradient(90deg, #9EF500 0%, #00F0C5 100%)",
                    },
                  }}
                >
                  Jelajahi Semua Komisi
                </Button>
              </Box>

              {/* Popular Artists - Now using ArtistItem component */}
              <Typography variant="h5" fontWeight="bold" mb={3} mt={8}>
                Seniman Populer
              </Typography>

              <Grid container spacing={3}>
                {popularArtists.map((artist) => (
                  <Grid item xs={12} sm={6} md={3} key={artist._id}>
                    <ArtistItem
                      artist={artist}
                      isAuthenticated={isAuthenticated}
                      isBookmarked={bookmarkedArtists.includes(
                        artist._id.toString()
                      )}
                      onToggleBookmark={async (artistId, action) => {
                        await handleToggleBookmark(artistId, action, "artist");
                      }}
                    />
                  </Grid>
                ))}

                {popularArtists.length === 0 && !loading && (
                  <Box width="100%" textAlign="center" py={4}>
                    <Typography variant="subtitle1" color="text.secondary">
                      Tidak ada seniman ditemukan. Periksa kembali nanti!
                    </Typography>
                  </Box>
                )}
              </Grid>

              <Box sx={{ textAlign: "center", mt: 4 }}>
                <Button
                  variant="contained"
                  size="large"
                  endIcon={<ArrowForwardIcon />}
                  onClick={() => router.push("/search/artists")}
                  sx={{
                    borderRadius: 6,
                    px: 3,
                    py: 1.2,
                  }}
                >
                  Temukan Lebih Banyak Seniman
                </Button>
              </Box>
            </>
          )}
        </Container>
      </Box>
    </Box>
  );
}

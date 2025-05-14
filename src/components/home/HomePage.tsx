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
  Card,
  CardContent,
  useTheme,
  alpha,
  ButtonGroup,
} from "@mui/material";
import {
  Search as SearchIcon,
  TrendingUp as TrendingUpIcon,
  ArrowForward as ArrowForwardIcon,
  Palette as PaletteIcon,
  Person as PersonIcon,
  Explore as ExploreIcon,
  Brush as BrushIcon,
  Star as StarIcon,
} from "@mui/icons-material";
import { useRouter } from "next/navigation";
import { CommissionListingItem } from "../dashboard/commissions/CommissionListingItem";

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
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState<"commissions" | "artists">(
    "commissions"
  );

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
      } finally {
        setLoading(false);
      }
    };

    fetchHomeData();
  }, []);

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
      // Redirect to login
      return;
    }

    try {
      const endpoint =
        type === "commission"
          ? "/api/bookmark/commission"
          : "/api/bookmark/artist";
      const payload =
        type === "commission"
          ? { commissionId: id, action }
          : { artistId: id, action };

      await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } catch (error) {
      console.error("Error toggling bookmark:", error);
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
                        color: "black",
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

          <Box sx={{ mt: 4, textAlign: "center" }}>
            <Typography
              variant="subtitle1"
              fontWeight="medium"
              mb={2}
              sx={{ opacity: 0.9 }}
            >
              Kategori Populer:
            </Typography>
            <Stack
              direction="row"
              spacing={1}
              justifyContent="center"
              flexWrap="wrap"
              sx={{ gap: 1 }}
            >
              {popularTags.map((tag) => (
                <Chip
                  key={tag}
                  label={tag}
                  onClick={() => handleTagClick(tag)}
                  sx={{
                    bgcolor: "rgba(255,255,255,0.15)",
                    color: "white",
                    fontWeight: 500,
                    backdropFilter: "blur(4px)",
                    "&:hover": {
                      bgcolor: "rgba(255,255,255,0.25)",
                    },
                  }}
                />
              ))}
            </Stack>
          </Box>
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

            {/* <Box>
              <Button
                variant="text"
                color="primary"
                endIcon={<ArrowForwardIcon />}
                onClick={() => router.push("/search/commissions")}
                sx={{ mr: 2 }}
              >
                Semua Komisi
              </Button>

              <Button
                variant="text"
                color="primary"
                endIcon={<ArrowForwardIcon />}
                onClick={() => router.push("/search/artists")}
              >
                Semua Seniman
              </Button>
            </Box> */}
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

              <Grid container spacing={3}>
                {featuredListings.map((listing) => (
                  <Grid item xs={12} sm={6} md={3} key={listing._id}>
                    <CommissionListingItem
                      listing={listing}
                      username={listing.artistId?.username || "unknown"}
                      isOwner={false}
                      isAuthenticated={isAuthenticated}
                      isBookmarked={false}
                      onToggleBookmark={async (listingId, action) => {
                        await handleToggleBookmark(
                          listingId,
                          action,
                          "commission"
                        );
                      }}
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
                    color: "black",
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

              {/* Popular Artists */}
              <Typography variant="h5" fontWeight="bold" mb={3} mt={8}>
                Seniman Populer
              </Typography>

              <Grid container spacing={3}>
                {popularArtists.map((artist) => (
                  <Grid item xs={12} sm={6} md={3} key={artist._id}>
                    <Card
                      sx={{
                        height: "100%",
                        display: "flex",
                        flexDirection: "column",
                        borderRadius: 3,
                        overflow: "hidden",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                        transition: "transform 0.3s ease, box-shadow 0.3s ease",
                        "&:hover": {
                          transform: "translateY(-5px)",
                          boxShadow: "0 12px 24px rgba(0,0,0,0.1)",
                        },
                        cursor: "pointer",
                      }}
                      onClick={() => router.push(`/${artist.username}`)}
                    >
                      <Box
                        sx={{
                          position: "relative",
                          pt: 3,
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                        }}
                      >
                        <Box
                          component="img"
                          src={artist.profilePicture}
                          alt={artist.displayName}
                          sx={{
                            width: 80,
                            height: 80,
                            borderRadius: "50%",
                            objectFit: "cover",
                            border: "3px solid white",
                            boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
                          }}
                        />
                      </Box>

                      <CardContent
                        sx={{ flexGrow: 1, textAlign: "center", p: 2 }}
                      >
                        <Typography
                          variant="h6"
                          component="div"
                          fontWeight="bold"
                        >
                          {artist.displayName}
                        </Typography>

                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ mb: 1 }}
                        >
                          @{artist.username}
                        </Typography>

                        {artist.rating && artist.rating.count > 0 && (
                          <Box
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                            mb={1}
                          >
                            <StarIcon
                              sx={{
                                color: "warning.main",
                                fontSize: 18,
                                mr: 0.5,
                              }}
                            />
                            <Typography variant="body2" fontWeight="medium">
                              {artist.rating.avg.toFixed(1)} (
                              {artist.rating.count})
                            </Typography>
                          </Box>
                        )}

                        <Box
                          sx={{
                            display: "flex",
                            flexWrap: "wrap",
                            gap: 0.5,
                            justifyContent: "center",
                            mt: 1,
                          }}
                        >
                          {artist.tags?.slice(0, 3).map((tag: string) => (
                            <Chip
                              key={tag}
                              label={tag}
                              size="small"
                              sx={{
                                fontSize: "0.7rem",
                                height: 20,
                                "& .MuiChip-label": { px: 1 },
                              }}
                            />
                          ))}
                        </Box>
                      </CardContent>

                      <Box
                        sx={{
                          p: 1.5,
                          borderTop: "1px solid",
                          borderTopColor: "divider",
                          bgcolor: alpha(theme.palette.primary.main, 0.03),
                        }}
                      >
                        <Button
                          fullWidth
                          variant={
                            artist.openForCommissions ? "contained" : "outlined"
                          }
                          size="small"
                          disableElevation
                          sx={{
                            borderRadius: 6,
                            textTransform: "none",
                            fontWeight: 600,
                            background: artist.openForCommissions
                              ? "linear-gradient(90deg, #A8FF00 0%, #00FFD1 100%)"
                              : undefined,
                            color: artist.openForCommissions
                              ? "common.black"
                              : undefined,
                            "&:hover": {
                              background: artist.openForCommissions
                                ? "linear-gradient(90deg, #A8FF00 0%, #00FFD1 100%)"
                                : undefined,
                            },
                          }}
                        >
                          {artist.openForCommissions
                            ? "Tersedia untuk Komisi"
                            : "Lihat Profil"}
                        </Button>
                      </Box>
                    </Card>
                  </Grid>
                ))}
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

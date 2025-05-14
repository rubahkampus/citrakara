// src/components/search/SearchArtistPage.tsx
"use client";

import { useState, useEffect } from "react";
import {
  Box,
  Container,
  TextField,
  Grid,
  Typography,
  Button,
  Stack,
  CircularProgress,
  Pagination,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  InputAdornment,
  Paper,
} from "@mui/material";
import {
  Search as SearchIcon,
  FilterAlt as FilterAltIcon,
  Close as CloseIcon,
} from "@mui/icons-material";
import ArtistItem from "../artist/ArtistItem";
import { useRouter, useSearchParams } from "next/navigation";

interface SearchArtistPageProps {
  initialResults?: string;
  session?: any;
}

export default function SearchArtistPage({
  initialResults,
  session,
}: SearchArtistPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isAuthenticated = !!session;
  const initialResultsParsed = initialResults ? JSON.parse(initialResults) : []

  // Search state
  const [searchQuery, setSearchQuery] = useState(searchParams?.get("q") || "");
  const [filterTags, setFilterTags] = useState<string[]>(
    searchParams?.get("tags")?.split(",").filter(Boolean) || []
  );
  const [openForCommissions, setOpenForCommissions] = useState<boolean>(
    searchParams?.get("open") === "true"
  );

  // Results state
  const [results, setResults] = useState([]);
  const [totalResults, setTotalResults] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const resultsPerPage = 12;

  // Load results based on current filters
  const fetchResults = async (newPage = 1) => {
    setLoading(true);

    try {
      // Build query params
      const params = new URLSearchParams();
      if (searchQuery) params.append("query", searchQuery);
      if (filterTags.length) params.append("tags", filterTags.join(","));
      if (openForCommissions) params.append("open", "true");
      params.append("skip", ((newPage - 1) * resultsPerPage).toString());
      params.append("limit", resultsPerPage.toString());

      const response = await fetch(`/api/search/artists?${params.toString()}`);
      const data = await response.json();

      // Fix the MongoDB object issue by ensuring we're working with plain objects
      const plainArtists = data.artists
        ? JSON.parse(JSON.stringify(data.artists))
        : [];

      setResults(plainArtists);
      setTotalResults(data.total || 0);
    } catch (error) {
      console.error("Error fetching results:", error);
    } finally {
      setLoading(false);
    }
  };

  // Handle search submission
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchResults(1);

    // Update URL with search params
    updateUrlParams();
  };

  // Update URL without reloading the page
  const updateUrlParams = () => {
    const params = new URLSearchParams();
    if (searchQuery) params.append("q", searchQuery);
    if (filterTags.length) params.append("tags", filterTags.join(","));
    if (openForCommissions) params.append("open", "true");

    router.push(`/search/artists?${params.toString()}`);
  };

  console.log(results)

  // Handle page change
  const handlePageChange = (_: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
    fetchResults(value);
    window.scrollTo(0, 0);
  };

  // Handle tag selection
  const handleTagClick = (tag: string) => {
    if (filterTags.includes(tag)) {
      setFilterTags(filterTags.filter((t) => t !== tag));
    } else {
      setFilterTags([...filterTags, tag]);
    }
  };

  // Reset filters
  const handleResetFilters = () => {
    setSearchQuery("");
    setFilterTags([]);
    setOpenForCommissions(false);
  };

  // Toggle bookmark for an artist
  const handleToggleBookmark = async (
    artistId: string,
    action: "bookmark" | "unbookmark"
  ) => {
    if (!isAuthenticated) {
      // Redirect to login or show login prompt
      return;
    }

    try {
      const response = await fetch("/api/bookmark/artist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ artistId, action }),
      });

      if (!response.ok) {
        throw new Error("Failed to bookmark artist");
      }
    } catch (error) {
      console.error("Error toggling bookmark:", error);
    }
  };

  // Fetch initial results
  useEffect(() => {
    if (!initialResultsParsed) {
      fetchResults();
    } else {
      // Ensure initial results are plain objects
      const plainInitialResultsParsed = JSON.parse(
        JSON.stringify(initialResultsParsed.artists || [])
      );
      setResults(plainInitialResultsParsed);
      setTotalResults(initialResultsParsed.total || 0);
    }
  }, []);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="flex-start"
        mb={4}
      >
        <Typography variant="h4" fontWeight="bold">
          Temukan Seniman
        </Typography>
        <Button
          variant="outlined"
          startIcon={<FilterAltIcon />}
          onClick={() => setFiltersOpen(!filtersOpen)}
          sx={{ display: { xs: "block", md: "none" } }}
        >
          Filter
        </Button>
      </Box>

      <Grid container spacing={3}>
        {/* Filters sidebar - desktop */}
        <Grid
          item
          md={3}
          sx={{
            display: { xs: "none", md: "block" },
          }}
        >
          <Paper sx={{ p: 2, borderRadius: 2 }}>
            <Typography variant="h6" fontWeight="bold" mb={2}>
              Filter
              <Button size="small" sx={{ ml: 1 }} onClick={handleResetFilters}>
                Reset
              </Button>
            </Typography>

            <form onSubmit={handleSearch}>
              <TextField
                fullWidth
                label="Cari Seniman"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                margin="normal"
                size="small"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <SearchIcon color="action" />
                    </InputAdornment>
                  ),
                }}
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={openForCommissions}
                    onChange={(e) => setOpenForCommissions(e.target.checked)}
                  />
                }
                label="Tersedia untuk Komisi"
                sx={{ mt: 2, display: "block" }}
              />

              <Box mt={2}>
                <Typography variant="subtitle2" gutterBottom>
                  Tag Populer
                </Typography>
                <Box display="flex" flexWrap="wrap" gap={0.7}>
                  {[
                    "anime",
                    "portrait",
                    "character",
                    "digital",
                    "traditional",
                    "cute",
                    "chibi",
                    "fantasy",
                  ].map((tag) => (
                    <Chip
                      key={tag}
                      label={tag}
                      size="small"
                      onClick={() => handleTagClick(tag)}
                      color={filterTags.includes(tag) ? "primary" : "default"}
                    />
                  ))}
                </Box>
              </Box>

              <Button
                type="submit"
                variant="contained"
                fullWidth
                sx={{ mt: 3 }}
              >
                Cari Seniman
              </Button>
            </form>
          </Paper>
        </Grid>

        {/* Mobile filters - slide in */}
        {filtersOpen && (
          <Box
            sx={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              bgcolor: "background.paper",
              zIndex: 1200,
              p: 2,
              display: { xs: "block", md: "none" },
              overflowY: "auto",
            }}
          >
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
              mb={2}
            >
              <Typography variant="h6" fontWeight="bold">
                Filter
              </Typography>
              <Button
                onClick={() => setFiltersOpen(false)}
                startIcon={<CloseIcon />}
              >
                Tutup
              </Button>
            </Box>

            {/* Mobile filter form */}
            <form
              onSubmit={(e) => {
                handleSearch(e);
                setFiltersOpen(false);
              }}
            >
              <TextField
                fullWidth
                label="Cari Seniman"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                margin="normal"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <SearchIcon color="action" />
                    </InputAdornment>
                  ),
                }}
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={openForCommissions}
                    onChange={(e) => setOpenForCommissions(e.target.checked)}
                  />
                }
                label="Tersedia untuk Komisi"
                sx={{ mt: 2, display: "block" }}
              />

              <Box mt={2}>
                <Typography variant="subtitle2" gutterBottom>
                  Tag Populer
                </Typography>
                <Box display="flex" flexWrap="wrap" gap={0.7}>
                  {[
                    "anime",
                    "portrait",
                    "character",
                    "digital",
                    "traditional",
                    "cute",
                    "chibi",
                    "fantasy",
                  ].map((tag) => (
                    <Chip
                      key={tag}
                      label={tag}
                      size="small"
                      onClick={() => handleTagClick(tag)}
                      color={filterTags.includes(tag) ? "primary" : "default"}
                    />
                  ))}
                </Box>
              </Box>

              <Button
                type="submit"
                variant="contained"
                fullWidth
                size="large"
                sx={{ mt: 3 }}
              >
                Cari Seniman
              </Button>
            </form>
          </Box>
        )}

        {/* Search results */}
        <Grid item xs={12} md={9}>
          {loading ? (
            <Box display="flex" justifyContent="center" py={4}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              {/* Applied filters display */}
              {(searchQuery || filterTags.length > 0 || openForCommissions) && (
                <Box mb={3}>
                  <Typography variant="subtitle2" gutterBottom>
                    Filter yang Diterapkan:
                  </Typography>
                  <Box display="flex" flexWrap="wrap" gap={1}>
                    {searchQuery && (
                      <Chip
                        label={`Pencarian: ${searchQuery}`}
                        onDelete={() => setSearchQuery("")}
                        size="small"
                      />
                    )}

                    {filterTags.map((tag) => (
                      <Chip
                        key={tag}
                        label={tag}
                        onDelete={() => handleTagClick(tag)}
                        size="small"
                      />
                    ))}

                    {openForCommissions && (
                      <Chip
                        label="Tersedia untuk Komisi"
                        onDelete={() => setOpenForCommissions(false)}
                        size="small"
                      />
                    )}

                    <Chip
                      label="Hapus Semua"
                      onClick={handleResetFilters}
                      variant="outlined"
                      size="small"
                    />
                  </Box>
                </Box>
              )}

              {/* Results count */}
              <Typography variant="subtitle1" mb={2}>
                {totalResults} {totalResults === 1 ? "seniman" : "seniman"}{" "}
                ditemukan
              </Typography>

              {/* Results grid */}
              <Grid container spacing={3}>
                {results.map((artist: any) => (
                  <Grid item xs={12} sm={6} md={4} key={artist._id}>
                    <ArtistItem
                      artist={artist}
                      isAuthenticated={isAuthenticated}
                      isBookmarked={false} // You would need to check this against user's bookmarks
                      onToggleBookmark={handleToggleBookmark}
                    />
                  </Grid>
                ))}
              </Grid>

              {/* No results */}
              {results.length === 0 && (
                <Box textAlign="center" py={6}>
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    Tidak ada seniman ditemukan
                  </Typography>
                  <Typography variant="body2">
                    Coba sesuaikan filter atau kata pencarian Anda
                  </Typography>
                </Box>
              )}

              {/* Pagination */}
              {totalResults > resultsPerPage && (
                <Box display="flex" justifyContent="center" mt={4}>
                  <Pagination
                    count={Math.ceil(totalResults / resultsPerPage)}
                    page={page}
                    onChange={handlePageChange}
                    color="primary"
                  />
                </Box>
              )}
            </>
          )}
        </Grid>
      </Grid>
    </Container>
  );
}

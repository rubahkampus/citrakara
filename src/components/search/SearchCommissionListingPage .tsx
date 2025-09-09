// src/components/search/SearchCommissionListingPage.tsx
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
  Slider,
  InputAdornment,
  Paper,
  Alert,
} from "@mui/material";
import {
  Search as SearchIcon,
  FilterAlt as FilterAltIcon,
  Close as CloseIcon,
} from "@mui/icons-material";
import { CommissionListingItem } from "../dashboard/commissions/CommissionListingItem";
import { useRouter, useSearchParams } from "next/navigation";

interface SearchCommissionListingPageProps {
  initialResults?: string;
  session?: any;
}

export default function SearchCommissionListingPage({
  initialResults,
  session,
}: SearchCommissionListingPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isAuthenticated = !!session;
  const initialResultsParsed = initialResults ? JSON.parse(initialResults) : [];

  // Search state
  const [searchQuery, setSearchQuery] = useState(searchParams?.get("q") || "");
  const [filterTags, setFilterTags] = useState<string[]>(
    searchParams?.get("tags")?.split(",").filter(Boolean) || []
  );
  const [type, setType] = useState<string>(searchParams?.get("type") || "");
  const [flow, setFlow] = useState<string>(searchParams?.get("flow") || "");
  const [priceRange, setPriceRange] = useState<[number, number]>([
    parseInt(searchParams?.get("minPrice") || "0", 10) || 0,
    parseInt(searchParams?.get("maxPrice") || "1000", 10) || 1000,
  ]);

  // Results state
  const [results, setResults] = useState([]);
  const [totalResults, setTotalResults] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const resultsPerPage = 12;

  // Bookmark states
  const [bookmarkedCommissions, setBookmarkedCommissions] = useState<string[]>(
    []
  );
  const [bookmarkLoading, setBookmarkLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Load results based on current filters
  const fetchResults = async (newPage = 1) => {
    setLoading(true);

    try {
      // Build query params
      const params = new URLSearchParams();
      if (searchQuery) params.append("label", searchQuery);
      if (filterTags.length) params.append("tags", filterTags.join(","));
      if (type) params.append("type", type);
      if (flow) params.append("flow", flow);
      if (priceRange[0] > 0)
        params.append("minPrice", priceRange[0].toString());
      if (priceRange[1] < 1000)
        params.append("maxPrice", priceRange[1].toString());
      params.append("skip", ((newPage - 1) * resultsPerPage).toString());
      params.append("limit", resultsPerPage.toString());

      const response = await fetch(
        `/api/search/commissions?${params.toString()}`
      );
      const data = await response.json();

      // Fix the MongoDB object issue by ensuring we're working with plain objects
      const plainItems = data.items
        ? JSON.parse(JSON.stringify(data.items))
        : [];

      setResults(plainItems);
      setTotalResults(data.total || 0);
    } catch (error) {
      console.error("Error fetching results:", error);
      setErrorMessage("Gagal memuat data. Silakan coba lagi nanti.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch user's bookmarks when authenticated
  useEffect(() => {
    const fetchBookmarks = async () => {
      if (!isAuthenticated) return;

      try {
        const response = await fetch("/api/user/bookmarks?type=commissions");
        if (!response.ok) throw new Error("Failed to fetch bookmarks");

        const data = await response.json();

        // Extract IDs from bookmark objects
        const commissionIds =
          data.bookmarks?.map((item: any) => item._id.toString()) || [];

        setBookmarkedCommissions(commissionIds);
      } catch (error) {
        console.error("Error fetching bookmarks:", error);
      }
    };

    fetchBookmarks();
  }, [isAuthenticated]);

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
    if (type) params.append("type", type);
    if (flow) params.append("flow", flow);
    if (priceRange[0] > 0) params.append("minPrice", priceRange[0].toString());
    if (priceRange[1] < 1000)
      params.append("maxPrice", priceRange[1].toString());

    router.push(`/search/commissions?${params.toString()}`);
  };

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
    setType("");
    setFlow("");
    setPriceRange([0, 1000]);
  };

  // Toggle bookmark for a commission
  const handleToggleBookmark = async (
    listingId: string,
    action: "bookmark" | "unbookmark"
  ) => {
    if (!isAuthenticated) {
      // TODO LOGIN
      return;
    }

    try {
      setBookmarkLoading(true);
      setErrorMessage(null);

      const response = await fetch("/api/bookmark/commission", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ commissionId: listingId, action }),
      });

      if (!response.ok) {
        throw new Error("Failed to update bookmark");
      }

      // Update local state based on the action
      if (action === "bookmark") {
        setBookmarkedCommissions((prev) => [...prev, listingId]);
      } else {
        setBookmarkedCommissions((prev) =>
          prev.filter((id) => id !== listingId)
        );
      }
    } catch (error) {
      console.error("Error toggling bookmark:", error);
      setErrorMessage("Gagal memperbarui bookmark. Silakan coba lagi.");
    } finally {
      setBookmarkLoading(false);
    }
  };

  // Fetch initial results
  useEffect(() => {
    if (
      !initialResultsParsed.items ||
      initialResultsParsed.items.length === 0
    ) {
      fetchResults();
    } else {
      // Ensure initial results are plain objects
      const plainInitialResultsParsed = JSON.parse(
        JSON.stringify(initialResultsParsed.items || [])
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
          Jelajahi Komisi
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

      {errorMessage && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {errorMessage}
        </Alert>
      )}

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
                label="Cari"
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

              {/* <Box mt={3}>
                <Typography variant="subtitle2" gutterBottom>
                  Rentang Harga
                </Typography>
                <Slider
                  value={priceRange}
                  onChange={(_, newValue) =>
                    setPriceRange(newValue as [number, number])
                  }
                  min={0}
                  max={1000}
                  valueLabelDisplay="auto"
                />
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="caption" color="text.secondary">
                    ${priceRange[0]}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    ${priceRange[1]}+
                  </Typography>
                </Box>
              </Box> */}

              <FormControl fullWidth margin="normal" size="small">
                <InputLabel>Tipe</InputLabel>
                <Select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  label="Type"
                >
                  <MenuItem value="">Semua Tipe</MenuItem>
                  <MenuItem value="template">Template</MenuItem>
                  <MenuItem value="custom">Kustom</MenuItem>
                </Select>
              </FormControl>

              <FormControl fullWidth margin="normal" size="small">
                <InputLabel>Alur</InputLabel>
                <Select
                  value={flow}
                  onChange={(e) => setFlow(e.target.value)}
                  label="Flow"
                >
                  <MenuItem value="">Semua Alur</MenuItem>
                  <MenuItem value="standard">Standar</MenuItem>
                  <MenuItem value="milestone">Milestone</MenuItem>
                </Select>
              </FormControl>

              <Box mt={2}>
                <Typography variant="subtitle2" gutterBottom>
                  Tag Populer
                </Typography>
                <Box display="flex" flexWrap="wrap" gap={0.7}>
                  {[
                    "anime",
                    "portrait",
                    "character",
                    "fullbody",
                    "chibi",
                    "illustration",
                    "mascot",
                    "logo",
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
                Terapkan Filter
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

            {/* Mobile filter form - same as desktop but with larger controls */}
            <form
              onSubmit={(e) => {
                handleSearch(e);
                setFiltersOpen(false);
              }}
            >
              <TextField
                fullWidth
                label="Cari"
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

              <Box mt={3}>
                <Typography variant="subtitle2" gutterBottom>
                  Rentang Harga
                </Typography>
                <Slider
                  value={priceRange}
                  onChange={(_, newValue) =>
                    setPriceRange(newValue as [number, number])
                  }
                  min={0}
                  max={1000}
                  valueLabelDisplay="auto"
                />
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="caption" color="text.secondary">
                    ${priceRange[0]}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    ${priceRange[1]}+
                  </Typography>
                </Box>
              </Box>

              <FormControl fullWidth margin="normal">
                <InputLabel>Tipe</InputLabel>
                <Select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  label="Tipe"
                >
                  <MenuItem value="">Semua Tipe</MenuItem>
                  <MenuItem value="template">Template</MenuItem>
                  <MenuItem value="custom">Kustom</MenuItem>
                </Select>
              </FormControl>

              <FormControl fullWidth margin="normal">
                <InputLabel>Alur</InputLabel>
                <Select
                  value={flow}
                  onChange={(e) => setFlow(e.target.value)}
                  label="Alur"
                >
                  <MenuItem value="">Semua Alur</MenuItem>
                  <MenuItem value="standard">Standar</MenuItem>
                  <MenuItem value="milestone">Milestone</MenuItem>
                </Select>
              </FormControl>

              <Box mt={2}>
                <Typography variant="subtitle2" gutterBottom>
                  Tag Populer
                </Typography>
                <Box display="flex" flexWrap="wrap" gap={0.7}>
                  {[
                    "anime",
                    "portrait",
                    "character",
                    "fullbody",
                    "chibi",
                    "illustration",
                    "mascot",
                    "logo",
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
                Terapkan Filter
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
              {(searchQuery ||
                filterTags.length > 0 ||
                type ||
                flow ||
                priceRange[0] > 0 ||
                priceRange[1] < 1000) && (
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

                    {type && (
                      <Chip
                        label={`Tipe: ${type}`}
                        onDelete={() => setType("")}
                        size="small"
                      />
                    )}

                    {flow && (
                      <Chip
                        label={`Alur: ${flow}`}
                        onDelete={() => setFlow("")}
                        size="small"
                      />
                    )}

                    {(priceRange[0] > 0 || priceRange[1] < 1000) && (
                      <Chip
                        label={`Harga: $${priceRange[0]}-$${priceRange[1]}`}
                        onDelete={() => setPriceRange([0, 1000])}
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
                {totalResults} {totalResults === 1 ? "hasil" : "hasil"}{" "}
                ditemukan
              </Typography>

              {/* Results grid */}
              <Grid container spacing={3}>
                {results.map((listing: any) => (
                  <Grid item xs={12} sm={6} md={4} key={listing._id}>
                    <CommissionListingItem
                      listing={listing}
                      username={listing.artistId?.username || "unknown"}
                      isOwner={false}
                      isAuthenticated={isAuthenticated}
                      isBookmarked={bookmarkedCommissions.includes(
                        listing._id.toString()
                      )}
                      onToggleBookmark={handleToggleBookmark}
                      loading={bookmarkLoading}
                    />
                  </Grid>
                ))}
              </Grid>

              {/* No results */}
              {results.length === 0 && (
                <Box textAlign="center" py={6}>
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    Tidak ada komisi ditemukan
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

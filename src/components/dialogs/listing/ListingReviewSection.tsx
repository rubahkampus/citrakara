"use client";

import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  useTheme,
  Paper,
  Stack,
  Divider,
  Rating,
  Avatar,
  CircularProgress,
  Alert,
  Button,
  Pagination,
} from "@mui/material";
import {
  Star,
  StarBorder,
  ChatBubbleOutline,
  SentimentVeryDissatisfied,
} from "@mui/icons-material";
import { axiosClient } from "@/lib/utils/axiosClient";
interface ListingReviewSectionProps {
  listingId: string;
  reviewsSummary: {
    avg: number;
    count: number;
  };
}

export default function ListingReviewSection({
  listingId,
  reviewsSummary,
}: ListingReviewSectionProps) {
  const theme = useTheme();
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [expandedReviews, setExpandedReviews] = useState<Set<string>>(
    new Set()
  );
  const itemsPerPage = 5;

  useEffect(() => {
    if (!listingId) return;

    setLoading(true);
    setError(null);

    axiosClient
      .get(`/api/commission/listing/${listingId}/reviews`)
      .then((res) => {
        setReviews(res.data);
      })
      .catch((err) => {
        console.error("Error loading reviews:", err);
        setError("Gagal memuat ulasan. Silakan coba lagi nanti.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [listingId]);

  const totalPages = Math.ceil(reviews.length / itemsPerPage);
  const currentReviews = reviews.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  const handlePageChange = (
    event: React.ChangeEvent<unknown>,
    value: number
  ) => {
    setPage(value);
    // Scroll to top of reviews section
    const reviewSection = document.getElementById("reviews-section");
    if (reviewSection) {
      reviewSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  const toggleExpandReview = (reviewId: string) => {
    setExpandedReviews((prev) => {
      const next = new Set(prev);
      if (next.has(reviewId)) {
        next.delete(reviewId);
      } else {
        next.add(reviewId);
      }
      return next;
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("id-ID", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date);
  };

  return (
    <Box id="reviews-section" sx={{ p: 3 }}>
      <Paper
        elevation={0}
        variant="outlined"
        sx={{ p: 3, mb: 3, borderRadius: 2 }}
      >
        <Typography
          variant="h6"
          fontWeight={600}
          gutterBottom
          sx={{ display: "flex", alignItems: "center" }}
        >
          <Star sx={{ color: theme.palette.warning.main, mr: 1 }} />
          Ulasan Klien ({reviewsSummary.count})
        </Typography>

        {reviewsSummary.count > 0 ? (
          <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
            <Rating
              value={reviewsSummary.avg}
              precision={0.1}
              readOnly
              size="large"
              sx={{ mr: 2 }}
            />
            <Typography variant="h5" fontWeight={600} color="text.primary">
              {reviewsSummary.avg.toFixed(1)}
            </Typography>
          </Box>
        ) : (
          <Typography variant="body2" color="text.secondary">
            Belum ada ulasan untuk komisi ini.
          </Typography>
        )}

        {loading ? (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              py: 4,
            }}
          >
            <CircularProgress size={40} />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        ) : reviews.length === 0 ? (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              py: 4,
              color: "text.secondary",
            }}
          >
            <SentimentVeryDissatisfied sx={{ fontSize: 48, mb: 2 }} />
            <Typography variant="body1">
              Belum ada ulasan untuk komisi ini.
            </Typography>
          </Box>
        ) : (
          <>
            {currentReviews.map((review) => {
              const isExpanded = expandedReviews.has(review._id.toString());
              const hasLongComment = review.comment.length > 200;

              return (
                <Box key={review._id.toString()} sx={{ mb: 3 }}>
                  <Paper
                    elevation={0}
                    variant="outlined"
                    sx={{ p: 2, borderRadius: 1 }}
                  >
                    <Stack
                      direction="row"
                      alignItems="flex-start"
                      spacing={2}
                      sx={{ mb: 1 }}
                    >
                      <Avatar sx={{ bgcolor: theme.palette.primary.main }} src={review.client.profilePicture}/>
                      <Box sx={{ flex: 1 }}>
                        <Stack
                          direction="row"
                          justifyContent="space-between"
                          alignItems="center"
                        >
                          <Typography variant="subtitle2" fontWeight={600}>
                            {review.client.displayName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {formatDate(
                              typeof review.createdAt === "string"
                                ? review.createdAt
                                : review.createdAt.toISOString()
                            )}
                          </Typography>
                        </Stack>
                        <Rating
                          value={review.rating}
                          readOnly
                          size="small"
                          sx={{ my: 0.5 }}
                        />
                        <Typography
                          variant="body2"
                          sx={{ mt: 1, whiteSpace: "pre-line" }}
                        >
                          {hasLongComment && !isExpanded
                            ? `${review.comment.substring(0, 200)}...`
                            : review.comment}
                        </Typography>
                        {hasLongComment && (
                          <Button
                            onClick={() =>
                              toggleExpandReview(review._id.toString())
                            }
                            sx={{
                              mt: 1,
                              textTransform: "none",
                              fontWeight: "normal",
                            }}
                            size="small"
                          >
                            {isExpanded
                              ? "Lihat lebih sedikit"
                              : "Lihat selengkapnya"}
                          </Button>
                        )}

                        {/* Display review images if any */}
                        {review.images && review.images.length > 0 && (
                          <Box sx={{ mt: 2 }}>
                            <Stack direction="row" spacing={1} flexWrap="wrap">
                              {review.images.map((imageUrl: string, idx: number) => (
                                <Box
                                  key={idx}
                                  sx={{
                                    borderRadius: 1,
                                    overflow: "hidden",
                                    width: 80,
                                    height: 80,
                                    mt: 1,
                                  }}
                                >
                                  <img
                                    src={imageUrl}
                                    alt={`Review image ${idx + 1}`}
                                    style={{
                                      width: "100%",
                                      height: "100%",
                                      objectFit: "cover",
                                    }}
                                    onClick={() =>
                                      window.open(imageUrl, "_blank")
                                    }
                                  />
                                </Box>
                              ))}
                            </Stack>
                          </Box>
                        )}
                      </Box>
                    </Stack>
                  </Paper>
                </Box>
              );
            })}

            {/* Pagination */}
            {totalPages > 1 && (
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  mt: 3,
                }}
              >
                <Pagination
                  count={totalPages}
                  page={page}
                  onChange={handlePageChange}
                  color="primary"
                  size="medium"
                />
              </Box>
            )}
          </>
        )}
      </Paper>
    </Box>
  );
}

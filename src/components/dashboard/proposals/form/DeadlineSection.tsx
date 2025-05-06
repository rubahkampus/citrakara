// src/components/dashboard/proposals/form/DeadlineSection.tsx

/**
 * DeadlineSection
 * ---------------
 * Renders the deadline picker according to the listing's deadline configuration.
 * Now fetches dynamic date estimates from the API to account for artist's current workload.
 *
 * Props:
 *   - listingDeadline: {
 *       mode: "standard" | "withDeadline" | "withRush",
 *       min: number,    // days after now (baseline)
 *       max: number,    // days after now (baseline)
 *       rushFee?: { kind: "flat" | "perDay"; amount: number }
 *     }
 *
 * Behavior:
 *   - Fetches dynamic date estimates from /api/proposal/estimate/[listingId]
 *   - mode === "standard": no input; display info text with dynamic dates
 *   - mode === "withDeadline": enforce dynamicEarliest ≤ deadline (no rush fee); can be after dynamicLatest
 *   - mode === "withRush": same as withDeadline for deadline > dynamicEarliest (no rush fee); ; if < dynamicEarliest, rush fees apply
 */
import React, { useEffect, useState } from "react";
import { Controller, useFormContext } from "react-hook-form";
import {
  TextField,
  Typography,
  Box,
  Paper,
  CircularProgress,
} from "@mui/material";
import { ProposalFormValues } from "@/types/proposal";
import { axiosClient } from "@/lib/utils/axiosClient";
import { ICommissionListing } from "@/lib/db/models/commissionListing.model";

interface DeadlineSectionProps {
  listing: ICommissionListing;
}

interface DateEstimate {
  baseDate: string; // When artist starts working
  earliestDate: string; // Earliest possible completion
  latestDate: string; // Latest estimated completion
}

export default function DeadlineSection({ listing }: DeadlineSectionProps) {
  const { control, setValue } = useFormContext<ProposalFormValues>();
  const [loading, setLoading] = useState(true);
  const [dateEstimate, setDateEstimate] = useState<DateEstimate | null>(null);
  const [error, setError] = useState<string | null>(null);

  const listingDeadline = listing.deadline;

  // Fetch dynamic date estimates when component mounts
  useEffect(() => {
    const fetchDateEstimates = async () => {
      try {
        setLoading(true);
        const response = await axiosClient.get(
          `/api/proposal/estimate/${listing._id}`
        );

        // Validate that each date is valid before processing
        const baseDate = new Date(response.data.baseDate);
        const earliestDate = new Date(response.data.earliestDate);
        const latestDate = new Date(response.data.latestDate);

        // Check if any of the dates are invalid
        if (
          isNaN(baseDate.getTime()) ||
          isNaN(earliestDate.getTime()) ||
          isNaN(latestDate.getTime())
        ) {
          throw new Error("Invalid date received from API");
        }

        setDateEstimate({
          baseDate: baseDate.toISOString(),
          earliestDate: earliestDate.toISOString(),
          latestDate: latestDate.toISOString(),
        });

        // For standard mode, auto-set the deadline to 2 weeks after latestDate
        if (listingDeadline.mode === "standard") {
          const stdDeadline = new Date(latestDate);
          // Add 2 weeks (14 days) to the latest date
          stdDeadline.setDate(stdDeadline.getDate() + 14);
          setValue("deadline", stdDeadline.toISOString().slice(0, 10));
        }

        setError(null);
      } catch (err: any) {
        console.error("Error fetching date estimates:", err);
        setError(err.response?.data?.error || "Failed to fetch date estimates");

        // Fallback to calculate dates locally (not ideal, but prevents UI from breaking)
        const now = new Date();
        const baseDate = new Date(
          now.getTime() + (listingDeadline.min / 2) * 24 * 60 * 60 * 1000
        );
        const minDate = new Date(
          now.getTime() + listingDeadline.min * 24 * 60 * 60 * 1000
        );
        const maxDate = new Date(
          now.getTime() + listingDeadline.max * 24 * 60 * 60 * 1000
        );

        setDateEstimate({
          baseDate: baseDate.toISOString(),
          earliestDate: minDate.toISOString(),
          latestDate: maxDate.toISOString(),
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDateEstimates();
  }, [
    listing._id,
    listingDeadline.min,
    listingDeadline.max,
    listingDeadline.mode,
    setValue,
  ]);

  if (loading) {
    return (
      <Paper sx={{ p: 3, mb: 3, display: "flex", justifyContent: "center" }}>
        <CircularProgress size={24} sx={{ mr: 2 }} />
        <Typography>Calculating available dates...</Typography>
      </Paper>
    );
  }

  if (error || !dateEstimate) {
    return (
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" color="error" gutterBottom>
          Error loading date estimates
        </Typography>
        <Typography color="text.secondary">
          {error || "Please try again later."}
        </Typography>
      </Paper>
    );
  }

  // Format dates for display and validation
  const safeGetDate = (dateString: string): Date => {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      // Return a valid date as fallback (today + some offset)
      const now = new Date();
      return new Date(now.getTime() + 24 * 60 * 60 * 1000); // tomorrow
    }
    return date;
  };

  const baseDate = safeGetDate(dateEstimate.baseDate);
  const earliestDate = safeGetDate(dateEstimate.earliestDate);
  const latestDate = safeGetDate(dateEstimate.latestDate);

  const baseDateStr = baseDate.toISOString().slice(0, 10);
  const earliestStr = earliestDate.toISOString().slice(0, 10);
  const latestStr = latestDate.toISOString().slice(0, 10);

  // Calculate standard deadline (2 weeks after latest date) for standard mode
  const standardDeadline = new Date(latestDate);
  standardDeadline.setDate(standardDeadline.getDate() + 14);
  const standardDeadlineStr = standardDeadline.toISOString().slice(0, 10);

  // Format dates for display in human-readable format
  const formatReadableDate = (date: Date) => {
    try {
      if (!date || isNaN(date.getTime())) {
        return "Date unavailable";
      }
      return date.toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch (e) {
      console.error("Error formatting date:", e);
      return "Date unavailable";
    }
  };

  switch (listingDeadline.mode) {
    case "standard":
      return (
        <Paper
          sx={{
            p: 3,
            mb: 3,
            borderRadius: 2,
            boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
          }}
        >
          <Typography variant="h6" gutterBottom color="primary">
            Deadline
          </Typography>

          <Box sx={{ mb: 3, display: "flex", flexDirection: "column", gap: 2 }}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Typography variant="body2" color="text.secondary">
                Artist starts work:
              </Typography>
              <Typography variant="body2" fontWeight="medium">
                {formatReadableDate(baseDate)}
              </Typography>
            </Box>

            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Typography variant="body2" color="text.secondary">
                Estimated completion:
              </Typography>
              <Typography variant="body2" fontWeight="medium">
                {formatReadableDate(earliestDate)} -{" "}
                {formatReadableDate(latestDate)}
              </Typography>
            </Box>

            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                borderTop: "1px solid",
                borderColor: "divider",
                pt: 2,
              }}
            >
              <Typography variant="body1" color="text.primary">
                Your deadline:
              </Typography>
              <Typography variant="body1" fontWeight="bold" color="primary">
                {formatReadableDate(standardDeadline)}
              </Typography>
            </Box>
          </Box>

          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ fontStyle: "italic" }}
          >
            Based on the artist's current workload, your deadline is
            automatically set to allow sufficient time for high-quality work.
          </Typography>

          {/* Hidden field to store the deadline value */}
          <Controller
            name="deadline"
            control={control}
            render={({ field }) => <input type="hidden" {...field} />}
          />
        </Paper>
      );

    case "withDeadline":
      return (
        <Paper
          sx={{
            p: 3,
            mb: 3,
            borderRadius: 2,
            boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
          }}
        >
          <Typography variant="h6" gutterBottom color="primary">
            Select Your Deadline
          </Typography>

          <Box sx={{ mb: 3, display: "flex", flexDirection: "column", gap: 2 }}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Typography variant="body2" color="text.secondary">
                Artist starts work:
              </Typography>
              <Typography variant="body2" fontWeight="medium">
                {formatReadableDate(baseDate)}
              </Typography>
            </Box>

            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Typography variant="body2" color="text.secondary">
                Estimated completion:
              </Typography>
              <Typography variant="body2" fontWeight="medium">
                {formatReadableDate(earliestDate)} -{" "}
                {formatReadableDate(latestDate)}
              </Typography>
            </Box>
          </Box>

          <Box
            sx={{
              p: 2,
              mb: 2,
              bgcolor: "rgba(0, 0, 0, 0.02)",
              borderRadius: 1,
              border: "1px solid",
              borderColor: "divider",
            }}
          >
            <Typography variant="body2" color="text.secondary">
              You can choose any date on or after{" "}
              {formatReadableDate(earliestDate)}. This flexibility allows you to
              align with your project timeline.
            </Typography>
          </Box>

          <Controller
            name="deadline"
            control={control}
            rules={{
              required: "Deadline is required",
              validate: (val: string) => {
                if (!val) return "Deadline is required";

                try {
                  const d = new Date(val);
                  if (isNaN(d.getTime())) {
                    return "Please enter a valid date";
                  }

                  if (d < earliestDate) {
                    return `Date cannot be before ${earliestStr}`;
                  }
                  return true;
                } catch (e) {
                  console.error("Date validation error:", e);
                  return "Invalid date format";
                }
              },
            }}
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                label="Desired Deadline"
                type="date"
                fullWidth
                InputLabelProps={{ shrink: true }}
                inputProps={{ min: earliestStr }}
                error={!!fieldState.error}
                helperText={fieldState.error?.message}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    "& fieldset": {
                      borderColor: "primary.light",
                    },
                    "&:hover fieldset": {
                      borderColor: "primary.main",
                    },
                  },
                }}
              />
            )}
          />
        </Paper>
      );

    case "withRush":
      return (
        <Paper
          sx={{
            p: 3,
            mb: 3,
            borderRadius: 2,
            boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
          }}
        >
          <Typography variant="h6" gutterBottom color="primary">
            Rush Deadline Options
          </Typography>

          <Box sx={{ mb: 3, display: "flex", flexDirection: "column", gap: 2 }}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Typography variant="body2" color="text.secondary">
                Artist starts work:
              </Typography>
              <Typography variant="body2" fontWeight="medium">
                {formatReadableDate(baseDate)}
              </Typography>
            </Box>

            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                mb: 1,
              }}
            >
              <Typography variant="body2" color="text.secondary">
                Standard completion:
              </Typography>
              <Typography variant="body2" fontWeight="medium">
                {formatReadableDate(earliestDate)} -{" "}
                {formatReadableDate(latestDate)}
              </Typography>
            </Box>

            <Box
              sx={{
                p: 2,
                mb: 1,
                borderRadius: 1,
                bgcolor: "rgba(255, 244, 229, 0.7)",
                border: "1px solid",
                borderColor: "warning.light",
                display: "flex",
                flexDirection: "column",
                gap: 1,
              }}
            >
              <Typography
                variant="body2"
                fontWeight="medium"
                color="warning.dark"
              >
                Rush Fee Information
              </Typography>
              <Typography variant="body2" color="text.secondary">
                • Standard completion (no fee): After{" "}
                {formatReadableDate(earliestDate)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                • Rush completion (fee applies): Between{" "}
                {formatReadableDate(
                  new Date(baseDate.getTime() + 24 * 60 * 60 * 1000)
                )}{" "}
                and{" "}
                {formatReadableDate(
                  new Date(earliestDate.getTime() - 24 * 60 * 60 * 1000)
                )}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                • The artist must have at least one day after starting work (
                {formatReadableDate(baseDate)})
              </Typography>
            </Box>
          </Box>

          <Controller
            name="deadline"
            control={control}
            rules={{
              required: "Deadline is required",
              validate: (val: string) => {
                if (!val) return "Deadline is required";

                try {
                  const d = new Date(val);
                  if (isNaN(d.getTime())) {
                    return "Please enter a valid date";
                  }

                  // Ensure the deadline is after baseDate (at least +1 day)
                  const minAllowedDate = new Date(baseDate);
                  minAllowedDate.setDate(minAllowedDate.getDate() + 1);

                  if (d <= baseDate) {
                    return `Deadline must be after ${formatReadableDate(
                      baseDate
                    )}`;
                  }
                  return true;
                } catch (e) {
                  console.error("Date validation error:", e);
                  return "Invalid date format";
                }
              },
            }}
            render={({ field, fieldState }) => {
              const selectedDate = field.value
                ? safeGetDate(field.value)
                : null;
              const isRush = selectedDate && selectedDate < earliestDate;

              // Ensure date is at least one day after baseDate
              const minAllowedDate = new Date(baseDate);
              minAllowedDate.setDate(minAllowedDate.getDate() + 1);
              const minDateStr = minAllowedDate.toISOString().slice(0, 10);

              return (
                <Box>
                  <TextField
                    {...field}
                    label="Select Your Deadline"
                    type="date"
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                    inputProps={{ min: minDateStr }}
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message}
                    sx={{
                      mb: 2,
                      "& .MuiOutlinedInput-root": {
                        "& fieldset": {
                          borderColor: isRush
                            ? "warning.main"
                            : "primary.light",
                          borderWidth: isRush ? 2 : 1,
                        },
                        "&:hover fieldset": {
                          borderColor: isRush ? "warning.dark" : "primary.main",
                        },
                      },
                    }}
                  />

                  {isRush && selectedDate && listingDeadline.rushFee && (
                    <Box
                      sx={{
                        p: 2,
                        borderRadius: 1,
                        bgcolor: "warning.light",
                        color: "warning.contrastText",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <Typography variant="body1" fontWeight="medium">
                        Rush Fee:
                      </Typography>
                      <Typography variant="body1" fontWeight="bold">
                        {listing.currency}{" "}
                        {listingDeadline.rushFee.kind === "flat"
                          ? listingDeadline.rushFee.amount.toLocaleString()
                          : (() => {
                              // Calculate days between the selected date and earliest date
                              if (!selectedDate) return "0";

                              try {
                                const timeDiff = Math.abs(
                                  earliestDate.getTime() -
                                    selectedDate.getTime()
                                );
                                const daysDiff = Math.ceil(
                                  timeDiff / (1000 * 60 * 60 * 24)
                                );
                                const amount =
                                  daysDiff * listingDeadline.rushFee.amount;
                                return amount.toLocaleString();
                              } catch (e) {
                                console.error("Error calculating rush fee:", e);
                                return "calculation error";
                              }
                            })()}
                      </Typography>
                    </Box>
                  )}
                </Box>
              );
            }}
          />
        </Paper>
      );

    default:
      return null;
  }
}

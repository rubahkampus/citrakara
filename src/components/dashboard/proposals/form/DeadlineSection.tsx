// src/components/dashboard/proposals/form/DeadlineSection.tsx
import React, { useEffect, useState } from "react";
import { Controller, useFormContext } from "react-hook-form";
import {
  TextField,
  Typography,
  Box,
  Paper,
  CircularProgress,
  Grid,
  Divider,
  Tooltip,
  Card,
  alpha,
} from "@mui/material";
import InfoIcon from "@mui/icons-material/Info";
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
  const { control, setValue, getValues, watch } =
    useFormContext<ProposalFormValues>();
  const [loading, setLoading] = useState(true);
  const [dateEstimate, setDateEstimate] = useState<DateEstimate | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);

  // Watch deadline to calculate rush fee
  const watchedDeadline = watch("deadline");

  const listingDeadline = listing.deadline;

  // Check if we're in edit mode
  useEffect(() => {
    const formValues = getValues();
    if (formValues.id) {
      setIsEditMode(true);
    }
  }, [getValues]);

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

        // Get the current form values to check if we're in edit mode and have an existing deadline
        const formValues = getValues();
        const existingDeadline = formValues.deadline;
        const isEditing = !!formValues.id;

        // Default deadline is two weeks after latestDate
        const defaultDeadline = new Date(latestDate);
        defaultDeadline.setDate(defaultDeadline.getDate() + 14);
        const defaultDeadlineStr = defaultDeadline.toISOString().slice(0, 10);

        // Only set a value automatically if this is a new proposal (not edit mode)
        // OR if we're in standard mode (which forces a specific deadline)
        if (
          listingDeadline.mode === "standard" ||
          !isEditing ||
          !existingDeadline
        ) {
          if (listingDeadline.mode === "standard") {
            // For standard mode, always set the deadline to 2 weeks after latestDate
            setValue("deadline", defaultDeadlineStr);
          } else if (!isEditing) {
            // For new proposals, set a default deadline
            setValue("deadline", defaultDeadlineStr);
          }
        }

        // Handle existing deadline in edit mode
        if (isEditing && existingDeadline) {
          // If the deadline is a full ISO string, convert it to YYYY-MM-DD format
          if (existingDeadline.includes("T")) {
            const formattedDate = new Date(existingDeadline)
              .toISOString()
              .slice(0, 10);
            setValue("deadline", formattedDate);
          }
        }

        setError(null);
      } catch (err: any) {
        console.error("Error fetching date estimates:", err);
        setError(err.response?.data?.error || "Failed to fetch date estimates");

        // Fallback to calculate dates locally
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
    getValues,
  ]);

  if (loading) {
    return (
      <Card sx={{ p: 3, mb: 3, display: "flex", justifyContent: "center" }}>
        <CircularProgress size={24} sx={{ mr: 2 }} />
        <Typography>Calculating available dates...</Typography>
      </Card>
    );
  }

  if (error || !dateEstimate) {
    return (
      <Card sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" color="error" gutterBottom>
          Error loading date estimates
        </Typography>
        <Typography color="text.secondary">
          {error || "Please try again later."}
        </Typography>
      </Card>
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

  // Determine if the selected deadline qualifies for rush fee (only applicable for withRush mode)
  const isRushDeadline = () => {
    if (!watchedDeadline || listingDeadline.mode !== "withRush") return false;

    try {
      const selectedDate = new Date(watchedDeadline);
      return selectedDate < earliestDate;
    } catch (e) {
      return false;
    }
  };

  // Calculate days being rushed (for withRush mode)
  const getRushDays = () => {
    if (!watchedDeadline || !isRushDeadline()) return 0;

    try {
      const selectedDate = new Date(watchedDeadline);
      const timeDiff = Math.abs(
        earliestDate.getTime() - selectedDate.getTime()
      );
      return Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
    } catch (e) {
      return 0;
    }
  };

  // Calculate rush fee based on listing rules
  const calculateRushFee = () => {
    if (!isRushDeadline() || !listingDeadline.rushFee) return 0;

    const rushDays = getRushDays();

    if (listingDeadline.rushFee.kind === "flat") {
      return listingDeadline.rushFee.amount;
    } else {
      return rushDays * listingDeadline.rushFee.amount;
    }
  };

  return (
    <Card sx={{ p: 3, mb: 3, borderRadius: 2 }}>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Typography variant="h6" gutterBottom color="primary">
            Project Timeline
          </Typography>

          <Box sx={{ mb: 3 }}>
            <Box
              sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}
            >
              <Typography variant="body2" color="text.secondary">
                Artist starts work:
              </Typography>
              <Typography variant="body2" fontWeight="medium">
                {formatReadableDate(baseDate)}
              </Typography>
            </Box>

            <Box
              sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}
            >
              <Typography variant="body2" color="text.secondary">
                Estimated completion:
              </Typography>
              <Typography variant="body2" fontWeight="medium">
                {formatReadableDate(earliestDate)} -{" "}
                {formatReadableDate(latestDate)}
              </Typography>
            </Box>

            <Divider sx={{ my: 2 }} />

            {listingDeadline.mode === "standard" ? (
              <Box
                sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}
              >
                <Typography
                  variant="body1"
                  fontWeight="medium"
                  color="text.primary"
                >
                  Your deadline:
                </Typography>
                <Typography variant="body1" fontWeight="bold" color="primary">
                  {formatReadableDate(standardDeadline)}
                </Typography>
              </Box>
            ) : (
              <Box>
                <Typography
                  variant="body1"
                  fontWeight="medium"
                  color="text.primary"
                  gutterBottom
                >
                  Select Your Deadline:
                </Typography>
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

                        // Mode-specific validations
                        if (listingDeadline.mode === "withDeadline") {
                          if (d < earliestDate) {
                            return `Date cannot be before ${formatReadableDate(
                              earliestDate
                            )}`;
                          }
                        } else if (listingDeadline.mode === "withRush") {
                          // For withRush, deadline must be at least 1 day after baseDate
                          const minAllowedDate = new Date(baseDate);
                          minAllowedDate.setDate(minAllowedDate.getDate() + 1);

                          if (d <= baseDate) {
                            return `Deadline must be after ${formatReadableDate(
                              baseDate
                            )}`;
                          }
                        }
                        return true;
                      } catch (e) {
                        return "Invalid date format";
                      }
                    },
                  }}
                  render={({ field, fieldState }) => (
                    <TextField
                      {...field}
                      type="date"
                      fullWidth
                      InputLabelProps={{ shrink: true }}
                      error={!!fieldState.error}
                      helperText={fieldState.error?.message}
                      inputProps={{
                        min:
                          listingDeadline.mode === "withDeadline"
                            ? earliestStr
                            : new Date(baseDate.getTime() + 24 * 60 * 60 * 1000)
                                .toISOString()
                                .slice(0, 10),
                      }}
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          "& fieldset": {
                            borderColor: isRushDeadline()
                              ? "warning.main"
                              : "primary.light",
                            borderWidth: isRushDeadline() ? 2 : 1,
                          },
                        },
                      }}
                    />
                  )}
                />
              </Box>
            )}

            {/* Hidden field for standard mode */}
            {listingDeadline.mode === "standard" && (
              <Controller
                name="deadline"
                control={control}
                render={({ field }) => (
                  <input
                    type="hidden"
                    {...field}
                    value={standardDeadlineStr}
                    disabled={true}
                  />
                )}
              />
            )}
          </Box>
        </Grid>

        <Grid item xs={12} md={6}>
          <Typography variant="h6" gutterBottom color="primary">
            Deadline Rules
          </Typography>

          <Box
            sx={{
              p: 2,
              bgcolor: alpha("#f5f5f5", 0.5),
              borderRadius: 1,
              border: "1px solid",
              borderColor: "divider",
            }}
          >
            {listingDeadline.mode === "standard" && (
              <Typography variant="body2" color="text.secondary">
                This commission uses a standard deadline which is automatically
                set to
                <strong> 2 weeks after</strong> the estimated completion date to
                ensure sufficient time for high-quality work.
              </Typography>
            )}

            {listingDeadline.mode === "withDeadline" && (
              <Typography variant="body2" color="text.secondary">
                You can choose any date{" "}
                <strong>on or after {formatReadableDate(earliestDate)}</strong>.
                This flexibility allows you to align the deadline with your
                project timeline.
              </Typography>
            )}

            {listingDeadline.mode === "withRush" && (
              <>
                <Typography variant="body2" color="text.secondary" paragraph>
                  You have two options:
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ display: "block", mb: 1 }}
                >
                  • <strong>Standard completion</strong> (no fee): On or after{" "}
                  {formatReadableDate(earliestDate)}
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ display: "block", mb: 1 }}
                >
                  • <strong>Rush completion</strong> (fee applies): Between{" "}
                  {formatReadableDate(
                    new Date(baseDate.getTime() + 24 * 60 * 60 * 1000)
                  )}{" "}
                  and{" "}
                  {formatReadableDate(
                    new Date(earliestDate.getTime() - 24 * 60 * 60 * 1000)
                  )}
                </Typography>

                {isRushDeadline() && (
                  <Box
                    sx={{
                      mt: 2,
                      p: 2,
                      bgcolor: alpha("#fff4e5", 0.7),
                      borderRadius: 1,
                      border: "1px solid",
                      borderColor: "warning.light",
                    }}
                  >
                    <Typography
                      variant="body2"
                      color="warning.dark"
                      fontWeight="medium"
                    >
                      Rush Fee: {listing.currency}{" "}
                      {calculateRushFee().toLocaleString()}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mt: 1 }}
                    >
                      {getRushDays()} day(s) rushed •{" "}
                      {listingDeadline.rushFee?.kind === "flat"
                        ? "Flat fee"
                        : "Per-day fee"}
                    </Typography>
                  </Box>
                )}
              </>
            )}
          </Box>
        </Grid>
      </Grid>
    </Card>
  );
}

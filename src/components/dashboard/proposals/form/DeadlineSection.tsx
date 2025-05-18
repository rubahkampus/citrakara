// src/components/dashboard/proposals/form/DeadlineSection.tsx
import React, { useEffect, useState } from "react";
import { Controller, useFormContext } from "react-hook-form";
import {
  TextField,
  Typography,
  Box,
  CircularProgress,
  Grid,
  Divider,
  Card,
  alpha,
} from "@mui/material";
import { ProposalFormValues } from "@/types/proposal";
import { axiosClient } from "@/lib/utils/axiosClient";
import { ICommissionListing } from "@/lib/db/models/commissionListing.model";

// Types
interface DeadlineSectionProps {
  listing: ICommissionListing;
}

interface DateEstimate {
  baseDate: string; // Tanggal mulai pengerjaan
  earliestDate: string; // Estimasi selesai paling cepat
  latestDate: string; // Estimasi selesai paling lambat
}

// Constants
const RUSH_MS_PER_DAY = 24 * 60 * 60 * 1000;

export default function DeadlineSection({ listing }: DeadlineSectionProps) {
  // Hooks
  const { control, setValue, getValues, watch } =
    useFormContext<ProposalFormValues>();

  // State
  const [loading, setLoading] = useState(true);
  const [dateEstimate, setDateEstimate] = useState<DateEstimate | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);

  // Watch for changes to calculate rush fee
  const watchedDeadline = watch("deadline");
  const listingDeadline = listing.deadline;

  // Helper functions
  const formatReadableDate = (date: Date) => {
    try {
      if (!date || isNaN(date.getTime())) {
        return "Tanggal tidak tersedia";
      }
      return date.toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch (e) {
      console.error("Error formatting date:", e);
      return "Tanggal tidak tersedia";
    }
  };

  const safeGetDate = (dateString: string): Date => {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      // Fallback to valid date (tomorrow)
      const now = new Date();
      return new Date(now.getTime() + RUSH_MS_PER_DAY);
    }
    return date;
  };

  // Effects
  useEffect(() => {
    const formValues = getValues();
    if (formValues.id) {
      setIsEditMode(true);
    }
  }, [getValues]);

  useEffect(() => {
    const fetchDateEstimates = async () => {
      try {
        setLoading(true);
        const response = await axiosClient.get(
          `/api/proposal/estimate/${listing._id}`
        );

        // Validate dates
        const baseDate = new Date(response.data.baseDate);
        const earliestDate = new Date(response.data.earliestDate);
        const latestDate = new Date(response.data.latestDate);

        if (
          isNaN(baseDate.getTime()) ||
          isNaN(earliestDate.getTime()) ||
          isNaN(latestDate.getTime())
        ) {
          throw new Error("Tanggal tidak valid dari API");
        }

        setDateEstimate({
          baseDate: baseDate.toISOString(),
          earliestDate: earliestDate.toISOString(),
          latestDate: latestDate.toISOString(),
        });

        // Handle deadline values
        const formValues = getValues();
        const existingDeadline = formValues.deadline;
        const isEditing = !!formValues.id;

        // Default deadline (2 weeks after latestDate)
        const defaultDeadline = new Date(latestDate);
        defaultDeadline.setDate(defaultDeadline.getDate() + 14);
        const defaultDeadlineStr = defaultDeadline.toISOString().slice(0, 10);

        if (
          listingDeadline.mode === "standard" ||
          !isEditing ||
          !existingDeadline
        ) {
          if (listingDeadline.mode === "standard") {
            setValue("deadline", defaultDeadlineStr);
          } else if (!isEditing) {
            setValue("deadline", defaultDeadlineStr);
          }
        }

        // Handle existing deadline in edit mode
        if (isEditing && existingDeadline) {
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
        setError(
          err.response?.data?.error || "Gagal mengambil estimasi tanggal"
        );

        // Fallback calculation
        const now = new Date();
        const baseDate = new Date(
          now.getTime() + (listingDeadline.min / 2) * RUSH_MS_PER_DAY
        );
        const minDate = new Date(
          now.getTime() + listingDeadline.min * RUSH_MS_PER_DAY
        );
        const maxDate = new Date(
          now.getTime() + listingDeadline.max * RUSH_MS_PER_DAY
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

  // Loading state
  if (loading) {
    return (
      <Card sx={{ p: 3, mb: 3, display: "flex", justifyContent: "center" }}>
        <CircularProgress size={24} sx={{ mr: 2 }} />
        <Typography>Menghitung tanggal yang tersedia...</Typography>
      </Card>
    );
  }

  // Error state
  if (error || !dateEstimate) {
    return (
      <Card sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" color="error" gutterBottom>
          Gagal memuat estimasi tanggal
        </Typography>
        <Typography color="text.secondary">
          {error || "Silakan coba lagi nanti."}
        </Typography>
      </Card>
    );
  }

  // Process dates
  const baseDate = safeGetDate(dateEstimate.baseDate);
  const earliestDate = safeGetDate(dateEstimate.earliestDate);
  const latestDate = safeGetDate(dateEstimate.latestDate);

  const baseDateStr = baseDate.toISOString().slice(0, 10);
  const earliestStr = earliestDate.toISOString().slice(0, 10);
  const latestStr = latestDate.toISOString().slice(0, 10);

  // Calculate standard deadline (2 weeks after latest date)
  const standardDeadline = new Date(latestDate);
  standardDeadline.setDate(standardDeadline.getDate() + 14);
  const standardDeadlineStr = standardDeadline.toISOString().slice(0, 10);

  // Rush fee calculations
  const isRushDeadline = () => {
    if (!watchedDeadline || listingDeadline.mode !== "withRush") return false;

    try {
      const selectedDate = new Date(watchedDeadline);
      return selectedDate < earliestDate;
    } catch (e) {
      return false;
    }
  };

  const getRushDays = () => {
    if (!watchedDeadline || !isRushDeadline()) return 0;

    try {
      const selectedDate = new Date(watchedDeadline);
      const timeDiff = Math.abs(
        earliestDate.getTime() - selectedDate.getTime()
      );
      return Math.ceil(timeDiff / RUSH_MS_PER_DAY);
    } catch (e) {
      return 0;
    }
  };

  const calculateRushFee = () => {
    if (!isRushDeadline() || !listingDeadline.rushFee) return 0;

    const rushDays = getRushDays();

    if (listingDeadline.rushFee.kind === "flat") {
      return listingDeadline.rushFee.amount;
    } else {
      return rushDays * listingDeadline.rushFee.amount;
    }
  };

  // Render content
  return (
    <Card sx={{ p: 3, mb: 3, borderRadius: 2 }}>
      <Grid container spacing={3}>
        {/* Timeline Section */}
        <Grid item xs={12} md={6}>
          <Typography variant="h6" gutterBottom color="primary">
            Jadwal Proyek
          </Typography>

          <Box sx={{ mb: 3 }}>
            <Box
              sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}
            >
              <Typography variant="body2" color="text.secondary">
                Seniman mulai bekerja:
              </Typography>
              <Typography variant="body2" fontWeight="medium">
                {formatReadableDate(baseDate)}
              </Typography>
            </Box>

            <Box
              sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}
            >
              <Typography variant="body2" color="text.secondary">
                Estimasi penyelesaian:
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
                  Tenggat waktu Anda:
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
                  Pilih Tenggat Waktu Anda:
                </Typography>
                <Controller
                  name="deadline"
                  control={control}
                  rules={{
                    required: "Tenggat waktu diperlukan",
                    validate: (val: string) => {
                      if (!val) return "Tenggat waktu diperlukan";

                      try {
                        const d = new Date(val);
                        if (isNaN(d.getTime())) {
                          return "Silakan masukkan tanggal yang valid";
                        }

                        // Mode-specific validations
                        if (listingDeadline.mode === "withDeadline") {
                          // Compare dates by setting time to 00:00:00 for fair comparison
                          const selectedDate = new Date(val);
                          selectedDate.setHours(0, 0, 0, 0);

                          const minDate = new Date(earliestDate);
                          minDate.setHours(0, 0, 0, 0);

                          if (selectedDate < minDate) {
                            return `Tanggal tidak boleh sebelum ${formatReadableDate(
                              earliestDate
                            )}`;
                          }
                        } else if (listingDeadline.mode === "withRush") {
                          // For withRush, deadline must be at least 1 day after baseDate
                          const minAllowedDate = new Date(baseDate);
                          minAllowedDate.setDate(minAllowedDate.getDate() + 1);
                          minAllowedDate.setHours(0, 0, 0, 0);

                          const selectedDate = new Date(val);
                          selectedDate.setHours(0, 0, 0, 0);

                          if (selectedDate <= baseDate) {
                            return `Tenggat waktu harus setelah ${formatReadableDate(
                              baseDate
                            )}`;
                          }
                        }
                        return true;
                      } catch (e) {
                        return "Format tanggal tidak valid";
                      }
                    },
                  }}
                  render={({ field, fieldState }) => {
                    // Add this function to handle date changes and enforce min date
                    const handleDateChange = (
                      e: React.ChangeEvent<HTMLInputElement>
                    ) => {
                      const inputDate = e.target.value;
                      field.onChange(inputDate);

                      // Immediately validate and correct if entered date is too early
                      if (listingDeadline.mode === "withDeadline") {
                        try {
                          const selectedDate = new Date(inputDate);
                          const minDate = new Date(earliestStr);

                          if (selectedDate < minDate) {
                            // If invalid date, reset to min date with slight delay
                            // This allows the validation error to show briefly
                            setTimeout(() => field.onChange(earliestStr), 100);
                          }
                        } catch (e) {
                          // If parsing fails, do nothing (will be caught by validate)
                        }
                      }
                    };

                    return (
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
                              ? (() => {
                                  // Add one day to earliestStr
                                  const minDate = new Date(earliestStr);
                                  minDate.setDate(minDate.getDate()); // Add one day
                                  return minDate.toISOString().slice(0, 10);
                                })()
                              : new Date(baseDate.getTime() + RUSH_MS_PER_DAY)
                                  .toISOString()
                                  .slice(0, 10),
                        }}
                        // Override onChange with our custom handler
                        onChange={handleDateChange}
                        // Add onBlur to enforce min date
                        onBlur={(e) => {
                          field.onBlur();
                          if (listingDeadline.mode === "withDeadline") {
                            try {
                              const currentValue = field.value;
                              const selectedDate = new Date(currentValue);
                              const minDate = new Date(earliestStr);

                              if (selectedDate < minDate) {
                                field.onChange(earliestStr);
                              }
                            } catch (e) {
                              // If parsing fails, will be caught by validate
                            }
                          }
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
                    );
                  }}
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

        {/* Rules Section */}
        <Grid item xs={12} md={6}>
          <Typography variant="h6" gutterBottom color="primary">
            Aturan Tenggat Waktu
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
            {/* Standard mode explanation */}
            {listingDeadline.mode === "standard" && (
              <Typography variant="body2" color="text.secondary">
                Komisi ini menggunakan tenggat waktu standar yang otomatis
                ditetapkan
                <strong> 2 minggu setelah</strong> tanggal penyelesaian yang
                diperkirakan untuk memastikan waktu yang cukup untuk pekerjaan
                berkualitas tinggi.
              </Typography>
            )}

            {/* WithDeadline mode explanation */}
            {listingDeadline.mode === "withDeadline" && (
              <Typography variant="body2" color="text.secondary">
                Anda dapat memilih tanggal apa pun{" "}
                <strong>
                  pada atau setelah {formatReadableDate(earliestDate)}
                </strong>
                . Fleksibilitas ini memungkinkan Anda untuk menyelaraskan
                tenggat waktu dengan jadwal proyek Anda.
              </Typography>
            )}

            {/* WithRush mode explanation */}
            {listingDeadline.mode === "withRush" && (
              <>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Anda memiliki dua pilihan:
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ display: "block", mb: 1 }}
                >
                  • <strong>Penyelesaian standar</strong> (tanpa biaya): Pada
                  atau setelah {formatReadableDate(earliestDate)}
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ display: "block", mb: 1 }}
                >
                  • <strong>Penyelesaian dipercepat</strong> (biaya tambahan):
                  Antara{" "}
                  {formatReadableDate(
                    new Date(baseDate.getTime() + RUSH_MS_PER_DAY)
                  )}{" "}
                  dan{" "}
                  {formatReadableDate(
                    new Date(earliestDate.getTime() - RUSH_MS_PER_DAY)
                  )}
                </Typography>

                {/* Rush fee information */}
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
                      Biaya Percepatan: {listing.currency}{" "}
                      {calculateRushFee().toLocaleString()}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mt: 1 }}
                    >
                      {getRushDays()} hari dipercepat •{" "}
                      {listingDeadline.rushFee?.kind === "flat"
                        ? "Biaya tetap"
                        : "Biaya per hari"}
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

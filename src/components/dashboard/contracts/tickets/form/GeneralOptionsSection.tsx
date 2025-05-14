// src/components/dashboard/contracts/tickets/form/GeneralOptionsSection.tsx

import React, { useEffect } from "react";
import { Control, useController, useFormContext } from "react-hook-form";
import {
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Checkbox,
  FormControlLabel,
  Paper,
  Divider,
  Card,
  CardContent,
  Grid,
  FormHelperText,
  Switch,
} from "@mui/material";
import { IContract } from "@/lib/db/models/contract.model";
import { ChangeTicketFormValues } from "../ChangeTicketForm";

// Helper functions for encoding/decoding question text
const encodeQuestionKey = (question: string): string => {
  return encodeURIComponent(question);
};

interface GeneralOptionsSectionProps {
  contract: IContract;
  disabled: boolean;
}

export default function GeneralOptionsSection({
  contract,
  disabled,
}: GeneralOptionsSectionProps) {
  const {
    control,
    watch,
    setValue,
    formState: { errors },
  } = useFormContext<ChangeTicketFormValues>();

  // Get listing from contract
  const listing = contract.proposalSnapshot.listingSnapshot || {};

  // Get general options from listing
  const listingGeneralOptions = listing.generalOptions || {};

  // Get latest contract terms for initial values
  const latestTerms = contract.contractTerms[contract.contractTerms.length - 1];

  // Get current general options from contract terms
  const currentGeneralOptions = latestTerms.generalOptions || {};

  // Watch for form values
  const includeGeneralOptions = watch("includeGeneralOptions");
  const watchedOptions = watch("generalOptions") || {};

  // Initialize form structure if it doesn't exist
  useEffect(() => {
    // Ensure generalOptions structure exists to prevent undefined errors
    if (!watchedOptions || Object.keys(watchedOptions).length === 0) {
      // Initialize with empty objects for each section
      setValue(
        "generalOptions",
        {
          optionGroups: {},
          addons: {},
          answers: {},
        },
        { shouldValidate: false }
      );
    }
  }, [setValue, watchedOptions]);

  // Initialize default values on component mount
  useEffect(() => {
    // Only set default values if general options change is included
    if (!includeGeneralOptions) return;

    // Set default values for option groups based on current contract terms
    if (
      (listingGeneralOptions?.optionGroups?.length ?? 0) > 0 &&
      Object.keys(watchedOptions.optionGroups || {}).length === 0
    ) {
      const defaultOptionGroups: Record<string, any> = {};

      // Initialize with current values from contract terms
      if (currentGeneralOptions.optionGroups) {
        currentGeneralOptions.optionGroups.forEach((selection) => {
          defaultOptionGroups[selection.groupId.toString()] = {
            selectedId: selection.selectedSelectionID,
            selectedLabel: selection.selectedSelectionLabel,
            price: selection.price,
          };
        });
      }

      if (Object.keys(defaultOptionGroups).length > 0) {
        setValue("generalOptions.optionGroups", defaultOptionGroups, {
          shouldValidate: false,
        });
      }
    }

    // Initialize addons with current values from contract terms
    if (
      (listingGeneralOptions?.addons?.length ?? 0) > 0 &&
      Object.keys(watchedOptions.addons || {}).length === 0
    ) {
      const defaultAddons: Record<string, number> = {};

      // Set current addons from contract terms
      if (currentGeneralOptions.addons) {
        currentGeneralOptions.addons.forEach((addon) => {
          defaultAddons[addon.addonId.toString()] = addon.price;
        });
      }

      if (Object.keys(defaultAddons).length > 0) {
        setValue("generalOptions.addons", defaultAddons, {
          shouldValidate: false,
        });
      }
    }

    // Initialize answers with current values from contract terms
    if ((listingGeneralOptions?.questions?.length ?? 0) > 0) {
      const defaultAnswers: Record<string, string> = {};
      console.log("T");
      // Set current answers from contract terms
      if (currentGeneralOptions.answers) {
        currentGeneralOptions.answers.forEach((answer) => {
          defaultAnswers[answer.questionId.toString()] = answer.answer;
        });
      } else {
        // Initialize empty answers if none exist
        (listingGeneralOptions?.questions ?? []).forEach((question) => {
          defaultAnswers[question.id.toString()] = "";
        });
      }

      console.log("defaultAnswers", defaultAnswers);

      if (Object.keys(defaultAnswers).length > 0) {
        setValue("generalOptions.answers", defaultAnswers, {
          shouldValidate: false,
        });
      }
    }
  }, [
    includeGeneralOptions,
    listingGeneralOptions.optionGroups,
    listingGeneralOptions.addons,
    listingGeneralOptions.questions,
    currentGeneralOptions,
    setValue,
    watchedOptions,
  ]);

  // Safety check - if general options are not allowed or no options exist, don't render
  if (
    !listing.changeable?.includes("generalOptions") ||
    (!listingGeneralOptions.optionGroups?.length &&
      !listingGeneralOptions.addons?.length &&
      !listingGeneralOptions.questions?.length)
  ) {
    return null;
  }

  // Handle option group selection
  const handleOptionGroupChange = (groupId: number, selectedLabel: string) => {
    // Find the selected option group
    const group = listingGeneralOptions.optionGroups?.find(
      (g) => g.id === groupId
    );

    if (!group) return;

    // Find the selected option within the group
    const selection = group.selections.find((s) => s.label === selectedLabel);

    if (selection) {
      setValue(
        `generalOptions.optionGroups.${groupId}`,
        {
          selectedId: selection.id,
          selectedLabel,
          price: selection.price,
        },
        { shouldValidate: true }
      );
    } else if (selectedLabel === "") {
      // Handle clearing the selection
      const currentOptionGroups = { ...watchedOptions.optionGroups };
      delete currentOptionGroups[groupId.toString()];
      setValue("generalOptions.optionGroups", currentOptionGroups, {
        shouldValidate: true,
      });
    }
  };

  // Handle addon toggle
  const handleAddonToggle = (addonId: number, checked: boolean) => {
    const addon = listingGeneralOptions.addons?.find((a) => a.id === addonId);
    const currentAddons = watchedOptions?.addons || {};

    if (checked && addon) {
      setValue(`generalOptions.addons.${addonId}`, addon.price, {
        shouldValidate: true,
      });
    } else {
      const { [addonId.toString()]: removed, ...rest } = currentAddons;
      setValue("generalOptions.addons", rest, { shouldValidate: true });
    }
  };

  // Create a memoized debounce function
  const debounce = (fn: (...args: any[]) => void, delay: number) => {
    let timer: NodeJS.Timeout | null;
    return function (...args: any[]) {
      if (timer) {
        clearTimeout(timer);
      }
      timer = setTimeout(() => fn(...args), delay);
    };
  };

  // Debounced question change handler
  const debouncedQuestionChange = React.useCallback(
    debounce((questionId, value) => {
      setValue(`generalOptions.answers.${questionId}`, value, {
        shouldValidate: true,
      });
    }, 300),
    [setValue]
  );

  // Toggle inclusion of general options
  const handleIncludeGeneralOptions = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setValue("includeGeneralOptions", e.target.checked);
  };

  return (
    <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
        }}
      >
        <Typography variant="h6" color="primary" fontWeight="medium">
          Opsi Umum
        </Typography>
        <FormControlLabel
          control={
            <Switch
              checked={includeGeneralOptions}
              onChange={handleIncludeGeneralOptions}
              disabled={disabled}
            />
          }
          label="Include changes"
          sx={{ mr: 0 }}
        />
      </Box>
      <Divider sx={{ mb: 3 }} />

      {includeGeneralOptions ? (
        <>
          {/* Option Groups */}
          {listingGeneralOptions.optionGroups &&
            listingGeneralOptions.optionGroups.length > 0 && (
              <Box sx={{ mb: 4 }}>
                <Typography
                  variant="subtitle1"
                  sx={{ mb: 2 }}
                  fontWeight="medium"
                >
                  Pilih Opsi
                </Typography>

                <Card variant="outlined" sx={{ height: "100%", pb: 2, pr: 2 }}>
                  <Grid container spacing={2}>
                    {listingGeneralOptions.optionGroups.map((group) => (
                      <Grid item xs={12} md={12} key={group.id}>
                        <CardContent>
                          <FormControl
                            fullWidth
                            error={
                              !!errors?.generalOptions?.optionGroups &&
                              !!(
                                errors.generalOptions.optionGroups as Record<
                                  string,
                                  any
                                >
                              )[group.id.toString()]
                            }
                            disabled={disabled}
                          >
                            <InputLabel id={`general-option-${group.id}-label`}>
                              {group.title}
                            </InputLabel>
                            <Select
                              labelId={`general-option-${group.id}-label`}
                              id={`general-option-${group.id}`}
                              value={
                                watchedOptions?.optionGroups?.[group.id]
                                  ?.selectedLabel || ""
                              }
                              label={group.title}
                              onChange={(e) =>
                                handleOptionGroupChange(
                                  group.id,
                                  e.target.value
                                )
                              }
                            >
                              {group.selections.map((selection) => (
                                <MenuItem
                                  key={selection.id}
                                  value={selection.label}
                                >
                                  {selection.label} - {listing.currency}{" "}
                                  {selection.price.toLocaleString()}
                                </MenuItem>
                              ))}
                            </Select>
                            {errors?.generalOptions?.optionGroups &&
                              (
                                errors.generalOptions.optionGroups as Record<
                                  string,
                                  any
                                >
                              )[group.id.toString()] && (
                                <FormHelperText error>
                                  Field ini wajib diisi
                                </FormHelperText>
                              )}
                          </FormControl>
                        </CardContent>
                      </Grid>
                    ))}
                  </Grid>
                </Card>
              </Box>
            )}

          {/* Addons */}
          {(listingGeneralOptions.addons ?? []).length > 0 && (
            <Box sx={{ mb: 5 }}>
              <Typography
                variant="subtitle1"
                sx={{
                  mb: 2.5,
                  fontWeight: 600,
                  position: "relative",
                  paddingBottom: 1,
                }}
              >
                Layanan Tambahan
              </Typography>

              <Card
                variant="outlined"
                sx={{
                  borderRadius: 2,
                  boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                  transition: "all 0.2s ease-in-out",
                  "&:hover": {
                    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                  },
                }}
              >
                <CardContent sx={{ py: 2.5 }}>
                  <Box sx={{ display: "flex", flexDirection: "column" }}>
                    {(listingGeneralOptions.addons ?? []).map((addon) => (
                      <FormControlLabel
                        key={addon.id}
                        control={
                          <Checkbox
                            checked={!!watchedOptions?.addons?.[addon.id]}
                            onChange={(e) =>
                              handleAddonToggle(addon.id, e.target.checked)
                            }
                            color="primary"
                            disabled={disabled}
                            sx={{
                              "&.Mui-checked": {
                                color: "primary.main",
                              },
                            }}
                          />
                        }
                        label={
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              width: "100%",
                              flexWrap: { xs: "wrap", sm: "nowrap" },
                              paddingTop: { xs: 0.5, sm: 0.75 },
                            }}
                          >
                            <Typography fontWeight={500} sx={{ mr: 1, ml: 2 }}>
                              {addon.label}
                            </Typography>
                            <Typography
                              sx={{
                                color: "text.secondary",
                                fontWeight: 500,
                                backgroundColor: "action.hover",
                                px: 1.5,
                                py: 0.5,
                                borderRadius: 1,
                                fontSize: "0.875rem",
                                display: "inline-flex",
                                alignItems: "center",
                                ml: "auto",
                                mt: { xs: 0.5, sm: 0 },
                              }}
                            >
                              {listing.currency} {addon.price.toLocaleString()}
                            </Typography>
                          </Box>
                        }
                        sx={{
                          display: "flex",
                          py: 1.5,
                          alignItems: "flex-start",
                          borderBottom: "1px solid",
                          borderColor: "divider",
                          width: "100%",
                          margin: 0,
                          "&:last-child": {
                            borderBottom: "none",
                          },
                        }}
                      />
                    ))}
                  </Box>
                </CardContent>
              </Card>
            </Box>
          )}

          {/* Questions */}
          {(listingGeneralOptions.questions ?? []).length > 0 && (
            <Box sx={{ mb: 3 }}>
              <Typography
                variant="subtitle1"
                sx={{ mb: 2 }}
                fontWeight="medium"
              >
                Informasi Tambahan
              </Typography>

              {(listingGeneralOptions.questions ?? []).map((question) => {
                const questionIdStr = question.id.toString();
                const fieldError = errors?.generalOptions?.answers
                  ? (errors.generalOptions.answers as Record<string, any>)[
                      questionIdStr
                    ]
                  : undefined;

                return (
                  <QuestionField
                    key={question.id}
                    questionId={question.id}
                    questionText={question.text}
                    control={control}
                    disabled={disabled}
                    error={fieldError}
                  />
                );
              })}
            </Box>
          )}
        </>
      ) : (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ fontStyle: "italic", mt: 2 }}
        >
          Alihkan toggle untuk menyertakan perubahan pada opsi umum.
        </Typography>
      )}
    </Paper>
  );
}

/**
 * A memoized single‐question component that only
 * re‐renders when its own value or error changes.
 */
const QuestionField = React.memo(function QuestionField({
  questionId,
  questionText,
  control,
  disabled,
  error,
}: {
  questionId: number;
  questionText: string;
  control: Control<ChangeTicketFormValues>;
  disabled: boolean;
  error?: { message?: string };
}) {
  // Get current value from form controller
  const { field } = useController({
    name: `generalOptions.answers.${questionId.toString()}`,
    control,
    // Fix: Initialize with empty string explicitly rather than undefined
    defaultValue: "",
  });

  // Fix: Ensure initial value is properly set
  React.useEffect(() => {
    if (inputRef.current) {
      // Ensure the value is never undefined or null
      inputRef.current.value = field.value || "";
    }
  }, [field.value]);

  // Use uncontrolled input pattern with refs for performance
  const inputRef = React.useRef<HTMLInputElement | null>(null);

  // Set initial value when mounted or value changes
  React.useEffect(() => {
    if (inputRef.current && inputRef.current.value !== field.value) {
      inputRef.current.value = field.value;
    }
  }, [field.value]);

  // Handle input changes with debounce
  const debouncedChange = React.useCallback(
    (function () {
      let timer: NodeJS.Timeout | null = null;
      return function () {
        if (timer) clearTimeout(timer);
        timer = setTimeout(() => {
          if (inputRef.current) {
            field.onChange(inputRef.current.value);
          }
        }, 300);
      };
    })(),
    [field]
  );

  return (
    <TextField
      inputRef={inputRef}
      label={questionText}
      multiline
      rows={2}
      fullWidth
      sx={{ mb: 3 }}
      defaultValue={field.value}
      onInput={debouncedChange}
      onBlur={() => {
        if (inputRef.current) {
          field.onChange(inputRef.current.value);
        }
      }}
      error={!!error}
      helperText={error?.message}
      placeholder="Jawabanmu..."
      disabled={disabled}
    />
  );
});

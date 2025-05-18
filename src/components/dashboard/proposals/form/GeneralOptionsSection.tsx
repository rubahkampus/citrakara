// src/components/dashboard/proposals/form/GeneralOptionsSection.tsx

import React, { useEffect, useCallback, memo, useRef } from "react";
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
  alpha,
} from "@mui/material";
import { ProposalFormValues, GeneralOptionGroupInput } from "@/types/proposal";
import { ICommissionListing } from "@/lib/db/models/commissionListing.model";

// Helper functions for encoding/decoding question text
const encodeQuestionKey = (question: string): string => {
  return encodeURIComponent(question);
};

// Constants for translating UI text to Indonesian
const TRANSLATIONS = {
  generalOptions: "Opsi Umum",
  selectOptions: "Pilih Opsi",
  additionalServices: "Layanan Tambahan",
  additionalInformation: "Informasi Tambahan",
  thisFieldIsRequired: "Bidang ini wajib diisi",
  yourAnswer: "Jawaban Anda...",
};

// Component types
interface GeneralOptionsSectionProps {
  listing: ICommissionListing;
}

interface QuestionFieldProps {
  questionId: number;
  questionText: string;
  control: Control<ProposalFormValues>;
  error?: { message?: string };
}

/**
 * GeneralOptionsSection component for handling commission proposals options
 */
export default function GeneralOptionsSection({
  listing,
}: GeneralOptionsSectionProps) {
  const {
    control,
    watch,
    setValue,
    formState: { errors },
  } = useFormContext<ProposalFormValues>();
  const generalOptions = listing.generalOptions || {};

  const watchedOptions = watch("generalOptions") || {
    optionGroups: {},
    addons: {},
    answers: {},
  };

  // Initialize default values on component mount
  useEffect(() => {
    initializeOptionGroups();
    initializeQuestionAnswers();
  }, [generalOptions.optionGroups, generalOptions.questions]);

  // Initialize option groups with default values
  const initializeOptionGroups = () => {
    if (
      (generalOptions?.optionGroups?.length ?? 0) > 0 &&
      Object.keys(watchedOptions.optionGroups || {}).length === 0
    ) {
      const defaultOptionGroups: Record<string, GeneralOptionGroupInput> = {};

      (generalOptions?.optionGroups ?? []).forEach((group) => {
        if (group.selections.length > 0) {
          // Set the first option as default
          defaultOptionGroups[group.id.toString()] = {
            selectedId: group.selections[0].id,
            selectedLabel: group.selections[0].label,
            price: group.selections[0].price,
          };
        }
      });

      if (Object.keys(defaultOptionGroups).length > 0) {
        setValue("generalOptions.optionGroups", defaultOptionGroups, {
          shouldValidate: false,
        });
      }
    }
  };

  // Initialize question answers with empty values
  const initializeQuestionAnswers = () => {
    if (
      (generalOptions?.questions?.length ?? 0) > 0 &&
      Object.keys(watchedOptions.answers || {}).length === 0
    ) {
      const defaultAnswers: Record<string, string> = {};

      (generalOptions?.questions ?? []).forEach((question) => {
        // Encode the question to create a safe key
        const encodedKey = encodeQuestionKey(question.text);
        defaultAnswers[question.id.toString()] = "";
      });

      if (Object.keys(defaultAnswers).length > 0) {
        setValue("generalOptions.answers", defaultAnswers, {
          shouldValidate: false,
        });
      }
    }
  };

  // Safety check - if any section is missing, don't render the component
  if (
    !generalOptions.optionGroups?.length &&
    !generalOptions.addons?.length &&
    !generalOptions.questions?.length
  ) {
    return null;
  }

  // Handle option group selection
  const handleOptionGroupChange = (groupId: number, selectedLabel: string) => {
    // Find the selected option group
    const group = generalOptions.optionGroups?.find((g) => g.id === groupId);

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
    const addon = generalOptions.addons?.find((a) => a.id === addonId);
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

  // Create a debounce function
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
  const debouncedQuestionChange = useCallback(
    debounce((questionId, value) => {
      setValue(`generalOptions.answers.${questionId}`, value, {
        shouldValidate: true,
      });
    }, 300),
    [setValue]
  );

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3.5,
        mb: 3,
        borderRadius: 2.5,
        border: "1px solid",
        borderColor: "divider",
        boxShadow: "0 4px 20px rgba(0,0,0,0.03)",
      }}
    >
      <Typography
        variant="h6"
        gutterBottom
        color="primary"
        sx={{
          fontWeight: 600,
          fontSize: "1.1rem",
          mb: 1.5,
        }}
      >
        {TRANSLATIONS.generalOptions}
      </Typography>
      <Divider sx={{ mb: 3.5 }} />

      {/* Option Groups */}
      {generalOptions.optionGroups &&
        generalOptions.optionGroups.length > 0 && (
          <Box sx={{ mb: 4.5 }}>
            <Typography
              variant="subtitle1"
              sx={{
                mb: 2,
                fontWeight: 500,
                color: "text.primary",
              }}
            >
              {TRANSLATIONS.selectOptions}
            </Typography>

            <Card
              variant="outlined"
              sx={{
                height: "100%",
                pb: 2,
                pr: 2,
                borderRadius: 2,
                boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
                transition: "all 0.2s ease-in-out",
                "&:hover": {
                  boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
                },
              }}
            >
              <Grid container spacing={-2}>
                {generalOptions.optionGroups.map((group) => (
                  <Grid item xs={12} md={12} key={group.id}>
                    <CardContent sx={{ pt: 2.5, pb: 1.5 }}>
                      <FormControl
                        fullWidth
                        error={
                          !!errors?.generalOptions?.optionGroups?.[group.id]
                        }
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
                            handleOptionGroupChange(group.id, e.target.value)
                          }
                          sx={{
                            "& .MuiOutlinedInput-notchedOutline": {
                              borderColor: "divider",
                            },
                            "&:hover .MuiOutlinedInput-notchedOutline": {
                              borderColor: "primary.light",
                            },
                          }}
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
                        {errors?.generalOptions?.optionGroups?.[group.id] && (
                          <FormHelperText error>
                            {TRANSLATIONS.thisFieldIsRequired}
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
      {(generalOptions.addons ?? []).length > 0 && (
        <Box sx={{ mb: 5 }}>
          <Typography
            variant="h6"
            sx={{
              mb: 2.5,
              fontWeight: 600,
              position: "relative",
              paddingBottom: 1,
              fontSize: "1rem",
              color: "text.primary",
            }}
          >
            {TRANSLATIONS.additionalServices}
          </Typography>

          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              border: "1px solid",
              borderColor: "grey.300",
              borderRadius: 2,
              padding: 1,
              backgroundColor: "background.paper",
            }}
          >
            {(generalOptions.addons ?? []).map((addon) => (
              <FormControlLabel
                key={addon.id}
                control={
                  <Checkbox
                    checked={!!watchedOptions?.addons?.[addon.id]}
                    onChange={(e) =>
                      handleAddonToggle(addon.id, e.target.checked)
                    }
                    color="primary"
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
                  "&:hover": {
                    backgroundColor: "action.hover",
                  },
                  transition: "background-color 0.2s ease",
                  borderRadius: 1,
                }}
              />
            ))}
          </Box>
        </Box>
      )}

      {/* Questions */}
      {(generalOptions.questions ?? []).length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Typography
            variant="subtitle1"
            sx={{
              mb: 2.5,
              fontWeight: 500,
              color: "text.primary",
            }}
          >
            {TRANSLATIONS.additionalInformation}
          </Typography>

          {(generalOptions.questions ?? []).map((question) => (
            <QuestionField
              key={question.id}
              questionId={question.id}
              questionText={question.text}
              control={control}
              error={errors?.generalOptions?.answers?.[question.id]}
            />
          ))}
        </Box>
      )}
    </Paper>
  );
}

/**
 * A memoized single‐question component that only
 * re‐renders when its own value or error changes.
 */
const QuestionField = memo(function QuestionField({
  questionId,
  questionText,
  control,
  error,
}: QuestionFieldProps) {
  // Get current value from form controller
  const { field } = useController({
    name: `generalOptions.answers.${questionId}`,
    control,
    defaultValue: "",
  });

  // Use uncontrolled input pattern with refs for performance
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Set initial value when mounted or value changes
  useEffect(() => {
    if (inputRef.current && inputRef.current.value !== field.value) {
      inputRef.current.value = field.value;
    }
  }, [field.value]);

  // Handle input changes with debounce
  const debouncedChange = useCallback(
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

  // Find if this is the last question to adjust margin
  const isLastQuestion = React.useMemo(() => {
    const questions = control._formValues.generalOptions?.questions || [];
    return (
      questions.length > 0 && questions[questions.length - 1]?.id === questionId
    );
  }, [control._formValues.generalOptions?.questions, questionId]);

  return (
    <TextField
      inputRef={inputRef}
      label={questionText}
      multiline
      rows={2}
      fullWidth
      sx={{
        mb: isLastQuestion ? 0 : 3.5,
        "& .MuiOutlinedInput-root": {
          transition: "all 0.2s ease",
          "&:hover .MuiOutlinedInput-notchedOutline": {
            borderColor: "primary.light",
          },
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderWidth: "1px",
          },
        },
      }}
      defaultValue={field.value}
      onInput={debouncedChange}
      onBlur={() => {
        if (inputRef.current) {
          field.onChange(inputRef.current.value);
        }
      }}
      error={!!error}
      helperText={error?.message}
      placeholder={TRANSLATIONS.yourAnswer}
    />
  );
});

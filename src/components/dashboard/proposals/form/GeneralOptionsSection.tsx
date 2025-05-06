// src/components/dashboard/proposals/form/GeneralOptionsSection.tsx

/**
 * GeneralOptionsSection
 * ---------------------
 * Renders nested optionGroups, addons, and answer fields.
 * Data shape:
 *   formValues.generalOptions.optionGroups: { [title]: { selectedLabel, price } }
 *   formValues.generalOptions.addons: { [label]: price }
 *   formValues.generalOptions.answers: { [question]: answer }
 */
import React, { useCallback, useEffect, useMemo } from "react";
import { useFormContext, Controller } from "react-hook-form";
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
} from "@mui/material";
import { ProposalFormValues } from "@/types/proposal";
import { ICommissionListing } from "@/lib/db/models/commissionListing.model";
import { Cents } from "@/types/common";

interface GeneralOptionsSectionProps {
  listing: ICommissionListing;
}

// Separate components to prevent full component re-renders
const OptionGroupItem = React.memo(
  ({
    group,
    value,
    currency,
    onChange,
    error,
  }: {
    group: any;
    value: string;
    currency: string;
    onChange: (title: string, value: string) => void;
    error?: any;
  }) => {
    const handleChange = useCallback(
      (e: { target: { value: string } }) => {
        onChange(group.title, e.target.value);
      },
      [group.title, onChange]
    );

    return (
      <Grid item xs={12} md={12} key={group.title}>
        <CardContent>
          <FormControl fullWidth error={!!error}>
            <InputLabel id={`general-option-${group.title}-label`}>
              {group.title}
            </InputLabel>
            <Select
              labelId={`general-option-${group.title}-label`}
              id={`general-option-${group.title}`}
              value={value}
              label={group.title}
              onChange={handleChange}
            >
              {group.selections.map(
                (selection: { label: string; price: Cents }) => (
                  <MenuItem key={selection.label} value={selection.label}>
                    {selection.label} - {currency}{" "}
                    {selection.price.toLocaleString()}
                  </MenuItem>
                )
              )}
            </Select>
            {error && (
              <FormHelperText error>This field is required</FormHelperText>
            )}
          </FormControl>
        </CardContent>
      </Grid>
    );
  }
);

const AddonItem = React.memo(
  ({
    addon,
    checked,
    currency,
    onToggle,
  }: {
    addon: any;
    checked: boolean;
    currency: string;
    onToggle: (label: string, checked: boolean) => void;
  }) => {
    const handleChange = useCallback(
      (e: { target: { checked: boolean } }) => {
        onToggle(addon.label, e.target.checked);
      },
      [addon.label, onToggle]
    );

    return (
      <FormControlLabel
        control={
          <Checkbox
            checked={checked}
            onChange={handleChange}
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
              {currency} {addon.price.toLocaleString()}
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
    );
  }
);

const QuestionItem = React.memo(
  ({
    question,
    value,
    onChange,
    error,
    isLast,
  }: {
    question: string;
    value: string;
    onChange: (question: string, value: string) => void;
    error?: any;
    isLast: boolean;
  }) => {
    const handleChange = useCallback(
      (e: { target: { value: string } }) => {
        onChange(question, e.target.value);
      },
      [question, onChange]
    );

    return (
      <TextField
        label={question}
        multiline
        rows={1}
        fullWidth
        sx={{ mb: isLast ? 0 : 3 }}
        value={value || ""}
        onChange={handleChange}
        error={!!error}
        helperText={error?.message}
        placeholder="Your answer..."
      />
    );
  }
);

export default function GeneralOptionsSection({
  listing,
}: GeneralOptionsSectionProps) {
  const {
    control,
    watch,
    setValue,
    formState: { errors },
  } = useFormContext<ProposalFormValues>();

  // Memoize generalOptions to prevent unnecessary recalculations
  const generalOptions = useMemo(
    () => listing.generalOptions || {},
    [listing.generalOptions]
  );
  const watchedOptions = watch("generalOptions") || {
    optionGroups: {},
    addons: {},
    answers: {},
  };

  // Safety check - if any section is missing, don't render the component
  if (
    !generalOptions.optionGroups?.length &&
    !generalOptions.addons?.length &&
    !generalOptions.questions?.length
  ) {
    return null;
  }

  useEffect(() => {
    const optionGroupDefaults: Record<string, { selectedLabel: string; price: Cents }> = {};
  
    generalOptions.optionGroups?.forEach((group) => {
      const defaultSelection = group.selections[0];
      if (defaultSelection) {
        optionGroupDefaults[group.title] = {
          selectedLabel: defaultSelection.label,
          price: defaultSelection.price,
        };
      }
    });
  
    setValue("generalOptions.optionGroups", {
      ...optionGroupDefaults,
      ...watchedOptions.optionGroups, // preserve any user-modified selections
    }, { shouldValidate: false });
  }, [generalOptions.optionGroups, setValue]);
  

  // Handle option group selection - memoized callback
  const handleOptionGroupChange = useCallback(
    (groupTitle: string, selectedLabel: string) => {
      // Find the selected option group
      const group = generalOptions.optionGroups?.find(
        (g) => g.title === groupTitle
      );

      if (!group) return;

      // Find the selected option within the group
      const selection = group.selections.find((s) => s.label === selectedLabel);

      if (selection) {
        setValue(
          `generalOptions.optionGroups.${groupTitle}`,
          {
            selectedLabel,
            price: selection.price,
          },
          { shouldValidate: true }
        );
      } else if (selectedLabel === "") {
        // Handle clearing the selection
        const currentOptionGroups = { ...watchedOptions.optionGroups };
        delete currentOptionGroups[groupTitle];
        setValue("generalOptions.optionGroups", currentOptionGroups, {
          shouldValidate: true,
        });
      }
    },
    [generalOptions.optionGroups, setValue, watchedOptions.optionGroups]
  );

  // Handle addon toggle - memoized callback
  const handleAddonToggle = useCallback(
    (addonLabel: string, checked: boolean) => {
      const addon = generalOptions.addons?.find((a) => a.label === addonLabel);
      const currentAddons = watchedOptions?.addons || {};

      if (checked && addon) {
        setValue(
          "generalOptions.addons",
          {
            ...currentAddons,
            [addonLabel]: addon.price,
          },
          { shouldValidate: true }
        );
      } else {
        const { [addonLabel]: removed, ...rest } = currentAddons;
        setValue("generalOptions.addons", rest, { shouldValidate: true });
      }
    },
    [generalOptions.addons, setValue, watchedOptions?.addons]
  );

  // Handle question answers - memoized callback
  const handleQuestionChange = useCallback(
    (question: string, answer: string) => {
      setValue(`generalOptions.answers.${question}`, answer, {
        shouldValidate: true,
      });
    },
    [setValue]
  );

  // Memoize rendering sections to prevent unnecessary re-renders
  const optionGroupsSection = useMemo(() => {
    if (!generalOptions.optionGroups?.length) return null;

    return (
      <Box sx={{ mb: 4 }}>
        <Typography variant="subtitle1" sx={{ mb: 2 }} fontWeight="medium">
          Select Options
        </Typography>

        <Card variant="outlined" sx={{ height: "100%", pb: 2, pr: 2 }}>
          <Grid container spacing={-2}>
            {generalOptions.optionGroups.map((group) => (
              <OptionGroupItem
                key={group.title}
                group={group}
                value={
                  watchedOptions?.optionGroups?.[group.title]?.selectedLabel ||
                  (group.selections.length > 0 ? group.selections[0].label : "")
                }
                currency={listing.currency}
                onChange={handleOptionGroupChange}
                error={errors?.generalOptions?.optionGroups?.[group.title]}
              />
            ))}
          </Grid>
        </Card>
      </Box>
    );
  }, [
    generalOptions.optionGroups,
    watchedOptions?.optionGroups,
    listing.currency,
    handleOptionGroupChange,
    errors?.generalOptions?.optionGroups,
  ]);

  const addonsSection = useMemo(() => {
    if (!(generalOptions.addons ?? []).length) return null;

    return (
      <Box sx={{ mb: 5 }}>
        <Typography
          variant="h6"
          sx={{
            mb: 2.5,
            fontWeight: 600,
            position: "relative",
            paddingBottom: 1,
          }}
        >
          Additional Services
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
              {(generalOptions.addons ?? []).map((addon) => (
                <AddonItem
                  key={`${addon.label}-${addon.price}`}
                  addon={addon}
                  checked={!!watchedOptions?.addons?.[addon.label]}
                  currency={listing.currency}
                  onToggle={handleAddonToggle}
                />
              ))}
            </Box>
          </CardContent>
        </Card>
      </Box>
    );
  }, [
    generalOptions.addons,
    watchedOptions?.addons,
    listing.currency,
    handleAddonToggle,
  ]);

  const questionsSection = useMemo(() => {
    if (!(generalOptions.questions ?? []).length) return null;

    return (
      <Box>
        <Typography variant="subtitle1" sx={{ mb: 2 }} fontWeight="medium">
          Additional Information
        </Typography>
        <Card variant="outlined">
          <CardContent>
            {(generalOptions.questions ?? []).map((question, index) => (
              <QuestionItem
                key={question}
                question={question}
                value={watchedOptions?.answers?.[question] || ""}
                onChange={handleQuestionChange}
                error={errors?.generalOptions?.answers?.[question]}
                isLast={index === (generalOptions.questions ?? []).length - 1}
              />
            ))}
          </CardContent>
        </Card>
      </Box>
    );
  }, [
    generalOptions.questions,
    watchedOptions?.answers,
    handleQuestionChange,
    errors?.generalOptions?.answers,
  ]);

  // Remove console.log that could slow down renders
  return (
    <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
      <Typography variant="h6" gutterBottom color="primary" fontWeight="medium">
        General Options
      </Typography>
      <Divider sx={{ mb: 3 }} />

      {optionGroupsSection}
      {addonsSection}
      {questionsSection}
    </Paper>
  );
}

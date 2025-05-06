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
import React from "react";
import { useFormContext } from "react-hook-form";
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

interface GeneralOptionsSectionProps {
  listing: ICommissionListing;
}

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

  console.log("listing", listing);

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

  // Handle option group selection
  const handleOptionGroupChange = (
    groupTitle: string,
    selectedLabel: string
  ) => {
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
  };

  // Handle addon toggle
  const handleAddonToggle = (addonLabel: string, checked: boolean) => {
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
  };

  // Handle question answers
  const handleQuestionChange = (question: string, answer: string) => {
    setValue(`generalOptions.answers.${question}`, answer, {
      shouldValidate: true,
    });
  };

  return (
    <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
      <Typography variant="h6" gutterBottom color="primary" fontWeight="medium">
        General Options
      </Typography>
      <Divider sx={{ mb: 3 }} />

      {/* Option Groups */}
      {generalOptions.optionGroups &&
        generalOptions.optionGroups.length > 0 && (
          <Box sx={{ mb: 4 }}>
            <Typography variant="subtitle1" sx={{ mb: 2 }} fontWeight="medium">
              Select Options
            </Typography>

            <Card variant="outlined" sx={{ height: "100%", pb: 2, pr: 2 }}>
              <Grid container spacing={-2}>
                {generalOptions.optionGroups.map((group) => (
                  <Grid item xs={12} md={12} key={group.title}>
                    <CardContent>
                      <FormControl
                        fullWidth
                        error={
                          !!errors?.generalOptions?.optionGroups?.[group.title]
                        }
                      >
                        <InputLabel id={`general-option-${group.title}-label`}>
                          {group.title}
                        </InputLabel>
                        <Select
                          labelId={`general-option-${group.title}-label`}
                          id={`general-option-${group.title}`}
                          value={
                            watchedOptions?.optionGroups?.[group.title]
                              ?.selectedLabel || ""
                          }
                          label={group.title}
                          onChange={(e) =>
                            handleOptionGroupChange(group.title, e.target.value)
                          }
                        >
                          <MenuItem value="">
                            <em>None</em>
                          </MenuItem>
                          {group.selections.map((selection) => (
                            <MenuItem
                              key={selection.label}
                              value={selection.label}
                            >
                              {selection.label} - {listing.currency}{" "}
                              {selection.price.toLocaleString()}
                            </MenuItem>
                          ))}
                        </Select>
                        {errors?.generalOptions?.optionGroups?.[
                          group.title
                        ] && (
                          <FormHelperText error>
                            This field is required
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
                  <FormControlLabel
                    key={`${addon.label}-${addon.price}`}
                    control={
                      <Checkbox
                        checked={!!watchedOptions?.addons?.[addon.label]}
                        onChange={(e) =>
                          handleAddonToggle(addon.label, e.target.checked)
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
                    }}
                  />
                ))}
              </Box>
            </CardContent>
          </Card>
        </Box>
      )}

      {/* Questions */}
      {(generalOptions.questions ?? []).length > 0 && (
        <Box>
          <Typography variant="subtitle1" sx={{ mb: 2 }} fontWeight="medium">
            Additional Information
          </Typography>
          <Card variant="outlined">
            <CardContent>
              {(generalOptions.questions ?? []).map((question, index) => (
                <TextField
                  key={index}
                  label={question}
                  multiline
                  rows={1}
                  fullWidth
                  sx={{
                    mb:
                      index < (generalOptions.questions ?? []).length - 1
                        ? 3
                        : 0,
                  }}
                  value={watchedOptions?.answers?.[question] || ""}
                  onChange={(e) =>
                    handleQuestionChange(question, e.target.value)
                  }
                  error={!!errors?.generalOptions?.answers?.[question]}
                  helperText={
                    errors?.generalOptions?.answers?.[question]?.message
                  }
                  placeholder="Your answer..."
                />
              ))}
            </CardContent>
          </Card>
        </Box>
      )}
    </Paper>
  );
}

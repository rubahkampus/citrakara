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
            <Grid container spacing={2}>
              {generalOptions.optionGroups.map((group) => (
                <Grid item xs={12} md={6} key={group.title}>
                  <Card variant="outlined" sx={{ height: "100%" }}>
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
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

      {/* Addons */}
      {(generalOptions.addons ?? []).length > 0 && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="subtitle1" sx={{ mb: 2 }} fontWeight="medium">
            Additional Services
          </Typography>
          <Card variant="outlined">
            <CardContent>
              <Grid container spacing={2}>
                {(generalOptions.addons ?? []).map((addon) => (
                  <Grid item xs={12} md={6} key={addon.label}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={!!watchedOptions?.addons?.[addon.label]}
                          onChange={(e) =>
                            handleAddonToggle(addon.label, e.target.checked)
                          }
                          color="primary"
                        />
                      }
                      label={
                        <Box>
                          <Typography component="span" fontWeight="medium">
                            {addon.label}
                          </Typography>
                          <Typography
                            component="span"
                            color="text.secondary"
                            ml={1}
                          >
                            {listing.currency} {addon.price.toLocaleString()}
                          </Typography>
                        </Box>
                      }
                      sx={{ display: "block", mb: 1 }}
                    />
                  </Grid>
                ))}
              </Grid>
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
                  rows={3}
                  fullWidth
                  sx={{
                    mb: index < (generalOptions.questions ?? []).length - 1 ? 3 : 0,
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

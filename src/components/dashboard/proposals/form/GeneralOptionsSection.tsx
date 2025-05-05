// src/components/dashboard/proposals/form/GeneralOptionsSection.tsx

/**
 * GeneralOptionsSection
 * ---------------------
 * Renders nested optionGroups, addons, and answer fields.
 * Use RHF's useFieldArray for dynamic groups.
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
} from "@mui/material";
import { ProposalFormValues } from "@/types/proposal";

export default function GeneralOptionsSection() {
  const { control, watch, setValue } = useFormContext<ProposalFormValues>();
  const listing = JSON.parse(sessionStorage.getItem("currentListing") || "{}");
  const generalOptions = listing.generalOptions || {};

  const watchedOptions = watch("generalOptions") || {};

  // Handle option group selection
  const handleOptionGroupChange = (
    groupTitle: string,
    selectedLabel: string
  ) => {
    const group = generalOptions.optionGroups?.find(
      (g: any) => g.title === groupTitle
    );
    const selection = group?.selections.find(
      (s: any) => s.label === selectedLabel
    );

    if (selection) {
      setValue(`generalOptions.optionGroups.${groupTitle}`, {
        selectedLabel,
        price: selection.price,
      });
    }
  };

  // Handle addon toggle
  const handleAddonToggle = (addonLabel: string, checked: boolean) => {
    const addon = generalOptions.addons?.find(
      (a: any) => a.label === addonLabel
    );
    const currentAddons = watchedOptions?.addons || {};

    if (checked && addon) {
      setValue("generalOptions.addons", {
        ...currentAddons,
        [addonLabel]: addon.price,
      });
    } else {
      const { [addonLabel]: removed, ...rest } = currentAddons;
      setValue("generalOptions.addons", rest);
    }
  };

  if (
    !generalOptions.optionGroups?.length &&
    !generalOptions.addons?.length &&
    !generalOptions.questions?.length
  ) {
    return null;
  }

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        General Options
      </Typography>

      {/* Option Groups */}
      {generalOptions.optionGroups?.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" sx={{ mb: 2 }}>
            Select Options
          </Typography>
          {generalOptions.optionGroups.map((group: any) => (
            <FormControl fullWidth key={group.title} sx={{ mb: 2 }}>
              <InputLabel>{group.title}</InputLabel>
              <Select
                value={
                  watchedOptions?.optionGroups?.[group.title]?.selectedLabel ||
                  ""
                }
                label={group.title}
                onChange={(e) =>
                  handleOptionGroupChange(group.title, e.target.value)
                }
              >
                <MenuItem value="">
                  <em>None</em>
                </MenuItem>
                {group.selections.map((selection: any) => (
                  <MenuItem key={selection.label} value={selection.label}>
                    {selection.label} - {listing.currency}{" "}
                    {selection.price.toLocaleString()}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          ))}
        </Box>
      )}

      {/* Addons */}
      {generalOptions.addons?.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" sx={{ mb: 2 }}>
            Additional Services
          </Typography>
          {generalOptions.addons.map((addon: any) => (
            <FormControlLabel
              key={addon.label}
              control={
                <Checkbox
                  checked={!!watchedOptions?.addons?.[addon.label]}
                  onChange={(e) =>
                    handleAddonToggle(addon.label, e.target.checked)
                  }
                />
              }
              label={`${addon.label} - ${
                listing.currency
              } ${addon.price.toLocaleString()}`}
              sx={{ display: "block", mb: 1 }}
            />
          ))}
        </Box>
      )}

      {/* Questions */}
      {generalOptions.questions?.length > 0 && (
        <Box>
          <Typography variant="subtitle1" sx={{ mb: 2 }}>
            Additional Information
          </Typography>
          <Divider sx={{ mb: 2 }} />
          {generalOptions.questions.map((question: string, index: number) => (
            <TextField
              key={index}
              label={question}
              multiline
              rows={2}
              fullWidth
              sx={{ mb: 2 }}
              value={watchedOptions?.answers?.[question] || ""}
              onChange={(e) =>
                setValue(`generalOptions.answers.${question}`, e.target.value)
              }
            />
          ))}
        </Box>
      )}
    </Paper>
  );
}

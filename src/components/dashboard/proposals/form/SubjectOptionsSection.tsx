// src/components/dashboard/proposals/form/SubjectOptionsSection.tsx

/**
 * SubjectOptionsSection
 * ---------------------
 * Renders for each subjectTitle:
 *   - instances[] with nested optionGroups/addons/answers per instance
 * Use nested useFieldArray calls for dynamic depth.
 */
import React from "react";
import { useFormContext, useFieldArray } from "react-hook-form";
import {
  Box,
  Typography,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Checkbox,
  FormControlLabel,
  IconButton,
  Divider,
} from "@mui/material";
import {
  ExpandMore as ExpandMoreIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
} from "@mui/icons-material";
import { ProposalFormValues } from "@/types/proposal";

export default function SubjectOptionsSection() {
  const { control, watch, setValue } = useFormContext<ProposalFormValues>();
  const listing = JSON.parse(sessionStorage.getItem("currentListing") || "{}");
  const subjectOptions = listing.subjectOptions || [];

  const watchedSubjectOptions = watch("subjectOptions") || {};

  if (!subjectOptions.length) {
    return null;
  }

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        Subject Options
      </Typography>

      {subjectOptions.map((subject: any) => (
        <SubjectSection
          key={subject.title}
          subject={subject}
          control={control}
          watch={watch}
          setValue={setValue}
          listing={listing}
          watchedSubjectOptions={watchedSubjectOptions}
        />
      ))}
    </Paper>
  );
}

function SubjectSection({
  subject,
  control,
  watch,
  setValue,
  listing,
  watchedSubjectOptions,
}: any) {
  const instancesFieldArrayName = `subjectOptions.${subject.title}.instances`;
  const { fields, append, remove } = useFieldArray({
    control,
    name: instancesFieldArrayName,
  });

  const watchedSubject = watchedSubjectOptions[subject.title] || {};
  const instances = watchedSubject.instances || [];

  const addInstance = () => {
    append({
      optionGroups: {},
      addons: {},
      answers: {},
    });
  };

  return (
    <Box sx={{ mb: 3 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
        }}
      >
        <Typography variant="subtitle1" fontWeight="bold">
          {subject.title}
        </Typography>
        <Button
          startIcon={<AddIcon />}
          size="small"
          onClick={addInstance}
          variant="outlined"
          disabled={subject.limit !== -1 && instances.length >= subject.limit}
        >
          Add {subject.title}
        </Button>
      </Box>

      {fields.map((instance, instanceIndex) => (
        <InstanceCard
          key={instance.id}
          instance={instance}
          instanceIndex={instanceIndex}
          subject={subject}
          onRemove={() => remove(instanceIndex)}
          control={control}
          watch={watch}
          setValue={setValue}
          listing={listing}
          instancesFieldArrayName={instancesFieldArrayName}
        />
      ))}

      {instances.length === 0 && (
        <Typography color="text.secondary" sx={{ textAlign: "center", py: 2 }}>
          No {subject.title.toLowerCase()} added yet
        </Typography>
      )}
    </Box>
  );
}

function InstanceCard({
  instanceIndex,
  subject,
  onRemove,
  control,
  watch,
  setValue,
  listing,
  instancesFieldArrayName,
}: any) {
  const watchedInstance =
    watch(`${instancesFieldArrayName}.${instanceIndex}`) || {};

  const handleOptionGroupChange = (
    groupTitle: string,
    selectedLabel: string
  ) => {
    const group = subject.optionGroups?.find(
      (g: any) => g.title === groupTitle
    );
    const selection = group?.selections.find(
      (s: any) => s.label === selectedLabel
    );

    if (selection) {
      setValue(
        `${instancesFieldArrayName}.${instanceIndex}.optionGroups.${groupTitle}`,
        {
          selectedLabel,
          price: selection.price,
        }
      );
    }
  };

  const handleAddonToggle = (addonLabel: string, checked: boolean) => {
    const addon = subject.addons?.find((a: any) => a.label === addonLabel);
    const currentAddons = watchedInstance?.addons || {};

    if (checked && addon) {
      setValue(`${instancesFieldArrayName}.${instanceIndex}.addons`, {
        ...currentAddons,
        [addonLabel]: addon.price,
      });
    } else {
      const { [addonLabel]: removed, ...rest } = currentAddons;
      setValue(`${instancesFieldArrayName}.${instanceIndex}.addons`, rest);
    }
  };

  return (
    <Accordion defaultExpanded sx={{ mb: 2 }}>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            width: "100%",
            pr: 1,
          }}
        >
          <Typography>
            {subject.title} #{instanceIndex + 1}
          </Typography>
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            sx={{ color: "error.main" }}
          >
            <DeleteIcon />
          </IconButton>
        </Box>
      </AccordionSummary>
      <AccordionDetails>
        {/* Option Groups */}
        {subject.optionGroups?.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" sx={{ mb: 2 }}>
              Select Options
            </Typography>
            {subject.optionGroups.map((group: any) => (
              <FormControl fullWidth key={group.title} sx={{ mb: 2 }}>
                <InputLabel>{group.title}</InputLabel>
                <Select
                  value={
                    watchedInstance?.optionGroups?.[group.title]
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
        {subject.addons?.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" sx={{ mb: 2 }}>
              Additional Services
            </Typography>
            {subject.addons.map((addon: any) => (
              <FormControlLabel
                key={addon.label}
                control={
                  <Checkbox
                    checked={!!watchedInstance?.addons?.[addon.label]}
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
        {subject.questions?.length > 0 && (
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 2 }}>
              Additional Information
            </Typography>
            <Divider sx={{ mb: 2 }} />
            {subject.questions.map((question: string, index: number) => (
              <TextField
                key={index}
                label={question}
                multiline
                rows={2}
                fullWidth
                sx={{ mb: 2 }}
                value={watchedInstance?.answers?.[question] || ""}
                onChange={(e) =>
                  setValue(
                    `${instancesFieldArrayName}.${instanceIndex}.answers.${question}`,
                    e.target.value
                  )
                }
              />
            ))}
          </Box>
        )}
      </AccordionDetails>
    </Accordion>
  );
}

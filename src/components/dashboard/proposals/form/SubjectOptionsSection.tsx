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
  Chip,
  Card,
  CardContent,
  Grid,
  Badge,
  Tooltip,
  FormHelperText,
} from "@mui/material";
import {
  ExpandMore as ExpandMoreIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
  Layers as LayersIcon,
  Info as InfoIcon,
} from "@mui/icons-material";
import { ProposalFormValues } from "@/types/proposal";
import { ICommissionListing } from "@/lib/db/models/commissionListing.model";
import { Cents } from "@/types/common";

interface SubjectOptionsSectionProps {
  listing: ICommissionListing;
}

export default function SubjectOptionsSection({
  listing,
}: SubjectOptionsSectionProps) {
  const {
    control,
    watch,
    setValue,
    formState: { errors },
  } = useFormContext<ProposalFormValues>();
  const subjectOptions = listing.subjectOptions || [];

  const watchedSubjectOptions = watch("subjectOptions") || {};

  if (!subjectOptions.length) {
    return null;
  }

  return (
    <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
      <Typography variant="h6" gutterBottom color="primary" fontWeight="medium">
        Subject Options
      </Typography>
      <Divider sx={{ mb: 3 }} />

      {subjectOptions.map((subject) => (
        <SubjectSection
          key={subject.title}
          subject={subject}
          control={control}
          watch={watch}
          setValue={setValue}
          listing={listing}
          watchedSubjectOptions={watchedSubjectOptions}
          errors={errors}
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
  errors,
}) {
  const instancesFieldArrayName = `subjectOptions.${subject.title}.instances`;
  const { fields, append, remove } = useFieldArray({
    control,
    name: instancesFieldArrayName,
  });

  const watchedSubject = watchedSubjectOptions[subject.title] || {};
  const instances = watchedSubject.instances || [];

  // Get icon based on subject title
  const getSubjectIcon = (title: string) => {
    const lowerTitle = title.toLowerCase();
    if (lowerTitle.includes("character")) return <PersonIcon />;
    if (lowerTitle.includes("background")) return <LayersIcon />;
    return null;
  };

  const addInstance = () => {
    append({
      optionGroups: {},
      addons: {},
      answers: {},
    });
  };

  // Calculate remaining slots
  const remainingSlots =
    subject.limit === -1
      ? "Unlimited"
      : `${subject.limit - instances.length} remaining`;

  return (
    <Box sx={{ mb: 4 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center" }}>
          {getSubjectIcon(subject.title)}
          <Typography variant="subtitle1" fontWeight="bold" sx={{ ml: 1 }}>
            {subject.title}
          </Typography>

          {subject.discount > 0 && (
            <Tooltip
              title={`Get ${
                subject.discount
              }% discount when adding multiple ${subject.title.toLowerCase()}s`}
            >
              <Chip
                icon={<InfoIcon />}
                label={`${subject.discount}% Multi-discount`}
                size="small"
                color="secondary"
                sx={{ ml: 2 }}
              />
            </Tooltip>
          )}
        </Box>

        <Box sx={{ display: "flex", alignItems: "center" }}>
          <Typography variant="body2" color="text.secondary" sx={{ mr: 2 }}>
            {remainingSlots}
          </Typography>

          <Button
            startIcon={<AddIcon />}
            size="small"
            onClick={addInstance}
            variant="contained"
            color="primary"
            disabled={subject.limit !== -1 && instances.length >= subject.limit}
          >
            Add {subject.title}
          </Button>
        </Box>
      </Box>

      {fields.map((instance, instanceIndex) => (
        <InstanceCard
          key={instance.id}
          instanceIndex={instanceIndex}
          subject={subject}
          onRemove={() => remove(instanceIndex)}
          control={control}
          watch={watch}
          setValue={setValue}
          listing={listing}
          instancesFieldArrayName={instancesFieldArrayName}
          errors={errors}
          totalInstances={fields.length}
        />
      ))}

      {instances.length === 0 && (
        <Card
          variant="outlined"
          sx={{ borderStyle: "dashed", backgroundColor: "background.default" }}
        >
          <CardContent sx={{ textAlign: "center", py: 4 }}>
            <Typography color="text.secondary" gutterBottom>
              No {subject.title.toLowerCase()} added yet
            </Typography>
            <Button
              startIcon={<AddIcon />}
              variant="outlined"
              color="primary"
              onClick={addInstance}
              sx={{ mt: 1 }}
            >
              Add {subject.title}
            </Button>
          </CardContent>
        </Card>
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
  errors,
  totalInstances,
}) {
  const watchedInstance =
    watch(`${instancesFieldArrayName}.${instanceIndex}`) || {};

  const hasErrors =
    !!errors?.subjectOptions?.[subject.title]?.instances?.[instanceIndex];

  const handleOptionGroupChange = (
    groupTitle: string,
    selectedLabel: string
  ) => {
    const group = subject.optionGroups?.find((g: {
      title: string; // e.g. "Copyright", "Commercial use", "NSFW"
      selections: { label: string; price: Cents }[]; // e.g. "Full rights", "Partial rights", "No rights"
    }) => g.title === groupTitle);

    if (!group) return;

    const selection = group.selections.find((s: { label: string; price: Cents }) => s.label === selectedLabel);

    if (selection) {
      setValue(
        `${instancesFieldArrayName}.${instanceIndex}.optionGroups.${groupTitle}`,
        {
          selectedLabel,
          price: selection.price,
        },
        { shouldValidate: true }
      );
    } else if (selectedLabel === "") {
      // Handle clearing the selection
      const currentOptionGroups = { ...watchedInstance?.optionGroups };
      delete currentOptionGroups[groupTitle];
      setValue(
        `${instancesFieldArrayName}.${instanceIndex}.optionGroups`,
        currentOptionGroups,
        { shouldValidate: true }
      );
    }
  };

  const handleAddonToggle = (addonLabel: string, checked: boolean) => {
    const addon = subject.addons?.find((a: { label: string; price: Cents }) => a.label === addonLabel);
    const currentAddons = watchedInstance?.addons || {};

    if (checked && addon) {
      setValue(
        `${instancesFieldArrayName}.${instanceIndex}.addons`,
        {
          ...currentAddons,
          [addonLabel]: addon.price,
        },
        { shouldValidate: true }
      );
    } else {
      const { [addonLabel]: removed, ...rest } = currentAddons;
      setValue(`${instancesFieldArrayName}.${instanceIndex}.addons`, rest, {
        shouldValidate: true,
      });
    }
  };

  const handleQuestionChange = (question: string, answer: string) => {
    setValue(
      `${instancesFieldArrayName}.${instanceIndex}.answers.${question}`,
      answer,
      { shouldValidate: true }
    );
  };

  return (
    <Accordion
      defaultExpanded={instanceIndex === 0 || totalInstances <= 2}
      sx={{
        mb: 2,
        boxShadow: hasErrors ? "0 0 0 2px #f44336" : "none",
        border: "1px solid",
        borderColor: hasErrors ? "error.main" : "divider",
        borderRadius: "8px !important",
        "&:before": {
          display: "none",
        },
      }}
    >
      <AccordionSummary
        expandIcon={<ExpandMoreIcon />}
        sx={{
          backgroundColor: hasErrors ? "error.lightest" : "background.default",
          borderRadius: "8px 8px 0 0",
        }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            width: "100%",
            pr: 1,
            alignItems: "center",
          }}
        >
          <Badge
            badgeContent={instanceIndex + 1}
            color="primary"
            sx={{ mr: 2 }}
          >
            {getSubjectIcon(subject.title)}
          </Badge>
          <Typography variant="subtitle2" sx={{ flexGrow: 1 }}>
            {subject.title} #{instanceIndex + 1}
            {hasErrors && (
              <Typography
                component="span"
                variant="caption"
                color="error"
                sx={{ ml: 1 }}
              >
                (has errors)
              </Typography>
            )}
          </Typography>
          <Tooltip title="Remove this item">
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
          </Tooltip>
        </Box>
      </AccordionSummary>
      <AccordionDetails sx={{ p: 3 }}>
        {/* Option Groups */}
        {subject.optionGroups?.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" sx={{ mb: 2 }} fontWeight="medium">
              Select Options
            </Typography>
            <Grid container spacing={2}>
              {subject.optionGroups.map((group: {
      title: string; // e.g. "Cropping"
      selections: { label: string; price: Cents }[]; // e.g. "Full body", "Half body", "Bust"
    }) => (
                <Grid item xs={12} md={6} key={group.title}>
                  <FormControl
                    fullWidth
                    error={
                      !!errors?.subjectOptions?.[subject.title]?.instances?.[
                        instanceIndex
                      ]?.optionGroups?.[group.title]
                    }
                  >
                    <InputLabel
                      id={`subject-option-${subject.title}-${instanceIndex}-${group.title}-label`}
                    >
                      {group.title}
                    </InputLabel>
                    <Select
                      labelId={`subject-option-${subject.title}-${instanceIndex}-${group.title}-label`}
                      id={`subject-option-${subject.title}-${instanceIndex}-${group.title}`}
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
                      {group.selections.map((selection) => (
                        <MenuItem key={selection.label} value={selection.label}>
                          {selection.label} - {listing.currency}{" "}
                          {selection.price.toLocaleString()}
                        </MenuItem>
                      ))}
                    </Select>
                    {errors?.subjectOptions?.[subject.title]?.instances?.[
                      instanceIndex
                    ]?.optionGroups?.[group.title] && (
                      <FormHelperText error>
                        This field is required
                      </FormHelperText>
                    )}
                  </FormControl>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

        {/* Addons */}
        {subject.addons?.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" sx={{ mb: 2 }} fontWeight="medium">
              Additional Services
            </Typography>
            <Card variant="outlined">
              <CardContent>
                <Grid container spacing={2}>
                  {subject.addons.map((addon: { label: string; price: Cents }) => (
                    <Grid item xs={12} md={6} key={addon.label}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={!!watchedInstance?.addons?.[addon.label]}
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
        {subject.questions?.length > 0 && (
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 2 }} fontWeight="medium">
              Additional Information
            </Typography>
            <Card variant="outlined">
              <CardContent>
                {subject.questions.map((question: string, index: number) => (
                  <TextField
                    key={index}
                    label={question}
                    multiline
                    rows={3}
                    fullWidth
                    sx={{ mb: index < subject.questions.length - 1 ? 3 : 0 }}
                    value={watchedInstance?.answers?.[question] || ""}
                    onChange={(e) =>
                      handleQuestionChange(question, e.target.value)
                    }
                    error={
                      !!errors?.subjectOptions?.[subject.title]?.instances?.[
                        instanceIndex
                      ]?.answers?.[question]
                    }
                    helperText={
                      errors?.subjectOptions?.[subject.title]?.instances?.[
                        instanceIndex
                      ]?.answers?.[question]?.message
                    }
                    placeholder="Your answer..."
                  />
                ))}
              </CardContent>
            </Card>
          </Box>
        )}
      </AccordionDetails>
    </Accordion>
  );
}

// Helper function to get icon based on subject title
function getSubjectIcon(title: string) {
  const lowerTitle = title.toLowerCase();
  if (lowerTitle.includes("character")) return <PersonIcon />;
  if (lowerTitle.includes("background")) return <LayersIcon />;
  return null;
}

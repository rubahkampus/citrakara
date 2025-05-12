// src/components/dashboard/contracts/tickets/form/SubjectOptionsSection.tsx

/**
 * SubjectOptionsSection for ChangeTicket
 * -------------------------------------
 * Renders subject options for the change ticket form
 * Allows users to modify existing subject instances or add new ones
 */
import React, { useCallback, useMemo, useEffect } from "react";
import { useFormContext, useFieldArray, useWatch } from "react-hook-form";
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
  Switch,
} from "@mui/material";
import {
  ExpandMore as ExpandMoreIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
  Layers as LayersIcon,
  Info as InfoIcon,
} from "@mui/icons-material";
import { IContract } from "@/lib/db/models/contract.model";
import { ChangeTicketFormValues } from "../ChangeTicketForm";

// Helper function to get icon based on subject title
const getSubjectIcon = (title: string) => {
  const lowerTitle = title.toLowerCase();
  if (lowerTitle.includes("character")) return <PersonIcon />;
  if (lowerTitle.includes("background")) return <LayersIcon />;
  return null;
};

// Helper function to calculate discounted price
const applyDiscount = (price: number, discount: number): number => {
  if (discount <= 0) return price;
  return Math.round(price * ((100 - discount) / 100));
};

interface SubjectOptionsSectionProps {
  contract: IContract;
  disabled: boolean;
}

export default function SubjectOptionsSection({
  contract,
  disabled,
}: SubjectOptionsSectionProps) {
  const {
    control,
    watch,
    setValue,
    getValues,
    formState: { errors },
  } = useFormContext<ChangeTicketFormValues>();

  // Get listing from contract
  const listing = contract.proposalSnapshot.listingSnapshot || {};

  // Get subjectOptions from listing
  const subjectOptions = listing.subjectOptions || [];

  // Get latest contract terms for initial values
  const latestTerms = contract.contractTerms[contract.contractTerms.length - 1];

  // Get current subject options from contract terms
  const currentSubjectOptions = latestTerms.subjectOptions || [];

  // Watch for form values
  const includeSubjectOptions = watch("includeSubjectOptions");

  // Safety check - if subject options are not allowed or no options exist, don't render
  if (
    !listing.changeable?.includes("subjectOptions") ||
    subjectOptions.length === 0
  ) {
    return null;
  }

  // Ensure includeSubjectOptions is initialized correctly based on contract data
  useEffect(() => {
    // Check if we have subject options in the contract
    const hasExistingSubjectOptions =
      currentSubjectOptions && currentSubjectOptions.length > 0;

    // Initialize the toggle state based on existing data
    if (hasExistingSubjectOptions) {
      setValue("includeSubjectOptions", false);
    } else {
      // Set to false if no existing subject options
      setValue("includeSubjectOptions", false);
    }
  }, [currentSubjectOptions, setValue]);

  // Toggle inclusion of subject options
  const handleIncludeSubjectOptions = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const newValue = e.target.checked;

    // Set the toggle value
    setValue("includeSubjectOptions", newValue);

    // Important: When toggling on, ensure the subjectOptions structure exists
    if (newValue) {
      // Get current subjectOptions
      const currentSubjectOptions = getValues("subjectOptions") || {};

      // Ensure each subject has an instances array
      subjectOptions.forEach((subject) => {
        if (!currentSubjectOptions[subject.id]) {
          currentSubjectOptions[subject.id] = { instances: [] };
        }
      });

      // Update the form
      setValue("subjectOptions", currentSubjectOptions);
    }
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
          Subject Options
        </Typography>
        <FormControlLabel
          control={
            <Switch
              checked={includeSubjectOptions}
              onChange={handleIncludeSubjectOptions}
              disabled={disabled}
            />
          }
          label="Include changes"
          sx={{ mr: 0 }}
        />
      </Box>
      <Divider sx={{ mb: 3 }} />

      {includeSubjectOptions ? (
        <>
          {subjectOptions.map((subject) => (
            <SubjectSection
              key={subject.id}
              subject={subject}
              control={control}
              setValue={setValue}
              getValues={getValues}
              listing={listing}
              errors={errors}
              currentSubjectOptions={currentSubjectOptions}
              disabled={disabled}
            />
          ))}
        </>
      ) : (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ fontStyle: "italic", mt: 2 }}
        >
          Switch the toggle to include changes to subject options.
        </Typography>
      )}
    </Paper>
  );
}

// SubjectSection component using useFieldArray for better form control
const SubjectSection = React.memo(
  ({
    subject,
    control,
    setValue,
    getValues,
    listing,
    errors,
    currentSubjectOptions,
    disabled,
  }: {
    subject: any;
    control: any;
    setValue: any;
    getValues: any;
    listing: any;
    errors: any;
    currentSubjectOptions: any[];
    disabled: boolean;
  }) => {
    const subjectId = subject.id;

    // Use direct path for fieldArray
    const fieldArrayName = `subjectOptions.${subjectId}.instances`;

    // Initialize form once with a ref to track initialization
    const isInitialized = React.useRef(false);

    // Use fieldArray for managing instances
    const { fields, append, remove } = useFieldArray({
      control,
      name: fieldArrayName,
    });

    // Find current subject options in contract terms
    const currentSubjectData = useMemo(() => {
      return currentSubjectOptions.find((s) => s.subjectId === subjectId);
    }, [currentSubjectOptions, subjectId]);

    // Create a default instance for this subject
    const createDefaultInstance = useCallback(
      (isDiscounted = false) => {
        const defaultOptionGroups: Record<string, any> = {};

        // Check if we already have values in the form
        const existingValues =
          getValues(`subjectOptions.${subjectId}`)?.instances?.[0]
            ?.optionGroups || {};

        subject.optionGroups?.forEach((group: any) => {
          // Check if we already have a selected value for this group
          const existingSelection = existingValues[group.id];

          if (existingSelection) {
            // Use existing selection if available
            const selection = group.selections.find(
              (s: any) => s.id === existingSelection.selectedId
            );
            if (selection) {
              // Apply discount if needed (for 2+ instances)
              const price =
                isDiscounted && subject.discount > 0
                  ? applyDiscount(selection.price, subject.discount)
                  : selection.price;

              defaultOptionGroups[group.id] = {
                selectedId: existingSelection.selectedId,
                selectedLabel: existingSelection.selectedLabel,
                price,
              };
              return;
            }
          }

          // Fall back to first option if no existing selection
          const first = group.selections?.[0];
          if (first) {
            // Apply discount if needed (for 2+ instances)
            const price =
              isDiscounted && subject.discount > 0
                ? applyDiscount(first.price, subject.discount)
                : first.price;

            // store both id & price
            defaultOptionGroups[group.id] = {
              selectedId: first.id,
              selectedLabel: first.label,
              price,
            };
          }
        });

        return {
          optionGroups: defaultOptionGroups,
          addons: {},
          answers: {},
        };
      },
      [subject, subjectId, getValues]
    );

    // Combined initialization effect that runs once
    useEffect(() => {
      // Check if the toggle is on before initializing
      const includeSubjectOptions = getValues("includeSubjectOptions");

      // Only initialize once - THIS IS THE KEY CHANGE
      // We need to initialize if not already initialized AND toggle is on
      if (isInitialized.current && !includeSubjectOptions) {
        return;
      }

      // If toggle is on but we're not initialized, proceed with initialization
      if (includeSubjectOptions && !isInitialized.current) {
        // Make sure subjectOptions exists
        const subjectOptions = getValues("subjectOptions") || {};

        // If subject has no instances, initialize with empty array
        if (!subjectOptions[subjectId]) {
          setValue(`subjectOptions.${subjectId}`, { instances: [] });
        }

        // If we have existing instances in current contract terms, initialize with those
        if (currentSubjectData && currentSubjectData.instances.length > 0) {
          // Convert the existing instances to the format expected by the form
          const initialInstances = currentSubjectData.instances.map(
            (instance: any) => {
              const formattedInstance: any = {
                optionGroups: {},
                addons: {},
                answers: {},
              };

              // Format option groups
              if (instance.optionGroups && instance.optionGroups.length > 0) {
                instance.optionGroups.forEach((group: any) => {
                  formattedInstance.optionGroups[group.groupId] = {
                    selectedId: group.selectedSelectionID,
                    selectedLabel: group.selectedSelectionLabel,
                    price: group.price,
                  };
                });
              }

              // Format addons
              if (instance.addons && instance.addons.length > 0) {
                instance.addons.forEach((addon: any) => {
                  formattedInstance.addons[addon.addonId] = addon.price;
                });
              }

              // Format answers
              if (instance.answers && instance.answers.length > 0) {
                instance.answers.forEach((answer: any) => {
                  formattedInstance.answers[answer.questionId] = answer.answer;
                });
              }

              return formattedInstance;
            }
          );

          // Clear existing instances and append the formatted ones
          setValue(`subjectOptions.${subjectId}`, { instances: [] });
          initialInstances.forEach((instance: any) => {
            append(instance);
          });
        } else if (fields.length === 0 && subject.limit !== 0) {
          // If no existing instances and limit is not 0, add a default instance
          append(createDefaultInstance(false));
        }

        // Mark as initialized to prevent duplicate initialization
        isInitialized.current = true;
      }

      // If toggle was on but now off, reset initialization flag
      if (!includeSubjectOptions && isInitialized.current) {
        isInitialized.current = false;
      }
    }, [
      subjectId,
      setValue,
      getValues,
      fields.length,
      append,
      createDefaultInstance,
      subject.limit,
      currentSubjectData,
    ]);
    // Add another instance
    const addInstance = useCallback(() => {
      append(createDefaultInstance(fields.length > 0));
    }, [append, createDefaultInstance, fields.length]);

    // Calculate remaining slots
    const remainingSlots = useMemo(
      () =>
        subject.limit === -1
          ? "Unlimited"
          : `${subject.limit - fields.length} remaining`,
      [subject.limit, fields.length]
    );

    // If subject limit is exactly 1, we don't need the add button and UI for multiple
    const isSingleInstanceOnly = subject.limit === 1;

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

            {subject.discount > 0 && !isSingleInstanceOnly && (
              <Tooltip
                title={`Get ${
                  subject.discount
                }% discount on additional ${subject.title.toLowerCase()}s (starting from the second one)`}
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

          {!isSingleInstanceOnly && (
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
                disabled={
                  disabled ||
                  (subject.limit !== -1 && fields.length >= subject.limit)
                }
              >
                Add {subject.title}
              </Button>
            </Box>
          )}
        </Box>

        {fields.map((field, index) => (
          <InstanceCard
            key={field.id} // Use field.id from useFieldArray for stable keys
            instanceIndex={index}
            subject={subject}
            control={control}
            setValue={setValue}
            getValues={getValues}
            onRemove={() => remove(index)}
            listing={listing}
            subjectId={subjectId}
            errors={errors}
            totalInstances={fields.length}
            isDiscountApplicable={index > 0}
            showRemoveButton={!isSingleInstanceOnly || fields.length > 1} // Show for non-single instance subjects or when we have more than 1
            disabled={disabled}
          />
        ))}

        {fields.length === 0 && (
          <Card
            variant="outlined"
            sx={{
              borderStyle: "dashed",
              backgroundColor: "background.default",
            }}
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
                disabled={disabled}
              >
                Add {subject.title}
              </Button>
            </CardContent>
          </Card>
        )}
      </Box>
    );
  }
);

// Memoize InstanceCard to prevent unnecessary re-renders
const InstanceCard = React.memo(
  ({
    instanceIndex,
    subject,
    control,
    setValue,
    getValues,
    onRemove,
    listing,
    subjectId,
    errors,
    totalInstances,
    isDiscountApplicable,
    showRemoveButton = true,
    disabled,
  }: {
    instanceIndex: number;
    subject: any;
    control: any;
    setValue: any;
    getValues: any;
    onRemove: () => void;
    listing: any;
    subjectId: string | number;
    errors: any;
    totalInstances: number;
    isDiscountApplicable: boolean;
    showRemoveButton?: boolean;
    disabled: boolean;
  }) => {
    // Path to this instance in the form
    const instancePath = `subjectOptions.${subjectId}.instances.${instanceIndex}`;

    // Check for errors in this instance
    const hasErrors =
      !!errors?.subjectOptions?.[subjectId]?.instances?.[instanceIndex];

    // Get current instance data
    const watchedInstance = useWatch({
      control,
      name: instancePath,
      defaultValue: {
        optionGroups: {},
        addons: {},
        answers: {},
      },
    });

    // Memoize the discount factor to prevent recalculations
    const discountFactor = useMemo(
      () =>
        isDiscountApplicable && subject.discount > 0
          ? (100 - subject.discount) / 100
          : 1.0,
      [isDiscountApplicable, subject.discount]
    );

    // Memoize functions that don't need to be recreated on every render
    const displayPrice = useCallback(
      (basePrice: number) => {
        if (isDiscountApplicable && subject.discount > 0) {
          const discountedPrice = Math.round(basePrice * discountFactor);
          return (
            <>
              <Typography
                component="span"
                sx={{
                  textDecoration: "line-through",
                  color: "text.secondary",
                  fontSize: "0.85em",
                  mr: 1,
                }}
              >
                {listing.currency} {basePrice.toLocaleString()}
              </Typography>
              <Typography component="span" color="secondary.main">
                {listing.currency} {discountedPrice.toLocaleString()}
              </Typography>
            </>
          );
        }
        return (
          <>
            {listing.currency} {basePrice.toLocaleString()}
          </>
        );
      },
      [isDiscountApplicable, subject.discount, discountFactor, listing.currency]
    );

    const handleOptionGroupChange = useCallback(
      (
        groupId: number,
        groupTitle: string,
        selectedId: number,
        selectedLabel: string
      ) => {
        // Find the group in the subject
        const group = subject.optionGroups?.find((g: any) => g.id === groupId);
        if (!group) return;

        // Find the selection in the group
        const selection = group.selections.find(
          (s: any) => s.id === selectedId
        );

        if (!selection) return;

        // Apply discount if applicable
        const finalPrice =
          isDiscountApplicable && subject.discount > 0
            ? Math.round(selection.price * discountFactor)
            : selection.price;

        // Update the option group in the form
        setValue(
          `${instancePath}.optionGroups.${groupId}`,
          {
            selectedId,
            selectedLabel: selectedLabel,
            price: finalPrice,
          },
          { shouldValidate: true, shouldDirty: true } // Added shouldDirty: true
        );

        // Force update to ensure UI reflects the change immediately
        setTimeout(() => {
          // This will cause a re-render
          const currentValue = getValues(
            `${instancePath}.optionGroups.${groupId}`
          );
          setValue(
            `${instancePath}.optionGroups.${groupId}`,
            {
              ...currentValue,
            },
            { shouldValidate: false }
          );
        }, 0);
      },
      [
        subject.optionGroups,
        instancePath,
        setValue,
        isDiscountApplicable,
        subject.discount,
        discountFactor,
        getValues, // Added getValues to dependencies
      ]
    );

    const handleAddonToggle = useCallback(
      (addonId: number, checked: boolean) => {
        // Find the addon in the subject
        const addon = subject.addons?.find((a: any) => a.id === addonId);
        if (!addon) return;

        // Apply discount if applicable
        const finalPrice =
          isDiscountApplicable && subject.discount > 0
            ? Math.round(addon.price * discountFactor)
            : addon.price;

        if (checked) {
          // Add the addon with shouldDirty: true
          setValue(`${instancePath}.addons.${addonId}`, finalPrice, {
            shouldValidate: true,
            shouldDirty: true,
          });
        } else {
          // Get the current addons from the watched value
          const currentAddons = { ...watchedInstance.addons };
          delete currentAddons[addonId];

          // Remove the addon with shouldDirty: true
          setValue(`${instancePath}.addons`, currentAddons, {
            shouldValidate: true,
            shouldDirty: true,
          });
        }
      },
      [
        subject.addons,
        instancePath,
        setValue,
        watchedInstance.addons, // Use watched value instead of getValues
        isDiscountApplicable,
        subject.discount,
        discountFactor,
      ]
    );

    // Helper to check if an addon is selected - now uses watchedInstance
    const isAddonSelected = useCallback(
      (addonId: number) => {
        return !!watchedInstance.addons?.[addonId];
      },
      [watchedInstance.addons]
    );

    // Handle question answers
    const handleQuestionChange = useCallback(
      (questionId: string, value: string) => {
        setValue(`${instancePath}.answers.${questionId}`, value, {
          shouldValidate: true,
          shouldDirty: true,
        });
      },
      [instancePath, setValue]
    );

    // Get answer for a specific question - now uses watchedInstance
    const getQuestionAnswer = useCallback(
      (questionId: number) => {
        return watchedInstance.answers?.[questionId] || "";
      },
      [watchedInstance.answers]
    );

    return (
      <Accordion
        defaultExpanded={instanceIndex === 0 || totalInstances <= 2}
        sx={{
          mb: 2,
          position: "relative",
          boxShadow: hasErrors ? "0 0 0 2px #f44336" : "none",
          border: "1px solid",
          borderColor: hasErrors ? "error.main" : "divider",
          borderRadius: "8px !important",
          "&:before": {
            display: "none",
          },
        }}
        disabled={disabled}
      >
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          sx={{
            backgroundColor: hasErrors
              ? "error.lightest"
              : "background.default",
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
              {isDiscountApplicable && subject.discount > 0 && (
                <Chip
                  label={`${subject.discount}% off`}
                  color="secondary"
                  size="small"
                  sx={{ ml: 1 }}
                />
              )}
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
          </Box>
        </AccordionSummary>
        {/* Only show remove button if showRemoveButton is true and not disabled */}
        {showRemoveButton && !disabled && (
          <Box
            sx={{ position: "absolute", top: "12px", right: "40px", zIndex: 1 }}
          >
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
        )}
        <AccordionDetails sx={{ p: 3 }}>
          {/* Option Groups */}
          {subject.optionGroups?.length > 0 && (
            <Box sx={{ mb: 3 }}>
              <Typography
                variant="subtitle2"
                sx={{ mb: 2 }}
                fontWeight="medium"
              >
                Select Options
              </Typography>
              <Grid container spacing={2}>
                {subject.optionGroups.map(
                  (group: {
                    id: number;
                    title: string;
                    selections: { id: number; label: string; price: number }[];
                  }) => (
                    <Grid item xs={12} md={12} key={group.title}>
                      <FormControl
                        fullWidth
                        error={
                          !!errors?.subjectOptions?.[subjectId]?.instances?.[
                            instanceIndex
                          ]?.optionGroups?.[group.title]
                        }
                        disabled={disabled}
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
                            watchedInstance?.optionGroups?.[group.id]
                              ?.selectedId ?? ""
                          }
                          label={group.title}
                          onChange={(e) => {
                            const selectedId = Number(e.target.value);
                            const selectedLabel =
                              group.selections.find(
                                (selection) => selection.id === selectedId
                              )?.label || "";

                            handleOptionGroupChange(
                              group.id,
                              group.title,
                              selectedId,
                              String(selectedLabel)
                            );
                          }}
                        >
                          {group.selections.map((selection) => (
                            <MenuItem
                              key={Number(selection.id)}
                              value={Number(selection.id)}
                            >
                              {selection.label} -{" "}
                              {isDiscountApplicable && subject.discount > 0
                                ? displayPrice(Number(selection.price))
                                : `${
                                    listing.currency
                                  } ${selection.price.toLocaleString()}`}
                            </MenuItem>
                          ))}
                        </Select>
                        {/* ... Error handling (unchanged) ... */}
                      </FormControl>
                    </Grid>
                  )
                )}
              </Grid>
            </Box>
          )}

          {/* Addons - using watchedInstance for checked state */}
          {subject.addons?.length > 0 && (
            <Box sx={{ mb: 3 }}>
              <Typography
                variant="subtitle2"
                sx={{ mb: 2 }}
                fontWeight="medium"
              >
                Additional Services
              </Typography>

              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  border: "1px solid",
                  borderColor: "grey.300",
                  borderRadius: 2,
                  padding: 1,
                }}
              >
                {subject.addons.map(
                  (addon: { id: number; label: string; price: number }) => (
                    <FormControlLabel
                      key={Number(addon.id)}
                      control={
                        <Checkbox
                          checked={isAddonSelected(Number(addon.id))}
                          onChange={(e) =>
                            handleAddonToggle(
                              Number(addon.id),
                              e.target.checked
                            )
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
                            {isDiscountApplicable && subject.discount > 0
                              ? displayPrice(Number(addon.price))
                              : `${
                                  listing.currency
                                } ${addon.price.toLocaleString()}`}
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
                  )
                )}
              </Box>
            </Box>
          )}

          {/* Questions */}
          {subject.questions?.length > 0 && (
            <Box>
              <Typography
                variant="subtitle2"
                sx={{ mb: 2 }}
                fontWeight="medium"
              >
                Additional Information
              </Typography>
              <Card variant="outlined">
                <CardContent>
                  {subject.questions.map(
                    (
                      questionObj: { id: number; text: string },
                      idx: number
                    ) => (
                      <QuestionField
                        key={questionObj.id}
                        question={questionObj.text}
                        value={getQuestionAnswer(Number(questionObj.id))}
                        onChange={(value) =>
                          handleQuestionChange(String(questionObj.id), value)
                        }
                        error={!!hasErrors}
                        isLastQuestion={idx === subject.questions.length - 1}
                        disabled={disabled}
                      />
                    )
                  )}
                </CardContent>
              </Card>
            </Box>
          )}
        </AccordionDetails>
      </Accordion>
    );
  }
);

// Isolated component for question field to prevent rerender issues
const QuestionField = React.memo(
  ({
    question,
    value,
    onChange,
    error,
    isLastQuestion,
    disabled,
  }: {
    question: string;
    value: string;
    onChange: (value: string) => void;
    error?: boolean;
    isLastQuestion: boolean;
    disabled: boolean;
  }) => {
    // Use uncontrolled input pattern with refs for performance
    const inputRef = React.useRef<HTMLInputElement | null>(null);

    // Set initial value when mounted or value changes
    React.useEffect(() => {
      if (inputRef.current && inputRef.current.value !== value) {
        inputRef.current.value = value;
      }
    }, [value]);

    // Handle input changes with debounce
    const debouncedChange = React.useCallback(
      (function () {
        let timer: NodeJS.Timeout | null = null;
        return function () {
          if (timer) clearTimeout(timer);
          timer = setTimeout(() => {
            if (inputRef.current) {
              onChange(inputRef.current.value);
            }
          }, 300);
        };
      })(),
      [onChange]
    );

    return (
      <TextField
        inputRef={inputRef}
        label={question}
        multiline
        rows={2}
        fullWidth
        sx={{ mb: isLastQuestion ? 0 : 3 }}
        defaultValue={value}
        onInput={debouncedChange}
        onBlur={() => {
          if (inputRef.current) {
            onChange(inputRef.current.value);
          }
        }}
        error={error}
        placeholder="Your answer..."
        disabled={disabled}
      />
    );
  }
);

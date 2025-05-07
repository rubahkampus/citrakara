// src/components/dashboard/proposals/form/SubjectOptionsSection.tsx

/**
 * SubjectOptionsSection
 * ---------------------
 * Renders for each subjectTitle:
 *   - instances[] with nested optionGroups/addons/answers per instance
 * Use nested useFieldArray calls for dynamic depth.
 *
 * Fixed multi-discount logic to not apply to the first subject
 * PERFORMANCE OPTIMIZATIONS:
 * - Added memoization to prevent unnecessary re-renders
 * - Fixed form field handling for multiple questions
 * - Improved validation strategy
 * - Optimized state management
 */
import React, { useCallback, useMemo } from "react";
import { useFormContext, useWatch, Controller } from "react-hook-form";
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
import {
  ProposalFormValues,
  GeneralOptionGroupInput,
  SubjectInstanceInput,
} from "@/types/proposal";
import { ICommissionListing } from "@/lib/db/models/commissionListing.model";
import { Cents } from "@/types/common";

interface SubjectOptionsSectionProps {
  listing: ICommissionListing;
}

// Helper function to get icon based on subject title
const getSubjectIcon = (title: string) => {
  const lowerTitle = title.toLowerCase();
  if (lowerTitle.includes("character")) return <PersonIcon />;
  if (lowerTitle.includes("background")) return <LayersIcon />;
  return null;
};

// Helper function to calculate discounted price
const applyDiscount = (price: Cents, discount: number): Cents => {
  if (discount <= 0) return price;
  return Math.round(price * ((100 - discount) / 100));
};

export default function SubjectOptionsSection({
  listing,
}: SubjectOptionsSectionProps) {
  const {
    control,
    watch,
    setValue,
    formState: { errors },
  } = useFormContext<ProposalFormValues>();

  // Memoize subjectOptions to avoid unnecessary recalculations
  const subjectOptions = useMemo(
    () => listing.subjectOptions || [],
    [listing.subjectOptions]
  );

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

// Memoize SubjectSection to prevent unnecessary re-renders
const SubjectSection = React.memo(
  ({
    subject,
    control,
    watch,
    setValue,
    listing,
    watchedSubjectOptions,
    errors,
  }: {
    subject: any;
    control: any;
    watch: any;
    setValue: any;
    listing: ICommissionListing;
    watchedSubjectOptions: any;
    errors: any;
  }) => {
    const subjectTitle = subject.title;

    // FIX 1: Use a ref to track if we've already initialized to prevent double initialization
    const initializedRef = React.useRef(false);

    // Check if we have any existing data in edit mode before initializing
    const existingInstances =
      watchedSubjectOptions[subjectTitle]?.instances || [];
    const hasExistingData = existingInstances.length > 0;

    React.useEffect(() => {
      // Only initialize if we haven't already AND there are no fields AND no existing data
      if (!initializedRef.current && !hasExistingData) {
        initializedRef.current = true;

        // Create initial default options
        const defaultOptionGroups: Record<string, GeneralOptionGroupInput> = {};

        subject.optionGroups?.forEach((group: any) => {
          const first = group.selections?.[0];
          if (first) {
            defaultOptionGroups[group.title] = {
              selectedLabel: first.label,
              price: first.price,
            };
          }
        });

        // Create the first instance
        const initialInstance: SubjectInstanceInput = {
          optionGroups: defaultOptionGroups,
          addons: {},
          answers: {},
        };

        // Initialize with one instance
        setValue(`subjectOptions.${subjectTitle}`, {
          instances: [initialInstance],
        });
      }
    }, [setValue, subject, subjectTitle, hasExistingData]);

    // Get the current instances for this subject
    const watchedInstances =
      watchedSubjectOptions[subjectTitle]?.instances || [];

    // FIX 2: Improve addInstance to initialize with discounted prices for subsequent instances
    const addInstance = useCallback(() => {
      // Create new instance with pre-calculated discounted prices for options
      const newInstanceOptionGroups: Record<string, GeneralOptionGroupInput> =
        {};

      subject.optionGroups?.forEach((group: any) => {
        const first = group.selections?.[0];
        if (first) {
          // Apply discount for 2+ instances
          const price =
            watchedInstances.length > 0 && subject.discount > 0
              ? applyDiscount(first.price, subject.discount)
              : first.price;

          newInstanceOptionGroups[group.title] = {
            selectedLabel: first.label,
            price,
          };
        }
      });

      // Add the new instance
      const updatedInstances = [
        ...(watchedInstances || []),
        {
          optionGroups: newInstanceOptionGroups,
          addons: {},
          answers: {},
        },
      ];

      setValue(`subjectOptions.${subjectTitle}`, {
        instances: updatedInstances,
      });
    }, [setValue, subject, subjectTitle, watchedInstances]);

    // Calculate remaining slots
    const remainingSlots = useMemo(
      () =>
        subject.limit === -1
          ? "Unlimited"
          : `${subject.limit - watchedInstances.length} remaining`,
      [subject.limit, watchedInstances.length]
    );

    // Handle instance removal
    const handleRemoveInstance = (instanceIndex: number) => {
      const updatedInstances = [...watchedInstances];
      updatedInstances.splice(instanceIndex, 1);

      if (updatedInstances.length === 0) {
        // If no instances left, remove the whole subject entry
        const { [subjectTitle]: removed, ...rest } = watchedSubjectOptions;
        setValue("subjectOptions", rest);
      } else {
        // Otherwise update with remaining instances
        setValue(`subjectOptions.${subjectTitle}.instances`, updatedInstances);
      }
    };

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
                subject.limit !== -1 && watchedInstances.length >= subject.limit
              }
            >
              Add {subject.title}
            </Button>
          </Box>
        </Box>

        {watchedInstances.map((instance: any, instanceIndex: number) => (
          <InstanceCard
            key={`${subjectTitle}-${instanceIndex}`}
            instanceIndex={instanceIndex}
            subject={subject}
            instance={instance}
            onRemove={() => handleRemoveInstance(instanceIndex)}
            control={control}
            setValue={setValue}
            listing={listing}
            subjectTitle={subjectTitle}
            errors={errors}
            totalInstances={watchedInstances.length}
            isDiscountApplicable={instanceIndex > 0}
          />
        ))}

        {watchedInstances.length === 0 && (
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
    instance,
    onRemove,
    control,
    setValue,
    listing,
    subjectTitle,
    errors,
    totalInstances,
    isDiscountApplicable,
  }: {
    instanceIndex: number;
    subject: any;
    instance: any;
    onRemove: () => void;
    control: any;
    setValue: any;
    listing: ICommissionListing;
    subjectTitle: string;
    errors: any;
    totalInstances: number;
    isDiscountApplicable: boolean;
  }) => {
    // Path to this instance in the form
    const instancePath = `subjectOptions.${subjectTitle}.instances.${instanceIndex}`;

    // Check for errors in this instance
    const hasErrors =
      !!errors?.subjectOptions?.[subjectTitle]?.instances?.[instanceIndex];

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
      (basePrice: Cents) => {
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
        return `${listing.currency} ${basePrice.toLocaleString()}`;
      },
      [isDiscountApplicable, subject.discount, discountFactor, listing.currency]
    );

    const handleOptionGroupChange = useCallback(
      (groupTitle: string, selectedLabel: string) => {
        // Find the group in the subject
        const group = subject.optionGroups?.find(
          (g: any) => g.title === groupTitle
        );
        if (!group) return;

        // Find the selection in the group
        const selection = group.selections.find(
          (s: any) => s.label === selectedLabel
        );

        if (!selection) return;

        // Apply discount if applicable
        const finalPrice =
          isDiscountApplicable && subject.discount > 0
            ? Math.round(selection.price * discountFactor)
            : selection.price;

        // Update the option group in the form
        setValue(
          `${instancePath}.optionGroups.${groupTitle}`,
          {
            selectedLabel,
            price: finalPrice,
          },
          { shouldValidate: true }
        );
      },
      [
        subject.optionGroups,
        instancePath,
        setValue,
        isDiscountApplicable,
        subject.discount,
        discountFactor,
      ]
    );

    const handleAddonToggle = useCallback(
      (addonLabel: string, checked: boolean) => {
        // Find the addon in the subject
        const addon = subject.addons?.find((a: any) => a.label === addonLabel);
        if (!addon) return;

        // Apply discount if applicable
        const finalPrice =
          isDiscountApplicable && subject.discount > 0
            ? Math.round(addon.price * discountFactor)
            : addon.price;

        if (checked) {
          // Add the addon
          setValue(`${instancePath}.addons.${addonLabel}`, finalPrice, {
            shouldValidate: true,
          });
        } else {
          // Remove the addon
          const currentAddons = { ...instance.addons };
          delete currentAddons[addonLabel];
          setValue(`${instancePath}.addons`, currentAddons, {
            shouldValidate: true,
          });
        }
      },
      [
        subject.addons,
        instancePath,
        setValue,
        instance.addons,
        isDiscountApplicable,
        subject.discount,
        discountFactor,
      ]
    );

    // Helper to check if an addon is selected
    const isAddonSelected = (addonLabel: string) => {
      return !!instance.addons?.[addonLabel];
    };

    // Handle question answers
    const handleQuestionChange = useCallback(
      (question: string, value: string) => {
        setValue(`${instancePath}.answers.${question}`, value, {
          shouldValidate: true,
        });
      },
      [instancePath, setValue]
    );

    // Get answer for a specific question
    const getQuestionAnswer = (question: string) => {
      return instance.answers?.[question] || "";
    };

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
                    title: string;
                    selections: { label: string; price: Cents }[];
                  }) => (
                    <Grid item xs={12} md={12} key={group.title}>
                      <FormControl
                        fullWidth
                        error={
                          !!errors?.subjectOptions?.[subjectTitle]?.instances?.[
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
                            instance?.optionGroups?.[group.title]
                              ?.selectedLabel || ""
                          }
                          label={group.title}
                          onChange={(e) =>
                            handleOptionGroupChange(group.title, e.target.value)
                          }
                        >
                          {group.selections.map((selection) => (
                            <MenuItem
                              key={selection.label}
                              value={selection.label}
                            >
                              {selection.label} -{" "}
                              {isDiscountApplicable && subject.discount > 0
                                ? displayPrice(selection.price)
                                : `${
                                    listing.currency
                                  } ${selection.price.toLocaleString()}`}
                            </MenuItem>
                          ))}
                        </Select>
                        {errors?.subjectOptions?.[subjectTitle]?.instances?.[
                          instanceIndex
                        ]?.optionGroups?.[group.title] && (
                          <FormHelperText error>
                            This field is required
                          </FormHelperText>
                        )}
                      </FormControl>
                    </Grid>
                  )
                )}
              </Grid>
            </Box>
          )}

          {/* Addons */}
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
                  (addon: { label: string; price: Cents }) => (
                    <FormControlLabel
                      key={addon.label}
                      control={
                        <Checkbox
                          checked={isAddonSelected(addon.label)}
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
                            {isDiscountApplicable && subject.discount > 0
                              ? displayPrice(addon.price)
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
                  {subject.questions.map((question: any, index: number) => (
                    <QuestionField
                      key={question}
                      question={question}
                      value={getQuestionAnswer(question)}
                      onChange={(value) =>
                        handleQuestionChange(question, value)
                      }
                      error={!!hasErrors}
                      isLastQuestion={index === subject.questions.length - 1}
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
);

// Isolated component for question field to prevent rerender issues
const QuestionField = React.memo(
  ({
    question,
    value,
    onChange,
    error,
    isLastQuestion,
  }: {
    question: string;
    value: string;
    onChange: (value: string) => void;
    error?: boolean;
    isLastQuestion: boolean;
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
      />
    );
  }
);

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
import {
  useFormContext,
  useFieldArray,
  UseFormSetValue,
  useWatch,
  Controller,
} from "react-hook-form";
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

// Helper function to get icon based on subject title
const getSubjectIcon = (title: string) => {
  const lowerTitle = title.toLowerCase();
  if (lowerTitle.includes("character")) return <PersonIcon />;
  if (lowerTitle.includes("background")) return <LayersIcon />;
  return null;
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
    setValue: UseFormSetValue<ProposalFormValues>;
    listing: ICommissionListing;
    watchedSubjectOptions: any;
    errors: any;
  }) => {
    const instancesFieldArrayName = `subjectOptions.${subject.title}.instances`;
    const { fields, append, remove } = useFieldArray({
      control,
      name: instancesFieldArrayName,
    });

    // Fix: Add fields.length to dependencies array to prevent infinite loops
    React.useEffect(() => {
      if (fields.length === 0) {
        const defaultOptionGroups: Record<string, any> = {};

        subject.optionGroups?.forEach((group: any) => {
          const first = group.selections?.[0];
          if (first) {
            defaultOptionGroups[group.title] = {
              selectedLabel: first.label,
              price: first.price,
              originalPrice: first.price,
            };
          }
        });

        append({
          optionGroups: defaultOptionGroups,
          addons: {},
          answers: {},
        });
      }
    }, [fields.length, append, subject.optionGroups]);

    const watchedSubject = watchedSubjectOptions[subject.title] || {};
    const instances = watchedSubject.instances || [];

    const addInstance = useCallback(() => {
      append({
        optionGroups: {},
        addons: {},
        answers: {},
      });
    }, [append]);

    // Calculate remaining slots using fields.length
    const remainingSlots = useMemo(
      () =>
        subject.limit === -1
          ? "Unlimited"
          : `${subject.limit - fields.length} remaining`,
      [subject.limit, fields.length]
    );

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
              disabled={subject.limit !== -1 && fields.length >= subject.limit}
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
            setValue={setValue}
            listing={listing}
            instancesFieldArrayName={instancesFieldArrayName}
            errors={errors}
            totalInstances={fields.length}
            isDiscountApplicable={instanceIndex > 0}
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
    onRemove,
    control,
    setValue,
    listing,
    instancesFieldArrayName,
    errors,
    totalInstances,
    isDiscountApplicable,
  }: {
    instanceIndex: number;
    subject: any;
    onRemove: () => void;
    control: any;
    setValue: any;
    listing: ICommissionListing;
    instancesFieldArrayName: string;
    errors: any;
    totalInstances: number;
    isDiscountApplicable: boolean;
  }) => {
    // Use useWatch with selective watching to reduce re-renders
    const instance = useWatch({
      control,
      name: `${instancesFieldArrayName}.${instanceIndex}`,
      defaultValue: { optionGroups: {}, addons: {}, answers: {} },
    });

    const hasErrors =
      !!errors?.subjectOptions?.[subject.title]?.instances?.[instanceIndex];

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
        const group = subject.optionGroups?.find(
          (g: {
            title: string;
            selections: { label: string; price: Cents }[];
          }) => g.title === groupTitle
        );

        if (!group) return;

        if (selectedLabel === "") {
          // Handle clearing the selection
          const currentOptionGroups = { ...instance.optionGroups };
          delete currentOptionGroups[groupTitle];
          setValue(
            `${instancesFieldArrayName}.${instanceIndex}.optionGroups`,
            currentOptionGroups,
            { shouldValidate: true }
          );
          return;
        }

        const selection = group.selections.find(
          (s: { label: string; price: Cents }) => s.label === selectedLabel
        );

        if (selection) {
          // Apply discount if applicable
          const finalPrice =
            isDiscountApplicable && subject.discount > 0
              ? Math.round(selection.price * discountFactor)
              : selection.price;

          setValue(
            `${instancesFieldArrayName}.${instanceIndex}.optionGroups.${groupTitle}`,
            {
              selectedLabel,
              price: finalPrice,
              originalPrice: selection.price, // Store original price for reference
            },
            { shouldValidate: true }
          );
        }
      },
      [
        subject.optionGroups,
        instance.optionGroups,
        instancesFieldArrayName,
        instanceIndex,
        setValue,
        isDiscountApplicable,
        subject.discount,
        discountFactor,
      ]
    );

    const handleAddonToggle = useCallback(
      (addonLabel: string, checked: boolean) => {
        const addon = subject.addons?.find(
          (a: { label: string; price: Cents }) => a.label === addonLabel
        );
        const currentAddons = instance.addons || {};

        if (checked && addon) {
          // Apply discount if applicable
          const finalPrice =
            isDiscountApplicable && subject.discount > 0
              ? Math.round(addon.price * discountFactor)
              : addon.price;

          setValue(
            `${instancesFieldArrayName}.${instanceIndex}.addons`,
            {
              ...currentAddons,
              [addonLabel]: {
                price: finalPrice,
                originalPrice: addon.price, // Store original price for reference
              },
            },
            { shouldValidate: true }
          );
        } else {
          const { [addonLabel]: removed, ...rest } = currentAddons;
          setValue(`${instancesFieldArrayName}.${instanceIndex}.addons`, rest, {
            shouldValidate: true,
          });
        }
      },
      [
        subject.addons,
        instance.addons,
        instancesFieldArrayName,
        instanceIndex,
        setValue,
        isDiscountApplicable,
        subject.discount,
        discountFactor,
      ]
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
                          !!errors?.subjectOptions?.[subject.title]
                            ?.instances?.[instanceIndex]?.optionGroups?.[
                            group.title
                          ]
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
                              ?.selectedLabel ||
                            (group.selections.length > 0
                              ? group.selections[0].label
                              : "")
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
                        {errors?.subjectOptions?.[subject.title]?.instances?.[
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
                          checked={!!instance?.addons?.[addon.label]}
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

          {/* Questions - Uncontrolled input approach for first question fix */}
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
                  {subject.questions.map((question: string, index: number) => {
                    // Create separate QuestionField component to isolate each input
                    return (
                      <QuestionField
                        key={`question-${subject.title}-${instanceIndex}-${question}-${index}`}
                        question={question}
                        instancesFieldArrayName={instancesFieldArrayName}
                        instanceIndex={instanceIndex}
                        subject={subject}
                        instance={instance}
                        setValue={setValue}
                        errors={errors}
                        isLastQuestion={index === subject.questions.length - 1}
                      />
                    );
                  })}
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
    instancesFieldArrayName,
    instanceIndex,
    subject,
    instance,
    setValue,
    errors,
    isLastQuestion,
  }: {
    question: string;
    instancesFieldArrayName: string;
    instanceIndex: number;
    subject: any;
    instance: any;
    setValue: any;
    errors: any;
    isLastQuestion: boolean;
  }) => {
    // Use uncontrolled input pattern with refs
    const inputRef = React.useRef<HTMLInputElement | null>(null);

    // Get field path and current value
    const fieldPath = `${instancesFieldArrayName}.${instanceIndex}.answers.${question}`;
    const currentValue = instance?.answers?.[question] || "";

    // Set field error state
    const fieldError =
      errors?.subjectOptions?.[subject.title]?.instances?.[instanceIndex]
        ?.answers?.[question];

    // Set initial value when mounted or value changes
    React.useEffect(() => {
      if (inputRef.current && inputRef.current.value !== currentValue) {
        inputRef.current.value = currentValue;
      }
    }, [currentValue]);

    // Handle input changes - direct manipulation approach
    const handleInputChange = () => {
      if (inputRef.current) {
        // Use requestAnimationFrame to ensure we're outside React's rendering cycle
        requestAnimationFrame(() => {
          setValue(fieldPath, inputRef.current?.value || "", {
            shouldDirty: true,
            shouldValidate: false,
          });
        });
      }
    };

    return (
      <TextField
        inputRef={inputRef}
        name={fieldPath}
        label={question}
        multiline
        rows={2}
        fullWidth
        sx={{ mb: isLastQuestion ? 0 : 3 }}
        // Use defaultValue for uncontrolled component
        defaultValue={currentValue}
        // Use input event which is more reliable for text inputs
        onInput={handleInputChange}
        onBlur={() => {
          if (inputRef.current) {
            setValue(fieldPath, inputRef.current.value, {
              shouldValidate: true,
            });
          }
        }}
        error={!!fieldError}
        helperText={fieldError?.message}
        placeholder="Your answer..."
      />
    );
  }
);

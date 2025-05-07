// src/components/dashboard/proposals/form/SubjectOptionsSection.tsx

/**
 * SubjectOptionsSection
 * ---------------------
 * Renders for each subjectId:
 *   - instances[] with nested optionGroups/addons/answers per instance
 * Uses useFieldArray for dynamic arrays
 */
import React, { useCallback, useMemo, useEffect } from "react";
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
    formState: { errors },
    setValue,
    getValues,
  } = useFormContext<ProposalFormValues>();

  // Memoize subjectOptions to avoid unnecessary recalculations
  const subjectOptions = useMemo(
    () => listing.subjectOptions || [],
    [listing.subjectOptions]
  );

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
          key={subject.id}
          subject={subject}
          control={control}
          setValue={setValue}
          getValues={getValues}
          listing={listing}
          errors={errors}
        />
      ))}
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
  }: {
    subject: any;
    control: any;
    setValue: any;
    getValues: any;
    listing: ICommissionListing;
    errors: any;
  }) => {
    const subjectId = subject.id;

    // Use direct path for fieldArray
    const fieldArrayName = `subjectOptions.${subjectId}.instances`;

    // Initialize the form value structure if it doesn't exist
    useEffect(() => {
      // Make sure subjectOptions exists
      const subjectOptions = getValues("subjectOptions") || {};
      if (!subjectOptions[subjectId]) {
        setValue(`subjectOptions.${subjectId}`, { instances: [] });
      }
    }, [subjectId, setValue, getValues]);

    // Use fieldArray for managing instances
    const { fields, append, remove } = useFieldArray({
      control,
      name: fieldArrayName,
    });

    // Create a default instance for this subject
    const createDefaultInstance = useCallback(
      (isDiscounted = false) => {
        const defaultOptionGroups: Record<string, GeneralOptionGroupInput> = {};

        subject.optionGroups?.forEach((group: any) => {
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
      [subject]
    );

    // Add initial instance if none exists
    useEffect(() => {
      if (fields.length === 0) {
        append(createDefaultInstance(false));
      }
    }, [fields.length, append, createDefaultInstance]);

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
    control,
    setValue,
    getValues,
    onRemove,
    listing,
    subjectId,
    errors,
    totalInstances,
    isDiscountApplicable,
  }: {
    instanceIndex: number;
    subject: any;
    control: any;
    setValue: any;
    getValues: any;
    onRemove: () => void;
    listing: ICommissionListing;
    subjectId: string;
    errors: any;
    totalInstances: number;
    isDiscountApplicable: boolean;
  }) => {
    // Path to this instance in the form
    const instancePath = `subjectOptions.${subjectId}.instances.${instanceIndex}`;

    // Check for errors in this instance
    const hasErrors =
      !!errors?.subjectOptions?.[subjectId]?.instances?.[instanceIndex];

    // Get current instance data
    const instance = getValues(instancePath) || {
      optionGroups: {},
      addons: {},
      answers: {},
    };

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

        // console.log({
        //   selection,
        //   finalPrice,
        // });

        // Update the option group in the form
        setValue(
          `${instancePath}.optionGroups.${groupId}`,
          {
            selectedId,
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
          // Add the addon
          setValue(`${instancePath}.addons.${addonId}`, finalPrice, {
            shouldValidate: true,
          });
        } else {
          // Remove the addon
          const currentAddons = { ...instance.addons };
          delete currentAddons[addonId];
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
    const isAddonSelected = (addonId: number) => {
      return !!instance.addons?.[addonId];
    };

    // Handle question answers
    const handleQuestionChange = useCallback(
      (questionId: string, value: string) => {
        setValue(`${instancePath}.answers.${questionId}`, value, {
          shouldValidate: true,
        });
      },
      [instancePath, setValue]
    );

    // Get answer for a specific question
    const getQuestionAnswer = (questionId: number) => {
      return instance.answers?.[questionId] || "";
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
                    id: number;
                    title: string;
                    selections: { id: Number; label: String; price: Number }[];
                  }) => (
                    <Grid item xs={12} md={12} key={group.title}>
                      <FormControl
                        fullWidth
                        error={
                          !!errors?.subjectOptions?.[subjectId]?.instances?.[
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
                            instance?.optionGroups?.[group.id]?.selectedId ?? ""
                          }
                          label={group.title}
                          onChange={(e) => {
                            const selectedId = Number(e.target.value);
                            const selectedLabel =
                              group.selections.find(
                                (selection) => selection.id === selectedId
                              )?.label || "";

                            // console.log({
                            //   groupId: group.id,
                            //   groupTitle: group.title,
                            //   selectedId,
                            //   selectedLabel: String(selectedLabel),
                            // });

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
                        {errors?.subjectOptions?.[subjectId]?.instances?.[
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
                  (addon: { id: Number; label: String; price: Number }) => (
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
                      questionObj: { id: string; label: string },
                      idx: number
                    ) => (
                      <QuestionField
                        key={questionObj.id}
                        question={questionObj.label}
                        value={getQuestionAnswer(Number(questionObj.id))}
                        onChange={(value) =>
                          handleQuestionChange(questionObj.id, value)
                        }
                        error={!!hasErrors}
                        isLastQuestion={idx === subject.questions.length - 1}
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

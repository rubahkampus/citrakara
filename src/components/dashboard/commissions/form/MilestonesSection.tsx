"use client";
import React, { useEffect, useState } from "react";
import {
  Grid,
  TextField,
  IconButton,
  Box,
  Checkbox,
  FormControlLabel,
  Typography,
  Paper,
  Button,
  Divider,
  Alert,
  Tooltip,
  Stack,
  InputAdornment,
  Chip,
} from "@mui/material";
import {
  Controller,
  useFieldArray,
  useFormContext,
  useWatch,
} from "react-hook-form";
import { CommissionFormValues } from "../CommissionFormPage";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import InfoIcon from "@mui/icons-material/Info";
import LockIcon from "@mui/icons-material/Lock";
import LockOpenIcon from "@mui/icons-material/LockOpen";

const MilestonesSection: React.FC = () => {
  const { control, setValue, getValues } =
    useFormContext<CommissionFormValues>();
  const flow = useWatch({ control, name: "flow" });
  const revisionType = useWatch({ control, name: "revisionType" });
  const milestones = useWatch({ control, name: "milestones" }) || [];

  // Tracking locked milestones with local state
  const [lockedMilestones, setLockedMilestones] = useState<
    Record<number, boolean>
  >({});

  // Track if we've already initialized the first milestone
  const [initialized, setInitialized] = useState(false);

  // Track unlimited/paid only states for each milestone
  const [unlimitedRevisions, setUnlimitedRevisions] = useState<
    Record<number, boolean>
  >({});
  const [paidRevisionsOnly, setPaidRevisionsOnly] = useState<
    Record<number, boolean>
  >({});

  const { fields, append, remove } = useFieldArray({
    control,
    name: "milestones",
  });

  const showRevisionFields =
    flow === "milestone" && revisionType === "milestone";

  // Calculate total percentage
  const totalPercent = milestones.reduce(
    (sum, m) => sum + (m?.percent || 0),
    0
  );
  const isValid = Math.abs(totalPercent - 100) < 0.1; // Allow for tiny floating-point errors

  // Initialize first milestone to 100% when added
  useEffect(() => {
    if (fields.length === 1 && !initialized) {
      setValue(`milestones.0.percent`, 100);
      setInitialized(true);
    }
  }, [fields.length, setValue, initialized]);

  // Initialize revision states based on form values
  useEffect(() => {
    const newUnlimited: Record<number, boolean> = {};
    const newPaidOnly: Record<number, boolean> = {};

    fields.forEach((field, index) => {
      // Get the current policy
      const policy = getValues(`milestones.${index}.policy`);
      if (!policy) return;

      // Set unlimited based on !limit
      newUnlimited[index] = !policy.limit;

      // Set paid only based on: limit is true, free is 0, extraAllowed is true
      newPaidOnly[index] =
        !!policy.limit && policy.free === 0 && !!policy.extraAllowed;
    });

    setUnlimitedRevisions(newUnlimited);
    setPaidRevisionsOnly(newPaidOnly);
  }, [fields, getValues]);

  // Balance percentages when milestones change
  useEffect(() => {
    // Skip if no milestones yet
    if (fields.length === 0) return;

    // Skip if we already have a valid total
    if (isValid) return;

    // Skip initial render before form is fully initialized
    if (fields.length === 1 && totalPercent === 0) {
      setValue(`milestones.0.percent`, 100);
      return;
    }

    // Calculate how many milestones need adjustment (not locked)
    const unlocked = fields.filter((_, idx) => !lockedMilestones[idx]);
    const unlockedCount = unlocked.length;

    if (unlockedCount === 0) {
      // If all are locked but we're not at 100%, we need to adjust something
      if (!isValid && fields.length > 0) {
        // Force unlock the last milestone
        const lastIndex = fields.length - 1;
        setLockedMilestones((prev) => ({
          ...prev,
          [lastIndex]: false,
        }));

        // Recalculate in the next render cycle
        return;
      }
      return; // All milestones are locked and we're at 100%
    }

    // Calculate how much percent we need to distribute
    const lockedTotal = fields.reduce(
      (sum, f, idx) => (lockedMilestones[idx] ? sum + (f.percent || 0) : sum),
      0
    );

    const remainingPercent = 100 - lockedTotal;

    if (remainingPercent <= 0 && unlockedCount > 0) {
      // Edge case: locked milestones already exceed or equal 100%
      // Set all unlocked milestones to a small positive value
      unlocked.forEach((_, idx) => {
        const actualIdx = fields.findIndex((f, i) => f.id === unlocked[idx].id);
        if (actualIdx >= 0) {
          setValue(`milestones.${actualIdx}.percent`, 0.1);
        }
      });
      return;
    }

    // Distribute evenly among unlocked milestones
    const baseShare = Math.floor((remainingPercent * 10) / unlockedCount) / 10;
    let remainder = remainingPercent - baseShare * unlockedCount;
    remainder = Math.round(remainder * 10) / 10; // Round to 1 decimal

    // Update unlocked milestone percentages
    unlocked.forEach((f, i) => {
      const actualIdx = fields.findIndex((field) => field.id === f.id);
      if (actualIdx >= 0) {
        // Add a little extra to the first few milestones to account for the remainder
        const extraPoint = i < Math.round(remainder * 10) ? 0.1 : 0;
        const value = Math.round((baseShare + extraPoint) * 10) / 10; // Round to 1 decimal
        setValue(`milestones.${actualIdx}.percent`, value);
      }
    });
  }, [fields, lockedMilestones, setValue, isValid, totalPercent]);

  // Handle adding a new milestone
  const handleAddMilestone = () => {
    append({
      title: "",
      percent: 0, // Will be auto-calculated by the effect
      policy: { limit: false, free: 2, extraAllowed: true, fee: 0 },
    });
  };

  // Toggle lock state for a milestone's percentage
  const toggleLock = (index: number) => {
    setLockedMilestones((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  // Handle milestone removal
  const handleRemoveMilestone = (index: number) => {
    // Store current percentages and locked states before removal
    const currentPercentages = [...fields.map((f) => f.percent || 0)];
    const currentLocked = { ...lockedMilestones };

    // Remove the milestone
    remove(index);

    // Update the locked milestones state (adjust indices)
    const updatedLocked: Record<number, boolean> = {};
    Object.keys(currentLocked).forEach((key) => {
      const idx = parseInt(key);
      if (idx < index) {
        updatedLocked[idx] = currentLocked[idx];
      } else if (idx > index) {
        updatedLocked[idx - 1] = currentLocked[idx];
      }
    });

    setLockedMilestones(updatedLocked);

    // Special case: if removing the last milestone, return early
    if (fields.length <= 1) {
      return;
    }

    // Recalculate percentages in the next render cycle
    // We rely on the useEffect instead of manual calculation here
  };

  // Handle percentage change
  const handlePercentChange = (index: number, newValue: number) => {
    // Ensure newValue is valid
    const sanitizedValue = Math.max(0, Math.min(100, newValue));

    // If only one milestone, it must be 100%
    if (fields.length === 1) {
      setValue(`milestones.${index}.percent`, 100);
      return;
    }

    // If this milestone is locked, just set its value
    if (lockedMilestones[index]) {
      setValue(`milestones.${index}.percent`, sanitizedValue);
      return;
    }

    // Set the new value
    setValue(`milestones.${index}.percent`, sanitizedValue);

    // Get current percentages with this update
    const currentValues = fields.map((f, idx) =>
      idx === index ? sanitizedValue : f.percent || 0
    );

    // Calculate how much we need to adjust other milestones
    const currentTotal = currentValues.reduce((sum, val) => sum + val, 0);
    const diff = currentTotal - 100;

    if (Math.abs(diff) < 0.1) return; // Already balanced

    // Find unlocked milestones other than the current one
    const adjustableIndexes = fields
      .map((_, idx) => idx)
      .filter((idx) => idx !== index && !lockedMilestones[idx]);

    if (adjustableIndexes.length === 0) {
      // Can't adjust any other milestones - force this one to be valid
      const maxAllowed =
        100 -
        fields
          .filter((_, i) => i !== index && lockedMilestones[i])
          .reduce((sum, f, i) => sum + (f.percent || 0), 0);

      setValue(
        `milestones.${index}.percent`,
        Math.max(0, Math.min(100, maxAllowed))
      );
      return;
    }

    // Distribute the difference evenly
    const adjustPerMilestone = diff / adjustableIndexes.length;

    adjustableIndexes.forEach((idx) => {
      const currentVal = fields[idx].percent || 0;
      const newVal = Math.max(0.1, currentVal - adjustPerMilestone); // Ensure at least 0.1%
      setValue(`milestones.${idx}.percent`, Math.round(newVal * 10) / 10); // Round to 1 decimal
    });
  };

  // Handle "Unlimited Revisions" checkbox change
  const handleUnlimitedChange = (index: number, checked: boolean) => {
    setUnlimitedRevisions((prev) => ({
      ...prev,
      [index]: checked,
    }));

    // Update form values
    setValue(`milestones.${index}.policy.limit`, !checked);

    if (checked) {
      // Reset other fields for unlimited mode
      setValue(`milestones.${index}.policy.free`, 0);
      setValue(`milestones.${index}.policy.extraAllowed`, false);
      setValue(`milestones.${index}.policy.fee`, 0);

      // Also reset paid only state
      setPaidRevisionsOnly((prev) => ({
        ...prev,
        [index]: false,
      }));
    } else {
      // Default values for limited mode
      setValue(`milestones.${index}.policy.free`, 2);
      setValue(`milestones.${index}.policy.extraAllowed`, true);
    }
  };

  // Handle "Paid Revisions Only" checkbox change
  const handlePaidOnlyChange = (index: number, checked: boolean) => {
    setPaidRevisionsOnly((prev) => ({
      ...prev,
      [index]: checked,
    }));

    if (checked) {
      // Set values for paid-only mode
      setValue(`milestones.${index}.policy.free`, 0);
      setValue(`milestones.${index}.policy.extraAllowed`, true);
      // Set a default fee if not already set
      const currentFee = getValues(`milestones.${index}.policy.fee`);
      if (!currentFee) {
        setValue(`milestones.${index}.policy.fee`, 50000);
      }
    } else {
      // Set values for regular mode
      setValue(`milestones.${index}.policy.free`, 2);
      // Keep extra revisions allowed
      setValue(`milestones.${index}.policy.extraAllowed`, true);
    }
  };

  if (flow !== "milestone") return null;

  return (
    <Box>
      <Typography variant="h6" fontWeight="bold" gutterBottom>
        Milestones
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Break your commission into stages with separate deliverables and
        payments
      </Typography>

      {!isValid && fields.length > 0 && (
        <Alert
          severity={totalPercent > 100 ? "error" : "warning"}
          sx={{ mb: 2 }}
        >
          {totalPercent > 100
            ? "Total milestone percentages exceed 100%. Please adjust."
            : `Total milestone percentages: ${totalPercent.toFixed(
                1
              )}%. Should add up to 100%.`}
        </Alert>
      )}

      {fields.length === 0 && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Add at least one milestone to define your commission workflow.
        </Alert>
      )}

      {fields.map((milestone, index) => (
        <Paper
          key={milestone.id}
          variant="outlined"
          sx={{ p: 2, mb: 2, borderRadius: 1, position: "relative" }}
        >
          {/* Delete button - positioned at the top right */}
          <IconButton
            color="error"
            onClick={() => handleRemoveMilestone(index)}
            size="small"
            sx={{
              position: "absolute",
              top: 25,
              right: 20,
              zIndex: 1,
            }}
            // Disable delete if this is the only milestone
            disabled={fields.length <= 1}
          >
            <DeleteIcon />
          </IconButton>

          <Grid container spacing={2}>
            {/* Title and Payment % row */}
            <Grid item xs={12} sm={8}>
              <Controller
                control={control}
                name={`milestones.${index}.title`}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Milestone Title"
                    placeholder="e.g. Sketch, Lineart, Coloring"
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <Controller
                control={control}
                name={`milestones.${index}.percent`}
                render={({ field }) => (
                  <TextField
                    {...field}
                    sx={{ width: "80%" }}
                    type="number"
                    fullWidth
                    label="Payment %"
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <Box sx={{ display: "flex", alignItems: "center" }}>
                            %
                            <IconButton
                              onClick={() => toggleLock(index)}
                              edge="end"
                              size="small"
                              sx={{ ml: 1 }}
                              // Disable lock toggle if this is the only milestone
                              disabled={fields.length <= 1}
                            >
                              {lockedMilestones[index] ? (
                                <LockIcon fontSize="small" color="primary" />
                              ) : (
                                <LockOpenIcon fontSize="small" color="action" />
                              )}
                            </IconButton>
                          </Box>
                        </InputAdornment>
                      ),
                      inputProps: {
                        min: 0,
                        max: 100,
                        readOnly: lockedMilestones[index] || fields.length <= 1,
                        step: 0.1,
                      },
                    }}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      if (!isNaN(val)) {
                        handlePercentChange(index, val);
                      }
                    }}
                  />
                )}
              />
            </Grid>

            {lockedMilestones[index] && (
              <Typography
                variant="caption"
                color="primary"
                sx={{
                  position: "absolute",
                  top: 75,
                  right: 95,
                  zIndex: 1,
                }}
              >
                This percentage is locked
              </Typography>
            )}
            {fields.length <= 1 && (
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{
                  position: "absolute",
                  top: 75,
                  right: 95,
                  zIndex: 1,
                }}
              >
                Single milestone is always 100%
              </Typography>
            )}

            {/* Revision policy section with improved UI */}
            {showRevisionFields && (
              <Grid item xs={12}>
                <Paper variant="outlined" sx={{ p: 3, borderRadius: 2, mt: 1 }}>
                  <Typography
                    variant="subtitle2"
                    gutterBottom
                    fontWeight="medium"
                  >
                    Revision Policy for this Milestone
                  </Typography>

                  {/* First row: checkboxes */}
                  <Grid container spacing={3}>
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ display: "flex", alignItems: "center" }}>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={!!unlimitedRevisions[index]}
                              onChange={(e) =>
                                handleUnlimitedChange(index, e.target.checked)
                              }
                            />
                          }
                          label="Unlimited Revisions"
                        />
                        <Tooltip title="Allow clients to request unlimited revisions for this milestone">
                          <InfoIcon
                            fontSize="small"
                            color="action"
                            sx={{ ml: 1 }}
                          />
                        </Tooltip>
                      </Box>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <Box sx={{ display: "flex", alignItems: "center" }}>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={!!paidRevisionsOnly[index]}
                              onChange={(e) =>
                                handlePaidOnlyChange(index, e.target.checked)
                              }
                              disabled={!!unlimitedRevisions[index]}
                            />
                          }
                          label="Paid Revisions Only"
                        />
                        <Tooltip title="All revisions for this milestone will require payment">
                          <InfoIcon
                            fontSize="small"
                            color="action"
                            sx={{ ml: 1 }}
                          />
                        </Tooltip>
                      </Box>
                    </Grid>
                  </Grid>

                  <Divider sx={{ my: 2 }} />

                  {/* Second row: fields */}
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} sm={3}>
                      <Controller
                        control={control}
                        name={`milestones.${index}.policy.free`}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            type="number"
                            fullWidth
                            label="Free Revisions"
                            InputProps={{ inputProps: { min: 0 } }}
                            disabled={
                              !!unlimitedRevisions[index] ||
                              !!paidRevisionsOnly[index]
                            }
                          />
                        )}
                      />
                    </Grid>

                    <Grid item xs={12} sm={3}>
                      <Controller
                        control={control}
                        name={`milestones.${index}.policy.extraAllowed`}
                        render={({ field }) => (
                          <FormControlLabel
                            control={
                              <Checkbox
                                {...field}
                                checked={!!field.value}
                                disabled={
                                  !!unlimitedRevisions[index] ||
                                  !!paidRevisionsOnly[index]
                                }
                              />
                            }
                            label="Allow Paid Revisions (Extra Revisions)"
                          />
                        )}
                      />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <Controller
                        control={control}
                        name={`milestones.${index}.policy.fee`}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            type="number"
                            fullWidth
                            label="Fee Per Revision"
                            InputProps={{
                              inputProps: { min: 0 },
                              startAdornment: (
                                <span style={{ marginRight: 4 }}>Rp</span>
                              ),
                            }}
                            disabled={
                              unlimitedRevisions[index] ||
                              (!paidRevisionsOnly[index] && !getValues(
                                `milestones.${index}.policy.extraAllowed`
                              ))
                            }
                          />
                        )}
                      />
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>
            )}
          </Grid>
        </Paper>
      ))}

      <Button
        variant="contained"
        startIcon={<AddIcon />}
        onClick={handleAddMilestone}
        sx={{ mt: 1 }}
      >
        Add Milestone
      </Button>

      {fields.length > 0 && (
        <Stack direction="row" spacing={1} sx={{ mt: 2, alignItems: "center" }}>
          <InfoIcon color="info" fontSize="small" />
          <Typography component="div" variant="body2" color="text.secondary">
            Milestone percentages: {totalPercent.toFixed(1)}% of 100%
            {isValid && (
              <Chip
                label="Balanced"
                color="success"
                size="small"
                sx={{ ml: 1, height: 24 }}
              />
            )}
          </Typography>
        </Stack>
      )}
    </Box>
  );
};

export default MilestonesSection;

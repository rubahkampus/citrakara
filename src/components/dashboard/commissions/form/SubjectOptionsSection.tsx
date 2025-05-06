"use client";
import React from "react";
import {
  Box,
  Grid,
  TextField,
  IconButton,
  Typography,
  Button,
  Paper,
  Divider,
  InputAdornment,
  Tooltip,
} from "@mui/material";
import { useFormContext, useFieldArray, Controller } from "react-hook-form";
import { CommissionFormValues } from "../CommissionFormPage";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import InfoIcon from "@mui/icons-material/Info";

// Validation function for allowed characters
const validateAllowedCharacters = (value: string) => {
  // Regex that only allows alphabet, spaces, -, comma, period, and numbers
  const allowedCharsRegex = /^[a-zA-Z0-9\s\-.,?!/()]*$/;
  return (
    allowedCharsRegex.test(value) ||
    "Only letters, numbers, spaces, hyphens, commas, and periods are allowed"
  );
};

/**
 * Reusable component for price-label pairs
 */
const PriceOptionPair: React.FC<{
  label: string;
  priceSuffix?: string;
  register: any;
  control: any;
  remove: (index: number) => void;
  index: number;
  path: string;
}> = ({ label, priceSuffix = "", register, control, remove, index, path }) => (
  <Grid container spacing={1} alignItems="center" sx={{ mb: 1 }}>
    <Grid item xs={6}>
      <Controller
        control={control}
        name={`${path}.${index}.label`}
        rules={{
          validate: validateAllowedCharacters,
        }}
        render={({ field, fieldState }) => (
          <TextField
            label="Label"
            fullWidth
            size="small"
            error={!!fieldState.error}
            helperText={fieldState.error ? fieldState.error.message : ""}
            {...field}
          />
        )}
      />
    </Grid>
    <Grid item xs={4}>
      <Controller
        control={control}
        name={`${path}.${index}.price`}
        rules={{ min: 0 }}
        render={({ field, fieldState }) => (
          <TextField
            label="Price"
            type="number"
            fullWidth
            size="small"
            error={!!fieldState.error}
            helperText={fieldState.error ? "Cannot be negative" : ""}
            InputProps={{
              inputProps: { min: 0 },
              endAdornment: priceSuffix ? (
                <span style={{ marginLeft: 4 }}>{priceSuffix}</span>
              ) : undefined,
            }}
            {...field}
            onChange={(e) => {
              // Prevent negative values
              const value = parseFloat(e.target.value);
              field.onChange(value < 0 ? 0 : value);
            }}
          />
        )}
      />
    </Grid>
    <Grid item xs={2}>
      <IconButton size="small" color="error" onClick={() => remove(index)}>
        <DeleteIcon fontSize="small" />
      </IconButton>
    </Grid>
  </Grid>
);

/**
 * Component for handling selections within a subject option group
 */
const SubjectOptionSelections: React.FC<{
  control: any;
  subjectIndex: number;
  groupIndex: number;
  currency: string;
}> = ({ control, subjectIndex, groupIndex, currency }) => {
  const { fields, append, remove } = useFieldArray({
    control,
    name: `subjectOptions.${subjectIndex}.optionGroups.${groupIndex}.selections`,
  });

  return (
    <Box sx={{ pl: 1 }}>
      {fields.map((field, index) => (
        <PriceOptionPair
          key={field.id}
          label="Option"
          priceSuffix={currency}
          register={control.register}
          control={control}
          remove={remove}
          index={index}
          path={`subjectOptions.${subjectIndex}.optionGroups.${groupIndex}.selections`}
        />
      ))}

      <Button
        startIcon={<AddIcon />}
        size="small"
        onClick={() => append({ label: "", price: 0 })}
        sx={{ mt: 1 }}
        variant="text"
      >
        Add Option
      </Button>
    </Box>
  );
};

/**
 * Component for option groups within a subject
 */
const SubjectOptionGroup: React.FC<{
  control: any;
  subjectIndex: number;
  currency: string;
}> = ({ control, subjectIndex, currency }) => {
  const { fields, append, remove } = useFieldArray({
    control,
    name: `subjectOptions.${subjectIndex}.optionGroups`,
  });

  return (
    <Box>
      {fields.length === 0 && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          No option groups added yet
        </Typography>
      )}

      {fields.map((group, groupIndex) => (
        <Paper
          key={group.id}
          variant="outlined"
          sx={{ p: 2, mb: 2, borderRadius: 1 }}
        >
          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
            <Controller
              control={control}
              name={`subjectOptions.${subjectIndex}.optionGroups.${groupIndex}.title`}
              rules={{
                validate: validateAllowedCharacters,
              }}
              render={({ field, fieldState }) => (
                <TextField
                  label="Group Title"
                  fullWidth
                  size="small"
                  error={!!fieldState.error}
                  helperText={fieldState.error ? fieldState.error.message : ""}
                  sx={{ mr: 1, flexGrow: 1 }}
                  {...field}
                />
              )}
            />
            <IconButton color="error" onClick={() => remove(groupIndex)}>
              <DeleteIcon />
            </IconButton>
          </Box>

          <Divider sx={{ my: 1 }} />
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Options (each with price adjustment)
          </Typography>

          {/* Nested field array for selections within the group */}
          <SubjectOptionSelections
            control={control}
            subjectIndex={subjectIndex}
            groupIndex={groupIndex}
            currency={currency}
          />
        </Paper>
      ))}

      <Button
        variant="outlined"
        startIcon={<AddIcon />}
        onClick={() => append({ title: "", selections: [] })}
        size="small"
        sx={{ mt: 1 }}
      >
        Add Option Group
      </Button>
    </Box>
  );
};

/**
 * Component for addons within a subject
 */
const SubjectAddonList: React.FC<{
  control: any;
  subjectIndex: number;
  currency: string;
}> = ({ control, subjectIndex, currency }) => {
  const { fields, append, remove } = useFieldArray({
    control,
    name: `subjectOptions.${subjectIndex}.addons`,
  });

  return (
    <Box>
      {fields.length === 0 && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          No addons created yet
        </Typography>
      )}

      {fields.map((field, index) => (
        <PriceOptionPair
          key={field.id}
          label="Addon"
          priceSuffix={currency}
          register={control.register}
          control={control}
          remove={remove}
          index={index}
          path={`subjectOptions.${subjectIndex}.addons`}
        />
      ))}

      <Button
        variant="outlined"
        startIcon={<AddIcon />}
        onClick={() => append({ label: "", price: 0 })}
        size="small"
        sx={{ mt: 1 }}
      >
        Add Addon
      </Button>
    </Box>
  );
};

/**
 * Component for questions within a subject
 */
/**
 * Component for questions within a subject
 */
const SubjectQuestionList: React.FC<{
  control: any;
  subjectIndex: number;
}> = ({ control, subjectIndex }) => {
  const { fields, append, remove } = useFieldArray({
    control,
    name: `subjectOptions.${subjectIndex}.questions`,
  });

  return (
    <Box>
      {fields.length === 0 && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          No questions added yet
        </Typography>
      )}

      {fields.map((field, index) => (
        <Grid
          container
          spacing={1}
          key={field.id}
          alignItems="center"
          sx={{ mb: 1 }}
        >
          <Grid item xs={10}>
            <Controller
              control={control}
              name={`subjectOptions.${subjectIndex}.questions.${index}`}
              rules={{
                validate: validateAllowedCharacters,
              }}
              render={({ field, fieldState }) => (
                <TextField
                  label="Question"
                  fullWidth
                  size="small"
                  error={!!fieldState.error}
                  helperText={fieldState.error ? fieldState.error.message : ""}
                  {...field}
                />
              )}
            />
          </Grid>
          <Grid item xs={2}>
            <IconButton
              size="small"
              color="error"
              onClick={() => remove(index)}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Grid>
        </Grid>
      ))}

      <Button
        variant="outlined"
        startIcon={<AddIcon />}
        onClick={() => append("")}
        size="small"
        sx={{ mt: 1 }}
      >
        Add Question
      </Button>
    </Box>
  );
};

/**
 * Subject Options Section component
 * Manages subject groups with nested option groups, addons, and questions
 */
const SubjectOptionsSection = () => {
  const { control, watch } = useFormContext<CommissionFormValues>();
  const currency = watch("currency");

  const {
    fields: subjects,
    append: appendSubject,
    remove: removeSubject,
  } = useFieldArray({ control, name: "subjectOptions" });

  return (
    <Box>
      <Typography variant="h6" fontWeight="bold" gutterBottom>
        Subject Options
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Define different subjects with their own options, addons, and questions
      </Typography>

      {subjects.length === 0 && (
        <Box
          sx={{
            p: 3,
            textAlign: "center",
            bgcolor: "action.hover",
            borderRadius: 1,
            mb: 2,
          }}
        >
          <Typography color="text.secondary" gutterBottom>
            No subject groups added yet
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Subject groups help organize your commission options by category
          </Typography>
        </Box>
      )}

      {subjects.map((subject, subjectIndex) => (
        <Paper
          key={subject.id}
          variant="outlined"
          sx={{ p: 3, mb: 3, borderRadius: 2 }}
        >
          <Grid container spacing={2} alignItems="center" sx={{ mb: 3 }}>
            <Grid item xs={12} md={4}>
              <Controller
                control={control}
                name={`subjectOptions.${subjectIndex}.title`}
                rules={{
                  validate: validateAllowedCharacters,
                }}
                render={({ field, fieldState }) => (
                  <TextField
                    label="Subject Title"
                    fullWidth
                    error={!!fieldState.error}
                    helperText={
                      fieldState.error
                        ? fieldState.error.message
                        : "Category name (e.g. Characters, Backgrounds)"
                    }
                    {...field}
                  />
                )}
              />
            </Grid>

            <Grid item xs={6} md={3}>
              <Controller
                control={control}
                name={`subjectOptions.${subjectIndex}.limit`}
                rules={{ min: 1 }}
                render={({ field, fieldState }) => (
                  <TextField
                    label="Max Items"
                    type="number"
                    fullWidth
                    error={!!fieldState.error}
                    helperText={
                      fieldState.error
                        ? "Must be at least 1"
                        : "How many can be selected"
                    }
                    InputProps={{
                      inputProps: { min: 1 },
                      endAdornment: (
                        <Tooltip title="Maximum number of items clients can select">
                          <InputAdornment position="end">
                            <InfoIcon fontSize="small" color="action" />
                          </InputAdornment>
                        </Tooltip>
                      ),
                    }}
                    {...field}
                    onChange={(e) => {
                      // Ensure value is at least 1
                      const value = parseInt(e.target.value);
                      field.onChange(value < 1 ? 1 : value);
                    }}
                  />
                )}
              />
            </Grid>

            <Grid item xs={6} md={3}>
              <Controller
                control={control}
                name={`subjectOptions.${subjectIndex}.discount`}
                rules={{ min: 0, max: 100 }}
                render={({ field, fieldState }) => (
                  <TextField
                    label="Discount %"
                    type="number"
                    fullWidth
                    error={!!fieldState.error}
                    helperText={
                      fieldState.error
                        ? "Must be 0-100%"
                        : "For multiple selections"
                    }
                    InputProps={{
                      inputProps: { min: 0, max: 100 },
                      endAdornment: (
                        <InputAdornment position="end">%</InputAdornment>
                      ),
                    }}
                    {...field}
                    onChange={(e) => {
                      // Clamp value between 0 and 100
                      const value = parseFloat(e.target.value);
                      if (value < 0) field.onChange(0);
                      else if (value > 100) field.onChange(100);
                      else field.onChange(value);
                    }}
                  />
                )}
              />
            </Grid>

            <Grid
              item
              xs={12}
              md={2}
              sx={{ display: "flex", justifyContent: "flex-end" }}
            >
              <Button
                variant="outlined"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={() => removeSubject(subjectIndex)}
              >
                Remove
              </Button>
            </Grid>
          </Grid>

          <Divider sx={{ mb: 3 }} />

          {/* Option Groups */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
              Option Groups
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Create groups of options where clients can select one option
            </Typography>
            <SubjectOptionGroup
              control={control}
              subjectIndex={subjectIndex}
              currency={currency}
            />
          </Box>

          {/* Addons */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
              Addons
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Additional services clients can add to their commission
            </Typography>
            <SubjectAddonList
              control={control}
              subjectIndex={subjectIndex}
              currency={currency}
            />
          </Box>

          {/* Questions */}
          <Box>
            <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
              Questions
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Questions specific to this subject category
            </Typography>
            <SubjectQuestionList
              control={control}
              subjectIndex={subjectIndex}
            />
          </Box>
        </Paper>
      ))}

      <Button
        variant="contained"
        startIcon={<AddIcon />}
        onClick={() =>
          appendSubject({
            title: "",
            limit: 1,
            discount: 0,
            optionGroups: [],
            addons: [],
            questions: [],
          })
        }
        sx={{ mt: 1 }}
      >
        Add Subject Group
      </Button>
    </Box>
  );
};

export default SubjectOptionsSection;

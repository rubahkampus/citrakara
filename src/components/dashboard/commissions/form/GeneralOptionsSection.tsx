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
} from "@mui/material";
import { useFormContext, useFieldArray, Controller } from "react-hook-form";
import { CommissionFormValues } from "../CommissionFormPage";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";

/**
 * Reusable component for price-label pairs
 */
const PriceOptionPair: React.FC<{
  control: any;
  remove: (index: number) => void;
  index: number;
  path: string;
  priceSuffix?: string;
}> = ({ control, remove, index, path, priceSuffix = "" }) => (
  <Grid container spacing={1} alignItems="center" sx={{ mb: 1 }}>
    <Grid item xs={6}>
      <Controller
        control={control}
        name={`${path}.${index}.label`}
        render={({ field }) => (
          <TextField label="Label" fullWidth size="small" {...field} />
        )}
      />
    </Grid>
    <Grid item xs={4}>
      <Controller
        control={control}
        name={`${path}.${index}.price`}
        defaultValue={0}
        render={({ field }) => (
          <TextField
            label="Price"
            type="number"
            fullWidth
            size="small"
            InputProps={{
              inputProps: { min: 0 },
              endAdornment: priceSuffix ? (
                <span style={{ marginLeft: 4 }}>{priceSuffix}</span>
              ) : undefined,
            }}
            {...field}
            onChange={(e) => {
              const value = Math.max(0, parseFloat(e.target.value) || 0);
              field.onChange(value);
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
 * Component for option groups (title + selections)
 */
const OptionGroupList: React.FC<{
  control: any;
  path: string;
  currency: string;
}> = ({ control, path, currency }) => {
  const { fields, append, remove } = useFieldArray({ control, name: path });

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
              name={`${path}.${groupIndex}.title`}
              render={({ field }) => (
                <TextField
                  label="Group Title"
                  fullWidth
                  size="small"
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
          <NestedSelections
            control={control}
            parentPath={path}
            parentIndex={groupIndex}
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
 * Component for handling nested selections within an option group
 */
const NestedSelections: React.FC<{
  control: any;
  parentPath: string;
  parentIndex: number;
  currency: string;
}> = ({ control, parentPath, parentIndex, currency }) => {
  const { fields, append, remove } = useFieldArray({
    control,
    name: `${parentPath}.${parentIndex}.selections`,
  });

  return (
    <Box sx={{ pl: 1 }}>
      {fields.map((field, index) => (
        <PriceOptionPair
          key={field.id}
          control={control}
          remove={remove}
          index={index}
          path={`${parentPath}.${parentIndex}.selections`}
          priceSuffix={currency}
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
 * Component for addons list
 */
const AddonList: React.FC<{
  control: any;
  path: string;
  currency: string;
}> = ({ control, path, currency }) => {
  const { fields, append, remove } = useFieldArray({ control, name: path });

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
          control={control}
          remove={remove}
          index={index}
          path={path}
          priceSuffix={currency}
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

const QuestionList: React.FC<{
  control: any;
  path: string;
}> = ({ control, path }) => {
  const { fields, append, remove } = useFieldArray({ control, name: path });

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
              name={`${path}.${index}.label`}
              render={({ field }) => (
                <TextField label="Question" fullWidth size="small" {...field} />
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
        onClick={() => append({ label: "" })}
        size="small"
        sx={{ mt: 1 }}
      >
        Add Question
      </Button>
    </Box>
  );
};

/**
 * Main General Options Section component
 */
const GeneralOptionsSection = () => {
  const { control, watch } = useFormContext<CommissionFormValues>();
  const currency = watch("currency");

  return (
    <Box>
      <Typography variant="h6" fontWeight="bold" gutterBottom>
        General Options
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Define option groups, addons, and questions that apply to all
        commissions
      </Typography>

      <Grid container spacing={4}>
        {/* Option Groups */}
        <Grid item xs={12}>
          <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
            Option Groups
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Create groups of options where clients can select one option
          </Typography>
          <OptionGroupList
            control={control}
            path="generalOptions.optionGroups"
            currency={currency}
          />
        </Grid>

        {/* Addons */}
        <Grid item xs={12}>
          <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
            Addons
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Additional services clients can add to their commission
          </Typography>
          <AddonList
            control={control}
            path="generalOptions.addons"
            currency={currency}
          />
        </Grid>

        {/* Questions */}
        <Grid item xs={12}>
          <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
            Questions
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Questions to ask clients when they request a commission
          </Typography>
          <QuestionList control={control} path="generalOptions.questions" />
        </Grid>
      </Grid>
    </Box>
  );
};

export default GeneralOptionsSection;

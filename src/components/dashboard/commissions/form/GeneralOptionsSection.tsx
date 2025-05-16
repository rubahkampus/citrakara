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

// Constants for UI spacing
const SPACING = {
  sectionMargin: { mb: 4 },
  itemMargin: { mb: 2 },
  smallMargin: { mb: 1 },
};

// Text constants
const TEXT = {
  emptyOptionGroups: "Belum ada grup opsi yang ditambahkan",
  emptyAddons: "Belum ada layanan tambahan yang dibuat",
  emptyQuestions: "Belum ada pertanyaan yang ditambahkan",
  addOptionGroup: "Tambah Grup Opsi",
  addOption: "Tambah Opsi",
  addService: "Tambah Layanan",
  addQuestion: "Tambah Pertanyaan",
  generalOptions: "Opsi Umum",
  generalOptionsDescription:
    "Tentukan grup opsi, layanan tambahan, dan pertanyaan yang berlaku untuk semua pesanan",
  optionGroups: "Grup Opsi",
  optionGroupsDescription:
    "Buat grup opsi di mana klien dapat memilih satu opsi",
  additionalServices: "Layanan Tambahan",
  additionalServicesDescription:
    "Layanan tambahan yang dapat ditambahkan klien ke pesanan mereka",
  questions: "Pertanyaan",
  questionsDescription:
    "Pertanyaan untuk ditanyakan kepada klien saat mereka meminta pesanan",
  groupTitle: "Judul Grup",
  optionsWithPriceAdjustment: "Opsi (masing-masing dengan penyesuaian harga)",
  labelField: "Label",
  priceField: "Harga",
  questionField: "Pertanyaan",
};

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
          <TextField
            label={TEXT.labelField}
            fullWidth
            size="small"
            {...field}
          />
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
            label={TEXT.priceField}
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
      <IconButton
        size="small"
        color="error"
        onClick={() => remove(index)}
        aria-label="Hapus"
      >
        <DeleteIcon fontSize="small" />
      </IconButton>
    </Grid>
  </Grid>
);

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
        {TEXT.addOption}
      </Button>
    </Box>
  );
};

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
        <Typography
          variant="body2"
          color="text.secondary"
          sx={SPACING.itemMargin}
        >
          {TEXT.emptyOptionGroups}
        </Typography>
      )}

      {fields.map((group, groupIndex) => (
        <Paper
          key={group.id}
          variant="outlined"
          sx={{ p: 2, mb: 2, borderRadius: 1 }}
          elevation={0}
        >
          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
            <Controller
              control={control}
              name={`${path}.${groupIndex}.title`}
              render={({ field }) => (
                <TextField
                  label={TEXT.groupTitle}
                  fullWidth
                  size="small"
                  sx={{ mr: 1, flexGrow: 1 }}
                  {...field}
                />
              )}
            />
            <IconButton
              color="error"
              onClick={() => remove(groupIndex)}
              aria-label="Hapus grup"
            >
              <DeleteIcon />
            </IconButton>
          </Box>

          <Divider sx={{ my: 1 }} />
          <Typography variant="subtitle2" sx={SPACING.smallMargin}>
            {TEXT.optionsWithPriceAdjustment}
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
        {TEXT.addOptionGroup}
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
        <Typography
          variant="body2"
          color="text.secondary"
          sx={SPACING.itemMargin}
        >
          {TEXT.emptyAddons}
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
        {TEXT.addService}
      </Button>
    </Box>
  );
};

/**
 * Component for questions list
 */
const QuestionList: React.FC<{
  control: any;
  path: string;
}> = ({ control, path }) => {
  const { fields, append, remove } = useFieldArray({ control, name: path });

  return (
    <Box>
      {fields.length === 0 && (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={SPACING.itemMargin}
        >
          {TEXT.emptyQuestions}
        </Typography>
      )}

      {fields.map((field, index) => (
        <Grid
          container
          spacing={1}
          key={field.id}
          alignItems="center"
          sx={SPACING.smallMargin}
        >
          <Grid item xs={10}>
            <Controller
              control={control}
              name={`${path}.${index}.label`}
              render={({ field }) => (
                <TextField
                  label={TEXT.questionField}
                  fullWidth
                  size="small"
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
              aria-label="Hapus pertanyaan"
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
        {TEXT.addQuestion}
      </Button>
    </Box>
  );
};

/**
 * Section component for the form
 */
const SectionHeader: React.FC<{
  title: string;
  description: string;
}> = ({ title, description }) => (
  <Box sx={SPACING.itemMargin}>
    <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
      {title}
    </Typography>
    <Typography variant="body2" color="text.secondary" gutterBottom>
      {description}
    </Typography>
  </Box>
);

/**
 * Main General Options Section component
 */
const GeneralOptionsSection = () => {
  const { control, watch } = useFormContext<CommissionFormValues>();
  const currency = watch("currency");

  return (
    <Box>
      <Typography variant="h6" fontWeight="bold" gutterBottom>
        {TEXT.generalOptions}
      </Typography>
      <Typography
        variant="body2"
        color="text.secondary"
        sx={SPACING.sectionMargin}
      >
        {TEXT.generalOptionsDescription}
      </Typography>

      <Grid container spacing={4}>
        {/* Option Groups */}
        <Grid item xs={12} sx={SPACING.itemMargin}>
          <SectionHeader
            title={TEXT.optionGroups}
            description={TEXT.optionGroupsDescription}
          />
          <OptionGroupList
            control={control}
            path="generalOptions.optionGroups"
            currency={currency}
          />
        </Grid>

        {/* Addons */}
        <Grid item xs={12} sx={SPACING.itemMargin}>
          <SectionHeader
            title={TEXT.additionalServices}
            description={TEXT.additionalServicesDescription}
          />
          <AddonList
            control={control}
            path="generalOptions.addons"
            currency={currency}
          />
        </Grid>

        {/* Questions */}
        <Grid item xs={12} sx={SPACING.itemMargin}>
          <SectionHeader
            title={TEXT.questions}
            description={TEXT.questionsDescription}
          />
          <QuestionList control={control} path="generalOptions.questions" />
        </Grid>
      </Grid>
    </Box>
  );
};

export default GeneralOptionsSection;

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

// Constants for UI spacing
const SPACING = {
  sectionMargin: { mb: 4 },
  itemMargin: { mb: 2 },
  smallMargin: { mb: 1 },
};

// Text constants
const TEXT = {
  subjectOptions: "Opsi Subjek",
  subjectOptionsDescription:
    "Tentukan subjek berbeda dengan opsi, layanan tambahan, dan pertanyaan mereka sendiri",
  emptySubjects: "Belum ada grup subjek yang ditambahkan",
  emptySubjectsDescription:
    "Grup subjek membantu mengatur opsi pesanan Anda berdasarkan kategori",
  emptyOptionGroups: "Belum ada grup opsi yang ditambahkan",
  emptyAddons: "Belum ada layanan tambahan yang dibuat",
  emptyQuestions: "Belum ada pertanyaan yang ditambahkan",
  addSubjectGroup: "Tambah Grup Subjek",
  addOptionGroup: "Tambah Grup Opsi",
  addOption: "Tambah Opsi",
  addAddon: "Tambah Layanan",
  addQuestion: "Tambah Pertanyaan",
  delete: "Hapus",
  subjectTitle: "Judul Subjek",
  subjectTitleHelper: "Nama kategori (mis. Karakter, Latar Belakang)",
  maxItems: "Maks. Item",
  maxItemsHelper: "Berapa banyak subjek yang dapat dimasukkan",
  maxItemsError: "Minimal harus 1",
  maxItemsTooltip: "Jumlah maksimum item yang dapat dipilih klien",
  discount: "Diskon %",
  discountHelper: "Berlaku untuk setiap subjek setelah subjek pertama",
  discountError: "Harus 0-100%",
  optionGroups: "Grup Opsi",
  optionGroupsDescription:
    "Buat grup opsi di mana klien dapat memilih satu opsi",
  additionalServices: "Layanan Tambahan",
  additionalServicesDescription:
    "Layanan tambahan yang dapat ditambahkan klien ke pesanan mereka",
  questions: "Pertanyaan",
  questionsDescription: "Pertanyaan khusus untuk kategori subjek ini",
  groupTitle: "Judul Grup",
  optionsWithPriceAdjustment: "Opsi (masing-masing dengan penyesuaian harga)",
  labelField: "Label",
  priceField: "Harga",
  questionField: "Pertanyaan",
};

/**
 * Section component for the form
 */
const SectionHeader: React.FC<{ title: string; description: string }> = ({ title, description }) => (
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
        <Grid
          container
          spacing={1}
          alignItems="center"
          sx={SPACING.smallMargin}
          key={field.id}
        >
          <Grid item xs={6}>
            <Controller
              control={control}
              name={`subjectOptions.${subjectIndex}.optionGroups.${groupIndex}.selections.${index}.label`}
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
              name={`subjectOptions.${subjectIndex}.optionGroups.${groupIndex}.selections.${index}.price`}
              defaultValue={0}
              render={({ field }) => (
                <TextField
                  label={TEXT.priceField}
                  type="number"
                  fullWidth
                  size="small"
                  InputProps={{
                    inputProps: { min: 0 },
                    endAdornment: currency ? (
                      <span style={{ marginLeft: 4 }}>{currency}</span>
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
              aria-label="Hapus opsi"
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Grid>
        </Grid>
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
          elevation={0}
          sx={{ p: 2, mb: 2, borderRadius: 1 }}
        >
          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
            <Controller
              control={control}
              name={`subjectOptions.${subjectIndex}.optionGroups.${groupIndex}.title`}
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
        {TEXT.addOptionGroup}
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
        <Typography
          variant="body2"
          color="text.secondary"
          sx={SPACING.itemMargin}
        >
          {TEXT.emptyAddons}
        </Typography>
      )}

      {fields.map((field, index) => (
        <Grid
          container
          spacing={1}
          alignItems="center"
          sx={SPACING.smallMargin}
          key={field.id}
        >
          <Grid item xs={6}>
            <Controller
              control={control}
              name={`subjectOptions.${subjectIndex}.addons.${index}.label`}
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
              name={`subjectOptions.${subjectIndex}.addons.${index}.price`}
              defaultValue={0}
              render={({ field }) => (
                <TextField
                  label={TEXT.priceField}
                  type="number"
                  fullWidth
                  size="small"
                  InputProps={{
                    inputProps: { min: 0 },
                    endAdornment: currency ? (
                      <span style={{ marginLeft: 4 }}>{currency}</span>
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
              aria-label="Hapus layanan"
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Grid>
        </Grid>
      ))}

      <Button
        variant="outlined"
        startIcon={<AddIcon />}
        onClick={() => append({ label: "", price: 0 })}
        size="small"
        sx={{ mt: 1 }}
      >
        {TEXT.addAddon}
      </Button>
    </Box>
  );
};

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
              name={`subjectOptions.${subjectIndex}.questions.${index}.label`}
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
        {TEXT.subjectOptions}
      </Typography>
      <Typography
        variant="body2"
        color="text.secondary"
        sx={SPACING.sectionMargin}
      >
        {TEXT.subjectOptionsDescription}
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
            {TEXT.emptySubjects}
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={SPACING.itemMargin}
          >
            {TEXT.emptySubjectsDescription}
          </Typography>
        </Box>
      )}

      {subjects.map((subject, subjectIndex) => (
        <Paper
          key={subject.id}
          variant="outlined"
          elevation={0}
          sx={{ p: 3, mb: 3, borderRadius: 2 }}
        >
          <Grid
            container
            spacing={2}
            alignItems="center"
            sx={SPACING.sectionMargin}
          >
            <Grid item xs={12} md={4}>
              <Controller
                control={control}
                name={`subjectOptions.${subjectIndex}.title`}
                render={({ field }) => (
                  <TextField
                    label={TEXT.subjectTitle}
                    fullWidth
                    helperText={TEXT.subjectTitleHelper}
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
                    label={TEXT.maxItems}
                    type="number"
                    fullWidth
                    error={!!fieldState.error}
                    helperText={
                      fieldState.error
                        ? TEXT.maxItemsError
                        : TEXT.maxItemsHelper
                    }
                    InputProps={{
                      inputProps: { min: 1 },
                      endAdornment: (
                        <Tooltip title={TEXT.maxItemsTooltip}>
                          <InputAdornment position="end">
                            <InfoIcon fontSize="small" color="action" />
                          </InputAdornment>
                        </Tooltip>
                      ),
                    }}
                    {...field}
                    onChange={(e) => {
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
                    label={TEXT.discount}
                    type="number"
                    fullWidth
                    error={!!fieldState.error}
                    helperText={
                      fieldState.error
                        ? TEXT.discountError
                        : TEXT.discountHelper
                    }
                    InputProps={{
                      inputProps: { min: 0, max: 100 },
                      endAdornment: (
                        <InputAdornment position="end">%</InputAdornment>
                      ),
                    }}
                    {...field}
                    onChange={(e) => {
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
                aria-label="Hapus subjek"
              >
                {TEXT.delete}
              </Button>
            </Grid>
          </Grid>

          <Divider sx={SPACING.sectionMargin} />

          {/* Option Groups */}
          <Box sx={SPACING.sectionMargin}>
            <SectionHeader
              title={TEXT.optionGroups}
              description={TEXT.optionGroupsDescription}
            />
            <SubjectOptionGroup
              control={control}
              subjectIndex={subjectIndex}
              currency={currency}
            />
          </Box>

          {/* Addons */}
          <Box sx={SPACING.sectionMargin}>
            <SectionHeader
              title={TEXT.additionalServices}
              description={TEXT.additionalServicesDescription}
            />
            <SubjectAddonList
              control={control}
              subjectIndex={subjectIndex}
              currency={currency}
            />
          </Box>

          {/* Questions */}
          <Box>
            <SectionHeader
              title={TEXT.questions}
              description={TEXT.questionsDescription}
            />
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
        {TEXT.addSubjectGroup}
      </Button>
    </Box>
  );
};

export default SubjectOptionsSection;

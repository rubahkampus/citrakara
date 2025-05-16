// src/components/dashboard/commissions/form/BasicInfoSection.tsx
import React, { useEffect, useState } from "react";
import {
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Typography,
  Box,
  FormControlLabel,
  Checkbox,
  InputAdornment,
} from "@mui/material";
import { Controller, useFormContext } from "react-hook-form";
import { CommissionFormValues } from "../CommissionFormPage";

// Constants - keeps code organized and makes future changes easier
const FORM_LABELS = {
  title: "Judul",
  basePrice: "Harga Dasar",
  slots: "Slot",
  type: "Tipe",
  flow: "Alur",
  useBasePrice: "Gunakan harga dasar (IDR)",
  unlimitedSlots: "Slot tidak terbatas",
};

const ERROR_MESSAGES = {
  titleRequired: "Judul diperlukan",
  slotsValidation: "Slot minimal 1 atau -1 untuk tidak terbatas",
  typeRequired: "Tipe diperlukan",
  flowRequired: "Alur diperlukan",
};

const HELPER_TEXTS = {
  basePrice: "Masukkan angka positif",
  slots: "Jumlah slot yang tersedia",
  basePriceEnabled: "Pesanan akan dimulai dengan harga dasar",
  basePriceDisabled: "Harga dasar akan diatur ke 0",
};

const TYPE_OPTIONS = [
  { value: "template", label: "YCH" },
  { value: "custom", label: "Kustom" },
];

const FLOW_OPTIONS = [
  { value: "standard", label: "Standar" },
  { value: "milestone", label: "Milestone" },
];

// Types
interface BasicInfoSectionProps {
  mode: "create" | "edit";
}

interface DisplayValues {
  basePrice: number;
  slots: string;
  type: string;
  flow: string;
  title: string;
}

const BasicInfoSection: React.FC<BasicInfoSectionProps> = ({ mode }) => {
  const {
    control,
    formState: { errors },
    setValue,
    getValues,
  } = useFormContext<CommissionFormValues>();

  // State management
  const [displayValues, setDisplayValues] = useState<DisplayValues>({
    basePrice: 0,
    slots: "",
    type: "",
    flow: "",
    title: "",
  });
  // const [usesBasePrice, setUsesBasePrice] = useState(true);
  const [isUnlimited, setIsUnlimited] = useState(false);

  // Handlers
  const updateDisplayValues = () => {
    const values = getValues();
    setDisplayValues({
      basePrice: values.basePrice || 0,
      slots: values.slots?.toString() || "",
      type: values.type || "",
      flow: values.flow || "",
      title: values.title || "",
    });
  };

  // const handleBasePriceToggle = (checked: boolean) => {
  //   setUsesBasePrice(checked);
  //   if (!checked) {
  //     setValue("basePrice", 0, {
  //       shouldValidate: true,
  //       shouldDirty: true,
  //     });
  //   }
  //   updateDisplayValues();
  // };

  const handleUnlimitedSlots = (checked: boolean) => {
    setIsUnlimited(checked);
    setValue("slots", checked ? -1 : 1, {
      shouldValidate: true,
      shouldDirty: true,
    });
    updateDisplayValues();
  };

  // Initialize state on component mount
  useEffect(() => {
    const values = getValues();
    setIsUnlimited(values.slots === -1);

    const initialBasePrice = values.basePrice;
    // const shouldUseBasePrice =
    //   initialBasePrice !== 0 && initialBasePrice !== null;
    // setUsesBasePrice(shouldUseBasePrice);

    updateDisplayValues();
  }, []);

  return (
    <Box
      sx={{
        mb: 4,
        p: 3,
        border: "1px solid #e0e0e0",
        borderRadius: 2,
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)",
        transition: "box-shadow 0.3s ease",
        "&:hover": {
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
        },
      }}
    >
      <Typography variant="h5" fontWeight="bold" gutterBottom mb={2}>
        Pengaturan
      </Typography>

      <Grid container spacing={3}>
        {/* Title Field */}
        <Grid item xs={12}>
          <Controller
            name="title"
            control={control}
            rules={{ required: ERROR_MESSAGES.titleRequired }}
            render={({ field }) => (
              <TextField
                {...field}
                label={FORM_LABELS.title}
                fullWidth
                error={!!errors.title}
                helperText={errors.title?.message}
                onChange={(e) => {
                  field.onChange(e);
                  updateDisplayValues();
                }}
              />
            )}
          />
        </Grid>

        {/* Type Dropdown */}
        <Grid item xs={12} sm={6}>
          <Controller
            name="type"
            control={control}
            rules={{ required: ERROR_MESSAGES.typeRequired }}
            render={({ field }) => (
              <FormControl fullWidth error={!!errors.type}>
                <InputLabel>{FORM_LABELS.type}</InputLabel>
                <Select
                  {...field}
                  label={FORM_LABELS.type}
                  onChange={(e) => {
                    field.onChange(e);
                    updateDisplayValues();
                  }}
                >
                  {TYPE_OPTIONS.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
                {errors.type && (
                  <FormHelperText>{errors.type.message}</FormHelperText>
                )}
              </FormControl>
            )}
          />
        </Grid>

        {/* Flow Dropdown */}
        <Grid item xs={12} sm={6}>
          <Controller
            name="flow"
            control={control}
            rules={{ required: ERROR_MESSAGES.flowRequired }}
            render={({ field }) => (
              <FormControl fullWidth error={!!errors.flow}>
                <InputLabel>{FORM_LABELS.flow}</InputLabel>
                <Select
                  {...field}
                  label={FORM_LABELS.flow}
                  onChange={(e) => {
                    field.onChange(e);
                    updateDisplayValues();
                  }}
                >
                  {FLOW_OPTIONS.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
                {errors.flow && (
                  <FormHelperText>{errors.flow.message}</FormHelperText>
                )}
              </FormControl>
            )}
          />
        </Grid>

        {/* Base Price Field */}
        <Grid item xs={12} sm={6}>
          <Controller
            name="basePrice"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label={FORM_LABELS.basePrice}
                fullWidth
                type="number"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">IDR</InputAdornment>
                  ),
                  inputProps: { min: 0 },
                }}
                onChange={(e) => {
                  const value =
                    e.target.value === "" ? 0 : parseInt(e.target.value, 10);
                  const sanitizedValue = isNaN(value) ? 0 : Math.max(0, value);
                  field.onChange(sanitizedValue);
                  updateDisplayValues();
                }}
                error={!!errors.basePrice}
                helperText={HELPER_TEXTS.basePrice}
                // disabled={!usesBasePrice}
              />
            )}
          />
        </Grid>

        {/* Base Price Toggle */}
        {/* <Grid item xs={12} sm={6}>
        <Box sx={{ mt: 1 }}>
          <FormControlLabel
            control={
              <Checkbox
                checked={usesBasePrice}
                onChange={(e) => handleBasePriceToggle(e.target.checked)}
              />
            }
            label={FORM_LABELS.useBasePrice}
          />
          <Typography variant="caption" color="text.secondary" display="block">
            {usesBasePrice
              ? HELPER_TEXTS.basePriceEnabled
              : HELPER_TEXTS.basePriceDisabled}
          </Typography>
        </Box>
      </Grid> */}

        {/* Slots Field */}
        <Grid item xs={12} sm={6}>
          <Controller
            name="slots"
            control={control}
            rules={{
              validate: (value) =>
                value === -1 || value >= 1 || ERROR_MESSAGES.slotsValidation,
            }}
            render={({ field }) => (
              <>
                <TextField
                  label={FORM_LABELS.slots}
                  fullWidth
                  type="number"
                  disabled={isUnlimited}
                  value={isUnlimited ? "" : field.value}
                  InputProps={{
                    inputProps: { min: 1 },
                  }}
                  onChange={(e) => {
                    const value = parseInt(e.target.value, 10);
                    const newValue = isNaN(value) || value < 1 ? 1 : value;
                    field.onChange(newValue);
                    updateDisplayValues();
                  }}
                  error={!!errors.slots}
                  helperText={errors.slots?.message || HELPER_TEXTS.slots}
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={isUnlimited}
                      onChange={(e) => handleUnlimitedSlots(e.target.checked)}
                    />
                  }
                  label={FORM_LABELS.unlimitedSlots}
                />
              </>
            )}
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default BasicInfoSection;

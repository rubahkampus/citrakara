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
} from "@mui/material";
import { Controller, useFormContext } from "react-hook-form";
import { CommissionFormValues } from "../CommissionFormPage";
import { axiosClient } from "@/lib/utils/axiosClient";

interface BasicInfoSectionProps {
  mode: "create" | "edit";
}

export interface ListingSummary {
  _id: string;
  title: string;
}

const BasicInfoSection: React.FC<BasicInfoSectionProps> = ({ mode }) => {
  const {
    control,
    register,
    formState: { errors },
    setValue,
    getValues,
  } = useFormContext<CommissionFormValues>();

  // Use React state for tracking form values we want to display
  const [displayValues, setDisplayValues] = useState({
    basePrice: 0,
    slots: "",
    type: "",
    flow: "",
    title: "",
    // tos: "",
  });

  // Add state for base price toggle
  const [usesBasePrice, setUsesBasePrice] = useState(true);

  // Explicitly update our display state when form values change
  const updateDisplayValues = () => {
    const values = getValues();
    setDisplayValues({
      basePrice: values.basePrice || 0,
      slots: values.slots?.toString() || "",
      type: values.type || "",
      flow: values.flow || "",
      title: values.title || "",
      // tos: values.tos || "",
    });
    console.log("Updated display values:", values);
  };

  // Track unlimited slots checkbox state
  const [isUnlimited, setIsUnlimited] = useState(false);

  // Initialize form value display, unlimited slots state, and base price toggle
  useEffect(() => {
    const values = getValues();
    setIsUnlimited(values.slots === -1);

    // Initialize the base price toggle based on current value
    // If base price is 0, set uses base price to false
    const initialBasePrice = values.basePrice;
    const shouldUseBasePrice =
      initialBasePrice !== 0 && initialBasePrice !== null;
    setUsesBasePrice(shouldUseBasePrice);

    updateDisplayValues();
  }, []);

  return (
    <>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Controller
            name="title"
            control={control}
            rules={{ required: "Judul diperlukan" }}
            render={({ field }) => (
              <TextField
                {...field}
                label="Judul"
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

        <Grid item xs={12} sm={6}>
          <Controller
            name="basePrice"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Harga Dasar"
                fullWidth
                type="number"
                InputProps={{
                  startAdornment: <span style={{ marginRight: 4 }}>IDR</span>,
                }}
                // Only allow positive integers
                onKeyPress={(e) => {
                  // Allow only numbers
                  if (!/[0-9]/.test(e.key)) {
                    e.preventDefault();
                  }
                }}
                onChange={(e) => {
                  // Convert to number and handle invalid input
                  const value =
                    e.target.value === "" ? 0 : parseInt(e.target.value, 10);
                  const sanitizedValue = isNaN(value) ? 0 : Math.max(0, value);

                  // Update with sanitized value
                  field.onChange(sanitizedValue);
                  console.log("Base price changed to:", sanitizedValue);

                  // Update our display state
                  updateDisplayValues();
                }}
                error={!!errors.basePrice}
                helperText="Masukkan angka positif"
                disabled={!usesBasePrice}
                // disabled={mode === "edit" || !usesBasePrice}
              />
            )}
          />
        </Grid>

        {/* Replace currency with "use base price" toggle */}
        <Grid item xs={12} sm={6}>
          <Box sx={{ mt: 1 }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={usesBasePrice}
                  onChange={(e) => {
                    setUsesBasePrice(e.target.checked);
                    // If disabled, set base price to 0
                    if (!e.target.checked) {
                      setValue("basePrice", 0, {
                        shouldValidate: true,
                        shouldDirty: true,
                      });
                    }
                    console.log("Uses base price:", e.target.checked);
                    updateDisplayValues();
                  }}
                />
              }
              label="Gunakan harga dasar (IDR)"
            />
            <Typography
              variant="caption"
              color="text.secondary"
              display="block"
            >
              {usesBasePrice
                ? "Pesanan akan dimulai dengan harga dasar"
                : "Harga dasar akan diatur ke 0"}
            </Typography>
          </Box>
        </Grid>

        <Grid item xs={12} sm={4}>
          {/* Replace slots dropdown with a number input and 'unlimited' checkbox */}
          <Box>
            <Controller
              name="slots"
              control={control}
              rules={{
                validate: (value) =>
                  value === -1 ||
                  value >= 1 ||
                  "Slot minimal 1 atau -1 untuk tidak terbatas",
              }}
              render={({ field }) => (
                <>
                  <TextField
                    label="Slot"
                    fullWidth
                    type="number"
                    disabled={isUnlimited}
                    value={isUnlimited ? "" : field.value}
                    InputProps={{
                      inputProps: { min: 1 },
                    }}
                    onChange={(e) => {
                      // Ensure whole positive number
                      const value = parseInt(e.target.value, 10);
                      // Default to 1 if invalid
                      const newValue = isNaN(value) || value < 1 ? 1 : value;
                      field.onChange(newValue);
                      console.log("Slots changed to:", newValue);
                      updateDisplayValues();
                    }}
                    error={!!errors.slots}
                    helperText={
                      errors.slots?.message || "Jumlah slot yang tersedia"
                    }
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={isUnlimited}
                        onChange={(e) => {
                          setIsUnlimited(e.target.checked);
                          // Set slots to -1 if unlimited, or 1 if limited
                          setValue("slots", e.target.checked ? -1 : 1, {
                            shouldValidate: true,
                            shouldDirty: true,
                          });
                          console.log("Unlimited slots:", e.target.checked);
                          updateDisplayValues();
                        }}
                      />
                    }
                    label="Slot tidak terbatas"
                  />
                </>
              )}
            />
          </Box>
        </Grid>

        <Grid item xs={12} sm={4}>
          <Controller
            name="type"
            control={control}
            rules={{ required: "Tipe diperlukan" }}
            render={({ field }) => (
              <FormControl fullWidth error={!!errors.type}>
                <InputLabel>Tipe</InputLabel>
                <Select
                  {...field}
                  label="Tipe"
                  // disabled={mode === "edit"}
                  onChange={(e) => {
                    field.onChange(e);
                    console.log("Type changed to:", e.target.value);
                    updateDisplayValues();
                  }}
                >
                  <MenuItem value="template">Template</MenuItem>
                  <MenuItem value="custom">Kustom</MenuItem>
                </Select>
                {errors.type && (
                  <FormHelperText>{errors.type.message}</FormHelperText>
                )}
              </FormControl>
            )}
          />
        </Grid>

        <Grid item xs={12} sm={4}>
          <Controller
            name="flow"
            control={control}
            rules={{ required: "Alur diperlukan" }}
            render={({ field }) => (
              <FormControl fullWidth error={!!errors.flow}>
                <InputLabel>Alur</InputLabel>
                <Select
                  {...field}
                  label="Alur"
                  // disabled={mode === "edit"}
                  onChange={(e) => {
                    field.onChange(e);
                    console.log("Flow changed to:", e.target.value);
                    updateDisplayValues();
                  }}
                >
                  <MenuItem value="standard">Standar</MenuItem>
                  <MenuItem value="milestone">Milestone</MenuItem>
                </Select>
                {errors.flow && (
                  <FormHelperText>{errors.flow.message}</FormHelperText>
                )}
              </FormControl>
            )}
          />
        </Grid>
      </Grid>
    </>
  );
};

export default BasicInfoSection;

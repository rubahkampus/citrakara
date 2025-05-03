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

  // fetch TOS entries
  const [tosName, setTosName] = useState("Default Terms of Service");
  useEffect(() => {
    (async () => {
      try {
        const res = await axiosClient.get("/api/tos/default");
        if (res.data.tos) {
          setTosName(res.data.tos.title);
          setValue("tos", res.data.tos._id.toString());
        }
      } catch (error) {
        console.error("Error fetching default TOS:", error);
      }
    })();
  }, [setValue]);

  return (
    <>
      {/* Debug display with state that updates properly */}
      <Box
        sx={{
          mb: 2,
          p: 2,
          bgcolor: "#f5f5f5",
          borderRadius: 1,
          border: "1px solid #e0e0e0",
        }}
      >
        <Typography variant="subtitle2" gutterBottom>
          Debug Values:
        </Typography>
        <Typography variant="body2">Title: {displayValues.title}</Typography>
        <Typography variant="body2">
          Base Price: {displayValues.basePrice} (Use Base Price:{" "}
          {usesBasePrice ? "Yes" : "No"})
        </Typography>
        <Typography variant="body2">
          Slots: {displayValues.slots} (Unlimited: {isUnlimited ? "Yes" : "No"})
        </Typography>
        <Typography variant="body2">Type: {displayValues.type}</Typography>
        <Typography variant="body2">Flow: {displayValues.flow}</Typography>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <TextField
            label="Title"
            fullWidth
            {...register("title", { required: "Title is required" })}
            error={!!errors.title}
            helperText={errors.title?.message}
            onChange={(e) => {
              register("title").onChange(e);
              updateDisplayValues();
            }}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <Controller
            name="basePrice"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Base Price"
                fullWidth
                type="number"
                InputProps={{
                  startAdornment: <span style={{ marginRight: 4 }}>Rp</span>,
                }}
                // Only allow positive integers
                onKeyPress={(e) => {
                  // Allow only numbers
                  if (!/[0-9]/.test(e.key)) {
                    e.preventDefault();
                  }
                }}
                onChange={(e) => {
                  // Remove leading zeros and handle empty input
                  let inputValue = e.target.value;

                  // Remove leading zeros but keep a single zero
                  if (inputValue.length > 1 && inputValue.startsWith("0")) {
                    inputValue = inputValue.replace(/^0+/, "");
                  }

                  // Convert to number and handle invalid input
                  const value =
                    inputValue === "" ? 0 : parseInt(inputValue, 10);
                  const sanitizedValue = isNaN(value) ? 0 : Math.max(0, value);

                  // Update with sanitized value
                  field.onChange(sanitizedValue);
                  console.log("Base price changed to:", sanitizedValue);

                  // Update our display state
                  updateDisplayValues();
                }}
                // Prevent leading zeros on blur for better UX
                onBlur={(e) => {
                  field.onBlur();
                  const value = field.value;
                  if (value === 0) {
                    // Keep field empty or show "0" depending on your preference
                    field.onChange(0);
                  }
                }}
                error={!!errors.basePrice}
                helperText="Enter a positive number"
                disabled={mode === "edit" || !usesBasePrice}
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
              label="Use base price (IDR)"
            />
            <Typography
              variant="caption"
              color="text.secondary"
              display="block"
            >
              {usesBasePrice
                ? "Commission will start with a base price"
                : "Base price will be set to 0"}
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
                  "Slots must be at least 1 or -1 for unlimited",
              }}
              render={({ field }) => (
                <>
                  <TextField
                    label="Slots"
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
                      errors.slots?.message || "Number of available slots"
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
                    label="Unlimited slots"
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
            rules={{ required: "Type required" }}
            render={({ field }) => (
              <FormControl fullWidth error={!!errors.type}>
                <InputLabel>Type</InputLabel>
                <Select
                  {...field}
                  label="Type"
                  disabled={mode === "edit"}
                  onChange={(e) => {
                    field.onChange(e);
                    console.log("Type changed to:", e.target.value);
                    updateDisplayValues();
                  }}
                >
                  <MenuItem value="template">Template</MenuItem>
                  <MenuItem value="custom">Custom</MenuItem>
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
            rules={{ required: "Flow required" }}
            render={({ field }) => (
              <FormControl fullWidth error={!!errors.flow}>
                <InputLabel>Flow</InputLabel>
                <Select
                  {...field}
                  label="Flow"
                  disabled={mode === "edit"}
                  onChange={(e) => {
                    field.onChange(e);
                    console.log("Flow changed to:", e.target.value);
                    updateDisplayValues();
                  }}
                >
                  <MenuItem value="standard">Standard</MenuItem>
                  <MenuItem value="milestone">Milestone</MenuItem>
                </Select>
                {errors.flow && (
                  <FormHelperText>{errors.flow.message}</FormHelperText>
                )}
              </FormControl>
            )}
          />
        </Grid>

        <Grid item xs={12}>
          {/* Display fixed TOS */}
          <TextField
            label="Terms of Service"
            value={tosName}
            fullWidth
            disabled
            helperText="Using default terms of service"
          />
        </Grid>
      </Grid>
    </>
  );
};

export default BasicInfoSection;

/* ---------------- BasicInfoSection.tsx ----------------*/

import React, { useEffect, useState } from "react";
import {
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
} from "@mui/material";
import { Controller, useFormContext } from "react-hook-form";
import { CommissionFormValues } from "../CommissionFormPage"; // adjust path after file split
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
    watch,
  } = useFormContext<CommissionFormValues>();

  // fetch TOS entries
  const [tosOptions, setTosOptions] = useState<{ _id: string; title: string }[]>([]);
  useEffect(() => {
    (async () => {
      const res = await axiosClient.get("/api/tos");
      setTosOptions(res.data.tosEntries || []);
    })();
  }, []);

  return (
    <>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <TextField
            label="Title"
            fullWidth
            {...register("title", { required: "Title is required" })}
            error={!!errors.title}
            helperText={errors.title?.message}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <Controller
            name="basePrice"
            control={control}
            rules={{ required: "Base price required", pattern: /^[0-9]+$/ }}
            render={({ field }) => (
              <TextField
                {...field}
                label="Base Price"
                fullWidth
                InputProps={{ startAdornment: <span style={{ marginRight: 4 }}>{watch("currency")}</span> }}
                error={!!errors.basePrice}
                helperText={errors.basePrice?.message}
                disabled={mode === "edit"}
              />
            )}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <Controller
            name="currency"
            control={control}
            rules={{ required: "Currency required" }}
            render={({ field }) => (
              <FormControl fullWidth error={!!errors.currency}>
                <InputLabel>Currency</InputLabel>
                <Select {...field} label="Currency">
                  <MenuItem value="IDR">IDR</MenuItem>
                  <MenuItem value="USD">USD</MenuItem>
                  <MenuItem value="EUR">EUR</MenuItem>
                </Select>
                {errors.currency && <FormHelperText>{errors.currency.message}</FormHelperText>}
              </FormControl>
            )}
          />
        </Grid>

        <Grid item xs={12} sm={4}>
          <Controller
            name="slots"
            control={control}
            rules={{ required: "Slots required" }}
            render={({ field }) => (
              <FormControl fullWidth error={!!errors.slots}>
                <InputLabel>Slots</InputLabel>
                <Select {...field} label="Slots">
                  <MenuItem value={-1}>Unlimited</MenuItem>
                  {[1, 2, 3, 5, 10].map((n) => (
                    <MenuItem key={n} value={n}>{n}</MenuItem>
                  ))}
                </Select>
                {errors.slots && <FormHelperText>{errors.slots.message}</FormHelperText>}
              </FormControl>
            )}
          />
        </Grid>

        <Grid item xs={12} sm={4}>
          <Controller
            name="type"
            control={control}
            rules={{ required: "Type required" }}
            render={({ field }) => (
              <FormControl fullWidth error={!!errors.type}>
                <InputLabel>Type</InputLabel>
                <Select {...field} label="Type" disabled={mode === "edit"}>
                  <MenuItem value="template">Template</MenuItem>
                  <MenuItem value="custom">Custom</MenuItem>
                </Select>
                {errors.type && <FormHelperText>{errors.type.message}</FormHelperText>}
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
                <Select {...field} label="Flow" disabled={mode === "edit"}>
                  <MenuItem value="standard">Standard</MenuItem>
                  <MenuItem value="milestone">Milestone</MenuItem>
                </Select>
                {errors.flow && <FormHelperText>{errors.flow.message}</FormHelperText>}
              </FormControl>
            )}
          />
        </Grid>

        <Grid item xs={12}>
          <Controller
            name="tos"
            disabled
            control={control}
            rules={{ required: "TOS required" }}
            render={({ field }) => (
              <FormControl fullWidth error={!!errors.tos}>
                <InputLabel>Terms of Service</InputLabel>
                <Select {...field} label="Terms of Service" disabled={mode === "edit" && !!field.value}>
                  {tosOptions.length === 0 ? (
                    <MenuItem value="" disabled>No TOS entries</MenuItem>
                  ) : (
                    tosOptions.map((t) => <MenuItem key={t._id} value={t._id}>{t.title}</MenuItem>)
                  )}
                </Select>
                {errors.tos && <FormHelperText>{errors.tos.message}</FormHelperText>}
              </FormControl>
            )}
          />
        </Grid>
      </Grid>
    </>
  );
};

export default BasicInfoSection;
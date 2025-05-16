"use client";
import React, { useState, useEffect } from "react";
import {
  Box,
  Grid,
  Typography,
  FormControlLabel,
  Switch,
  FormGroup,
  Checkbox,
  FormHelperText,
  Paper,
  Tooltip,
} from "@mui/material";
import { useFormContext, Controller } from "react-hook-form";
import { CommissionFormValues } from "../CommissionFormPage";

// Constants for better organization and maintenance
const CHANGEABLE_KEYS = {
  DEADLINE: "deadline",
  GENERAL_OPTIONS: "generalOptions",
  SUBJECT_OPTIONS: "subjectOptions",
  GENERAL_DESCRIPTION: "generalDescription",
  REFERENCE_IMAGES: "referenceImages",
};

// Translated labels for changeable keys
const CHANGEABLE_KEY_LABELS = {
  [CHANGEABLE_KEYS.DEADLINE]: "Tenggat Waktu",
  [CHANGEABLE_KEYS.GENERAL_OPTIONS]: "Opsi Umum",
  [CHANGEABLE_KEYS.SUBJECT_OPTIONS]: "Opsi Subjek",
  [CHANGEABLE_KEYS.GENERAL_DESCRIPTION]: "Deskripsi Umum",
  [CHANGEABLE_KEYS.REFERENCE_IMAGES]: "Gambar Referensi",
};

// Array of all changeable keys for iteration
const CHANGEABLE_KEYS_ARRAY = Object.values(CHANGEABLE_KEYS);

const ContractSection: React.FC = () => {
  const { control, watch, setValue } = useFormContext<CommissionFormValues>();

  // Watch the field directly and use state to ensure proper rendering
  const allowContractChange = watch("allowContractChange");
  const [isEnabled, setIsEnabled] = useState<boolean>(false);

  // Use effect to update our local state when the form value changes
  useEffect(() => {
    setIsEnabled(!!allowContractChange);
  }, [allowContractChange]);

  // Handle switch toggle explicitly
  const handleSwitchChange = (newValue: boolean) => {
    setValue("allowContractChange", newValue);
    setIsEnabled(newValue);

    // If disabling, clear all selections
    if (!newValue) {
      setValue("changeable", []);
    }
  };

  return (
    <Box
      sx={{
        mb: 4,
        p: 3,
        border: "1px solid #e0e0e0",
        borderRadius: 2,
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)",
        transition: "all 0.3s ease",
        "&:hover": {
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
        },
      }}
    >
      <Typography variant="h6" fontWeight="bold" gutterBottom>
        Modifikasi Kontrak
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Tentukan apakah klien dapat mengajukan perubahan pada kontrak ketika komisi sudah berjalan
      </Typography>

      <Grid container spacing={2} alignItems="center">
        <Grid item xs={12} sm={6}>
          <FormControlLabel
            control={
              <Switch
                checked={isEnabled}
                onChange={(e) => handleSwitchChange(e.target.checked)}
                color="primary"
              />
            }
            label="Izinkan Klien Mengajukan Perubahan"
          />
        </Grid>
        <Grid item xs={12}>
          <Paper
            variant="outlined"
            sx={{
              p: 2,
              borderRadius: 2,
              opacity: isEnabled ? 1 : 0.7,
              transition: "opacity 0.3s ease",
              backgroundColor: isEnabled
                ? "background.paper"
                : "background.default",
            }}
          >
            <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
              Apa yang dapat diubah oleh klien?
            </Typography>
            <FormGroup row>
              {CHANGEABLE_KEYS_ARRAY.map((key) => (
                <Controller
                  key={key}
                  control={control}
                  name="changeable"
                  render={({ field }) => {
                    const checked =
                      Array.isArray(field.value) && field.value.includes(key);
                    const toggle = () => {
                      if (!isEnabled) return;

                      if (checked) {
                        setValue(
                          "changeable",
                          (field.value || []).filter((v: string) => v !== key)
                        );
                      } else {
                        setValue("changeable", [...(field.value || []), key]);
                      }
                    };
                    return (
                      <Tooltip
                        title={
                          isEnabled
                            ? ""
                            : "Aktifkan opsi di atas untuk memilih ini"
                        }
                        placement="top"
                      >
                        <FormControlLabel
                          disabled={!isEnabled}
                          control={
                            <Checkbox
                              checked={checked || false}
                              onChange={toggle}
                              disabled={!isEnabled}
                              color="primary"
                            />
                          }
                          label={CHANGEABLE_KEY_LABELS[key]}
                          sx={{
                            m: 1,
                            borderRadius: 1,
                            px: 1,
                            "&:hover": {
                              backgroundColor: isEnabled
                                ? "rgba(0, 0, 0, 0.04)"
                                : "transparent",
                            },
                          }}
                        />
                      </Tooltip>
                    );
                  }}
                />
              ))}
            </FormGroup>
            {!isEnabled && (
              <FormHelperText sx={{ mt: 1, fontStyle: "italic" }}>
                Aktifkan opsi di atas untuk mengizinkan klien mengajukan
                perubahan.
              </FormHelperText>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ContractSection;

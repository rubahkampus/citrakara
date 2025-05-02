// ---------------- ContractSection.tsx ----------------

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
} from "@mui/material";
import { useFormContext, Controller } from "react-hook-form";
import { CommissionFormValues } from "../CommissionFormPage";

const changeableKeys = [
  "deadline",
  "generalOptions",
  "subjectOptions",
  "description",
  "referenceImages",
];

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
    <Box>
      <Typography variant="h6" fontWeight="bold" gutterBottom>
        Contract Modifications
      </Typography>

      <Grid container spacing={2} alignItems="center">
        <Grid item xs={12} sm={6}>
          <FormControlLabel
            control={
              <Switch
                checked={isEnabled}
                onChange={(e) => handleSwitchChange(e.target.checked)}
              />
            }
            label="Allow Client to Propose Changes"
          />
        </Grid>
        <Grid item xs={12}>
          <Paper
            variant="outlined"
            sx={{
              p: 2,
              borderRadius: 2,
              opacity: isEnabled ? 1 : 0.7,
            }}
          >
            <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
              What can the client request to modify?
            </Typography>
            <FormGroup row>
              {changeableKeys.map((k) => (
                <Controller
                  key={k}
                  control={control}
                  name="changeable"
                  render={({ field }) => {
                    const checked =
                      Array.isArray(field.value) && field.value.includes(k);
                    const toggle = () => {
                      if (!isEnabled) return;

                      if (checked) {
                        setValue(
                          "changeable",
                          (field.value || []).filter((v: string) => v !== k)
                        );
                      } else {
                        setValue("changeable", [...(field.value || []), k]);
                      }
                    };
                    return (
                      <FormControlLabel
                        disabled={!isEnabled}
                        control={
                          <Checkbox
                            checked={checked || false}
                            onChange={toggle}
                            disabled={!isEnabled}
                          />
                        }
                        label={k}
                      />
                    );
                  }}
                />
              ))}
            </FormGroup>
            {!isEnabled && (
              <FormHelperText sx={{ mt: 1 }}>
                Enable the switch above to let clients request changes.
              </FormHelperText>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ContractSection;

"use client";
import React from "react";
import {
  Grid,
  TextField,
  IconButton,
  Box,
  Checkbox,
  FormControlLabel,
  Typography,
  Paper,
  Button,
  Divider,
  Alert,
  Tooltip,
} from "@mui/material";
import {
  Controller,
  useFieldArray,
  useFormContext,
  useWatch,
} from "react-hook-form";
import { CommissionFormValues } from "../CommissionFormPage";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import InfoIcon from "@mui/icons-material/Info";

const MilestonesSection: React.FC = () => {
  const { control } = useFormContext<CommissionFormValues>();
  const flow = useWatch({ control, name: "flow" });
  const revisionType = useWatch({ control, name: "revisionType" });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "milestones",
  });

  const showRevisionFields =
    flow === "milestone" && revisionType === "milestone";

  // Check if total percentage adds up to 100
  const percentages = fields.map((f) => f.percent || 0);
  const totalPercent = percentages.reduce((sum, val) => sum + val, 0);
  const isValid = totalPercent === 100;

  if (flow !== "milestone") return null;

  return (
    <Box>
      <Typography variant="h6" fontWeight="bold" gutterBottom>
        Milestones
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Break your commission into stages with separate deliverables and
        payments
      </Typography>

      {!isValid && fields.length > 0 && (
        <Alert
          severity={totalPercent > 100 ? "error" : "warning"}
          sx={{ mb: 2 }}
        >
          {totalPercent > 100
            ? "Total milestone percentages exceed 100%. Please adjust."
            : `Total milestone percentages: ${totalPercent}%. Should add up to 100%.`}
        </Alert>
      )}

      {fields.length === 0 && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Add at least one milestone to define your commission workflow.
        </Alert>
      )}

      {fields.map((milestone, index) => (
        <Paper
          key={milestone.id}
          variant="outlined"
          sx={{ p: 2, mb: 2, borderRadius: 1 }}
        >
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={showRevisionFields ? 4 : 6}>
              <Controller
                control={control}
                name={`milestones.${index}.title`}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Milestone Title"
                    placeholder="e.g. Sketch, Lineart, Coloring"
                  />
                )}
              />
            </Grid>

            <Grid item xs={6} sm={showRevisionFields ? 2 : 4}>
              <Controller
                control={control}
                name={`milestones.${index}.percent`}
                render={({ field }) => (
                  <TextField
                    {...field}
                    type="number"
                    fullWidth
                    label="Payment %"
                    InputProps={{
                      endAdornment: "%",
                      inputProps: { min: 0, max: 100 },
                    }}
                  />
                )}
              />
            </Grid>

            {showRevisionFields && (
              <Grid item xs={12} sm={5}>
                <Box
                  sx={{
                    border: "1px solid",
                    borderColor: "divider",
                    p: 1,
                    borderRadius: 1,
                  }}
                >
                  <Typography variant="caption" display="block" gutterBottom>
                    Revision Policy
                  </Typography>
                  <Grid container spacing={1} alignItems="center">
                    <Grid item xs={3}>
                      <Controller
                        control={control}
                        name={`milestones.${index}.policy.limit`}
                        render={({ field }) => (
                          <Tooltip title="Limit the number of revisions">
                            <FormControlLabel
                              control={
                                <Checkbox
                                  {...field}
                                  checked={!!field.value}
                                  size="small"
                                />
                              }
                              label="Limit"
                            />
                          </Tooltip>
                        )}
                      />
                    </Grid>
                    <Grid item xs={3}>
                      <Controller
                        control={control}
                        name={`milestones.${index}.policy.free`}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            type="number"
                            fullWidth
                            size="small"
                            label="Free"
                            InputProps={{ inputProps: { min: 0 } }}
                          />
                        )}
                      />
                    </Grid>
                    <Grid item xs={3}>
                      <Controller
                        control={control}
                        name={`milestones.${index}.policy.extraAllowed`}
                        render={({ field }) => (
                          <Tooltip title="Allow extra paid revisions">
                            <FormControlLabel
                              control={
                                <Checkbox
                                  {...field}
                                  checked={!!field.value}
                                  size="small"
                                />
                              }
                              label="Extra"
                            />
                          </Tooltip>
                        )}
                      />
                    </Grid>
                    <Grid item xs={3}>
                      <Controller
                        control={control}
                        name={`milestones.${index}.policy.fee`}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            type="number"
                            fullWidth
                            size="small"
                            label="Fee"
                            InputProps={{ inputProps: { min: 0 } }}
                          />
                        )}
                      />
                    </Grid>
                  </Grid>
                </Box>
              </Grid>
            )}

            <Grid item xs={6} sm={1}>
              <IconButton color="error" onClick={() => remove(index)}>
                <DeleteIcon />
              </IconButton>
            </Grid>
          </Grid>
        </Paper>
      ))}

      <Button
        variant="contained"
        startIcon={<AddIcon />}
        onClick={() =>
          append({
            title: "",
            percent: 0,
            policy: { limit: false, free: 2, extraAllowed: true, fee: 0 },
          })
        }
        sx={{ mt: 1 }}
      >
        Add Milestone
      </Button>

      {fields.length > 0 && (
        <Box sx={{ mt: 2, display: "flex", alignItems: "center" }}>
          <InfoIcon color="info" fontSize="small" sx={{ mr: 1 }} />
          <Typography variant="body2" color="text.secondary">
            Milestone percentages should add up to 100%. Current total:{" "}
            {totalPercent}%
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default MilestonesSection;

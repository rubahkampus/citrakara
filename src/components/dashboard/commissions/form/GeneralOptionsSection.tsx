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
import { useFormContext, useFieldArray } from "react-hook-form";
import { CommissionFormValues } from "../CommissionFormPage";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";

/**
 * Reusable component for price-label pairs
 */
const PriceOptionPair: React.FC<{
  label: string;
  priceSuffix?: string;
  register: any;
  remove: (index: number) => void;
  index: number;
  path: string;
}> = ({ label, priceSuffix = "", register, remove, index, path }) => (
  <Grid container spacing={1} alignItems="center" sx={{ mb: 1 }}>
    <Grid item xs={6}>
      <TextField
        label="Label"
        fullWidth
        size="small"
        {...register(`${path}.${index}.label`)}
      />
    </Grid>
    <Grid item xs={4}>
      <TextField
        label="Price"
        type="number"
        fullWidth
        size="small"
        InputProps={{
          endAdornment: priceSuffix ? (
            <span style={{ marginLeft: 4 }}>{priceSuffix}</span>
          ) : undefined,
        }}
        {...register(`${path}.${index}.price`)}
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
            <TextField
              label="Group Title"
              fullWidth
              size="small"
              {...control.register(`${path}.${groupIndex}.title`)}
              sx={{ mr: 1, flexGrow: 1 }}
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
          label="Option"
          priceSuffix={currency}
          register={control.register}
          remove={remove}
          index={index}
          path={`${parentPath}.${parentIndex}.selections`}
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
          label="Addon"
          priceSuffix={currency}
          register={control.register}
          remove={remove}
          index={index}
          path={path}
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

/**
 * Component for questions list
 */
// const QuestionList: React.FC<{
//   control: any;
//   path: string;
// }> = ({ control, path }) => {
//   const { fields, append, remove } = useFieldArray({ control, name: path });

//   return (
//     <Box>
//       {fields.length === 0 && (
//         <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
//           No questions added yet
//         </Typography>
//       )}

//       {fields.map((field, index) => (
//         <Grid
//           container
//           spacing={1}
//           key={field.id}
//           alignItems="center"
//           sx={{ mb: 1 }}
//         >
//           <Grid item xs={10}>
//             <TextField
//               label="Question"
//               fullWidth
//               size="small"
//               {...control.register(`${path}.${index}.title`)}
//             />
//           </Grid>
//           <Grid item xs={2}>
//             <IconButton
//               size="small"
//               color="error"
//               onClick={() => remove(index)}
//             >
//               <DeleteIcon fontSize="small" />
//             </IconButton>
//           </Grid>
//         </Grid>
//       ))}

//       <Button
//         variant="outlined"
//         startIcon={<AddIcon />}
//         onClick={() => append({ title: "", detail: "" })}
//         size="small"
//         sx={{ mt: 1 }}
//       >
//         Add Question
//       </Button>
//     </Box>
//   );
// };

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
            <TextField
              label="Question"
              fullWidth
              size="small"
              {...control.register(`${path}.${index}`)}
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
        onClick={() => append("")}
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
const GeneralOptionsSection: React.FC = () => {
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

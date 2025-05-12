// src/components/dashboard/contracts/tickets/form/DescriptionSection.tsx

import React, { useRef, useEffect } from "react";
import { useFormContext } from "react-hook-form";
import {
  Box,
  Typography,
  Paper,
  Divider,
  FormControlLabel,
  Switch,
} from "@mui/material";
import { IContract } from "@/lib/db/models/contract.model";
import { ChangeTicketFormValues } from "../ChangeTicketForm";

interface DescriptionSectionProps {
  contract: IContract;
  disabled: boolean;
}

export default function DescriptionSection({
  contract,
  disabled,
}: DescriptionSectionProps) {
  const { setValue, watch, formState, setError, clearErrors, getValues } =
    useFormContext<ChangeTicketFormValues>();

  const includeDescription = watch("includeDescription");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const errMsgRef = useRef<HTMLDivElement>(null);
  const fieldName = "generalDescription";

  // Get latest contract terms for initial description
  const latestTerms = contract.contractTerms[contract.contractTerms.length - 1];
  const currentDescription = latestTerms.generalDescription || "";

  // Check if description changes are allowed
  if (
    !contract.proposalSnapshot.listingSnapshot?.changeable?.includes(
      "generalDescription"
    )
  ) {
    return null;
  }

  // Toggle inclusion of description change
  const handleIncludeDescription = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue("includeDescription", e.target.checked);

    // If toggled on and no description is set, set the current description
    if (e.target.checked && !watch("generalDescription")) {
      setValue("generalDescription", currentDescription);
      if (textareaRef.current) {
        textareaRef.current.value = currentDescription;
      }
    }
  };

  // Initialize the textarea with the form value if it exists
  useEffect(() => {
    const initialValue = getValues(fieldName) || currentDescription;
    if (textareaRef.current) {
      textareaRef.current.value = initialValue;
    }
  }, [getValues, fieldName, currentDescription]);

  // Set up validation and update form on blur
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea || disabled) return;

    const handleBlur = () => {
      if (!includeDescription) return;

      const value = textarea.value;

      // Validate
      if (!value) {
        setError(fieldName, {
          type: "required",
          message: "Description is required",
        });
      } else if (value.length < 10) {
        setError(fieldName, {
          type: "minLength",
          message: "Description should be at least 10 characters",
        });
      } else if (value.length > 2000) {
        setError(fieldName, {
          type: "maxLength",
          message: "Description must be less than 2000 characters",
        });
      } else {
        clearErrors(fieldName);
      }

      // Update form value
      setValue(fieldName, value, { shouldValidate: true });
    };

    textarea.addEventListener("blur", handleBlur);
    return () => {
      textarea.removeEventListener("blur", handleBlur);
    };
  }, [
    setValue,
    setError,
    clearErrors,
    fieldName,
    disabled,
    includeDescription,
  ]);

  // Update error message from form state
  useEffect(() => {
    const errorElement = errMsgRef.current;
    if (!errorElement) return;

    const error = formState.errors[fieldName];

    if (error) {
      errorElement.textContent = error.message || "";
      errorElement.style.display = "block";
      if (textareaRef.current) {
        textareaRef.current.classList.add("error");
      }
    } else {
      errorElement.style.display = "none";
      if (textareaRef.current) {
        textareaRef.current.classList.remove("error");
      }
    }
  }, [formState.errors, fieldName]);

  return (
    <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
        }}
      >
        <Typography variant="h6" color="primary" fontWeight="medium">
          Description
        </Typography>
        <FormControlLabel
          control={
            <Switch
              checked={includeDescription}
              onChange={handleIncludeDescription}
              disabled={disabled}
            />
          }
          label="Include changes"
          sx={{ mr: 0 }}
        />
      </Box>
      <Divider sx={{ mb: 3 }} />

      {includeDescription ? (
        <Box>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Update the general description for your commission. Be as detailed
            as possible about what you want.
          </Typography>

          <div
            className="textarea-container"
            style={{ position: "relative", marginBottom: "20px" }}
          >
            <textarea
              ref={textareaRef}
              name={fieldName}
              rows={6}
              placeholder="Describe what you want in detail..."
              disabled={disabled}
              style={{
                width: "100%",
                padding: "16.5px 14px",
                borderRadius: "4px",
                borderColor: formState.errors[fieldName]
                  ? "#d32f2f"
                  : "#c4c4c4",
                fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
                fontSize: "1rem",
                lineHeight: "1.5",
                resize: "vertical",
                boxSizing: "border-box",
              }}
              className={formState.errors[fieldName] ? "error" : ""}
            />
            <div
              ref={errMsgRef}
              style={{
                color: "#d32f2f",
                fontSize: "0.75rem",
                marginTop: "3px",
                marginLeft: "14px",
                display: "none",
              }}
            />
          </div>

          <Box sx={{ mt: 3 }}>
            <Typography variant="body2" color="text.secondary">
              Current description:
            </Typography>
            <Box
              sx={{
                mt: 1,
                p: 2,
                backgroundColor: "background.default",
                borderRadius: 1,
                border: "1px solid",
                borderColor: "divider",
                maxHeight: 200,
                overflow: "auto",
              }}
            >
              <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                {currentDescription || "No description provided."}
              </Typography>
            </Box>
          </Box>
        </Box>
      ) : (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ fontStyle: "italic", mt: 2 }}
        >
          Switch the toggle to include changes to the description.
        </Typography>
      )}
    </Paper>
  );
}

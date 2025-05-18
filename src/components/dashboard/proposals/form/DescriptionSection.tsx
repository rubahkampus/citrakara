import React, { useRef, useEffect } from "react";
import { useFormContext } from "react-hook-form";
import { Typography, Paper } from "@mui/material";
import { ProposalFormValues } from "@/types/proposal";

/**
 * DescriptionSection Component
 * ----------------------------
 * Handles project description input with direct DOM manipulation
 * for maximum performance while maintaining clean code structure
 */
const DescriptionSection = () => {
  // Form hooks
  const { setValue, formState, setError, clearErrors, getValues } =
    useFormContext<ProposalFormValues>();

  // Refs
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const errMsgRef = useRef<HTMLDivElement>(null);

  // Constants
  const fieldName = "generalDescription";

  // Initialize textarea with existing form value (for edit mode)
  useEffect(() => {
    const initialValue = getValues(fieldName) || "";
    if (textareaRef.current) {
      textareaRef.current.value = initialValue;
    }
  }, [getValues, fieldName]);

  // Validation and form update on blur
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const handleBlur = () => {
      const value = textarea.value;

      // Validation logic
      if (!value) {
        setError(fieldName, {
          type: "required",
          message: "Deskripsi wajib diisi",
        });
      } else if (value.length > 500) {
        setError(fieldName, {
          type: "maxLength",
          message: "Maksimal 500 karakter",
        });
      } else {
        clearErrors(fieldName);
      }

      // Update form value
      setValue(fieldName, value, { shouldValidate: false });
    };

    textarea.addEventListener("blur", handleBlur);
    return () => {
      textarea.removeEventListener("blur", handleBlur);
    };
  }, [setValue, setError, clearErrors, fieldName]);

  // Update error message display based on form state
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
    <Paper sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
        Deskripsi Proyek
      </Typography>
      <div
        className="textarea-container"
        style={{ position: "relative", marginBottom: "20px" }}
      >
        <textarea
          ref={textareaRef}
          name={fieldName}
          rows={4}
          placeholder="Berikan detail tentang permintaan komisi Anda. Jelaskan secara spesifik apa yang Anda inginkan dan persyaratan khusus lainnya."
          style={{
            width: "95%",
            padding: "16.5px 14px",
            borderRadius: "4px",
            borderColor: "#c4c4c4",
            fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
            fontSize: "1rem",
            lineHeight: "1.5",
            resize: "vertical",
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
    </Paper>
  );
};

export default DescriptionSection;

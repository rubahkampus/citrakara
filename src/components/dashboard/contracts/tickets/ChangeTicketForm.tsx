"use client";
// src/components/dashboard/contracts/tickets/ChangeTicketFormPage.tsx

import React, { useState } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { useRouter } from "next/navigation";
import { axiosClient } from "@/lib/utils/axiosClient";
import { IContract } from "@/lib/db/models/contract.model";
import {
  Box,
  Paper,
  Typography,
  Button,
  Alert,
  Snackbar,
  CircularProgress,
  Divider,
  TextField,
} from "@mui/material";

// Import section components
import DeadlineSection from "./form/DeadlineSection";
import DescriptionSection from "./form/DescriptionSection";
import ReferenceImagesSection from "./form/ReferenceImagesSection";
import GeneralOptionsSection from "./form/GeneralOptionsSection";
import SubjectOptionsSection from "./form/SubjectOptionsSection";

export interface GeneralOptionGroupInput {
  selectedId: number;
  selectedLabel: string;
  price: number;
}

export interface GeneralOptionsInput {
  optionGroups: Record<string, GeneralOptionGroupInput>;
  addons: Record<string, number>;
  answers: Record<string, string>;
}

export interface SubjectInstanceInput {
  optionGroups: Record<string, GeneralOptionGroupInput>;
  addons: Record<string, number>;
  answers: Record<string, string>;
}

export interface SubjectOptionsInput {
  [subjectTitle: string]: {
    instances: SubjectInstanceInput[];
  };
}

// Define interfaces for the form values
export interface ChangeTicketFormValues {
  reason: string;
  includeDeadline: boolean;
  includeDescription: boolean;
  includeGeneralOptions: boolean;
  includeSubjectOptions: boolean;
  deadlineAt: Date | null;
  generalDescription: string;
  referenceImages: Array<File | string>;
  generalOptions: Record<string, any>;
  subjectOptions: Record<string, any>;
}

// Main component props
interface ChangeTicketFormPageProps {
  contract: IContract;
  userId: string;
  isClient: boolean;
}

export default function ChangeTicketFormPage({
  contract,
  userId,
  isClient,
}: ChangeTicketFormPageProps) {
  const router = useRouter();

  // Get the latest contract terms
  const latestTerms = contract.contractTerms[contract.contractTerms.length - 1];

  // Get allowed change types from contract
  const allowedChanges =
    contract.proposalSnapshot.listingSnapshot?.changeable || [];

  // Check if changes are allowed
  const isChangeAllowed =
    contract.proposalSnapshot.listingSnapshot?.allowContractChange || false;

  // Form state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Initialize form with React Hook Form
  const methods = useForm<ChangeTicketFormValues>({
    defaultValues: {
      reason: "",
      includeDeadline: false,
      includeDescription: false,
      includeGeneralOptions: false,
      includeSubjectOptions: false,
      deadlineAt: null,
      generalDescription: latestTerms.generalDescription || "",
      referenceImages: [],
      generalOptions: {},
      subjectOptions: {},
    },
    mode: "onSubmit",
  });

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isValid },
  } = methods;

  // Watch values to determine which sections are included
  const includeDeadline = watch("includeDeadline");
  const includeDescription = watch("includeDescription");
  const includeGeneralOptions = watch("includeGeneralOptions");
  const includeSubjectOptions = watch("includeSubjectOptions");

  // Form submission handler
  const onSubmit = async (values: ChangeTicketFormValues) => {
    setIsSubmitting(true);
    setError(null);

    try {
      // Validate that at least one change is included
      if (
        !values.includeDeadline &&
        !values.includeDescription &&
        !values.includeGeneralOptions &&
        !values.includeSubjectOptions &&
        values.referenceImages.length === 0
      ) {
        throw new Error(
          "Please select at least one aspect of the contract to change"
        );
      }

      // Create FormData
      const formData = new FormData();
      formData.append("reason", values.reason);

      // Add deadline if included
      if (values.includeDeadline && values.deadlineAt) {
        formData.append("deadlineAt", values.deadlineAt.toISOString());
      }

      // Add description if included
      if (values.includeDescription) {
        formData.append("generalDescription", values.generalDescription);
      }

      // Add general options if included
      if (values.includeGeneralOptions) {
        formData.append(
          "generalOptions",
          JSON.stringify(values.generalOptions)
        );
      }

      // Add subject options if included
      if (values.includeSubjectOptions) {
        formData.append(
          "subjectOptions",
          JSON.stringify(values.subjectOptions)
        );
      }

      // Add reference images
      if (values.referenceImages.length > 0) {
        values.referenceImages.forEach((file) => {
          if (file instanceof File) {
            formData.append("referenceImages[]", file);
          } else if (typeof file === "string") {
            // For existing images that should be kept
            formData.append("existingReferenceImages[]", file);
          }
        });
      }

      // Submit to API using axios
      const response = await axiosClient.post(
        `/api/contract/${contract._id}/tickets/change`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setSuccess(true);

      // Redirect after successful submission
      setTimeout(() => {
        router.push(`/dashboard/${userId}/contracts/${contract._id}/tickets`);
        router.refresh();
      }, 1500);
    } catch (error: any) {
      setError(
        error.response?.data?.message ||
          error.message ||
          "Failed to create change request"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Function to display validation errors in user-friendly format
  const getMissingFieldsMessage = () => {
    if (Object.keys(errors).length === 0) return null;

    const fieldNames: Record<string, string> = {
      reason: "Reason",
      deadlineAt: "Deadline",
      generalDescription: "Description",
      referenceImages: "Reference Images",
      generalOptions: "General Options",
      subjectOptions: "Subject Options",
    };

    const missingFields = Object.keys(errors)
      .map((key) => fieldNames[key] || key)
      .join(", ");

    return `Please complete the following required fields: ${missingFields}`;
  };

  // Check if contract changes are allowed
  if (!isChangeAllowed) {
    return (
      <Alert severity="error">This contract does not allow changes.</Alert>
    );
  }

  // Check if user is a client (only clients can create change tickets)
  if (!isClient) {
    return (
      <Alert severity="warning">
        Only clients can request contract changes.
      </Alert>
    );
  }

  return (
    <FormProvider {...methods}>
      <Box
        component="form"
        onSubmit={handleSubmit(
          (values) => onSubmit(values),
          (errors) => {
            setError(
              getMissingFieldsMessage() || "Please check all required fields."
            );
          }
        )}
        sx={{ maxWidth: 800, mx: "auto" }}
      >
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Paper
          component="div"
          sx={{
            p: 4,
            border: 1,
            borderColor: "divider",
            borderRadius: 2,
            boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
            mb: 3,
          }}
        >
          <Typography variant="h5" component="h1" gutterBottom sx={{ mb: 3 }}>
            Request Contract Changes
          </Typography>

          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" fontWeight="bold">
              Change Request Information
            </Typography>
            <Typography variant="body2">
              You can request changes to certain aspects of the contract. The
              artist will need to approve these changes and may apply a fee for
              significant modifications.
            </Typography>
          </Box>

          <Box sx={{ mb: 3 }}>
            <Alert severity="info">
              <Typography variant="body2" fontWeight="bold">
                Changeable Aspects:
              </Typography>
              <Typography variant="body2">
                {allowedChanges.length > 0
                  ? allowedChanges.join(", ")
                  : "No specific aspects are listed as changeable. Contact the artist directly."}
              </Typography>
            </Alert>
          </Box>

          <Divider sx={{ my: 3 }} />

          {/* Reason input - stays in the main component */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>
              Reason for Changes
            </Typography>
            <TextField
              {...register("reason", {
                required: "Reason is required",
                minLength: {
                  value: 10,
                  message:
                    "Please provide a more detailed reason (minimum 10 characters)",
                },
              })}
              label="Reason"
              multiline
              rows={3}
              fullWidth
              placeholder="Explain why you need these changes..."
              error={!!errors.reason}
              helperText={errors.reason?.message}
              disabled={isSubmitting}
              sx={{ mt: 1 }}
            />
          </Box>

          <Divider sx={{ my: 3 }} />

          {/* Section components */}
          {allowedChanges.includes("deadline") && (
            <DeadlineSection contract={contract} disabled={isSubmitting} />
          )}

          {allowedChanges.includes("generalDescription") && (
            <DescriptionSection contract={contract} disabled={isSubmitting} />
          )}

          <ReferenceImagesSection contract={contract} disabled={isSubmitting} />

          {allowedChanges.includes("generalOptions") && (
            <GeneralOptionsSection
              contract={contract}
              disabled={isSubmitting}
            />
          )}

          {allowedChanges.includes("subjectOptions") && (
            <SubjectOptionsSection
              contract={contract}
              disabled={isSubmitting}
            />
          )}

          {/* Form Controls */}
          <Box sx={{ display: "flex", justifyContent: "space-between", mt: 4 }}>
            <Button
              variant="outlined"
              onClick={() => router.back()}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={isSubmitting}
              sx={{ minWidth: 180 }}
            >
              {isSubmitting ? (
                <>
                  <CircularProgress size={24} sx={{ mr: 1 }} />
                  Submitting...
                </>
              ) : (
                "Submit Change Request"
              )}
            </Button>
          </Box>
        </Paper>

        {/* Success Snackbar */}
        <Snackbar
          open={success}
          message="Change request submitted successfully!"
          autoHideDuration={2000}
          onClose={() => setSuccess(false)}
        />
      </Box>
    </FormProvider>
  );
}

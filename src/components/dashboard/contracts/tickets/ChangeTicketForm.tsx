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
import {
  ProposalGeneralOptions,
  ProposalSubjectOptions,
} from "@/lib/db/models/proposal.model";

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
  includeReferenceImages: boolean;
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
  username: string;
  isClient: boolean;
}

export default function ChangeTicketFormPage({
  contract,
  userId,
  username,
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
      includeReferenceImages: false,
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
    getValues,
    formState: { errors, isValid },
  } = methods;

  // Watch values to determine which sections are included
  const includeDeadline = watch("includeDeadline");
  const includeDescription = watch("includeDescription");
  const includeGeneralOptions = watch("includeGeneralOptions");
  const includeSubjectOptions = watch("includeSubjectOptions");
  const includeReferenceImages = watch("includeReferenceImages");

  // Helper function to deeply compare objects for equality
  const areObjectsEqual = (obj1: any, obj2: any): boolean => {
    if (obj1 === obj2) return true;
    if (!obj1 || !obj2) return false;
    if (typeof obj1 !== "object" || typeof obj2 !== "object") return false;

    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);

    if (keys1.length !== keys2.length) return false;

    for (const key of keys1) {
      if (!keys2.includes(key)) return false;

      const val1 = obj1[key];
      const val2 = obj2[key];

      // Recursively check nested objects
      if (typeof val1 === "object" && typeof val2 === "object") {
        if (!areObjectsEqual(val1, val2)) return false;
      } else if (val1 !== val2) {
        return false;
      }
    }

    return true;
  };

  // Helper function to compare arrays
  const areArraysEqual = (arr1: any[], arr2: any[]): boolean => {
    if (arr1 === arr2) return true;
    if (!arr1 || !arr2) return false;
    if (arr1.length !== arr2.length) return false;

    // For simple value arrays
    if (typeof arr1[0] !== "object") {
      return arr1.every((val, idx) => val === arr2[idx]);
    }

    // For object arrays, would need deeper comparison
    // For simplicity in reference images case, we'll return false
    // This means we'll always consider reference images as changed if included
    return false;
  };

  // Form submission handler
  const onSubmit = async (values: ChangeTicketFormValues) => {
    setIsSubmitting(true);
    setError(null);

    console.log("Form values:", values);

    try {
      // Create FormData
      const formData = new FormData();
      let hasActualChanges = false;

      // Always append reason
      formData.append("reason", values.reason);

      // 1. Check each attribute against changeable
      // 2. Check if includeX is true
      // 3. Check if value is different from original

      // Handle deadline
      if (allowedChanges.includes("deadline")) {
        if (values.includeDeadline && values.deadlineAt) {
          // Check if the deadline has actually changed
          const currentDeadline = new Date(contract.deadlineAt);
          const newDeadline = new Date(values.deadlineAt);

          if (currentDeadline.toISOString() !== newDeadline.toISOString()) {
            formData.append("deadlineAt", newDeadline.toISOString());
            hasActualChanges = true;
          } else {
            // No change, use original
            formData.append("deadlineAt", currentDeadline.toISOString());
          }
        } else {
          // Not included or null, use original
          formData.append(
            "deadlineAt",
            new Date(contract.deadlineAt).toISOString()
          );
        }
      }

      // Handle description
      if (allowedChanges.includes("generalDescription")) {
        if (values.includeDescription) {
          // Check if description has actually changed
          if (values.generalDescription !== latestTerms.generalDescription) {
            formData.append("generalDescription", values.generalDescription);
            hasActualChanges = true;
          } else {
            // No change, use original
            formData.append(
              "generalDescription",
              latestTerms.generalDescription || ""
            );
          }
        } else {
          // Not included, use original
          formData.append(
            "generalDescription",
            latestTerms.generalDescription || ""
          );
        }
      }

      const transformedOptions = transformOptions(
        values.generalOptions,
        values.subjectOptions
      );
      // console.log(latestTerms.generalOptions)
      // console.log(transformedOptions.generalOptions)
      // console.log(latestTerms.subjectOptions)
      // console.log(transformedOptions.subjectOptions)

      // Handle general options
      if (allowedChanges.includes("generalOptions")) {
        if (values.includeGeneralOptions) {
          // Compare with original to see if there are changes
          const currentGeneralOptions = latestTerms.generalOptions || {};
          if (
            !areObjectsEqual(
              transformedOptions.generalOptions,
              currentGeneralOptions
            )
          ) {
            formData.append(
              "generalOptions",
              JSON.stringify(transformedOptions.generalOptions)
            );
            hasActualChanges = true;
          } else {
            // No change, use original
            formData.append(
              "generalOptions",
              JSON.stringify(currentGeneralOptions)
            );
          }
        } else {
          // Not included, use original
          formData.append(
            "generalOptions",
            JSON.stringify(latestTerms.generalOptions || {})
          );
        }
      }

      // Handle subject options
      if (allowedChanges.includes("subjectOptions")) {
        if (values.includeSubjectOptions) {
          // Compare with original to see if there are changes
          const currentSubjectOptions = latestTerms.subjectOptions || {};
          if (
            !areObjectsEqual(
              transformedOptions.subjectOptions,
              currentSubjectOptions
            )
          ) {
            formData.append(
              "subjectOptions",
              JSON.stringify(transformedOptions.subjectOptions)
            );
            hasActualChanges = true;
          } else {
            // No change, use original
            formData.append(
              "subjectOptions",
              JSON.stringify(currentSubjectOptions)
            );
          }
        } else {
          // Not included, use original
          formData.append(
            "subjectOptions",
            JSON.stringify(latestTerms.subjectOptions || {})
          );
        }
      }

      // Handle reference images
      if (values.includeReferenceImages) {
        let hasReferenceImageChanges = false;
        const currentReferenceImages = latestTerms.referenceImages || [];

        // Count new Files (which are always changes)
        const newFileCount = values.referenceImages.filter(
          (img) => img instanceof File
        ).length;

        if (newFileCount > 0) {
          hasReferenceImageChanges = true;
        } else {
          // Check if the string URLs match the current reference images
          const stringUrls = values.referenceImages.filter(
            (img) => typeof img === "string"
          );
          hasReferenceImageChanges = !areArraysEqual(
            stringUrls as string[],
            currentReferenceImages as string[]
          );
        }

        if (hasReferenceImageChanges) {
          values.referenceImages.forEach((file) => {
            if (file instanceof File) {
              formData.append("referenceImages[]", file);
            } else if (typeof file === "string") {
              formData.append("existingReferenceImages[]", file);
            }
          });
          hasActualChanges = true;
        } else {
          // No changes, use original
          (currentReferenceImages as string[]).forEach((url) => {
            formData.append("existingReferenceImages[]", url);
          });
        }
      } else {
        // Not included, use original
        const currentReferenceImages = latestTerms.referenceImages || [];
        (currentReferenceImages as string[]).forEach((url) => {
          formData.append("existingReferenceImages[]", url);
        });
      }

      // 4. Check if any changeable attribute has actually changed
      if (!hasActualChanges) {
        throw new Error(
          "No changes detected. Please modify at least one aspect of the contract before submitting."
        );
      }

      for (var pair of formData.entries()) {
        console.log(pair[0] + ", " + pair[1]);
      } // Debugging line

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
        router.push(`/${username}/dashboard/contracts/${contract._id}/tickets`);
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
      reason: "Alasan",
      deadlineAt: "Tenggat Waktu",
      generalDescription: "Deskripsi",
      referenceImages: "Gambar Referensi",
      generalOptions: "Opsi Umum",
      subjectOptions: "Opsi Subjek",
    };

    const missingFields = Object.keys(errors)
      .map((key) => fieldNames[key] || key)
      .join(", ");

    return `Harap lengkapi field berikut yang wajib diisi: ${missingFields}`;
  };

  // Periksa apakah perubahan kontrak diperbolehkan
  if (!isChangeAllowed) {
    return (
      <Alert severity="error">Kontrak ini tidak mengizinkan perubahan.</Alert>
    );
  }

  // Periksa apakah pengguna adalah klien (hanya klien yang dapat membuat permintaan perubahan)
  if (!isClient) {
    return (
      <Alert severity="warning">
        Hanya klien yang dapat meminta perubahan kontrak.
      </Alert>
    );
  }

  return (
    <FormProvider {...methods}>
      <Box
        component="form"
        onSubmit={handleSubmit(
          (values) => {
            console.log("Submit button pressed");
            onSubmit(values);
          },
          (errors) => {
            setError(
              getMissingFieldsMessage() || "Please check all required fields."
            );
          }
        )}
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
            Permintaan Perubahan Kontrak
          </Typography>

          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" fontWeight="bold">
              Informasi Permintaan Perubahan
            </Typography>
            <Typography variant="body2">
              Anda dapat meminta perubahan pada aspek tertentu dari kontrak.
              Seniman perlu menyetujui perubahan ini dan mungkin akan menerapkan
              biaya untuk perubahan yang signifikan.
            </Typography>
          </Box>

          <Box sx={{ mb: 3 }}>
            <Alert severity="info">
              <Typography variant="body2" fontWeight="bold">
                Aspek yang Dapat Diubah:
              </Typography>
              <Typography variant="body2">
                {allowedChanges.length > 0
                  ? allowedChanges.join(", ")
                  : "Tidak ada aspek spesifik yang tercatat sebagai dapat diubah. Hubungi seniman langsung."}
              </Typography>
            </Alert>
          </Box>

          <Divider sx={{ my: 3 }} />

          {/* Alasan input - tetap di komponen utama */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>
              Alasan untuk Perubahan
            </Typography>
            <TextField
              {...register("reason", {
                required: "Alasan wajib diisi",
                minLength: {
                  value: 10,
                  message:
                    "Harap berikan alasan yang lebih detail (minimal 10 karakter)",
                },
              })}
              label="Alasan"
              multiline
              rows={3}
              fullWidth
              placeholder="Jelaskan mengapa Anda membutuhkan perubahan ini..."
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
              onClick={() => {
                console.log("Cancel button pressed");
                router.back();
              }}
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

function transformOptions(
  generalOptions: Record<string, any>,
  subjectOptions: Record<string, any>
) {
  // Transform generalOptions
  const transformedGeneralOptions: any = {
    optionGroups: [],
    addons: [],
    answers: [],
  };

  // Transform optionGroups from object to array format
  if (generalOptions.optionGroups) {
    transformedGeneralOptions.optionGroups = Object.entries(
      generalOptions.optionGroups
    ).map(([groupId, group]: [string, any]) => {
      return {
        id: parseInt(groupId),
        groupId: parseInt(groupId),
        selectedSelectionID: group.selectedId,
        selectedSelectionLabel: group.selectedLabel,
        price: group.price || 0,
      };
    });
  }

  // Transform addons from object to array format
  if (generalOptions.addons && Object.keys(generalOptions.addons).length > 0) {
    transformedGeneralOptions.addons = Object.entries(
      generalOptions.addons
    ).map(([addonId, price]: [string, any]) => {
      return {
        id: parseInt(addonId),
        addonId: parseInt(addonId),
        price: price,
      };
    });
  }

  // Transform answers from object to array format
  if (generalOptions.answers) {
    transformedGeneralOptions.answers = Object.entries(generalOptions.answers)
      .filter(
        ([questionId, answer]) =>
          answer !== undefined &&
          answer !== null &&
          typeof answer === "string" &&
          answer.trim() !== ""
      )
      .map(([questionId, answer]: [string, any]) => {
        return {
          id: parseInt(questionId),
          questionId: parseInt(questionId),
          answer: answer,
        };
      });
  }

  // Transform subjectOptions from object with keys to array with subjectId
  const transformedSubjectOptions: ProposalSubjectOptions = Object.entries(
    subjectOptions
  ).map(([subjectId, data]) => {
    // Create the new subject object with subjectId
    return {
      subjectId: parseInt(subjectId),
      instances: data.instances.map((instance: any, index: number) => {
        // Transform each instance to the desired format
        const newInstance: any = {
          id: index + 1, // Generate sequential ID
          optionGroups: [],
          addons: [],
          answers: [],
        };

        // Transform optionGroups from object to array format
        if (instance.optionGroups) {
          newInstance.optionGroups = Object.entries(instance.optionGroups).map(
            ([groupId, group]: [string, any]) => {
              return {
                id: parseInt(groupId),
                groupId: parseInt(groupId),
                selectedSelectionID: group.selectedId,
                selectedSelectionLabel: group.selectedLabel,
                price: group.price || 0,
              };
            }
          );
        }

        // Transform addons from object to array format
        if (instance.addons && Object.keys(instance.addons).length > 0) {
          newInstance.addons = Object.entries(instance.addons).map(
            ([addonId, price]) => {
              return {
                id: parseInt(addonId),
                addonId: parseInt(addonId),
                price: price,
              };
            }
          );
        }

        // Transform answers from object to array format
        if (instance.answers && Object.keys(instance.answers).length > 0) {
          newInstance.answers = Object.entries(instance.answers)
            .filter(
              ([questionId, answer]) =>
                answer !== undefined &&
                answer !== null &&
                typeof answer === "string" &&
                answer.trim() !== ""
            )
            .map(([questionId, answer]) => {
              return {
                id: parseInt(questionId),
                questionId: parseInt(questionId),
                answer: answer,
              };
            });
        }

        return newInstance;
      }),
    };
  });

  return {
    generalOptions: transformedGeneralOptions,
    subjectOptions: transformedSubjectOptions,
  };
}

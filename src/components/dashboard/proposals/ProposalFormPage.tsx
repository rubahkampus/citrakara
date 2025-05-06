"use client";
// src/components/dashboard/proposals/ProposalFormPage.tsx

/**
 * ProposalFormPage
 * ----------------
 * Renders a multi‐section form to create or edit a proposal.
 * Now takes a `listing` prop (stringified JSON) so we know:
 *   - listing.deadline.mode / min / max
 *   - listing._id (for payload)
 *
 * Props:
 *   - username: string
 *   - mode: "create" | "edit"
 *   - listing: string           ← JSON.stringified commission listing
 *   - initialData?: ProposalUI  ← only for edit
 */
import React from "react";
import { useForm, FormProvider } from "react-hook-form";
import { useRouter } from "next/navigation";
import { axiosClient } from "@/lib/utils/axiosClient";
import { ProposalFormValues, ProposalUI } from "@/types/proposal";
import DeadlineSection from "./form/DeadlineSection";
import DescriptionSection from "./form/DescriptionSection";
import ReferenceImagesSection from "./form/ReferenceImagesSection";
import GeneralOptionsSection from "./form/GeneralOptionsSection";
import SubjectOptionsSection from "./form/SubjectOptionsSection";
import PriceBreakdownSection from "./form/PriceBreakdownSection";
import { Button, Box, Alert, Snackbar, Paper } from "@mui/material";

interface ProposalFormPageProps {
  username: string;
  mode: "create" | "edit";
  listing: string; // JSON.stringified listing
  initialData?: ProposalUI; // for edit only
}

export default function ProposalFormPage({
  username,
  mode,
  listing,
  initialData,
}: ProposalFormPageProps) {
  const router = useRouter();
  const listingObj: any = JSON.parse(listing);

  // Initialize RHF with optional existing data
  const methods = useForm<ProposalFormValues>({
    defaultValues: initialData
      ? {
          ...initialData,
          id: initialData?.id || undefined, // for edit mode only
          deadline:
            initialData.deadline instanceof Date
              ? initialData.deadline.toISOString()
              : initialData.deadline,
        }
      : {
          listingId: listingObj._id, // Add this for form data
          deadline: "", // user will fill or API will set for standard mode
          generalDescription: "",
          referenceImages: [],
          generalOptions: {
            optionGroups: {},
            addons: {},
            answers: {},
          },
          subjectOptions: {},
        },
    mode: "onSubmit", // Explicitly set validation mode
  });
  const {
    handleSubmit,
    formState: { errors },
  } = methods;

  // UI feedback
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<boolean>(false);
  const [loading, setLoading] = React.useState<boolean>(false);

  // Core submit handler
  const onSubmit = async (values: ProposalFormValues) => {
    // Add debug logging for onSubmit only
    console.log("onSubmit function called!");
    console.log("Form values:", values);

    setError(null);
    setLoading(true);

    // Build FormData
    const fd = new FormData();
    fd.append("listingId", listingObj._id);
    fd.append("deadline", values.deadline);
    fd.append("generalDescription", values.generalDescription);

    // Payload: only nested options
    fd.append(
      "payload",
      JSON.stringify({
        generalOptions: values.generalOptions,
        subjectOptions: values.subjectOptions,
      })
    );

    // Files
    values.referenceImages?.forEach((file) => {
      fd.append("referenceImages[]", file);
    });

    // For edit mode, include existing images
    if (mode === "edit" && initialData) {
      // Use the referenceImages from initialData instead of existingReferences
      initialData.referenceImages.forEach((url) => {
        fd.append("existingReferences[]", url);
      });
    }

    // Log form data for debugging
    console.log("Form data entries:");
    for (var pair of fd.entries()) {
      console.log(pair[0] + ", " + pair[1]);
    }

    // try {
    //   let res;
    //   console.log("About to make API call...");
    //   if (mode === "create") {
    //     res = await axiosClient.post("/api/proposal", fd, {
    //       headers: { "Content-Type": "multipart/form-data" },
    //     });
    //   } else {
    //     // edit: initialData.id must exist
    //     res = await axiosClient.patch(`/api/proposal/${initialData!.id}`, fd, {
    //       headers: { "Content-Type": "multipart/form-data" },
    //     });
    //   }
    //   console.log("API response:", res);
    //   setSuccess(true);
    //   setTimeout(() => {
    //     router.push(`/${username}/dashboard/proposals`);
    //   }, 1500);
    // } catch (e: any) {
    //   console.error("Proposal form submit error:", e);
    //   setError(e.response?.data?.error || "Failed to save proposal");
    // } finally {
    //   setLoading(false);
    // }
  };

  // Function to display validation errors in user-friendly format
  const getMissingFieldsMessage = () => {
    if (Object.keys(errors).length === 0) return null;
    
    const fieldNames: Record<string, string> = {
      deadline: "Deadline",
      generalDescription: "Description",
      referenceImages: "Reference Images",
      "generalOptions.optionGroups": "General Options",
      "generalOptions.addons": "Addons",
      "generalOptions.answers": "Option Answers",
      subjectOptions: "Subject Options"
    };
    
    const missingFields = Object.keys(errors)
      .map(key => fieldNames[key] || key)
      .join(", ");
    
    return `Please complete the following required fields: ${missingFields}`;
  };

  return (
    <FormProvider {...methods}>
      <Box
        component="form"
        onSubmit={handleSubmit(
          (values) => {
            console.log("Form submit event triggered with valid data!");
            onSubmit(values);
          },
          (errors) => {
            setError(getMissingFieldsMessage() || "Please check all required fields.");
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
          }}
        >
          {/* 1. Deadline (pass listingObj directly) */}
          <DeadlineSection listing={listingObj} />

          {/* 2. Description */}
          <DescriptionSection />

          {/* 3. Reference Images */}
          <ReferenceImagesSection />

          {/* 4. General Options (pass listingObj) */}
          <GeneralOptionsSection listing={listingObj} />

          {/* 5. Subject Options (pass listingObj) */}
          <SubjectOptionsSection listing={listingObj} />

          {/* 6. Live Price Breakdown (pass listingObj) */}
          <PriceBreakdownSection listing={listingObj} />

          {/* Form Controls */}
          <Box sx={{ display: "flex", justifyContent: "space-between", mt: 4 }}>
            <Button
              variant="outlined"
              onClick={() => router.back()}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={loading}
              onClick={(e) => {
                console.log("Submit button clicked!");
                // We'll use a manual submit to bypass possible issues
                if (e.currentTarget.form) {
                  console.log("Manually triggering form submission");
                  const formEl = e.currentTarget.form;
                  // Check if form is already being submitted
                  if (!formEl.classList.contains("submitting")) {
                    formEl.classList.add("submitting");
                    // Clean up class after submission attempt
                    setTimeout(
                      () => formEl.classList.remove("submitting"),
                      1000
                    );
                  }
                }
              }}
            >
              {mode === "create" ? "Create Proposal" : "Save Changes"}
            </Button>
          </Box>

          {/* Success Snackbar */}
          <Snackbar
            open={success}
            message={
              mode === "create" ? "Proposal created!" : "Proposal updated!"
            }
            autoHideDuration={2000}
            onClose={() => setSuccess(false)}
          />
        </Paper>
      </Box>
    </FormProvider>
  );
}
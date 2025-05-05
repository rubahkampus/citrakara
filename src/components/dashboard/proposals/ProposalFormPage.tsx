'use client'
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
 *
 * On submit:
 *   • Build FormData:
 *       fd.append("listingId", listing._id);
 *       fd.append("deadline", values.deadline);
 *       fd.append("generalDescription", values.generalDescription);
 *       fd.append("payload", JSON.stringify({
 *         generalOptions: values.generalOptions,
 *         subjectOptions: values.subjectOptions,
 *       }));
 *       files → fd.append("referenceImages[]", file)
 *   • POST to /api/proposal  or PATCH to /api/proposal/[id]
 */
import React, { useEffect } from "react";
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
import { Button, Box, Alert, Snackbar } from "@mui/material";

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

  // Store the listing in sessionStorage for child components
  useEffect(() => {
    sessionStorage.setItem("currentListing", listing);
    return () => {
      sessionStorage.removeItem("currentListing");
    };
  }, [listing]);

  // Initialize RHF with optional existing data
  const methods = useForm<ProposalFormValues>({
    defaultValues: initialData
      ? {
          ...initialData,
          deadline: initialData.deadline instanceof Date
            ? initialData.deadline.toISOString()
            : initialData.deadline,
        }
      : {
          listingId: listingObj._id, // Add this for form data
          deadline: "", // user will fill
          generalDescription: "",
          referenceImages: [],
          generalOptions: {
            optionGroups: {},
            addons: {},
            answers: {},
          },
          subjectOptions: {},
        },
  });
  const { handleSubmit, watch } = methods;

  // UI feedback
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<boolean>(false);
  const loadingRef = React.useRef(false);

  // Core submit handler
  const onSubmit = async (values: ProposalFormValues) => {
    setError(null);
    loadingRef.current = true;

    // Build FormData
    const fd = new FormData();
    fd.append("listingId", listingObj._id);
    fd.append("deadline", values.deadline);
    fd.append("generalDescription", values.generalDescription);

    // Calculate dynamic dates based on the deadline
    if (values.deadline) {
      const deadlineDate = new Date(values.deadline);
      const now = new Date();

      // Calculate earliest and latest dates based on listing rules
      const minDate = new Date(now);
      minDate.setDate(minDate.getDate() + listingObj.deadline.min);

      const maxDate = new Date(now);
      maxDate.setDate(maxDate.getDate() + listingObj.deadline.max);

      fd.append("earliestDate", minDate.toISOString());
      fd.append("latestDate", maxDate.toISOString());
    }

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

    try {
      let res;
      if (mode === "create") {
        res = await axiosClient.post("/api/proposal", fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        // edit: initialData.id must exist
        res = await axiosClient.patch(`/api/proposal/${initialData!.id}`, fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }
      setSuccess(true);
      setTimeout(() => {
        router.push(`/${username}/dashboard/proposals`);
      }, 1500);
    } catch (e: any) {
      console.error("Proposal form submit error:", e);
      setError(e.response?.data?.error || "Failed to save proposal");
    } finally {
      loadingRef.current = false;
    }
  };

  return (
    <FormProvider {...methods}>
      <Box
        component="form"
        onSubmit={handleSubmit(onSubmit)}
        sx={{ maxWidth: 800, mx: "auto" }}
      >
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* 1. Deadline (uses listing.deadline config) */}
        <DeadlineSection listingDeadline={listingObj.deadline} />

        {/* 2. Description */}
        <DescriptionSection />

        {/* 3. Reference Images */}
        <ReferenceImagesSection />

        {/* 4. General Options */}
        <GeneralOptionsSection />

        {/* 5. Subject Options */}
        <SubjectOptionsSection />

        {/* 6. Live Price Breakdown */}
        <PriceBreakdownSection />

        {/* Form Controls */}
        <Box sx={{ display: "flex", justifyContent: "space-between", mt: 4 }}>
          <Button
            variant="outlined"
            onClick={() => router.back()}
            disabled={loadingRef.current}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loadingRef.current}
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
      </Box>
    </FormProvider>
  );
}

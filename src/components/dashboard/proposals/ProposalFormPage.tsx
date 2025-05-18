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
 *   - initialData?: IProposal   ← only for edit
 */
import React from "react";
import { useForm, FormProvider } from "react-hook-form";
import { useRouter } from "next/navigation";
import { axiosClient } from "@/lib/utils/axiosClient";
import {
  ProposalFormValues,
  convertToFormFormat,
  convertToModelFormat,
} from "@/types/proposal";
import DeadlineSection from "./form/DeadlineSection";
import DescriptionSection from "./form/DescriptionSection";
import ReferenceImagesSection from "./form/ReferenceImagesSection";
import GeneralOptionsSection from "./form/GeneralOptionsSection";
import SubjectOptionsSection from "./form/SubjectOptionsSection";
import PriceBreakdownSection from "./form/PriceBreakdownSection";
import {
  Button,
  Box,
  Alert,
  Snackbar,
  Paper,
  Breadcrumbs,
  Link,
  Typography,
} from "@mui/material";
import { IProposal } from "@/lib/db/models/proposal.model";
import {
  NavigateNext,
  Home,
  DescriptionRounded,
  ArrowBack,
} from "@mui/icons-material";

interface ProposalFormPageProps {
  username: string;
  mode: "create" | "edit";
  listing: string; // JSON.stringified listing
  initialData?: IProposal; // for edit only
}

export default function ProposalFormPage({
  username,
  mode,
  listing,
  initialData,
}: ProposalFormPageProps) {
  const router = useRouter();
  const listingObj: any = JSON.parse(listing);

  // Convert initial data to form format if it exists
  const formattedInitialData = React.useMemo(() => {
    if (!initialData) return undefined;

    // Convert backend model data to form format
    const formData = convertToFormFormat({
      ...initialData,
      id: initialData._id?.toString(),
      listingId: initialData.listingId.toString(),
      deadline:
        initialData.deadline instanceof Date
          ? initialData.deadline.toISOString()
          : initialData.deadline,
      generalDescription: initialData.generalDescription || "",
      referenceImages: initialData.referenceImages || [],
    });

    console.log("initialDataLoaded from API", JSON.stringify(formData));

    return formData;
  }, [initialData]);

  // Initialize RHF with optional existing data
  const methods = useForm<ProposalFormValues>({
    defaultValues: formattedInitialData || {
      listingId: listingObj._id,
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
    // console.log("onSubmit function called!");
    // console.log("Edit (before convertToModelFormat function):", JSON.stringify(values));
    console.log(
      "Form values (before convertToModelFormat function):",
      JSON.stringify(values)
    );

    setError(null);
    setLoading(true);

    // Convert form data to model format for API
    const modelData = convertToModelFormat(values);

    // Build FormData
    const fd = new FormData();
    fd.append("listingId", listingObj._id);
    fd.append("deadline", values.deadline);
    fd.append("generalDescription", values.generalDescription);

    // Payload: converted nested options
    fd.append(
      "payload",
      JSON.stringify({
        generalOptions: modelData.generalOptions,
        subjectOptions: modelData.subjectOptions,
      })
    );

    // Files
    values.referenceImages?.forEach((file) => {
      if (file instanceof File) {
        fd.append("referenceImages[]", file);
      }
    });

    // For edit mode, include existing images
    if (mode === "edit" && initialData) {
      initialData.referenceImages.forEach((url) => {
        if (typeof url === "string") {
          fd.append("existingReferences[]", url);
        }
      });
    }

    for (var pair of fd.entries()) {
      console.log(pair[0] + ", " + pair[1]);
    } // Debugging line

    // console.log("After convertToModelFormat function (ready for upload)",JSON.stringify(modelData));

    try {
      let res;
      console.log("About to make API call...");
      if (mode === "create") {
        res = await axiosClient.post("/api/proposal", fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        // edit: initialData._id must exist
        res = await axiosClient.patch(`/api/proposal/${initialData!._id}`, fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }
      console.log("API response:", res);
      setSuccess(true);
      setTimeout(() => {
        router.push(`/${username}/dashboard/proposals`);
      }, 1500);
    } catch (e: any) {
      console.error("Proposal form submit error:", e);
      setError(e.response?.data?.error || "Failed to save proposal");
    } finally {
      setLoading(false);
    }
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
      subjectOptions: "Subject Options",
    };

    const missingFields = Object.keys(errors)
      .map((key) => fieldNames[key] || key)
      .join(", ");

    return `Please complete the following required fields: ${missingFields}`;
  };

  return (
    <FormProvider {...methods}>
      <Box
        sx={{
          pt: 4,
          mb: 3,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <Breadcrumbs separator={<NavigateNext fontSize="small" />}>
            <Link
              component={Link}
              href={`/${username}/dashboard`}
              underline="hover"
              color="inherit"
              sx={{ display: "flex", alignItems: "center" }}
            >
              <Home fontSize="small" sx={{ mr: 0.5 }} />
              Dashboard
            </Link>
            <Link
              component={Link}
              href={`/${username}/dashboard/proposals`}
              underline="hover"
              color="inherit"
              sx={{ display: "flex", alignItems: "center" }}
            >
              <DescriptionRounded fontSize="small" sx={{ mr: 0.5 }} />
              Proposal
            </Link>
            <Typography
              color="text.primary"
              sx={{ display: "flex", alignItems: "center" }}
            >
              {mode === "create" ? "Buat Proposal" : "Ubah Proposal"}
            </Typography>
          </Breadcrumbs>

          <Box display="flex" alignItems="center" mt={4} ml={-0.5}>
            <DescriptionRounded
              sx={{ mr: 1, color: "primary.main", fontSize: 32 }}
            />
            <Typography variant="h4" fontWeight="bold">
              {mode === "create" ? "Buat Proposal" : "Ubah Proposal"}
            </Typography>
          </Box>
        </Box>

        <Button
          component={Link}
          href={`/${username}/dashboard/proposals`}
          variant="outlined"
          startIcon={<ArrowBack />}
          size="small"
          sx={{ mt: 1 }}
        >
          Kembali ke Daftar Proposal
        </Button>
      </Box>

      <Box
        component="form"
        onSubmit={handleSubmit(
          (values) => {
            console.log("Form submit event triggered with valid data!");
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
              // disabled={loading}
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
              {mode === "create" ? "Buat Proposal" : "Simpan Perubahan"}
            </Button>
          </Box>

          {/* Success Snackbar */}
          <Snackbar
            open={success}
            message={
              mode === "create"
                ? "Proposal berhasil dibuat!"
                : "Proposal berhasil diperbarui!"
            }
            autoHideDuration={2000}
            onClose={() => setSuccess(false)}
          />
        </Paper>
      </Box>
    </FormProvider>
  );
}

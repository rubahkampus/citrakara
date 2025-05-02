"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, FormProvider, SubmitHandler } from "react-hook-form";
import {
  Box,
  Paper,
  Divider,
  Button,
  Alert,
  Typography,
  Snackbar,
  IconButton,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CheckIcon from "@mui/icons-material/Check";
import { axiosClient } from "@/lib/utils/axiosClient";
import { KButton } from "@/components/KButton";

// Import form sections
import BasicInfoSection from "./form/BasicInfoSection";
import SamplesSection from "./form/SamplesSection";
import DescriptionSection from "./form/DescriptionSection";
import DeadlineSection from "./form/DeadlineSection";
import CancelationFeeSection from "./form/CancelationFeeSection";
import RevisionSection from "./form/RevisionSection";
import MilestonesSection from "./form/MilestonesSection";
import ContractSection from "./form/ContractSection";
import GeneralOptionsSection from "./form/GeneralOptionsSection";
import SubjectOptionsSection from "./form/SubjectOptionsSection";
import TagsSection from "./form/TagsSection";

// Type definitions retained from original codebase
type SelectionInput = { label: string; price: number };
type OptionGroupInput = { title: string; selections: SelectionInput[] };
type AddonInput = { label: string; price: number };
type RevisionPolicyInput = {
  limit: boolean;
  free: number;
  extraAllowed: boolean;
  fee: number;
};
type SubjectGroupInput = {
  title: string;
  limit: number;
  discount: number;
  optionGroups: OptionGroupInput[];
  addons: AddonInput[];
  questions: Array<{ title: string; detail: string }>;
};
type GeneralOptionsInput = {
  optionGroups: OptionGroupInput[];
  addons: AddonInput[];
  questions: Array<{ title: string; detail: string }>;
};

export interface CommissionFormValues {
  title: string;
  basePrice: string;
  currency: string;
  slots: number;
  type: "template" | "custom";
  flow: "standard" | "milestone";
  tos: string;
  // Samples + Thumbnail
  samples: (File | string)[];
  thumbnailIdx: number;
  // Description
  description: { title: string; detail: string }[];
  // Deadline
  deadlineMode: "standard" | "withDeadline" | "withRush";
  deadlineMin: number;
  deadlineMax: number;
  rushKind?: "flat" | "perDay";
  rushAmount?: number;
  // Fees
  cancelKind: "flat" | "percentage";
  cancelAmount: number;
  // Revisions
  revisionType: "none" | "standard" | "milestone";
  revLimit?: boolean;
  revFree?: number;
  revExtraAllowed?: boolean;
  revFee?: number;
  // Milestones
  milestones: { title: string; percent: number; policy: RevisionPolicyInput }[];
  // Contract
  allowContractChange: boolean;
  changeable: string[];
  // Options
  generalOptions: GeneralOptionsInput;
  subjectOptions: SubjectGroupInput[];
  // Tags
  tags: string[];
}

interface CommissionFormProps {
  username: string;
  mode: "create" | "edit";
  initialData?: any;
  defaultTosId?: string;
}

export default function CommissionFormPage({
  username,
  mode,
  initialData,
  defaultTosId,
}: CommissionFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Form setup
  const methods = useForm<CommissionFormValues>({
    defaultValues: getDefaults(mode, initialData, defaultTosId),
    mode: "onChange",
  });

  const {
    handleSubmit,
    watch,
    setError: setFormError,
    formState: { errors },
  } = methods;

  const flow = watch("flow");

  const onSubmit: SubmitHandler<CommissionFormValues> = async (values) => {
    console.log("Form values:", values); // Debugging line
    setLoading(true);
    setError(null);

    try {
      // Validate required samples
      if (!values.samples.length) {
        setFormError("samples", {
          type: "manual",
          message: "At least one sample image is required",
        });
        setLoading(false);
        return;
      }

      // Validate milestones if using milestone flow
      if (values.flow === "milestone" && values.milestones.length === 0) {
        setError(
          "You must add at least one milestone when using milestone flow"
        );
        setLoading(false);
        return;
      }

      // Check if milestone percentages add up to 100%
      if (values.flow === "milestone" && values.milestones.length > 0) {
        const total = values.milestones.reduce(
          (sum, m) => sum + (m.percent || 0),
          0
        );
        if (total !== 100) {
          setError(
            `Milestone percentages must add up to 100%. Current total: ${total}%`
          );
          setLoading(false);
          return;
        }
      }

      // Prepare form data
      const fd = new FormData();
      fd.append("title", values.title);
      fd.append("basePrice", values.basePrice);
      fd.append("currency", values.currency);
      fd.append("type", values.type);
      fd.append("flow", values.flow);
      fd.append("tos", values.tos);

      // Handle thumbnail
      const thumb = values.samples[values.thumbnailIdx];
      if (thumb instanceof File) fd.append("thumbnail", thumb);
      else fd.append("thumbnailUrl", thumb);

      // Handle other samples
      values.samples.forEach((s, i) => {
        if (i !== values.thumbnailIdx && s instanceof File)
          fd.append("samples", s);
      });

      // Prepare JSON payload
      const payload = {
        slots: values.slots,
        tags: values.tags,
        description: values.description,
        deadline: {
          mode: values.deadlineMode,
          min: values.deadlineMin,
          max: values.deadlineMax,
          ...(values.deadlineMode === "withRush" && {
            rushFee: { kind: values.rushKind, amount: values.rushAmount },
          }),
        },
        cancelationFee: {
          kind: values.cancelKind,
          amount: values.cancelAmount,
        },
        revisions:
          values.revisionType === "standard"
            ? {
                type: "standard",
                policy: {
                  limit: values.revLimit,
                  free: values.revFree,
                  extraAllowed: values.revExtraAllowed,
                  fee: values.revFee,
                },
              }
            : { type: values.revisionType },
        ...(values.flow === "milestone" && { milestones: values.milestones }),
        allowContractChange: values.allowContractChange,
        changeable: values.changeable,
        generalOptions: values.generalOptions,
        subjectOptions: values.subjectOptions,
      };

      fd.append("payload", JSON.stringify(payload));

      console.log("Form Data:", fd); // Debugging line

      // Submit the form
    //   if (mode === "create") {
    //     await axiosClient.post("/api/commission/listing", fd);
    //   } else {
    //     await axiosClient.patch(
    //       `/api/commission/listing/${initialData._id}`,
    //       fd
    //     );
    //   }

      // Show success message and redirect
      setSaveSuccess(true);

      // Redirect after short delay
      setTimeout(() => {
        router.push(`/${username}/dashboard/commissions`);
      }, 1500);
    } catch (e: any) {
      setError(
        e.response?.data?.error || "Save operation failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <FormProvider {...methods}>
      <Box sx={{ maxWidth: 1200, mx: "auto", pb: 8 }}>
        {/* Header & Navigation */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 3,
          }}
        >
          <Button
            startIcon={<ArrowBackIcon />}
            variant="outlined"
            onClick={() => router.back()}
          >
            Back to Listings
          </Button>

          <Typography variant="h5" fontWeight="bold">
            {mode === "create" ? "" : "Edit Commission"}
          </Typography>
        </Box>

        {/* Error Display */}
        {error && (
          <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Success Message */}
        <Snackbar
          open={saveSuccess}
          autoHideDuration={3000}
          onClose={() => setSaveSuccess(false)}
          message={`Commission listing ${
            mode === "create" ? "created" : "updated"
          } successfully!`}
          action={
            <IconButton size="small" color="inherit">
              <CheckIcon fontSize="small" />
            </IconButton>
          }
        />

        {/* Main Form Container */}
        <Paper
          component="form"
          onSubmit={handleSubmit(onSubmit)}
          sx={{
            p: 4,
            border: 1,
            borderColor: "divider",
            borderRadius: 2,
            boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
          }}
        >
          {/* Basic Info Section */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
              Commission Details
            </Typography>
            <BasicInfoSection mode={mode} />
          </Box>
          <Divider sx={{ my: 4 }} />

          {/* Samples Section */}
          <Box sx={{ mb: 4 }}>
            <SamplesSection />
          </Box>
          <Divider sx={{ my: 4 }} />

          {/* Description Section */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
              Description
            </Typography>
            <DescriptionSection />
          </Box>
          <Divider sx={{ my: 4 }} />

          {/* Deadline Section */}
          <DeadlineSection />
          <Divider sx={{ my: 4 }} />

          {/* Cancelation Fee Section */}
          <CancelationFeeSection />
          <Divider sx={{ my: 4 }} />

          {/* Revision Section */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
              Revision Policy
            </Typography>
            <RevisionSection />
          </Box>
          <Divider sx={{ my: 4 }} />

          {/* Milestones Section (conditional) */}
          {flow === "milestone" && (
            <>
              <MilestonesSection />
              <Divider sx={{ my: 4 }} />
            </>
          )}

          {/* Contract Section */}
          <ContractSection />
          <Divider sx={{ my: 4 }} />

          {/* Options Sections */}
          <GeneralOptionsSection />
          <Divider sx={{ my: 4 }} />

          <SubjectOptionsSection />
          <Divider sx={{ my: 4 }} />

          {/* Tags Section */}
          <TagsSection />

          {/* Form Controls */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "flex-end",
              gap: 2,
              mt: 4,
              pt: 3,
              borderTop: 1,
              borderColor: "divider",
            }}
          >
            <Button
              variant="outlined"
              onClick={() => router.back()}
              disabled={loading}
            >
              Cancel
            </Button>
            <KButton type="submit" loading={loading} disabled={loading}>
              {mode === "create" ? "Create Commission" : "Save Changes"}
            </KButton>
          </Box>
        </Paper>
      </Box>
    </FormProvider>
  );
}

// Helper: default values - retained from original codebase
function getDefaults(
  mode: "create" | "edit",
  data: any,
  defaultTosId?: string
): CommissionFormValues {
  if (mode === "edit" && data) {
    return {
      title: data.title,
      basePrice: String(data.basePrice ?? 0),
      currency: data.currency || "IDR",
      slots: data.slots,
      type: data.type,
      flow: data.flow,
      tos: data.tos,
      samples: data.samples || [],
      thumbnailIdx: 0,
      description: data.description || [{ title: "Overview", detail: "" }],
      deadlineMode: data.deadline.mode,
      deadlineMin: data.deadline.min,
      deadlineMax: data.deadline.max,
      rushKind: data.deadline.rushFee?.kind,
      rushAmount: data.deadline.rushFee?.amount,
      cancelKind: data.cancelationFee.kind,
      cancelAmount: data.cancelationFee.amount,
      revisionType: data.revisions?.type || "none",
      revLimit: data.revisions?.policy?.limit,
      revFree: data.revisions?.policy?.free,
      revExtraAllowed: data.revisions?.policy?.extraAllowed,
      revFee: data.revisions?.policy?.fee,
      milestones: data.milestones || [],
      allowContractChange: data.allowContractChange ?? true,
      changeable: data.changeable || [],
      generalOptions: data.generalOptions || {
        optionGroups: [],
        addons: [],
        questions: [],
      },
      subjectOptions: data.subjectOptions || [],
      tags: data.tags || [],
    } as CommissionFormValues;
  }

  return {
    title: "",
    basePrice: "",
    currency: "IDR",
    slots: -1,
    type: "template",
    flow: "standard",
    tos: defaultTosId || "",
    samples: [],
    thumbnailIdx: 0,
    description: [{ title: "Overview", detail: "" }],
    deadlineMode: "standard",
    deadlineMin: 7,
    deadlineMax: 14,
    cancelKind: "percentage",
    cancelAmount: 10,
    revisionType: "none",
    milestones: [],
    allowContractChange: true,
    changeable: [
      "deadline",
      "generalOptions",
      "subjectOptions",
      "description",
      "referenceImages",
    ],
    generalOptions: { optionGroups: [], addons: [], questions: [] },
    subjectOptions: [],
    tags: [],
  } as CommissionFormValues;
}

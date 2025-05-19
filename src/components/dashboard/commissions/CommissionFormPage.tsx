// src/components/dashboard/commissions/CommissionFormPage.tsx
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
  Breadcrumbs,
  Link,
} from "@mui/material";
import {
  NavigateNext,
  Home,
  BrushRounded,
  ArrowBack,
  Add,
  Check as CheckIcon,
} from "@mui/icons-material";
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
import TemplateSection from "./form/TemplateSection";

// Constants
const TEXT = {
  pageTitle: {
    create: "Buat Komisi",
    edit: "Edit Komisi",
  },
  breadcrumbs: {
    dashboard: "Dashboard",
    commissions: "Komisi",
    create: "Buat Komisi",
    edit: "Edit Komisi",
  },
  backButton: "Kembali ke Daftar Komisi",
  cancelButton: "Batal",
  submitButton: {
    create: "Buat Komisi",
    edit: "Simpan Perubahan",
  },
  success: {
    create: "Daftar komisi berhasil dibuat!",
    edit: "Daftar komisi berhasil diperbarui!",
  },
  errors: {
    missingFields: "Mohon lengkapi bidang berikut: ",
    fixErrors: "Mohon perbaiki kesalahan yang ditandai.",
    sampleRequired: "Setidaknya satu contoh gambar diperlukan",
    milestoneRequired:
      "Anda harus menambahkan setidaknya satu milestone saat menggunakan alur milestone",
    milestoneTotal:
      "Persentase milestone harus berjumlah 100%. Total saat ini: ",
    saveFailed: "Gagal menyimpan. Silakan coba lagi.",
  },
  sections: {
    revisionRules: "Aturan Revisi",
  },
  fieldNames: {
    title: "Judul",
    slots: "Jumlah Slot",
    samples: "Contoh Gambar",
    description: "Deskripsi",
    cancelKind: "Jenis Pembatalan",
    cancelAmount: "Jumlah Pembatalan",
    revisionType: "Kebijakan Revisi",
  },
};

// UI spacing & styling constants
const SPACING = {
  sectionMargin: { mb: 4 },
  sectionDivider: { my: 4 },
  formContainer: {
    p: 4,
    border: 1,
    borderColor: "divider",
    borderRadius: 2,
    boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
  },
  formControls: {
    display: "flex",
    justifyContent: "flex-end",
    gap: 2,
    mt: 4,
    pt: 3,
    borderTop: 1,
    borderColor: "divider",
  },
  headerWrapper: {
    mb: 3,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  titleContainer: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
  },
  pageTitle: {
    display: "flex",
    alignItems: "center",
    mt: 4,
    ml: -0.5,
  },
};

// Type definitions updated for new ID-based model
type ID = number;

export type SelectionInput = { id?: ID; label: string; price: number };
export type OptionGroupInput = {
  id?: ID;
  title: string;
  selections: SelectionInput[];
};
export type AddonInput = { id?: ID; label: string; price: number };
export type QuestionInput = { id?: ID; label: string };
export type RevisionPolicyInput = {
  limit: boolean;
  free: number;
  extraAllowed: boolean;
  fee: number;
};
export type MilestoneInput = {
  id?: ID;
  title: string;
  percent: number;
  policy?: RevisionPolicyInput;
};
export type SubjectGroupInput = {
  id?: ID;
  title: string;
  limit: number;
  discount: number;
  optionGroups: OptionGroupInput[];
  addons: AddonInput[];
  questions: QuestionInput[];
};
export type GeneralOptionsInput = {
  optionGroups: OptionGroupInput[];
  addons: AddonInput[];
  questions: QuestionInput[];
};

export interface CommissionFormValues {
  title: string;
  basePrice: number;
  currency: string;
  slots: number;
  type: "template" | "custom";
  flow: "standard" | "milestone";
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
  milestones: MilestoneInput[];
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
}

export default function CommissionFormPage({
  username,
  mode,
  initialData,
}: CommissionFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Form setup
  const methods = useForm<CommissionFormValues>({
    defaultValues: getDefaults(mode, initialData),
    mode: "onChange",
  });

  const {
    handleSubmit,
    watch,
    setError: setFormError,
    formState: { errors },
  } = methods;

  const flow = watch("flow");

  // Helper to generate sequential IDs for new components
  const generateSequentialIds = <T extends { id?: ID }>(
    items: T[]
  ): (T & { id: ID })[] => {
    return items.map((item, index) => ({
      ...item,
      id: item.id ?? index + 1,
    }));
  };

  const onSubmit: SubmitHandler<CommissionFormValues> = async (values) => {
    setLoading(true);
    setError(null);

    console.log("Submitting form with values:", values); // Debugging line

    try {
      // Validate required samples
      if (!values.samples.length) {
        setFormError("samples", {
          type: "manual",
          message: TEXT.errors.sampleRequired,
        });
        setLoading(false);
        return;
      }

      // Validate milestones if using milestone flow
      if (values.flow === "milestone" && values.milestones.length === 0) {
        setError(TEXT.errors.milestoneRequired);
        setLoading(false);
        return;
      }

      // Check if milestone percentages add up to 100%
      if (values.flow === "milestone" && values.milestones.length > 0) {
        const total = values.milestones.reduce(
          (sum, m) => sum + (m.percent || 0),
          0
        );
        if (Math.abs(total - 100) > 0.1) {
          setError(`${TEXT.errors.milestoneTotal}${total.toFixed(2)}%`);
          setLoading(false);
          return;
        }
      }

      // Prepare form data
      const fd = new FormData();
      fd.append("title", values.title);
      fd.append("basePrice", values.basePrice.toString());
      fd.append("currency", values.currency);
      fd.append("type", values.type);
      fd.append("flow", values.flow);
      fd.append("thumbnailIdx", values.thumbnailIdx.toString());

      // Handle other samples
      if (mode === "create") {
        values.samples.forEach((s) => {
          if (s instanceof File) fd.append("samples[]", s);
        });
      } else {
        // new:
        const existingSampleUrls = values.samples.filter(
          (s) => typeof s === "string"
        ) as string[];
        const newSampleFiles = values.samples.filter(
          (s) => s instanceof File
        ) as File[];

        // first, tell the server exactly which URLs to keep:
        existingSampleUrls.forEach((url) => {
          fd.append("existingSamples[]", url);
        });

        // then, append only the fresh File uploads:
        newSampleFiles.forEach((file) => {
          fd.append("samples[]", file);
        });
      }

      // Add IDs to all components
      const processedMilestones = generateSequentialIds(values.milestones);

      // Process general options
      const processedGeneralOptions: GeneralOptionsInput = {
        optionGroups: generateSequentialIds(
          values.generalOptions.optionGroups
        ).map((group) => ({
          ...group,
          selections: generateSequentialIds(group.selections),
        })),
        addons: generateSequentialIds(values.generalOptions.addons),
        questions: generateSequentialIds(values.generalOptions.questions),
      };

      // Process subject options
      const processedSubjectOptions = generateSequentialIds(
        values.subjectOptions
      ).map((subject) => ({
        ...subject,
        optionGroups: generateSequentialIds(subject.optionGroups).map(
          (group) => ({
            ...group,
            selections: generateSequentialIds(group.selections),
          })
        ),
        addons: generateSequentialIds(subject.addons),
        questions: generateSequentialIds(subject.questions),
      }));

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
        ...(values.flow === "milestone" && { milestones: processedMilestones }),
        allowContractChange: values.allowContractChange,
        changeable: values.changeable,
        generalOptions: processedGeneralOptions,
        subjectOptions: processedSubjectOptions,
      };

      fd.append("payload", JSON.stringify(payload));

      for (var pair of fd.entries()) {
        console.log(pair[0] + ", " + pair[1]);
      } // Debugging line

      // Submit the form
      if (mode === "create") {
        await axiosClient.post("/api/commission/listing", fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        await axiosClient.patch(
          `/api/commission/listing/${initialData._id}`,
          fd,
          {
            headers: { "Content-Type": "multipart/form-data" },
          }
        );
      }

      // Show success message and redirect
      setSaveSuccess(true);

      // Redirect after short delay
      const redirectTimer = setTimeout(() => {
        router.push(`/${username}/dashboard/commissions`);
      }, 1500);
      // cleanup if unmounted
    } catch (e: any) {
      setError(e.response?.data?.error || TEXT.errors.saveFailed);
    } finally {
      setLoading(false);
    }
  };

  const getMissingFieldsMessage = () => {
    if (Object.keys(errors).length === 0) return null;

    const missingFields = Object.keys(errors)
      .map((key) => TEXT.fieldNames[key as keyof typeof TEXT.fieldNames] || key)
      .join(", ");

    return `${TEXT.errors.missingFields}${missingFields}`;
  };

  return (
    <FormProvider {...methods}>
      <Box
        sx={{
          py: 4,
          maxWidth: "100%",
          animation: "fadeIn 0.3s ease-in-out",
          "@keyframes fadeIn": {
            "0%": { opacity: 0, transform: "translateY(10px)" },
            "100%": { opacity: 1, transform: "translateY(0)" },
          },
        }}
      >
        {/* Header & Navigation */}
        <Box sx={SPACING.headerWrapper}>
          <Box sx={SPACING.titleContainer}>
            <Breadcrumbs separator={<NavigateNext fontSize="small" />}>
              <Link
                component={Link}
                href={`/${username}/dashboard`}
                underline="hover"
                color="inherit"
                sx={{ display: "flex", alignItems: "center" }}
              >
                <Home fontSize="small" sx={{ mr: 0.5 }} />
                {TEXT.breadcrumbs.dashboard}
              </Link>
              <Link
                component={Link}
                href={`/${username}/dashboard/commissions`}
                underline="hover"
                color="inherit"
                sx={{ display: "flex", alignItems: "center" }}
              >
                <BrushRounded fontSize="small" sx={{ mr: 0.5 }} />
                {TEXT.breadcrumbs.commissions}
              </Link>
              <Typography
                color="text.primary"
                sx={{ display: "flex", alignItems: "center" }}
              >
                {mode == "create"
                  ? TEXT.breadcrumbs.create
                  : TEXT.breadcrumbs.edit}
              </Typography>
            </Breadcrumbs>

            <Box sx={SPACING.pageTitle}>
              <Add sx={{ mr: 1, color: "primary.main", fontSize: 32 }} />
              <Typography variant="h4" fontWeight="bold">
                {TEXT.pageTitle[mode]}
              </Typography>
            </Box>
          </Box>

          <Button
            component={Link}
            href={`/${username}/dashboard/commissions`}
            variant="outlined"
            startIcon={<ArrowBack />}
            size="small"
            sx={{ mt: 1 }}
          >
            {TEXT.backButton}
          </Button>
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
          message={TEXT.success[mode]}
          action={
            <IconButton size="small" color="inherit" aria-label="Selesai">
              <CheckIcon fontSize="small" />
            </IconButton>
          }
        />

        {/* Main Form Container */}
        <Paper
          component="form"
          onSubmit={handleSubmit(onSubmit, (errors) => {
            setError(getMissingFieldsMessage() || TEXT.errors.fixErrors);
          })}
          sx={SPACING.formContainer}
        >
          {/* Template Section (only in create mode) */}
          {mode === "create" && (
            <>
              <TemplateSection />
              <Divider sx={SPACING.sectionDivider} />
            </>
          )}

          {/* Basic Info Section */}
          <Box sx={SPACING.sectionMargin}>
            <BasicInfoSection mode={mode} />
          </Box>
          <Divider sx={SPACING.sectionDivider} />

          {/* Samples Section */}
          <Box sx={SPACING.sectionMargin}>
            <SamplesSection />
          </Box>
          <Divider sx={SPACING.sectionDivider} />

          {/* Description Section */}
          <Box sx={SPACING.sectionMargin}>
            <DescriptionSection />
          </Box>
          <Divider sx={SPACING.sectionDivider} />

          {/* Deadline Section */}
          <DeadlineSection />
          <Divider sx={SPACING.sectionDivider} />

          {/* Cancelation Fee Section */}
          <CancelationFeeSection />
          <Divider sx={SPACING.sectionDivider} />

          {/* Revision Section */}
          <Box sx={SPACING.sectionMargin}>
            <RevisionSection />
          </Box>
          <Divider sx={SPACING.sectionDivider} />

          {/* Milestones Section (conditional) */}
          {flow === "milestone" && (
            <>
              <MilestonesSection />
              <Divider sx={SPACING.sectionDivider} />
            </>
          )}

          {/* Contract Section */}
          <ContractSection />
          <Divider sx={SPACING.sectionDivider} />

          {/* Options Sections */}
          <GeneralOptionsSection />
          <Divider sx={SPACING.sectionDivider} />

          <SubjectOptionsSection />
          <Divider sx={SPACING.sectionDivider} />

          {/* Tags Section */}
          <TagsSection />

          {/* Form Controls */}
          <Box sx={SPACING.formControls}>
            <Button
              variant="outlined"
              onClick={() => router.back()}
              disabled={loading}
            >
              {TEXT.cancelButton}
            </Button>
            <KButton type="submit" loading={loading} disabled={loading}>
              {TEXT.submitButton[mode]}
            </KButton>
          </Box>
        </Paper>
      </Box>
    </FormProvider>
  );
}

// Helper: default values for the form
function getDefaults(mode: "create" | "edit", data: any): CommissionFormValues {
  if (mode === "edit" && data) {
    // Convert ID-based questions to the form's expected format
    const processGeneralOptionsQuestions = (
      questions: any[] = []
    ): QuestionInput[] => {
      return questions.map((q) => {
        if (typeof q === "string") {
          return { label: q };
        } else if (typeof q === "object" && q !== null) {
          // Handle both old format (title) and new format (label)
          return {
            id: q.id,
            label: q.label || q.text || q.title || "",
          };
        }
        return { label: String(q) };
      });
    };

    const processSubjectOptions = (
      subjectOptions: any[] = []
    ): SubjectGroupInput[] => {
      return subjectOptions.map((subject) => {
        const questions = subject.questions
          ? subject.questions.map((q: any) => {
              if (typeof q === "string") {
                return { label: q };
              } else if (typeof q === "object" && q !== null) {
                return {
                  id: q.id,
                  label: q.label || q.text || q.title || "",
                };
              }
              return { label: String(q) };
            })
          : [];

        return {
          ...subject,
          questions,
          optionGroups:
            subject.optionGroups?.map((group: any) => ({
              ...group,
              id: group.id,
              selections:
                group.selections?.map((s: any) => ({
                  id: s.id,
                  label: s.label,
                  price: s.price,
                })) || [],
            })) || [],
          addons:
            subject.addons?.map((addon: any) => ({
              id: addon.id,
              label: addon.label,
              price: addon.price,
            })) || [],
        };
      });
    };

    // Format generalOptions for the form
    const generalOptions = data.generalOptions || {};
    const formattedGeneralOptions = {
      optionGroups: (generalOptions.optionGroups || []).map((group: any) => ({
        id: group.id,
        title: group.title,
        selections: (group.selections || []).map((s: any) => ({
          id: s.id,
          label: s.label,
          price: s.price,
        })),
      })),
      addons: (generalOptions.addons || []).map((addon: any) => ({
        id: addon.id,
        label: addon.label,
        price: addon.price,
      })),
      questions: processGeneralOptionsQuestions(generalOptions.questions),
    };

    // Format milestones for the form
    const milestones = (data.milestones || []).map((m: any) => ({
      id: m.id,
      title: m.title,
      percent: m.percent,
      policy: m.policy,
    }));

    return {
      title: data.title || "",
      basePrice: data.basePrice ?? 0,
      currency: data.currency || "IDR",
      slots: data.slots ?? -1,
      type: data.type || "template",
      flow: data.flow || "standard",
      samples: data.samples || [],
      thumbnailIdx:
        typeof data.thumbnailIdx === "number" && data.thumbnailIdx >= 0
          ? data.thumbnailIdx
          : 0,
      description: data.description || [{ title: "Overview", detail: "" }],
      deadlineMode: data.deadline?.mode || "standard",
      deadlineMin: data.deadline?.min ?? 7,
      deadlineMax: data.deadline?.max ?? 14,
      rushKind: data.deadline?.rushFee?.kind,
      rushAmount: data.deadline?.rushFee?.amount,
      cancelKind: data.cancelationFee?.kind || "percentage",
      cancelAmount: data.cancelationFee?.amount ?? 10,
      revisionType: data.revisions?.type || "none",
      revLimit: data.revisions?.policy?.limit ?? false,
      revFree: data.revisions?.policy?.free ?? 0,
      revExtraAllowed: data.revisions?.policy?.extraAllowed ?? false,
      revFee: data.revisions?.policy?.fee ?? 0,
      milestones: milestones,
      allowContractChange: data.allowContractChange ?? true,
      changeable: data.changeable || [
        "deadline",
        "generalOptions",
        "subjectOptions",
        "description",
        "referenceImages",
      ],
      generalOptions: formattedGeneralOptions,
      subjectOptions: processSubjectOptions(data.subjectOptions),
      tags: data.tags || [],
    } as CommissionFormValues;
  }

  // Default values for create mode
  return {
    title: "",
    basePrice: 0,
    currency: "IDR",
    slots: -1,
    type: "template",
    flow: "standard",
    samples: [],
    thumbnailIdx: 0,
    description: [{ title: "Overview", detail: "" }],
    deadlineMode: "standard",
    deadlineMin: 7,
    deadlineMax: 14,
    cancelKind: "percentage",
    cancelAmount: 10,
    revisionType: "standard",
    revLimit: false,
    revFree: 2,
    revExtraAllowed: true,
    revFee: 0,
    milestones: [],
    allowContractChange: true,
    changeable: [
      "deadline",
      "generalOptions",
      "subjectOptions",
      "description",
      "referenceImages",
    ],
    generalOptions: {
      optionGroups: [],
      addons: [],
      questions: [],
    },
    subjectOptions: [],
    tags: [],
  } as CommissionFormValues;
}

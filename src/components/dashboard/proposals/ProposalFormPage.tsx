// src/components/dashboard/proposals/ProposalFormPage.tsx
/**
 * ProposalFormPage
 * ----------------
 * Composite form for creating or editing a proposal.
 * 
 * Props:
 *   - username: string
 *   - mode: "create" | "edit"
 *   - initialData?: ProposalUI  // serialized via formatProposalForUI
 * 
 * Sections:
 *   1. AvailabilitySection (earliest, deadline, latest dates)
 *   2. DescriptionSection (generalDescription text)
 *   3. ReferenceImagesSection (upload + preview up to 5 images)
 *   4. GeneralOptionsSection (optionGroups, addons, answers)
 *   5. SubjectOptionsSection (per-subject instances)
 *   6. PriceBreakdownSection (live summary of calculatedPrice)
 * 
 * Implementation guide:
 *   - Use React Hook Form:
 *       const methods = useForm<ProposalFormValues>({ defaultValues: initialData });
 *     Wrap form in <FormProvider {...methods}>.
 *   - On submit:
 *     • Build FormData:
 *         fd.append("listingId", listingId);
 *         fd.append("earliestDate", values.earliestDate.toISOString());
 *         fd.append("latestDate", values.latestDate.toISOString());
 *         fd.append("deadline", values.deadline.toISOString());
 *         fd.append("generalDescription", values.generalDescription);
 *         fd.append("payload", JSON.stringify({ generalOptions, subjectOptions }));
 *         values.referenceImages.forEach(file => fd.append("referenceImages[]", file));
 *     • POST to /api/proposal for create or PATCH to /api/proposal/[id] for edit.
 * 
 * Available APIs:
 *   POST /api/proposal  (FormData)
 *   PATCH /api/proposal/[proposalId]  (FormData)
 * 
 * Example create payload:
 *   FormData {
 *     listingId: "123",
 *     earliestDate: "2025-05-10",
 *     latestDate: "2025-05-20",
 *     deadline: "2025-05-15",
 *     generalDescription: "Please draw my character...",
 *     payload: "{ \"generalOptions\": {...}, \"subjectOptions\": {...} }",
 *     referenceImages[]: File,
 *     ...
 *   }
 */
import React from "react";
import { useForm, FormProvider } from "react-hook-form";
import { ProposalFormValues, ProposalUI } from "@/types/proposal";
import AvailabilitySection from "./form/AvailabilitySection";
import DescriptionSection from "./form/DescriptionSection";
import ReferenceImagesSection from "./form/ReferenceImagesSection";
import GeneralOptionsSection from "./form/GeneralOptionsSection";
import SubjectOptionsSection from "./form/SubjectOptionsSection";
import PriceBreakdownSection from "./form/PriceBreakdownSection";

interface ProposalFormPageProps {
  username: string;
  mode: "create" | "edit";
  initialData?: ProposalUI;
}

export default function ProposalFormPage({ username, mode, initialData }: ProposalFormPageProps) {
  const methods = useForm<ProposalFormValues>({ defaultValues: initialData });
  const { handleSubmit } = methods;

  // TODO: implement onSubmit using FormData and axiosClient or useServerAction
  const onSubmit = async (values: ProposalFormValues) => {
    // placeholder
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <AvailabilitySection />
        <DescriptionSection />
        <ReferenceImagesSection />
        <GeneralOptionsSection />
        <SubjectOptionsSection />
        <PriceBreakdownSection />
        <button type="submit">{mode === "create" ? "Create Proposal" : "Save Changes"}</button>
      </form>
    </FormProvider>
  );
}
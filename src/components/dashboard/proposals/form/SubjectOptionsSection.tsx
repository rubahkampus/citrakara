// src/components/dashboard/proposals/form/SubjectOptionsSection.tsx
/**
 * SubjectOptionsSection
 * ---------------------
 * Renders for each subjectTitle:
 *   - instances[] with nested optionGroups/addons/answers per instance
 * Use nested useFieldArray calls for dynamic depth.
 */
import React from "react";
import { useFormContext } from "react-hook-form";
import { ProposalFormValues } from "@/types/proposal";

export default function SubjectOptionsSection() {
  const { control } = useFormContext<ProposalFormValues>();
  return (
    <div>
      {/* TODO: useFieldArray over formValues.subjectOptions */}
    </div>
  );
}

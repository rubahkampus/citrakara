// src/components/dashboard/proposals/form/GeneralOptionsSection.tsx
/**
 * GeneralOptionsSection
 * ---------------------
 * Renders nested optionGroups, addons, and answer fields.
 * Use RHF's useFieldArray for dynamic groups.
 * Data shape:
 *   formValues.generalOptions.optionGroups: { [title]: { selectedLabel, price } }
 *   formValues.generalOptions.addons: { [label]: price }
 *   formValues.generalOptions.answers: { [question]: answer }
 */
import React from "react";
import { useFormContext } from "react-hook-form";
import { ProposalFormValues } from "@/types/proposal";

export default function GeneralOptionsSection() {
  const { control } = useFormContext<ProposalFormValues>();
  return (
    <div>
      {/* TODO: map through optionGroups via useFieldArray */}
    </div>
  );
}
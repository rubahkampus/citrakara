// src/components/dashboard/proposals/form/PriceBreakdownSection.tsx
/**
 * PriceBreakdownSection
 * ---------------------
 * Displays a real‑time summary of price components:
 *   base, optionGroups, addons, rush, discount, surcharge, total
 * Use useFormContext(watch) to read calculated fields.
 * No input elements.
 */
import React from "react";
import { useFormContext } from "react-hook-form";
import { ProposalFormValues } from "@/types/proposal";

export default function PriceBreakdownSection() {
  const { watch } = useFormContext<ProposalFormValues>();
  // TODO: const values = watch(["calculatedPrice"]);
  return (
    <div>
      {/* TODO: render values.base, values.optionGroups, etc. */}
    </div>
  );
}

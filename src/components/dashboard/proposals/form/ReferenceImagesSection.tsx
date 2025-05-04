// src/components/dashboard/proposals/form/ReferenceImagesSection.tsx
/**
 * ReferenceImagesSection
 * ----------------------
 * Allows uploading up to 5 image files, previews them, and removal.
 * Use useFormContext + useFieldArray or custom file state.
 * Preview logic with URL.createObjectURL.
 */
import React from "react";
import { useFormContext } from "react-hook-form";
import { ProposalFormValues } from "@/types/proposal";

export default function ReferenceImagesSection() {
  // TODO: implement file input, preview grid, removal, marking kept vs new
  return (
    <div>
      {/* TODO: <input type="file" multiple accept="image/*" onChange={...} /> */}
    </div>
  );
}
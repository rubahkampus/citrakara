// src/types/proposal.ts
/**
 * Derived from IProposal
 */
import { IProposal } from "@/lib/db/models/proposal.model";

export interface PriceBreakdown {
  basePrice: number;
  optionsTotal: number;
  rush: number;
  discount: number;
  surcharge: number;
  finalTotal: number;
}

export interface Availability {
  earliestDate: Date;
  latestDate: Date;
}

export type ProposalStatus =
  | "pendingArtist"
  | "pendingClient"
  | "accepted"
  | "rejectedArtist"
  | "rejectedClient"
  | "expired";

/**
 * ProposalFormValues: values used in the create/edit form
 */
export interface GeneralOptionGroupInput {
  selectedId: number;
  selectedLabel: string;
  price: number;
}

export interface GeneralOptionsInput {
  optionGroups: Record<string, GeneralOptionGroupInput>;
  addons: Record<string, number>;
  answers: Record<string, string>;
}

export interface SubjectInstanceInput {
  optionGroups: Record<string, GeneralOptionGroupInput>;
  addons: Record<string, number>;
  answers: Record<string, string>;
}

export interface SubjectOptionsInput {
  [subjectTitle: string]: {
    instances: SubjectInstanceInput[];
  };
}

export interface ProposalFormValues {
  id?: string; // for edit only
  listingId: string;
  earliestDate?: string; // date string (YYYY-MM-DD)
  latestDate?: string;
  deadline: string;
  generalDescription: string;
  referenceImages: Array<File | string>;
  generalOptions: GeneralOptionsInput;
  subjectOptions: SubjectOptionsInput;
}

/**
 * Internal type mappers - used to convert between form values and API data
 * These adapters help translate between the record-based frontend format
 * and the array-based backend format
 */

// Backend model types (matching the repository)
export interface OptionSelection {
  id: number;
  groupId: number;
  selectedSelectionID: number;
  selectedSelectionLabel: string;
  price: number;
}

export interface Addon {
  id: number;
  addonId: number;
  price: number;
}

export interface Answer {
  id: number;
  questionId: number;
  answer: string;
}

export interface ModelGeneralOptions {
  optionGroups: OptionSelection[];
  addons: Addon[];
  answers: Answer[];
}

export interface SubjectInstance {
  id: number;
  optionGroups: OptionSelection[];
  addons: Addon[];
  answers: Answer[];
}

export interface SubjectOption {
  subjectId: number;
  instances: SubjectInstance[];
}

export interface ModelSubjectOptions {
  subjects: SubjectOption[];
}

/**
 * Converter functions to transform between formats
 */
export const convertToModelFormat = (formValues: ProposalFormValues) => {
  // Convert general options
  const generalOptions: ModelGeneralOptions = {
    optionGroups: Object.entries(formValues.generalOptions.optionGroups).map(
      ([groupId, option], index) => ({
        id: index + 1,
        groupId: Number(groupId),
        selectedSelectionID: option.selectedId,
        selectedSelectionLabel: option.selectedLabel,
        price: option.price,
      })
    ),
    addons: Object.entries(formValues.generalOptions.addons).map(
      ([addonId, price], index) => ({
        id: index + 1,
        addonId: Number(addonId),
        price,
      })
    ),
    answers: Object.entries(formValues.generalOptions.answers)
      .filter(
        ([questionId, answer]) => answer !== undefined && answer.trim() !== ""
      )
      .map(([questionId, answer], index) => ({
        id: index + 1,
        questionId: Number(questionId),
        answer,
      })),
  };

  // Convert subject options
  const subjectOptions: ModelSubjectOptions = {
    subjects: Object.entries(formValues.subjectOptions).map(
      ([subjectId, subject], subjectIndex) => ({
        subjectId: Number(subjectId),
        instances: subject.instances.map((instance, instanceIndex) => ({
          id: instanceIndex + 1,
          optionGroups: Object.entries(instance.optionGroups).map(
            ([groupId, option], index) => ({
              id: index + 1,
              groupId: Number(groupId),
              selectedSelectionID: option.selectedId,
              selectedSelectionLabel: option.selectedLabel,
              price: option.price,
            })
          ),
          addons: Object.entries(instance.addons).map(
            ([addonId, price], index) => ({
              id: index + 1,
              addonId: Number(addonId),
              price: typeof price === "object" ? (price as any).price : price,
            })
          ),
          answers: Object.entries(instance.answers)
            .filter(
              ([questionId, answer]) =>
                answer !== undefined && answer.trim() !== ""
            )
            .map(([questionId, answer], index) => ({
              id: index + 1,
              questionId: Number(questionId),
              answer,
            })),
        })),
      })
    ),
  };

  return {
    ...formValues,
    generalOptions,
    subjectOptions,
  };
};

/**
 * Convert database format back to form format
 * This handles the specific structure of the data coming from the database
 */
export const convertToFormFormat = (dbData: any): ProposalFormValues => {
  // Initialize the form values structure
  const formValues: ProposalFormValues = {
    id: dbData._id?.toString() || dbData.id,
    listingId: dbData.listingId?.toString() || "",
    deadline: dbData.deadline
      ? new Date(dbData.deadline).toISOString().split("T")[0]
      : "",
    earliestDate: dbData.availability?.earliestDate
      ? new Date(dbData.availability.earliestDate).toISOString().split("T")[0]
      : undefined,
    latestDate: dbData.availability?.latestDate
      ? new Date(dbData.availability.latestDate).toISOString().split("T")[0]
      : undefined,
    generalDescription: dbData.generalDescription || "",
    referenceImages: dbData.referenceImages || [],
    generalOptions: {
      optionGroups: {},
      addons: {},
      answers: {},
    },
    subjectOptions: {},
  };

  // If the data already has the form structure (already converted), just return it
  if (
    dbData.generalOptions &&
    typeof dbData.generalOptions.optionGroups === "object" &&
    !Array.isArray(dbData.generalOptions.optionGroups) &&
    dbData.subjectOptions &&
    typeof dbData.subjectOptions === "object" &&
    !Array.isArray(dbData.subjectOptions)
  ) {
    return dbData as ProposalFormValues;
  }

  // Process general options if they exist in the DB format
  if (dbData.generalOptions) {
    // Handle optionGroups
    if (Array.isArray(dbData.generalOptions.optionGroups)) {
      dbData.generalOptions.optionGroups.forEach((option: OptionSelection) => {
        formValues.generalOptions.optionGroups[option.groupId] = {
          selectedId: option.selectedSelectionID,
          selectedLabel: option.selectedSelectionLabel,
          price: option.price,
        };
      });
    }

    // Handle addons
    if (Array.isArray(dbData.generalOptions.addons)) {
      dbData.generalOptions.addons.forEach((addon: Addon) => {
        formValues.generalOptions.addons[addon.addonId] = addon.price;
      });
    }

    // Handle answers
    if (Array.isArray(dbData.generalOptions.answers)) {
      dbData.generalOptions.answers.forEach((answer: Answer) => {
        formValues.generalOptions.answers[answer.questionId] = answer.answer;
      });
    }
  }

  // Process subject options if they exist in the DB format as an array
  if (Array.isArray(dbData.subjectOptions)) {
    dbData.subjectOptions.forEach((subject: any) => {
      const subjectId = subject.subjectId.toString();

      formValues.subjectOptions[subjectId] = {
        instances: subject.instances.map((instance: any) => {
          const instanceData: SubjectInstanceInput = {
            optionGroups: {},
            addons: {},
            answers: {},
          };

          // Handle instance optionGroups
          if (Array.isArray(instance.optionGroups)) {
            instance.optionGroups.forEach((option: any) => {
              instanceData.optionGroups[option.groupId] = {
                selectedId: option.selectedSelectionID,
                selectedLabel: option.selectedSelectionLabel,
                price: option.price,
              };
            });
          }

          // Handle instance addons
          if (Array.isArray(instance.addons)) {
            instance.addons.forEach((addon: any) => {
              instanceData.addons[addon.addonId] = addon.price;
            });
          }

          // Handle instance answers
          if (Array.isArray(instance.answers)) {
            instance.answers.forEach((answer: any) => {
              instanceData.answers[answer.questionId] = answer.answer;
            });
          }

          return instanceData;
        }),
      };
    });
  }

  return formValues;
};

/**
 * API payloads for respond actions
 */
export interface ArtistDecisionPayload {
  role: "artist";
  accept: boolean;
  surcharge?: number;
  discount?: number;
  reason?: string;
}

export interface ClientDecisionPayload {
  role: "client";
  accept: boolean;
  rejectionReason?: string;
}

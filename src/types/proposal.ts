// src/types/proposal.ts
/**
 * Derived from IProposal
 */
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
        id: index,
        groupId: Number(groupId),
        selectedSelectionID: index,
        selectedSelectionLabel: option.selectedLabel,
        price: option.price,
      })
    ),
    addons: Object.entries(formValues.generalOptions.addons).map(
      ([addonId, price], index) => ({
        id: index,
        addonId: Number(addonId),
        price,
      })
    ),
    answers: Object.entries(formValues.generalOptions.answers).map(
      ([questionId, answer], index) => ({
        id: index,
        questionId: Number(questionId),
        answer,
      })
    ),
  };

  // Convert subject options
  const subjectOptions: ModelSubjectOptions = {
    subjects: Object.entries(formValues.subjectOptions).map(
      ([subjectId, subject], subjectIndex) => ({
        subjectId: Number(subjectId),
        instances: subject.instances.map((instance, instanceIndex) => ({
          id: instanceIndex,
          optionGroups: Object.entries(instance.optionGroups).map(
            ([groupId, option], index) => ({
              id: index,
              groupId: Number(groupId),
              selectedSelectionID: index,
              selectedSelectionLabel: option.selectedLabel,
              price: option.price,
            })
          ),
          addons: Object.entries(instance.addons).map(
            ([addonId, price], index) => ({
              id: index,
              addonId: Number(addonId),
              price: typeof price === "object" ? (price as any).price : price,
            })
          ),
          answers: Object.entries(instance.answers).map(
            ([questionId, answer], index) => ({
              id: index,
              questionId: Number(questionId),
              answer,
            })
          ),
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

export const convertToFormFormat = (modelData: any) => {
  // Convert general options
  const generalOptions: GeneralOptionsInput = {
    optionGroups: {},
    addons: {},
    answers: {},
  };

  // Convert option groups to record format
  if (modelData.generalOptions?.optionGroups) {
    modelData.generalOptions.optionGroups.forEach((option: OptionSelection) => {
      generalOptions.optionGroups[option.groupId] = {
        selectedId: option.id,
        selectedLabel: option.selectedSelectionLabel,
        price: option.price,
      };
    });
  }

  // Convert addons to record format
  if (modelData.generalOptions?.addons) {
    modelData.generalOptions.addons.forEach((addon: Addon) => {
      generalOptions.addons[addon.addonId] = addon.price;
    });
  }

  // Convert answers to record format
  if (modelData.generalOptions?.answers) {
    modelData.generalOptions.answers.forEach((answer: Answer) => {
      generalOptions.answers[answer.questionId] = answer.answer;
    });
  }

  // Convert subject options
  const subjectOptions: SubjectOptionsInput = {};

  // Convert subjects array to record format
  if (modelData.subjectOptions?.subjects) {
    modelData.subjectOptions.subjects.forEach((subject: SubjectOption) => {
      const subjectId = subject.subjectId.toString();

      subjectOptions[subjectId] = {
        instances: subject.instances.map((instance: SubjectInstance) => {
          const instanceOptionGroups: Record<string, GeneralOptionGroupInput> =
            {};
          const instanceAddons: Record<string, number> = {};
          const instanceAnswers: Record<string, string> = {};

          // Convert instance option groups
          instance.optionGroups?.forEach((option: OptionSelection) => {
            instanceOptionGroups[option.groupId] = {
              selectedId: option.id,
              selectedLabel: option.selectedSelectionLabel,
              price: option.price,
            };
          });

          // Convert instance addons
          instance.addons?.forEach((addon: Addon) => {
            instanceAddons[addon.addonId] = addon.price;
          });

          // Convert instance answers
          instance.answers?.forEach((answer: Answer) => {
            instanceAnswers[answer.questionId] = answer.answer;
          });

          return {
            optionGroups: instanceOptionGroups,
            addons: instanceAddons,
            answers: instanceAnswers,
          };
        }),
      };
    });
  }

  return {
    ...modelData,
    generalOptions,
    subjectOptions,
  };
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

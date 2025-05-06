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
    | 'pendingArtist'
    | 'pendingClient'
    | 'accepted'
    | 'rejectedArtist'
    | 'rejectedClient'
    | 'expired';
  
  /**
   * ProposalFormValues: values used in the create/edit form
   */
  export interface GeneralOptionGroupInput {
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
    earliestDate: string; // date string (YYYY-MM-DD)
    latestDate: string;
    deadline: string;
    generalDescription: string;
    referenceImages: Array<File | string>;
    generalOptions: GeneralOptionsInput;
    subjectOptions: SubjectOptionsInput;
  }
  
  /**
   * API payloads for respond actions
   */
  export interface ArtistDecisionPayload {
    role: 'artist';
    accept: boolean;
    surcharge?: number;
    discount?: number;
    reason?: string;
  }
  
  export interface ClientDecisionPayload {
    role: 'client';
    accept: boolean;
    rejectionReason?: string;
  }
  
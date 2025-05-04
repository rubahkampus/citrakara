// src/types/proposal.ts
/**
 * ProposalUI: frontend-safe representation of a proposal
 * Derived from IProposal via formatProposalForUI
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
  
  export interface ProposalUI {
    id: string;
    clientId: string;
    artistId: string;
    listingId: string;
    listingTitle: string;
    status: ProposalStatus;
    availability: Availability;
    deadline: Date;
    expiresAt: Date | null;
    generalDescription: string;
    referenceImages: string[];
    priceBreakdown: PriceBreakdown;
    adjustments?: {
      surcharge?: { amount: number; reason: string };
      discount?: { amount: number; reason: string };
    };
    rejectionReason?: string;
    createdAt: Date;
    updatedAt: Date;
  }
  
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
  
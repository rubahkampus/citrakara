// src/lib/db/models/index.ts
// Create this file to ensure all models are registered properly

// Import all model files to ensure they're registered
import Contract from "./contract.model";
import Proposal from "./proposal.model";
import CommissionListing from "./commissionListing.model";
import User from "./user.model";
import Tos from "./tos.model";
import Gallery from "./gallery.model";
import GalleryPost from "./galleryPost.model";
import {
  CancelTicket,
  RevisionTicket,
  ChangeTicket,
  ResolutionTicket,
} from "./ticket.model";
import {
  ProgressUploadStandard,
  ProgressUploadMilestone,
  RevisionUpload,
  FinalUpload,
} from "./upload.model";
import Wallet from "./wallet.model";
import EscrowTransaction from "./escrowTransaction.model";

// Export models for convenience
export {
  Contract,
  CancelTicket,
  RevisionTicket,
  ChangeTicket,
  ResolutionTicket,
  ProgressUploadStandard,
  ProgressUploadMilestone,
  RevisionUpload,
  FinalUpload,
  Wallet,
  EscrowTransaction,
  Proposal,
  CommissionListing,
  Tos,
  Gallery,
  GalleryPost,
  User
};

// Export a function to ensure all models are registered
export function ensureModelsRegistered() {
  // The mere act of importing the models should register them,
  // but you can add additional checks here if needed
  return {
    Contract,
    CancelTicket,
    RevisionTicket,
    ChangeTicket,
    ResolutionTicket,
    ProgressUploadStandard,
    ProgressUploadMilestone,
    RevisionUpload,
    FinalUpload,
    Wallet,
    EscrowTransaction,
    Proposal,
    CommissionListing,
    Tos,
    Gallery,
    GalleryPost,
  };
}

// src/components/dashboard/proposals/ArtistRespondForm.tsx
/**
 * ArtistRespondForm
 * ------------------
 * Renders UI for artist to accept or reject a proposal.
 *
 * Props:
 *   - proposal: ProposalUI
 *   - onSubmit: (decision: { accept: boolean; surcharge?: number; discount?: number; reason?: string }) => void
 *
 * UI Elements:
 *   - Number inputs for surcharge and discount (in cents)
 *   - Text input for reason
 *   - Buttons: Accept, Reject
 *
 * Example onSubmit payload:
 *   { role: "artist", accept: true, surcharge: 200, discount: 0, reason: "Rush fee" }
 */
import React from 'react';
import { ProposalUI } from '@/types/proposal';

interface ArtistRespondFormProps {
  proposal: ProposalUI;
  onSubmit: (decision: {
    accept: boolean;
    surcharge?: number;
    discount?: number;
    reason?: string;
  }) => void;
}

export default function ArtistRespondForm({ proposal, onSubmit }: ArtistRespondFormProps) {
  // TODO: use React state or form library to capture inputs
  return (
    <div>
      {/* TODO: display proposal details for context */}
      {/* TODO: input for surcharge */}
      {/* TODO: input for discount */}
      {/* TODO: textarea for reason */}
      {/* TODO: Accept and Reject buttons, calling onSubmit with appropriate payload */}
    </div>
  );
}

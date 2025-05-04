// src/components/dashboard/proposals/ClientRespondForm.tsx
/**
 * ClientRespondForm
 * ------------------
 * Renders UI for client to accept or reject artist adjustments.
 *
 * Props:
 *   - proposal: ProposalUI
 *   - onSubmit: (decision: { accept: boolean; rejectionReason?: string }) => void
 *
 * UI Elements:
 *   - Display updated price breakdown
 *   - Text input for rejectionReason (if rejecting)
 *   - Buttons: Accept & Pay, Reject
 *
 * Example onSubmit payload:
 *   { role: "client", accept: false, rejectionReason: "Price too high" }
 */
import React from 'react';
import { ProposalUI } from '@/types/proposal';

interface ClientRespondFormProps {
  proposal: ProposalUI;
  onSubmit: (decision: {
    accept: boolean;
    rejectionReason?: string;
  }) => void;
}

export default function ClientRespondForm({ proposal, onSubmit }: ClientRespondFormProps) {
  // TODO: show proposal.calculatedPrice breakdown
  return (
    <div>
      {/* TODO: display new total and breakdown */}
      {/* TODO: textarea for rejectionReason if rejecting */}
      {/* TODO: Accept & Pay button calls onSubmit({ accept: true }) */}
      {/* TODO: Reject button calls onSubmit({ accept: false, rejectionReason }) */}
    </div>
  );
}

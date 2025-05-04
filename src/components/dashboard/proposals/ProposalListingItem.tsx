// src/components/dashboard/proposals/ProposalListingItem.tsx
/**
 * `ProposalListingItem` renders a single proposal as a card or list row.
 *
 * Props:
 *   proposal: ProposalUI
 *   onEdit?: (id: string) => void   // only for client & status=pendingArtist
 *   onRespond?: (id: string) => void // for artist (pendingArtist) or client (pendingClient)
 *
 * UI should display:
 *   - Title or listing name
 *   - Status badge (pendingArtist, pendingClient, accepted, etc.)
 *   - Date range (earliest → deadline → latest)
 *   - Price breakdown summary (base, options, rush, total)
 *   - Action buttons/menu (Edit, Respond)
 */
import React from 'react';
import { ProposalUI } from '@/types/proposal';

interface ProposalListingItemProps {
  proposal: ProposalUI;
  onEdit?: (id: string) => void;
  onRespond?: (id: string) => void;
}

export default function ProposalListingItem({ proposal, onEdit, onRespond }: ProposalListingItemProps) {
  // TODO: destructure fields from proposal
  // TODO: conditionally render Edit / Respond buttons based on props

  return (
    <div>
      {/* TODO: display proposal title */}
      {/* TODO: status badge */}
      {/* TODO: date range */}
      {/* TODO: price summary */}
      {/* TODO: action buttons */}
    </div>
  );
}

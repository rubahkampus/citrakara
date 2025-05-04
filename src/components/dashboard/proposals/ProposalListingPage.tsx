// src/components/dashboard/proposals/ProposalListingPage.tsx
/**
 * `ProposalListingPage` displays two lists of proposals:
 *   - `incoming`: proposals awaiting the current artist's response
 *   - `outgoing`: proposals the current client has submitted
 *
 * It receives data already formatted via `formatProposalForUI`.
 * Example API call:
 *   GET /api/proposal?role=artist → { proposals: ProposalUI[] }
 *   GET /api/proposal?role=client → { proposals: ProposalUI[] }
 *
 * Props:
 *   username: string
 *   incoming: ProposalUI[]
 *   outgoing: ProposalUI[]
 *   error?: string
 *
 * Internally, this component should:
 *   - Render tabs or sections for "Incoming" and "Outgoing"
 *   - Map each proposal entry to <ProposalListingItem />
 *   - Pass necessary handlers (edit/respond) to the item
 */
import React from 'react';
import ProposalListingItem from './ProposalListingItem';
import { ProposalUI } from '@/types/proposal';

interface ProposalListingPageProps {
  username: string;
  incoming: ProposalUI[];
  outgoing: ProposalUI[];
  error?: string;
}

export default function ProposalListingPage({ username, incoming, outgoing, error }: ProposalListingPageProps) {
  // TODO: implement state for current tab (incoming vs outgoing)
  // TODO: handle empty states and error display

  return (
    <div>
      {/* TODO: Tab headers (Incoming / Outgoing) */}
      {/* TODO: If error, show alert */}
      {/* TODO: Map proposals to ProposalListingItem */}
    </div>
  );
}
// src/components/dashboard/proposals/RespondFormPage.tsx
/**
 * RespondFormPage
 * ----------------
 * Unified entrypoint for handling proposal responses by both Artist and Client.
 *
 * Props:
 *   - username: string
 *   - role: "artist" | "client"
 *   - proposal: ProposalUI  // serialized via formatProposalForUI
 *
 * Behavior:
 *   - If role === "artist": render <ArtistRespondForm />
 *   - If role === "client": render <ClientRespondForm />
 *
 * Data flow:
 *   - Sub-forms call onSubmit callback passed as prop
 *   - onSubmit dispatches PATCH to /api/proposal/[id]/respond
 *     with JSON body { role, accept, ...fields }
 *
 * Example API body (artist):
 *   {
 *     role: "artist",
 *     accept: true,
 *     surcharge: 500,
 *     discount: 0,
 *     reason: "Additional complexity"
 *   }
 *
 * Example API body (client):
 *   {
 *     role: "client",
 *     accept: false,
 *     rejectionReason: "Timeline too long"
 *   }
 */
import React from 'react';
import ArtistRespondForm from './ArtistRespondForm';
import ClientRespondForm from './ClientRespondForm';
import { ProposalUI } from '@/types/proposal';

interface RespondFormPageProps {
  username: string;
  role: 'artist' | 'client';
  proposal: ProposalUI;
}

export default function RespondFormPage({ username, role, proposal }: RespondFormPageProps) {
  // TODO: Implement form submission handler
  const handleArtistSubmit = async (decision: any) => {
    // placeholder for calling PATCH /api/proposal/[id]/respond
  };

  const handleClientSubmit = async (decision: any) => {
    // placeholder for calling PATCH /api/proposal/[id]/respond
  };

  return (
    <div>
      {role === 'artist' ? (
        <ArtistRespondForm proposal={proposal} onSubmit={handleArtistSubmit} />
      ) : (
        <ClientRespondForm proposal={proposal} onSubmit={handleClientSubmit} />
      )}
    </div>
  );
}

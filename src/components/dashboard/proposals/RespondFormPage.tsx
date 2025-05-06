// src/components/dashboard/proposals/RespondFormPage.tsx
/**
 * RespondFormPage
 * ----------------
 * Unified entrypoint for handling proposal responses by both Artist and Client.
 *
 * Props:
 *   - username: string
 *   - role: "artist" | "client"
 *   - proposal: IProposal
 *
 * Behavior:
 *   - If role === "artist": render <ArtistRespondForm />
 *   - If role === "client": render <ClientRespondForm />
 *
 * Data flow:
 *   - Sub-forms call onSubmit callback passed as prop
 *   - onSubmit dispatches PATCH to /api/proposal/[id]/respond
 *     with JSON body { role, accept, ...fields }
 */
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Box, Alert, Snackbar } from "@mui/material";
import { axiosClient } from "@/lib/utils/axiosClient";
import { IProposal } from "@/lib/db/models/proposal.model";
// import ArtistRespondForm from "./ArtistRespondForm";
// import ClientRespondForm from "./ClientRespondForm";

interface RespondFormPageProps {
  username: string;
  role: "artist" | "client";
  proposal: IProposal;
}

export default function RespondFormPage({
  username,
  role,
  proposal,
}: RespondFormPageProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleArtistSubmit = async (decision: {
    accept: boolean;
    surcharge?: number;
    discount?: number;
    reason?: string;
  }) => {
    setLoading(true);
    setError(null);

    try {
      await axiosClient.patch(`/api/proposal/${proposal.id}/respond`, {
        role: "artist",
        accept: decision.accept,
        surcharge: decision.surcharge,
        discount: decision.discount,
        reason: decision.reason,
      });

      setSuccess(true);
      // Redirect after showing success message
      setTimeout(() => {
        router.push(`/${username}/dashboard/proposals`);
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to submit response");
    } finally {
      setLoading(false);
    }
  };

  const handleClientSubmit = async (decision: {
    accept: boolean;
    rejectionReason?: string;
  }) => {
    setLoading(true);
    setError(null);

    try {
      await axiosClient.patch(`/api/proposal/${proposal.id}/respond`, {
        role: "client",
        accept: decision.accept,
        rejectionReason: decision.rejectionReason,
      });

      setSuccess(true);
      // Redirect after showing success message
      setTimeout(() => {
        router.push(`/${username}/dashboard/proposals`);
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to submit response");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* {role === "artist" ? (
        <ArtistRespondForm
          proposal={proposal}
          onSubmit={handleArtistSubmit}
          loading={loading}
        />
      ) : (
        <ClientRespondForm
          proposal={proposal}
          onSubmit={handleClientSubmit}
          loading={loading}
        />
      )} */}

      <Snackbar
        open={success}
        message="Response submitted successfully!"
        autoHideDuration={2000}
        onClose={() => setSuccess(false)}
      />
    </Box>
  );
}

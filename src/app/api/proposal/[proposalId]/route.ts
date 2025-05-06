/* ------------------------------------------------------------------
   src/app/api/proposal/[proposalId]/route.ts
   GET    → fetch single
   PATCH  → edit (multipart FormData)
   DELETE → hard‑delete (optional, mainly for admin use)
------------------------------------------------------------------ */
import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api/withAuth";
import { rotateToken } from "@/lib/api/rotateToken";
import { handleError } from "@/lib/utils/errorHandler";
import {
  fetchProposalById,
  updateProposalFromForm,
  canEditProposal,
} from "@/lib/services/proposal.service";
import { deleteProposal } from "@/lib/db/repositories/proposal.repository";

// ────────── GET /api/proposal/[id] ──────────
export async function GET(
  _req: NextRequest,
  { params }: { params: { proposalId: string } }
) {
  try {
    return withAuth(async (session) => {
      const proposal = await fetchProposalById(params.proposalId, session.id);
      const res = NextResponse.json({
        proposal: proposal,
      });
      rotateToken(res, session);
      return res;
    });
  } catch (err) {
    return handleError(err);
  }
}

// ────────── PATCH /api/proposal/[id] ──────────
export async function PATCH(
  req: NextRequest,
  { params }: { params: { proposalId: string } }
) {
  try {
    return withAuth(async (session) => {
      const allowed = await canEditProposal(params.proposalId, session.id);
      if (!allowed) throw new Error("Not authorized to edit proposal");

      const formData = await req.formData();
      const updated = await updateProposalFromForm(
        params.proposalId,
        session.id,
        formData
      );

      const res = NextResponse.json({
        message: "Proposal updated",
        proposal: updated,
      });
      rotateToken(res, session);
      return res;
    });
  } catch (err) {
    return handleError(err);
  }
}

// ────────── DELETE /api/proposal/[id] ──────────
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { proposalId: string } }
) {
  try {
    return withAuth(async (session) => {
      // Optional: allow only client owner or admin
      const allowed = await canEditProposal(params.proposalId, session.id);
      if (!allowed) throw new Error("Not authorized to delete proposal");

      await deleteProposal(params.proposalId);
      const res = NextResponse.json({ message: "Proposal deleted" });
      rotateToken(res, session);
      return res;
    });
  } catch (err) {
    return handleError(err);
  }
}

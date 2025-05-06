/* ------------------------------------------------------------------
   src/app/api/proposal/route.ts
   POST   → create proposal   (multipart FormData)
   GET    → list proposals    (?role=client|artist&status=pendingArtist,…)
------------------------------------------------------------------ */
import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api/withAuth";
import { rotateToken } from "@/lib/api/rotateToken";
import { handleError } from "@/lib/utils/errorHandler";
import {
  createProposalFromForm,
  getUserProposals,
} from "@/lib/services/proposal.service";

// ────────── POST /api/proposal ──────────
export async function POST(req: NextRequest) {
  try {
    return withAuth(async (session) => {
      const formData = await req.formData();
      const proposal = await createProposalFromForm(session.id, formData);

      const res = NextResponse.json({
        message: "Proposal created successfully",
        proposal: proposal,
      });
      rotateToken(res, session);
      return res;
    });
  } catch (err) {
    return handleError(err);
  }
}

// ────────── GET /api/proposal ──────────
// Query params: role=client|artist, status=csv, beforeExpire=true
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const role = (searchParams.get("role") || "client") as "client" | "artist";
    const status = searchParams.get("status")?.split(",") || undefined;
    const beforeExpire = searchParams.get("beforeExpire") === "true";

    return withAuth(async (session) => {
      const proposals = await getUserProposals(session.id, role, {
        status,
        beforeExpire,
      });

      const res = NextResponse.json({
        proposals: proposals,
      });
      rotateToken(res, session);
      return res;
    });
  } catch (err) {
    return handleError(err);
  }
}

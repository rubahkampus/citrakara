/* ------------------------------------------------------------------
   src/app/api/proposal/[proposalId]/respond/route.ts
   PATCH → artist or client response (JSON body)
------------------------------------------------------------------ */
import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api/withAuth";
import { rotateToken } from "@/lib/api/rotateToken";
import { handleError } from "@/lib/utils/errorHandler";
import {
  artistRespond,
  clientRespondToAdjustment,
} from "@/lib/services/proposal.service";

// Body shapes:
//
// Artist:
// { role:"artist", accept:true|false, surcharge?:number, discount?:number, reason?:string }
//
// Client:
// { role:"client", accept:true|false, rejectionReason?:string }
export async function PATCH(
  req: NextRequest,
  { params }: { params: { proposalId: string } }
) {
  try {
    const body = await req.json();
    const role = body.role as "artist" | "client";

    return withAuth(async (session) => {
      let proposal;

      if (role === "artist") {
        proposal = await artistRespond(session.id, params.proposalId, {
          accept: body.accept,
          surcharge: body.surcharge,
          discount: body.discount,
          reason: body.reason,
        });
      } else if (role === "client") {
        proposal = await clientRespondToAdjustment(
          session.id,
          params.proposalId,
          {
            accept: body.accept,
            rejectionReason: body.rejectionReason,
          }
        );
      } else {
        throw new Error("Invalid role");
      }

      const res = NextResponse.json({
        message: "Proposal updated",
        proposal: proposal,
      });
      rotateToken(res, session);
      return res;
    });
  } catch (err) {
    return handleError(err);
  }
}

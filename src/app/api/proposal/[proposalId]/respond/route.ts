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
  clientRespond,
  ArtistDecision,
  ClientDecision,
} from "@/lib/services/proposal.service";

// Body shapes:
//
// Artist:
// { role:"artist", acceptProposal:true|false, surcharge?:number, discount?:number, rejectionReason?:string }
//
// Client:
// { role:"client", acceptAdjustments?:true|false, cancel?:boolean }
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
        const artistDecision: ArtistDecision = {
          acceptProposal: body.acceptProposal,
          surcharge: body.surcharge,
          discount: body.discount,
          rejectionReason: body.rejectionReason,
        };

        proposal = await artistRespond(
          session.id,
          params.proposalId,
          artistDecision
        );
      } else if (role === "client") {
        const clientDecision: ClientDecision = {
          acceptAdjustments: body.acceptAdjustments,
          cancel: body.cancel,
        };

        proposal = await clientRespond(
          session.id,
          params.proposalId,
          clientDecision
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

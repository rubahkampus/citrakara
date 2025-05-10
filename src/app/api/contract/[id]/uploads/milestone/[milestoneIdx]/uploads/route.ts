// src/app/api/contract/[id]/milestone/[milestoneIdx]/uploads/route.ts
import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api/withAuth";
import { rotateToken } from "@/lib/api/rotateToken";
import { handleError } from "@/lib/utils/errorHandler";
import { getMilestoneUploads } from "@/lib/services/upload.service";

// Get uploads for a specific milestone
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string; milestoneIdx: string } }
) {
  try {
    const contractId = params.id;
    const milestoneIdx = parseInt(params.milestoneIdx);

    return withAuth(async (session) => {
      // First verify user is part of the contract (implementation needed)

      const uploads = await getMilestoneUploads(contractId, milestoneIdx);

      const response = NextResponse.json(uploads);
      rotateToken(response, session);
      return response;
    });
  } catch (error) {
    return handleError(error);
  }
}

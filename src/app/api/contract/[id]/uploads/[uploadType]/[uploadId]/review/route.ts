// src/app/api/contract/[id]/uploads/[uploadType]/[uploadId]/review/route.ts
import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api/withAuth";
import { rotateToken } from "@/lib/api/rotateToken";
import { handleError } from "@/lib/utils/errorHandler";
import { reviewUpload } from "@/lib/services/upload.service";

// Review an upload
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string; uploadType: string; uploadId: string } }
) {
  try {
    const contractId = params.id;
    const uploadType = params.uploadType as "milestone" | "revision" | "final";
    const uploadId = params.uploadId;
    const { action } = await req.json();

    if (action !== "accept" && action !== "reject") {
      return NextResponse.json(
        { error: "Invalid action. Must be 'accept' or 'reject'" },
        { status: 400 }
      );
    }

    return withAuth(async (session) => {
      const result = await reviewUpload(
        uploadType,
        uploadId,
        contractId,
        session.id,
        action
      );

      const response = NextResponse.json({
        message: `Upload ${
          action === "accept" ? "accepted" : "rejected"
        } successfully`,
        result,
      });

      rotateToken(response, session);
      return response;
    });
  } catch (error) {
    return handleError(error);
  }
}

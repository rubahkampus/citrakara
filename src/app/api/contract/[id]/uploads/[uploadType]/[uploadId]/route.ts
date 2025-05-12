// src/app/api/contract/[id]/uploads/[uploadType]/[uploadId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api/withAuth";
import { rotateToken } from "@/lib/api/rotateToken";
import { handleError } from "@/lib/utils/errorHandler";
import { getUpload } from "@/lib/services/upload.service";

/**
 * Get a specific upload by type and ID
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string; uploadType: string; uploadId: string } }
) {
  try {
    const param = await params
    const contractId = param.id;
    const uploadType = param.uploadType as "milestone" | "revision" | "final";
    const uploadId = param.uploadId;

    // Validate upload type
    if (
      uploadType !== "milestone" &&
      uploadType !== "revision" &&
      uploadType !== "final"
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid upload type. Must be 'milestone', 'revision', or 'final'",
        },
        { status: 400 }
      );
    }

    return withAuth(async (session) => {
      const upload = await getUpload(
        uploadType,
        uploadId,
        contractId,
        session.id
      );

      const response = NextResponse.json({
        message: "Upload retrieved successfully",
        upload,
      });

      rotateToken(response, session);
      return response;
    });
  } catch (error) {
    return handleError(error);
  }
}

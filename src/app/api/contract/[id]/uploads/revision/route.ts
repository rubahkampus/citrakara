// src/app/api/contract/[id]/uploads/revision/route.ts
import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api/withAuth";
import { rotateToken } from "@/lib/api/rotateToken";
import { handleError } from "@/lib/utils/errorHandler";
import { createRevisionUpload } from "@/lib/services/upload.service";

// Create a revision upload
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const param = await params
    const contractId = param.id;
    const formData = await req.formData();

    return withAuth(async (session) => {
      // Pass the entire formData to the service
      const upload = await createRevisionUpload(
        contractId,
        session.id,
        formData
      );

      const response = NextResponse.json({
        message: "Revision upload created successfully",
        upload,
      });

      rotateToken(response, session);
      return response;
    });
  } catch (error) {
    return handleError(error);
  }
}

// src/app/api/contract/[id]/uploads/milestone/route.ts
import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api/withAuth";
import { rotateToken } from "@/lib/api/rotateToken";
import { handleError } from "@/lib/utils/errorHandler";
import { createProgressUploadMilestone } from "@/lib/services/upload.service";

// Create a milestone progress upload
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const param = await params
    const contractId = param.id;

    // Parse the form data from the request
    const formData = await req.formData();

    return withAuth(async (session) => {
      // Pass the entire FormData object to the service
      const upload = await createProgressUploadMilestone(
        contractId,
        session.id,
        formData
      );

      const response = NextResponse.json({
        message: "Milestone upload created successfully",
        upload,
      });

      rotateToken(response, session);
      return response;
    });
  } catch (error) {
    return handleError(error);
  }
}

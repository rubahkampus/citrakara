import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/utils/session";
import { processAllUserExpirations } from "@/lib/services/contract.service";

export async function POST(request: NextRequest) {
  try {
    // Get the session to verify authentication
    const session = await getAuthSession();

    if (!session || typeof session !== "object" || !("id" in session)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get userId from request body
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Verify that the authenticated user matches the requested userId
    if (session.id !== userId) {
      return NextResponse.json(
        {
          error:
            "Unauthorized: Can only process expirations for your own account",
        },
        { status: 403 }
      );
    }

    console.log(`API: Processing expirations for user ${userId}`);

    // Process all user expirations
    const results = await processAllUserExpirations(userId);

    console.log(
      `API: Completed processing for user ${userId}: ${results.summary.totalUploadsProcessed} uploads, ${results.summary.totalContractsProcessed} contracts`
    );

    return NextResponse.json(results);
  } catch (error) {
    console.error("Error in process-expirations API:", error);

    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

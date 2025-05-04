// src/app/api/proposals/expire/route.ts
import { NextRequest, NextResponse } from "next/server";
import { handleError } from "@/lib/utils/errorHandler";
import { proposalService } from "@/lib/services/proposal.service";

// POST /api/proposals/expire - Expire stale proposals (system/admin only)
export async function POST(req: NextRequest) {
  try {
    // TODO: Implement proper admin/system authentication
    // For now, check for a secret key in headers for cron jobs
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let asOf: Date | undefined;

    try {
      const body = await req.json();
      if (body.asOf) {
        asOf = new Date(body.asOf);
      }
    } catch {
      // No body or invalid JSON - use default date
    }

    const expiredCount = await proposalService.autoExpireProposals(asOf);

    return NextResponse.json({
      message: "Expired proposals processed",
      expiredCount,
    });
  } catch (error) {
    return handleError(error);
  }
}

// src/app/api/proposal/estimate/[listingId]/route.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getDynamicEstimate } from "@/lib/services/proposal.service";

export async function GET(
  _req: NextRequest,
  { params }: { params: { listingId: string } }
) {
  const { listingId } = params;

  try {
    const estimate = await getDynamicEstimate(listingId);
    // returns { earliestDate: Date; latestDate: Date }
    return NextResponse.json(estimate);
  } catch (err: any) {
    console.error("Error in /api/proposal/estimate:", err);
    return NextResponse.json(
      { error: err.message || "Unknown error" },
      { status: 400 }
    );
  }
}

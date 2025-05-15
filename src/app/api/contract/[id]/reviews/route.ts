import { NextRequest, NextResponse } from "next/server";
import { getReviewsByContractId } from "@/lib/services/review.service";
import { getAuthSession, Session } from "@/lib/utils/session";

// GET: Get all reviews for a contract
export async function GET(
  request: NextRequest,
  { params }: { params: { contractId: string } }
) {
  try {
    const session = await getAuthSession();
    if (!(session as Session).username) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const contractId = params.contractId;
    const reviews = await getReviewsByContractId(contractId);

    return NextResponse.json(reviews);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: error.status || 500 }
    );
  }
}

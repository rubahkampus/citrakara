import { NextRequest, NextResponse } from "next/server";
import { getReviewsByListingId } from "@/lib/services/review.service";
import { getAuthSession, Session } from "@/lib/utils/session";

// GET: Get all reviews for a listing
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getAuthSession();
    if (!(session as Session).username) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const param = await params;
    const listingId = param.id;
    const reviews = await getReviewsByListingId(listingId);

    return NextResponse.json(reviews);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: error.status || 500 }
    );
  }
}

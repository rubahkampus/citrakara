import { NextRequest, NextResponse } from "next/server";
import {
  getReviewById,
  getReviewsByContractId,
  getReviewsByListingId,
  getReviewsByArtistId,
} from "@/lib/services/review.service";
import { getAuthSession, Session } from "@/lib/utils/session";

// GET: Get a specific review by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getAuthSession();
    if (!(session as Session).username) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const reviewId = params.id;
    const review = await getReviewById(reviewId);

    return NextResponse.json(review);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: error.status || 500 }
    );
  }
}

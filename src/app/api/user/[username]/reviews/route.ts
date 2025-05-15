import { NextRequest, NextResponse } from "next/server";
import { getReviewsByArtistId } from "@/lib/services/review.service";
import { getAuthSession, Session } from "@/lib/utils/session";

// GET: Get all reviews for an artist
export async function GET(
  request: NextRequest,
  { params }: { params: { artistId: string } }
) {
  try {
    const session = await getAuthSession();
    if (!(session as Session).username) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const artistId = params.artistId;
    const reviews = await getReviewsByArtistId(artistId);

    return NextResponse.json(reviews);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: error.status || 500 }
    );
  }
}

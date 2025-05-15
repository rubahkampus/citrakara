import { NextRequest, NextResponse } from "next/server";
import {
  createClientReview,
  getReviewByUploadId,
} from "@/lib/services/review.service";
import { getAuthSession, Session } from "@/lib/utils/session";

// GET: Check if a review exists for an upload
export async function GET(
  request: NextRequest,
  { params }: { params: { uploadId: string } }
) {
  try {
    const session = await getAuthSession();
    if (!(session as Session).username) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const uploadId = params.uploadId;
    const review = await getReviewByUploadId(uploadId);

    return NextResponse.json({ exists: !!review, review });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: error.status || 500 }
    );
  }
}

// POST: Create a new review for an upload
export async function POST(
  request: NextRequest,
  { params }: { params: { uploadId: string } }
) {
  try {
    const session = await getAuthSession();
    if (!(session as Session).username) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const uploadId = params.uploadId;
    const { rating, comment, selectedImages } = await request.json();

    if (!rating || !comment) {
      return NextResponse.json(
        { error: "Rating dan komentar diperlukan" },
        { status: 400 }
      );
    }

    const userId = (session as Session).id;
    const review = await createClientReview(userId, uploadId, {
      rating,
      comment,
      selectedImages: selectedImages || [],
    });

    return NextResponse.json(review);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: error.status || 500 }
    );
  }
}

// src/app/api/bookmark/artist/route.ts
import { NextRequest, NextResponse } from "next/server";
import { handleError } from "@/lib/utils/errorHandler";
import { getAuthSession } from "@/lib/utils/session";
import { toggleArtistBookmark } from "@/lib/services/user.service";

export async function POST(req: NextRequest) {
  try {
    const session = await getAuthSession();

    if (!session || typeof session === "string") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { artistId, action } = await req.json();

    if (!artistId || !action || !["bookmark", "unbookmark"].includes(action)) {
      return NextResponse.json(
        { error: "Invalid request parameters" },
        { status: 400 }
      );
    }

    const result = await toggleArtistBookmark(
      session.id,
      artistId,
      action as "bookmark" | "unbookmark"
    );

    return NextResponse.json(result);
  } catch (error) {
    return handleError(error);
  }
}

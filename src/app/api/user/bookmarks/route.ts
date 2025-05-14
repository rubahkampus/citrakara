// src/app/api/user/bookmarks/route.ts
import { NextRequest, NextResponse } from "next/server";
import { handleError } from "@/lib/utils/errorHandler";
import { getAuthSession } from "@/lib/utils/session";
import {
  getUserBookmarkedArtists,
  getUserBookmarkedCommissions,
} from "@/lib/services/user.service";

export async function GET(req: NextRequest) {
  try {
    const session = await getAuthSession();

    if (!session || typeof session === "string") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const type = req.nextUrl.searchParams.get("type");

    if (type === "artists") {
      const bookmarkedArtists = await getUserBookmarkedArtists(session.id);
      return NextResponse.json({ bookmarks: bookmarkedArtists });
    } else if (type === "commissions") {
      const bookmarkedCommissions = await getUserBookmarkedCommissions(
        session.id
      );
      return NextResponse.json({ bookmarks: bookmarkedCommissions });
    } else {
      const [artists, commissions] = await Promise.all([
        getUserBookmarkedArtists(session.id),
        getUserBookmarkedCommissions(session.id),
      ]);

      return NextResponse.json({
        artists,
        commissions,
      });
    }
  } catch (error) {
    return handleError(error);
  }
}

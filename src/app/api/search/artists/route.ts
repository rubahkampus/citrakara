// src/app/api/search/artists/route.ts
import { NextRequest, NextResponse } from "next/server";
import { handleError } from "@/lib/utils/errorHandler";
import { searchArtistsService } from "@/lib/services/user.service";

export async function GET(req: NextRequest) {
  try {
    const searchParams = await req.nextUrl.searchParams;
    const query = searchParams.get("query") || undefined;
    const tags = searchParams.get("tags")?.split(",") || undefined;
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = parseInt(searchParams.get("skip") || "0");

    const results = await searchArtistsService({ query, tags, limit, skip });

    return NextResponse.json(results);
  } catch (error) {
    return handleError(error);
  }
}

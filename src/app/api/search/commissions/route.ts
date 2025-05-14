// src/app/api/search/commissions/route.ts
import { NextRequest, NextResponse } from "next/server";
import { handleError } from "@/lib/utils/errorHandler";
import { searchCommissionListings } from "@/lib/services/commissionListing.service";

export async function GET(req: NextRequest) {
  try {
    const searchParams = await req.nextUrl.searchParams;
    const label = searchParams.get("label") || undefined;
    const tags = searchParams.get("tags")?.split(",") || undefined;
    const artistId = searchParams.get("artistId") || undefined;
    const type = searchParams.get("type") as "template" | "custom" | undefined;
    const flow = searchParams.get("flow") as
      | "standard"
      | "milestone"
      | undefined;

    // Parse price range if provided
    let priceRange: { min?: number; max?: number } | undefined;
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");

    if (minPrice || maxPrice) {
      priceRange = {};
      if (minPrice) priceRange.min = parseInt(minPrice);
      if (maxPrice) priceRange.max = parseInt(maxPrice);
    }

    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = parseInt(searchParams.get("skip") || "0");

    const results = await searchCommissionListings({
      label,
      tags,
      artistId,
      priceRange,
      type,
      flow,
      limit,
      skip,
    });

    return NextResponse.json(results);
  } catch (error) {
    return handleError(error);
  }
}

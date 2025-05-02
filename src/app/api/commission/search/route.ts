// src/app/api/commission/search/route.ts
import { NextRequest, NextResponse } from "next/server";
import { handleError } from "@/lib/utils/errorHandler";
import { browseListings } from "@/lib/services/commissionListing.service";

// Public search endpoint for browsing commission listings
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    
    // Parse search parameters
    const query = {
      text: searchParams.get('q') || undefined,
      tags: searchParams.get('tags')?.split(',') || undefined,
      artistId: searchParams.get('artist') || undefined,
      skip: parseInt(searchParams.get('skip') || '0'),
      limit: Math.min(parseInt(searchParams.get('limit') || '20'), 50), // Max 50 items per page
    };
    
    const { items, total } = await browseListings(query);
    
    return NextResponse.json({
      results: items,
      meta: {
        count: items.length,
        total,
        skip: query.skip,
        limit: query.limit,
      }
    });
  } catch (error) {
    return handleError(error);
  }
}
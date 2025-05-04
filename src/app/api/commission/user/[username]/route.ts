// src/app/api/commission/user/[username]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { handleError } from "@/lib/utils/errorHandler";
import { getListingsByUsername } from "@/lib/services/commissionListing.service";

// Get all commission listings for a user by username - public endpoint
export async function GET(
  req: NextRequest,
  { params }: { params: { username: string } }
) {
  try {
    const param = await params;
    const username = param.username;
    
    if (!username) {
      return NextResponse.json(
        { error: "Username is required" },
        { status: 400 }
      );
    }
    
    const listings = await getListingsByUsername(username);
    
    return NextResponse.json({ listings });
  } catch (error) {
    return handleError(error);
  }
}
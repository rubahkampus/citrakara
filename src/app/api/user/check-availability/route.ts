// src/app/api/user/check-availability/route.ts
import { checkUserAvailability } from "@/lib/services/user.service";
import { NextRequest, NextResponse } from "next/server";
import { handleError } from "@/lib/utils/errorHandler";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email") ?? undefined;
    const username = searchParams.get("username") ?? undefined;

    const result = await checkUserAvailability(email, username);
    return NextResponse.json(result);
  } catch (error) {
    return handleError(error, 400);
  }
}

// src/app/api/auth/refresh/route.ts
import { refreshAccessToken } from "@/lib/services/auth.service";
import { NextRequest } from "next/server";
import { handleError } from "@/lib/utils/errorHandler";

export async function POST(req: NextRequest) {
  try {
    return refreshAccessToken(req);
  } catch (error) {
    return handleError(error, 401);
  }
}
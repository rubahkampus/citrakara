// src/app/api/auth/login/route.ts
import { loginUser } from "@/lib/services/auth.service";
import { NextRequest } from "next/server";
import { handleError } from "@/lib/utils/errorHandler";

export async function POST(req: NextRequest) {
  try {
    return await loginUser(req);
  } catch (error) {
    return handleError(error, 500);
  }
}

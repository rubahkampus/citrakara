// src/app/api/auth/register/route.ts
import { registerUser } from "@/lib/services/auth.service";
import { NextRequest } from "next/server";
import { handleError } from "@/lib/utils/errorHandler";

export async function POST(req: NextRequest) {
  try {
    return await registerUser(req);
  } catch (error) {
    return handleError(error, 500);
  }
}

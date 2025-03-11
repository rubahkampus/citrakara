// src/app/api/auth/refresh/route.ts
import { NextRequest } from "next/server";
import { refreshTokenController } from "@/lib/controllers/AuthController";

export async function POST(req: NextRequest) {
  return refreshTokenController(req);
}

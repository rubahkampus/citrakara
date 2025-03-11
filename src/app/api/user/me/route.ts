// src/app/api/user/me/route.ts
import { NextRequest } from "next/server";
import { getUserProfileController } from "@/lib/controllers/UserController";

export async function GET(req: NextRequest) {
  return getUserProfileController(req);
}

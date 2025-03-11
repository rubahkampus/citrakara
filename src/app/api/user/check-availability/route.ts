// src/app/api/user/check-availability/route.ts
import { checkUserAvailabilityController } from "@/lib/controllers/UserController";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  return checkUserAvailabilityController(req);
}

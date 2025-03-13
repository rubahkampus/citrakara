// src/app/api/user/me/update/route.ts
import { NextRequest } from "next/server";
import { updateUserProfileController } from "@/lib/controllers/UserController";

export async function PATCH(req: NextRequest) {
  return updateUserProfileController(req);
}

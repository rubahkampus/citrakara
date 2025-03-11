// src/app/api/user/[username]/route.ts
import { NextRequest } from "next/server";
import { getUserPublicProfileController } from "@/lib/controllers/UserController";

export async function GET(req: NextRequest, context: { params: { username: string } }) {
  return getUserPublicProfileController(req, context);
}

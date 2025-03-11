// src/app/api/auth/login/route.ts
import { NextRequest } from "next/server";
import { loginController } from "@/lib/controllers/AuthController";

export async function POST(req: NextRequest) {
  return loginController(req);
}

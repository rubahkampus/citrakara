// src/app/api/user/register/route.ts
import { NextRequest } from "next/server";
import { registerUserController } from "@/lib/controllers/UserController";

export async function POST(req: NextRequest) {
  return registerUserController(req);
}

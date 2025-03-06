// src/app/api/auth/logout/route.ts
import { logoutController } from "@/lib/controllers/AuthController";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    return logoutController();
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

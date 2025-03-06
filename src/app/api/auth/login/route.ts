// src/app/api/auth/login/route.ts
import { NextRequest, NextResponse } from "next/server";
import { loginController } from "@/lib/controllers/AuthController";

export async function POST(req: NextRequest) {
  try {
    // 1. Parse request body
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: "Missing username or password" },
        { status: 400 }
      );
    }

    // 2. Call the controller to handle login logic
    return await loginController(username, password);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}

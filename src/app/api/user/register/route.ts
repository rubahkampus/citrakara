// src/app/api/user/register/route.ts
import { NextRequest, NextResponse } from "next/server";
import { registerUserController } from "@/lib/controllers/UserController";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log("Received Body:", body); // Debug log

    if (!body.email || !body.username || !body.password) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    return await registerUserController(body);
  } catch (error) {
    console.error("Register API Error:", error);
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}

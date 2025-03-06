// src/lib/controllers/UserController.ts
import { registerUser } from "@/lib/services/UserService";
import { RegisterSchema } from "@/schemas/UserSchema";
import { NextRequest, NextResponse } from "next/server";

export async function registerUserController(body: any) {
  try {
    // Minimal server-side validation
    if (!/^[a-zA-Z0-9_]+$/.test(body.username)) {
      return NextResponse.json(
        { error: "Invalid username format" },
        { status: 400 }
      );
    }

    // Validate using Zod
    const validated = RegisterSchema.parse(body);

    const user = await registerUser(
      validated.email,
      validated.username,
      validated.password
    );

    return NextResponse.json({
      message: "User registered successfully!",
      user,
    });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 }
    );
  }
}

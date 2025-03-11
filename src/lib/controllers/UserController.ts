// src/lib/controllers/UserController.ts
import { checkUserAvailabilityService, getUserProfile, registerUser } from "@/lib/services/UserService";
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

export async function checkUserAvailabilityController(req: NextRequest) {
  console.log("Checking user availability");
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");
    const username = searchParams.get("username");

    console.log(searchParams);

    if (!email && !username) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const result = await checkUserAvailabilityService(email ?? undefined, username ?? undefined);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function getUserProfileController(req: NextRequest, { params }: { params: { username: string } }) {
  try {
    const user = await getUserProfile(params.username);
    return NextResponse.json({ user });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 404 });
  }
}
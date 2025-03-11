// src/lib/controllers/UserController.ts
import { NextRequest, NextResponse } from "next/server";
import { checkUserAvailabilityService, getUserPublicProfile, registerUser } from "@/lib/services/UserService";
import { RegisterSchema } from "@/schemas/UserSchema";
import { handleError } from "@/lib/utils/errorHandler";
import { authMiddleware } from "@/lib/middleware/authMiddleware";
import { JwtPayload } from "jsonwebtoken";
import { Console } from "console";

export async function registerUserController(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = RegisterSchema.parse(body);

    const user = await registerUser(validated.email, validated.username, validated.password);

    return NextResponse.json({
      message: "User registered successfully!",
      user,
    });
  } catch (error) {
    return handleError(error);
  }
}

export async function checkUserAvailabilityController(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");
    const username = searchParams.get("username");

    if (!email && !username) throw new Error("Invalid request");

    const result = await checkUserAvailabilityService(email ?? undefined, username ?? undefined);
    return NextResponse.json(result);
  } catch (error) {
    return handleError(error);
  }
}

export async function getUserPublicProfileController(
  req: NextRequest,
  context: { params: { username?: string } }
) {
  try {
    const username = context?.params?.username;
    if (!username) throw new Error("Username is required");

    const authResponse = await authMiddleware(req);
    const isOwner =
      !(authResponse instanceof NextResponse) &&
      (authResponse as JwtPayload).user?.username === username;

    const user = await getUserPublicProfile(username);

    return NextResponse.json({ user, isOwner });
  } catch (error) {
    return handleError(error, 404);
  }
}

export async function getUserProfileController(req: NextRequest) {
  try {
    const authResponse = await authMiddleware(req);
    if (authResponse instanceof NextResponse) return authResponse;

    return NextResponse.json({ user: authResponse.user });
  } catch (error) {
    return handleError(error, 404);
  }
}

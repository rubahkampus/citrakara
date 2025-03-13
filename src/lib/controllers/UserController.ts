// src/lib/controllers/UserController.ts
import { NextRequest, NextResponse } from "next/server";
import { checkUserAvailabilityService, getUserPublicProfile, registerUser, updateUserProfileService } from "@/lib/services/UserService";
import { RegisterSchema, UpdateProfileSchema } from "@/schemas/UserSchema";
import { handleError } from "@/lib/utils/errorHandler";
import { authMiddleware } from "@/lib/middleware/authMiddleware";
import { JwtPayload } from "jsonwebtoken";
import { z } from "zod";

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
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input format" }, { status: 400 });
    }

    if ((error as Error).message.includes("already")) {
      return NextResponse.json({ error: (error as Error).message }, { status: 409 }); // 409 Conflict
    }

    return handleError(error, 500);
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
    // Await the params before using them
    const params = await context.params;
    const username = params?.username;
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

export async function updateUserProfileController(req: NextRequest) {
  try {
    const authResponse = await authMiddleware(req);
    if (authResponse instanceof NextResponse) return authResponse;

    const username = (authResponse as JwtPayload).user?.username; // ✅ Get username instead of userId
    const formData = await req.formData(); // ✅ Handle multipart form data

    // Convert FormData to an object
    const updateData: Record<string, any> = {};
    formData.forEach((value, key) => {
      updateData[key] = value;
    });

    const validatedData = UpdateProfileSchema.parse(updateData);
    const updatedUser = await updateUserProfileService(username, validatedData); // ✅ Pass username instead of userId

    return NextResponse.json({
      message: "Profile updated successfully!",
      user: updatedUser,
    });
  } catch (error) {
    return handleError(error);
  }
}

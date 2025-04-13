// src/app/api/user/[username]/route.ts
import { getUserPublicProfile, updateUserProfile } from "@/lib/services/user.service";
import { getAuthSession } from "@/lib/utils/session";
import { NextRequest, NextResponse } from "next/server";
import { cookieOptions } from "@/lib/utils/cookies";
import { handleError } from "@/lib/utils/errorHandler";

export async function GET(req: NextRequest, { params }: { params: { username: string } }) {
  try {
    const username = params.username;
    if (!username) throw new Error("Username required");

    const session = await getAuthSession();
    const user = await getUserPublicProfile(username);
    if (!user) throw new Error("User not found");

    const isOwner = typeof session !== "string" && session?.username === username;
    const response = NextResponse.json({ user, isOwner });

    if (session && typeof session === "object" && "_refreshedAccessToken" in session) {
      response.cookies.set("accessToken", session._refreshedAccessToken!, {
        ...cookieOptions,
        maxAge: 60 * 15,
      });
    }

    return response;
  } catch (error) {
    return handleError(error, 400);
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { username: string } }) {
  try {
    const session = await getAuthSession();
    const username = params.username;

    if (!session || typeof session === "string" || session.username !== username) {
      return handleError(new Error("Unauthorized"), 401);
    }

    const formData = await req.formData();
    const updatedUser = await updateUserProfile(username, formData);

    const response = NextResponse.json({
      message: "Profile updated",
      user: updatedUser,
    });

    if ("_refreshedAccessToken" in session) {
      response.cookies.set("accessToken", session._refreshedAccessToken!, {
        ...cookieOptions,
        maxAge: 60 * 15,
      });
    }

    return response;
  } catch (error) {
    return handleError(error);
  }
}

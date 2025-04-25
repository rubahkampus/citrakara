// src/app/api/user/me/update/route.ts
import { updateUserProfile } from "@/lib/services/user.service";
import { getAuthSession } from "@/lib/utils/session";
import { NextRequest, NextResponse } from "next/server";
import { cookieOptions } from "@/lib/utils/cookies";
import { handleError } from "@/lib/utils/errorHandler";

export async function PATCH(req: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session || typeof session !== "object" || !("username" in session)) {
      return handleError(new Error("Unauthorized"), 401);
    }

    const formData = await req.formData();
    const updatedUser = await updateUserProfile(session.username, formData);

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

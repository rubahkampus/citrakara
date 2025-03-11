// src/app/api/user/[username]/route.ts
import { NextRequest, NextResponse } from "next/server";
import User from "@/lib/models/User";
import { connectDB } from "@/lib/utils/db";
import { authMiddleware } from "@/lib/middleware/authMiddleware";

export async function GET(req: NextRequest, { params }: { params: { username: string } }) {
  try {
    await connectDB();

    const { username } = params;
    const user = await User.findOne({ username }).select("-password");

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Authenticate user (optional, user can be unauthenticated)
    const authResponse = await authMiddleware(req);

    let isOwner = false;
    if (!(authResponse instanceof NextResponse) && authResponse.user) {
      const authUser = authResponse.user as { username?: string }; // Explicitly type it
      isOwner = authUser.username === user.username;
    }

    return NextResponse.json({
      user,
      isOwner,
    });
  } catch (error) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// src/app/api/auth/websocket-token/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/utils/session";
import jwt from "jsonwebtoken";

// Generate a WebSocket token
function generateWebSocketToken(userId: string, username: string): string {
  return jwt.sign(
    { id: userId, username },
    process.env.JWT_SECRET!,
    { expiresIn: "2h" } // Short expiration for WebSocket tokens
  );
}

export async function GET(req: NextRequest) {
  try {
    const session = await getAuthSession();

    if (!session || typeof session === "string") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Generate a special short-lived token for WebSocket
    const wsToken = generateWebSocketToken(session.id, session.username);

    return NextResponse.json({
      token: wsToken,
    });
  } catch (error) {
    console.error("WebSocket token generation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

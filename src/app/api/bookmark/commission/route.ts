// src/app/api/bookmark/commission/route.ts
import { NextRequest, NextResponse } from "next/server";
import { handleError } from "@/lib/utils/errorHandler";
import { getAuthSession } from "@/lib/utils/session";
import { toggleCommissionBookmark } from "@/lib/services/user.service";

export async function POST(req: NextRequest) {
  try {
    const session = await getAuthSession();

    if (!session || typeof session === "string") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { commissionId, action } = await req.json();

    if (
      !commissionId ||
      !action ||
      !["bookmark", "unbookmark"].includes(action)
    ) {
      return NextResponse.json(
        { error: "Invalid request parameters" },
        { status: 400 }
      );
    }

    const result = await toggleCommissionBookmark(
      session.id,
      commissionId,
      action as "bookmark" | "unbookmark"
    );

    return NextResponse.json(result);
  } catch (error) {
    return handleError(error);
  }
}

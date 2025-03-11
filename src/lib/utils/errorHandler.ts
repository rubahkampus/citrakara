// src/lib/utils/errorHandler.ts
import { NextResponse } from "next/server";

export function handleError(error: unknown, status: number = 400) {
  console.error("Error:", error);
  return NextResponse.json({ error: (error as Error).message }, { status });
}

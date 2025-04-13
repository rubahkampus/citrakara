// src/app/api/auth/logout/route.ts
import { logoutUser } from "@/lib/services/auth.service";
import { handleError } from "@/lib/utils/errorHandler";

export async function POST() {
  try {
    return logoutUser();
  } catch (error) {
    return handleError(error);
  }
}
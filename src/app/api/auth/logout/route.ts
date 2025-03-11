// src/app/api/auth/logout/route.ts
import { logoutController } from "@/lib/controllers/AuthController";

export async function POST() {
  return logoutController();
}

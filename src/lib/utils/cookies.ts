// src/lib/utils/cookies.ts
export const cookieOptions = {
    httpOnly: true,
    secure: true,
    sameSite: "strict" as "strict" | "lax" | "none", // ✅ Explicitly type it
    path: "/",
  };
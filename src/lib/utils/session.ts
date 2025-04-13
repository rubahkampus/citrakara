import { cookies } from "next/headers";
import { verifyAccessToken, verifyRefreshToken, generateAccessToken } from "@/lib/utils/jwt";
import { cookieOptions } from "@/lib/utils/cookies";

/** Returns the current user's session (decoded JWT payload) or null if not authenticated. */
export async function getAuthSession() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("accessToken")?.value;
  const refreshToken = cookieStore.get("refreshToken")?.value;

if (!refreshToken) return null;

  try {
    return verifyAccessToken(accessToken!);
  } catch {
    try {
      const decoded = verifyRefreshToken(refreshToken!) as {
        id: string;
        username: string;
      };
      const newAccessToken = generateAccessToken({
        id: decoded.id,
        username: decoded.username,
      });
      return { ...decoded, _refreshedAccessToken: newAccessToken };
    } catch {
      return null;
    }
  }
}

import { cookies } from "next/headers";
import { verifyAccessToken, verifyRefreshToken, generateAccessToken } from "@/lib/utils/jwt";
import { cookieOptions } from "@/lib/utils/cookies";

export interface Session {
  id: string;
  username: string;
  _refreshedAccessToken?: string;
}

export interface Profile {
  [key: string]: any;
}

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

/** Returns the current user's session (decoded JWT payload) or null if not authenticated. */
export function isUserOwner(session: Session | null, username: string): boolean {
  return !!(
    session &&
    typeof session === "object" &&
    "username" in session &&
    session.username === username
  );
}

/** Returns the current user's session (decoded JWT payload) or null if not authenticated. */
export function serializeProfile(profile: Profile | null): Profile | null {
  if (!profile) return null;
  return JSON.parse(JSON.stringify(profile));
}

export interface AuthSession {
  userId: string;            // your Mongo ObjectId string
  roles: ("user" | "admin")[];
  username: string;
}
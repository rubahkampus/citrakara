// src/middleware.ts
// Global Next.js middleware
import { NextResponse, NextRequest } from "next/server";
import { verifyAccessToken } from "@/lib/utils/jwt";

export async function middleware(req: NextRequest) {
  // Define protected routes
  const protectedRoutes = ["/dashboard", "/profile"];
  const isProtectedRoute = protectedRoutes.some((route) =>
    req.nextUrl.pathname.startsWith(route)
  );

  if (isProtectedRoute) {
    const accessToken = req.cookies.get("accessToken")?.value;

    if (!accessToken) {
      // Not logged in – redirect to login page
      return NextResponse.redirect(new URL("/login", req.url));
    }

    try {
      verifyAccessToken(accessToken);
    } catch (error) {
      // Token invalid or expired – also redirect
      return NextResponse.redirect(new URL("/login", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard", "/profile"],
};

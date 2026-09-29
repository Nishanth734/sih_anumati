import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const COOKIE_NAME = "anumati_session";

const getSecretKey = () => {
  const secret = process.env.JWT_SECRET || "anumati_production_super_secret_jwt_key_32_bytes_min!";
  return new TextEncoder().encode(secret);
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(COOKIE_NAME)?.value;

  // Handle CORS & Preflight OPTIONS for API routes
  if (pathname.startsWith("/api")) {
    const origin = request.headers.get("origin");
    const allowedOrigin = process.env.NEXT_PUBLIC_APP_URL || origin || "*";

    // Preflight OPTIONS response
    if (request.method === "OPTIONS") {
      return new NextResponse(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": allowedOrigin,
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
          "Access-Control-Allow-Credentials": "true",
          "Access-Control-Max-Age": "86400",
        },
      });
    }

    const response = NextResponse.next();
    response.headers.set("Access-Control-Allow-Origin", allowedOrigin);
    response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
    response.headers.set("Access-Control-Allow-Credentials", "true");
    response.headers.set("X-Content-Type-Options", "nosniff");
    response.headers.set("X-Frame-Options", "DENY");
    response.headers.set("X-XSS-Protection", "1; mode=block");

    return response;
  }

  let session: { role: "entrepreneur" | "officer"; email: string } | null = null;

  if (token) {
    try {
      const { payload } = await jwtVerify(token, getSecretKey());
      session = payload as unknown as { role: "entrepreneur" | "officer"; email: string };
    } catch {
      session = null;
    }
  }

  // 1. Unauthenticated users trying to access protected routes
  if (
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/chat") ||
    pathname.startsWith("/profile") ||
    pathname.startsWith("/application")
  ) {
    if (!session) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Role-based route authorization
    if (
      (pathname.startsWith("/dashboard/entrepreneur") ||
        pathname.startsWith("/profile") ||
        pathname.startsWith("/application")) &&
      session.role !== "entrepreneur"
    ) {
      return NextResponse.redirect(new URL("/dashboard/officer", request.url));
    }

    if (pathname.startsWith("/dashboard/officer") && session.role !== "officer") {
      return NextResponse.redirect(new URL("/dashboard/entrepreneur", request.url));
    }
  }

  // 2. Authenticated users trying to access login/signup pages
  if (pathname === "/login" || pathname === "/signup") {
    if (session) {
      const targetDashboard = session.role === "officer" ? "/dashboard/officer" : "/dashboard/entrepreneur";
      return NextResponse.redirect(new URL(targetDashboard, request.url));
    }
  }

  const response = NextResponse.next();
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  return response;
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/chat",
    "/profile",
    "/application/:path*",
    "/login",
    "/signup",
    "/api/:path*",
  ],
};

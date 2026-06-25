import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const ROLE_ALLOWED_PATHS: Record<string, string[]> = {
  TEACHER: [
    "/dashboard",
    "/dashboard/courses",
    "/dashboard/reservations",
    "/dashboard/space",
    "/dashboard/affluence",
    "/dashboard/incidents",
    "/dashboard/notifications",
    "/dashboard/preferences",
  ],
  STUDENT: [
    "/dashboard",
    "/dashboard/courses",
    "/dashboard/parking",
    "/dashboard/dorms",
    "/dashboard/affluence",
    "/dashboard/incidents",
    "/dashboard/notifications",
    "/dashboard/preferences",
  ],
  MAINTENANCE: [
    "/dashboard",
    "/dashboard/incidents",
    "/dashboard/buildings",
    "/dashboard/hvac",
    "/dashboard/lighting",
    "/dashboard/notifications",
    "/dashboard/preferences",
  ],
};

function pathAllowed(pathname: string, allowedPaths: string[]): boolean {
  return allowedPaths.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/login") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/api/auth")
  ) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/dashboard") || pathname.startsWith("/api/")) {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token) {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
      }
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }

    const role = token.role as string;

    if (role === "ADMIN") return NextResponse.next();

    if (pathname.startsWith("/dashboard")) {
      const allowed = ROLE_ALLOWED_PATHS[role] ?? [];
      if (!pathAllowed(pathname, allowed)) {
        return NextResponse.redirect(
          new URL("/dashboard?forbidden=1", request.url)
        );
      }
    }

    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/api/:path*"],
};

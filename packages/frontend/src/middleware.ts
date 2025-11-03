import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const token = req.cookies.get("auth");
  const { pathname } = req.nextUrl;

  const publicPaths = ["/auth/login", "/auth/register", "/"];

  const isPublicPath = publicPaths.includes(pathname);

  if (!token && !isPublicPath) {
    return NextResponse.redirect(new URL("/auth/login", req.url));
  }

  if (token && (pathname === "/auth/login" || pathname === "/auth/register")) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Exclut les fichiers statiques, les images et les routes d'API.
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};

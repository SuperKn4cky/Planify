import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(req: NextRequest) {
    const token = req.cookies.get("auth");
    const { pathname } = req.nextUrl;

    const authPaths = new Set(["/auth/login", "/auth/register"]);
    const publicPaths = new Set(["/", ...authPaths]);

    const isPublicPath = publicPaths.has(pathname);

    if (!token && !isPublicPath) {
        return NextResponse.redirect(new URL("/auth/login", req.url));
    }

    if (token && authPaths.has(pathname)) {
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

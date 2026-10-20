import { NextResponse, type NextRequest } from "next/server";

const SESSION_COOKIE = "accurate_session";
const PUBLIC_PATHS = ["/login", "/home"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const hasSession = req.cookies.has(SESSION_COOKIE);
  const isPublic = PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );

  if (pathname === "/") {
    const url = req.nextUrl.clone();
    url.pathname = hasSession ? "/dashboard" : "/home";
    return NextResponse.redirect(url);
  }

  if (!hasSession && !isPublic) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (hasSession && pathname === "/login") {
    const url = req.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};

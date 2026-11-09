import { NextResponse, type NextRequest } from "next/server";

/** Pages need a session cookie; the API still checks the token itself. */
export function middleware(req: NextRequest) {
  const has = req.cookies.has("sc_token");
  const isLogin = req.nextUrl.pathname.startsWith("/login");
  if (!has && !isLogin) return NextResponse.redirect(new URL("/login", req.url));
  if (has && isLogin) return NextResponse.redirect(new URL("/", req.url));
  return NextResponse.next();
}

export const config = { matcher: ["/((?!_next|models|favicon.ico|api).*)"] };

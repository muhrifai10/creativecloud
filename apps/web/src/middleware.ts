import { NextResponse, type NextRequest } from "next/server";

const PROTECTED = /^\/(dashboard|explorer|accounts|transfers|settings|onboarding)(\/|$)/;

export function middleware(req: NextRequest) {
  if (!PROTECTED.test(req.nextUrl.pathname)) return NextResponse.next();
  const session =
    req.cookies.has("authjs.session-token") ||
    req.cookies.has("__Secure-authjs.session-token");
  if (!session) {
    return NextResponse.redirect(new URL("/login", req.url));
  }
  return NextResponse.next();
}

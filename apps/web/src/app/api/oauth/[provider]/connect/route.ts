import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { encryptSecret } from "@nexusdrive/core";
import { auth } from "@/auth";
import { authorizeUrl, isOAuthProvider, STATE_COOKIE } from "@/lib/oauth-config";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ provider: string }> },
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const { provider } = await params;
  if (!isOAuthProvider(provider)) {
    return NextResponse.json({ error: "Provider tidak dikenal." }, { status: 400 });
  }

  const redirectUri = new URL(`/api/oauth/${provider}/callback`, req.url).toString();
  const state = randomUUID();
  let target: string;
  try {
    target = authorizeUrl(provider, redirectUri, state);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Provider belum dikonfigurasi." }, { status: 503 });
  }

  const res = NextResponse.redirect(target);
  res.cookies.set(STATE_COOKIE, encryptSecret(state), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 600,
    secure: process.env.NODE_ENV === "production",
  });
  return res;
}

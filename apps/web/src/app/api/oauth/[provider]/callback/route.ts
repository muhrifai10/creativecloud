import { NextRequest, NextResponse } from "next/server";
import { createProvider, decryptSecret, exchangeCodeForToken } from "@nexusdrive/core";
import { prisma } from "@nexusdrive/database";
import { auth } from "@/auth";
import { isOAuthProvider, STATE_COOKIE } from "@/lib/oauth-config";
import { saveConnection } from "@nexusdrive/database/vault";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ provider: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const { provider } = await params;
  if (!isOAuthProvider(provider)) {
    return NextResponse.json({ error: "Provider tidak dikenal." }, { status: 400 });
  }

  const sp = req.nextUrl.searchParams;
  if (sp.get("error")) {
    return NextResponse.redirect(new URL(`/accounts?err=${encodeURIComponent(sp.get("error") ?? "")}`, req.url));
  }
  const code = sp.get("code");
  const state = sp.get("state");
  const cookieState = req.cookies.get(STATE_COOKIE)?.value;
  if (!code || !state || !cookieState) {
    return NextResponse.json({ error: "Parameter OAuth tidak lengkap." }, { status: 400 });
  }

  try {
    if (decryptSecret(cookieState) !== state) {
      return NextResponse.json({ error: "Pemeriksaan state CSRF gagal." }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: "State cookie tidak valid." }, { status: 400 });
  }

  const redirectUri = new URL(`/api/oauth/${provider}/callback`, req.url).toString();
  let done: NextResponse;

  try {
    const tokens = await exchangeCodeForToken({ provider, code, redirectUri });
    const adapter = createProvider(provider, { accessToken: tokens.accessToken });
    const [identity, quota] = await Promise.all([adapter.getIdentity(), adapter.getQuota()]);

    const account = await saveConnection({
      userId: session.user.id,
      provider,
      accountEmail: identity.email,
      accountName: identity.name,
      quota,
      tokens,
    });
    await prisma.fileItem.deleteMany({ where: { accountId: account.id } });

    done = NextResponse.redirect(new URL(`/accounts?ok=${provider}`, req.url));
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Koneksi gagal.";
    done = NextResponse.redirect(new URL(`/accounts?err=${encodeURIComponent(msg)}`, req.url));
  }
  done.cookies.delete(STATE_COOKIE);
  return done;
}

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { MegaProvider, PCloudProvider } from "@nexusdrive/core";
import { auth } from "@/auth";
import { saveConnection } from "@nexusdrive/database/vault";

const bodySchema = z.union([
  z.object({
    provider: z.literal("mega"),
    email: z.string().trim().toLowerCase().email().max(254),
    password: z.string().min(1).max(256),
  }),
  z.object({
    provider: z.literal("pcloud"),
    token: z.string().trim().min(16).max(512),
    region: z.enum(["us", "eu"]).default("us"),
  }),
]);

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Sesi tidak ditemukan." }, { status: 401 });
  }

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Data kredensial tidak valid." }, { status: 400 });
  }

  try {
    if (parsed.data.provider === "mega") {
      const provider = await MegaProvider.login(parsed.data.email, parsed.data.password);
      const quota = await provider.getQuota();
      await saveConnection({
        userId: session.user.id,
        provider: "mega",
        accountEmail: parsed.data.email,
        accountName: "MEGA",
        quota,
        masterSecret: parsed.data.password,
      });
      return NextResponse.json({ ok: true, provider: "mega" });
    }

    const provider = new PCloudProvider(parsed.data.token, parsed.data.region);
    const [identity, quota] = await Promise.all([provider.getIdentity(), provider.getQuota()]);
    await saveConnection({
      userId: session.user.id,
      provider: "pcloud",
      accountEmail: identity.email,
      accountName: identity.name ?? "pCloud",
      quota,
      tokens: { accessToken: parsed.data.token, expiresIn: 60 * 60 * 24 * 365 * 10 },
      meta: { region: parsed.data.region },
    });
    return NextResponse.json({ ok: true, provider: "pcloud" });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Validasi koneksi gagal.";
    return NextResponse.json({ error: msg }, { status: 422 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { getProviderForAccount } from "@nexusdrive/database/vault";

const querySchema = z.object({
  accountId: z.string().uuid(),
  fileId: z.string().min(1).max(256),
});

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Sesi tidak ditemukan." }, { status: 401 });
  }

  const parsed = querySchema.safeParse({
    accountId: req.nextUrl.searchParams.get("accountId"),
    fileId: req.nextUrl.searchParams.get("fileId"),
  });
  if (!parsed.success) {
    return NextResponse.json({ error: "Parameter berkas tidak valid." }, { status: 400 });
  }

  const { accountId, fileId } = parsed.data;

  try {
    const provider = await getProviderForAccount(accountId, session.user.id);
    let publicUrl: string | null = null;
    if (typeof provider.getShareLink === "function") {
      publicUrl = await provider.getShareLink(fileId);
    }

    return NextResponse.json({
      publicUrl,
      provider: provider.providerId,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Gagal membuat tautan publik." },
      { status: 502 },
    );
  }
}

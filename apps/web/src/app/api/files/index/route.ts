import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { getProviderForAccount } from "@nexusdrive/database/vault";
import { indexAccountFiles } from "@/lib/indexer";

const schema = z.object({
  accountId: z.string().uuid(),
  rootFolderId: z.string().min(1).max(256).default("root"),
  maxDepth: z.coerce.number().int().min(0).max(3).default(1),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Sesi tidak ditemukan." }, { status: 401 });
  }
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Parameter indeks tidak valid." }, { status: 400 });
  }

  try {
    const provider = await getProviderForAccount(parsed.data.accountId, session.user.id);
    const result = await indexAccountFiles(provider, {
      accountId: parsed.data.accountId,
      userId: session.user.id,
      rootFolderId: parsed.data.rootFolderId,
      maxDepth: parsed.data.maxDepth,
    });
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Indeks gagal." }, { status: 502 });
  }
}

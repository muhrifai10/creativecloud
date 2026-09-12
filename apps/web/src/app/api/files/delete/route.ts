import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@nexusdrive/database";
import { auth } from "@/auth";
import { getProviderForAccount } from "@nexusdrive/database/vault";

const schema = z.object({
  accountId: z.string().uuid(),
  itemId: z.string().min(1).max(256),
});

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Sesi tidak ditemukan." }, { status: 401 });
  }
  const parsed = schema.safeParse({
    accountId: req.nextUrl.searchParams.get("accountId"),
    itemId: req.nextUrl.searchParams.get("itemId"),
  });
  if (!parsed.success) {
    return NextResponse.json({ error: "Parameter hapus tidak valid." }, { status: 400 });
  }
  const { accountId, itemId } = parsed.data;

  try {
    const provider = await getProviderForAccount(accountId, session.user.id);
    await provider.deleteItem(itemId);
    await prisma.fileItem.deleteMany({
      where: { accountId, userId: session.user.id, providerFileId: itemId },
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Gagal menghapus." }, { status: 502 });
  }
}

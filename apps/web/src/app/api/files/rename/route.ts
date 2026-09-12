import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@nexusdrive/database";
import { auth } from "@/auth";
import { getProviderForAccount } from "@nexusdrive/database/vault";

const schema = z.object({
  accountId: z.string().uuid(),
  itemId: z.string().min(1).max(256),
  newName: z.string().trim().min(1).max(200),
});

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Sesi tidak ditemukan." }, { status: 401 });
  }
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Data rename tidak valid." }, { status: 400 });
  }
  const { accountId, itemId, newName } = parsed.data;

  try {
    const owned = await prisma.fileItem.findFirst({
      where: { accountId, userId: session.user.id, providerFileId: itemId },
    });
    if (!owned && (await prisma.connectedAccount.findFirst({ where: { id: accountId, userId: session.user.id } })) === null) {
      return NextResponse.json({ error: "Akun bukan milik Anda." }, { status: 403 });
    }
    const provider = await getProviderForAccount(accountId, session.user.id);
    const item = await provider.renameItem(itemId, newName);
    await prisma.fileItem.updateMany({
      where: { accountId, userId: session.user.id, providerFileId: itemId },
      data: { name: item.name },
    });
    return NextResponse.json({ item });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Gagal rename." }, { status: 502 });
  }
}

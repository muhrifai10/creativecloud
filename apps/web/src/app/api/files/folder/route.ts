import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@nexusdrive/database";
import { auth } from "@/auth";
import { getProviderForAccount } from "@nexusdrive/database/vault";

const schema = z.object({
  accountId: z.string().uuid(),
  name: z.string().trim().min(1).max(200),
  parentId: z.string().min(1).max(256).default("root"),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Sesi tidak ditemukan." }, { status: 401 });
  }
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Data folder tidak valid." }, { status: 400 });
  }
  const { accountId, name, parentId } = parsed.data;

  try {
    const provider = await getProviderForAccount(accountId, session.user.id);
    const folder = await provider.createFolder(name, parentId);
    await prisma.fileItem.upsert({
      where: { accountId_providerFileId: { accountId, providerFileId: folder.id } },
      update: { name: folder.name, isFolder: true },
      create: {
        accountId,
        userId: session.user.id,
        provider: folder.provider,
        providerFileId: folder.id,
        providerParentId: parentId,
        name: folder.name,
        isFolder: true,
        mimeType: "folder",
        pathHierarchy: `${parentId}/${folder.name}`,
      },
    });
    return NextResponse.json({ item: folder });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Gagal membuat folder." }, { status: 502 });
  }
}

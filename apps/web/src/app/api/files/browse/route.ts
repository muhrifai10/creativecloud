import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { fileKind } from "@nexusdrive/core";
import { prisma } from "@nexusdrive/database";
import { auth } from "@/auth";
import { getProviderForAccount } from "@nexusdrive/database/vault";

const q = z.object({
  accountId: z.string().uuid(),
  folderId: z.string().min(1).max(256).default("root"),
});

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Sesi tidak ditemukan." }, { status: 401 });
  }
  const parsed = q.safeParse({
    accountId: req.nextUrl.searchParams.get("accountId"),
    folderId: req.nextUrl.searchParams.get("folderId") ?? "root",
  });
  if (!parsed.success) {
    return NextResponse.json({ error: "Parameter folder tidak valid." }, { status: 400 });
  }
  const { accountId, folderId } = parsed.data;

  try {
    const provider = await getProviderForAccount(accountId, session.user.id);
    const items = await provider.listFiles(folderId);

    // refresh cache best-effort secara asinkron tanpa memblokir respons HTTP
    void (async () => {
      try {
        await Promise.all(
          items.map((it) =>
            prisma.fileItem.upsert({
              where: { accountId_providerFileId: { accountId, providerFileId: it.id } },
              update: { name: it.name, sizeBytes: BigInt(it.sizeBytes), isFolder: it.isFolder, providerParentId: it.parentId },
              create: {
                accountId,
                userId: session.user.id,
                provider: it.provider,
                providerFileId: it.id,
                providerParentId: it.parentId,
                name: it.name,
                sizeBytes: BigInt(it.sizeBytes),
                mimeType: it.mimeType,
                isFolder: it.isFolder,
                pathHierarchy: `${folderId}/${it.name}`,
              },
            })
          )
        );
      } catch (err) {
        console.error("Browse cache update error:", err);
      }
    })();

    const account = await prisma.connectedAccount.findUnique({ where: { id: accountId } });

    return NextResponse.json({
      accountId,
      provider: account?.provider ?? null,
      folderId,
      items: items.map((it) => ({
        id: it.id,
        name: it.name,
        sizeBytes: it.sizeBytes,
        mimeType: it.mimeType,
        isFolder: it.isFolder,
        kind: fileKind(it),
        modifiedAt: it.modifiedAt.toISOString(),
        parentId: it.parentId,
      })),
    });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Gagal memuat folder." }, { status: 502 });
  }
}

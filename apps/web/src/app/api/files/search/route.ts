import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { fileKind } from "@nexusdrive/core";
import { prisma } from "@nexusdrive/database";
import { auth } from "@/auth";

const q = z.object({
  query: z.string().trim().max(120).default(""),
  accountId: z.string().uuid().optional(),
  kind: z.enum(["image", "video", "audio", "document"]).optional(),
});

const EXT_BY_KIND: Record<string, string[]> = {
  image: ["jpg", "jpeg", "png", "gif", "webp", "heic", "svg", "psd", "fig"],
  video: ["mp4", "mov", "avi", "mkv", "webm"],
  audio: ["mp3", "wav", "flac", "aac", "ogg", "m4a"],
  document: ["pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "txt", "md", "csv"],
};

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Sesi tidak ditemukan." }, { status: 401 });
  }
  const parsed = q.safeParse(Object.fromEntries(req.nextUrl.searchParams));
  if (!parsed.success) {
    return NextResponse.json({ error: "Kueri pencarian tidak valid." }, { status: 400 });
  }
  const { query, accountId, kind } = parsed.data;
  if (!query && !kind && !accountId) {
    return NextResponse.json({ error: "Berikan query, kategori, atau akun." }, { status: 400 });
  }

  const rows = await prisma.fileItem.findMany({
    where: {
      userId: session.user.id,
      isFolder: false,
      ...(accountId ? { accountId } : {}),
      ...(kind ? { extension: { in: EXT_BY_KIND[kind] } } : {}),
      ...(query
        ? { name: { contains: query.replace(/[%_\\]/g, ""), mode: "insensitive" } }
        : {}),
    },
    orderBy: [{ name: "asc" }],
    take: 200,
    select: {
      id: true, accountId: true, provider: true, providerFileId: true,
      name: true, sizeBytes: true, isFolder: true, mimeType: true,
      providerModifiedAt: true, providerParentId: true, pathHierarchy: true,
    },
  });

  return NextResponse.json({
    items: rows.map((r) => ({
      cacheId: r.id,
      accountId: r.accountId,
      provider: r.provider,
      id: r.providerFileId,
      name: r.name,
      sizeBytes: Number(r.sizeBytes),
      isFolder: r.isFolder,
      kind: fileKind({ isFolder: r.isFolder, name: r.name, mimeType: r.mimeType }),
      modifiedAt: r.providerModifiedAt?.toISOString() ?? null,
      parentId: r.providerParentId,
      path: r.pathHierarchy,
    })),
  });
}

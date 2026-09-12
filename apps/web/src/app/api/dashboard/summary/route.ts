import { NextResponse } from "next/server";
import { fileKind } from "@nexusdrive/core";
import { prisma } from "@nexusdrive/database";
import { auth } from "@/auth";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Sesi tidak ditemukan." }, { status: 401 });
  }

  const accounts = await prisma.connectedAccount.findMany({
    where: { userId: session.user.id, status: { not: "revoked" } },
    orderBy: { provider: "asc" },
  });

  let total = 0;
  let used = 0;
  for (const a of accounts) {
    total += Number(a.totalSpaceBytes);
    used += Number(a.usedSpaceBytes);
  }

  const fileCount =
    (await prisma.fileItem.count({ where: { userId: session.user.id, isFolder: false } }));
  const folderCount = await prisma.fileItem.count({ where: { userId: session.user.id, isFolder: true } });

  const nonFolders = await prisma.fileItem.findMany({
    where: { userId: session.user.id, isFolder: false },
    select: { name: true, mimeType: true },
    take: 5000,
  });
  const kindCounts = { image: 0, video: 0, audio: 0, document: 0 };
  for (const f of nonFolders) {
    const k = fileKind({ isFolder: false, name: f.name, mimeType: f.mimeType });
    if (k === "image" || k === "video" || k === "audio" || k === "document") kindCounts[k]++;
  }

  const recentFolders = await prisma.fileItem.findMany({
    where: { userId: session.user.id, isFolder: true },
    orderBy: { lastIndexedAt: "desc" },
    take: 6,
    select: { id: true, accountId: true, providerFileId: true, name: true, provider: true },
  });

  return NextResponse.json({
    accounts: accounts.map((a) => ({
      id: a.id,
      provider: a.provider,
      accountEmail: a.accountEmail,
      accountName: a.accountName,
      status: a.status,
      totalBytes: Number(a.totalSpaceBytes),
      usedBytes: Number(a.usedSpaceBytes),
      lastSyncedAt: a.lastSyncedAt?.toISOString() ?? null,
    })),
    totals: { totalBytes: total, usedBytes: used, freeBytes: Math.max(total - used, 0) },
    stats: { connectedAccounts: accounts.length, fileCount, folderCount },
    kindCounts,
    recentFolders,
  });
}

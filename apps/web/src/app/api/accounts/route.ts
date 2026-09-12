import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@nexusdrive/database";
import { auth } from "@/auth";
import { getProviderForAccount } from "@nexusdrive/database/vault";

const uuid = z.string().uuid();

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Sesi tidak ditemukan." }, { status: 401 });
  }

  const accounts = await prisma.connectedAccount.findMany({
    where: { userId: session.user.id, status: { not: "revoked" } },
    orderBy: { createdAt: "asc" },
  });

  const withQuota = await Promise.all(
    accounts.map(async (acc) => {
      try {
        const provider = await getProviderForAccount(acc.id, session.user.id);
        const quota = await provider.getQuota();
        await prisma.connectedAccount.update({
          where: { id: acc.id },
          data: {
            totalSpaceBytes: BigInt(quota.totalBytes),
            usedSpaceBytes: BigInt(quota.usedBytes),
            lastSyncedAt: new Date(),
            status: acc.status === "expired" ? "active" : acc.status,
          },
        });
        return { ...serialize(acc), quota };
      } catch {
        if (acc.status === "active") {
          await prisma.connectedAccount.update({ where: { id: acc.id }, data: { status: "error" } });
        }
        return { ...serialize(acc), quota: null };
      }
    }),
  );

  return NextResponse.json({ accounts: withQuota });
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Sesi tidak ditemukan." }, { status: 401 });
  }

  const idParam = req.nextUrl.searchParams.get("id") ?? "";
  const parsedId = uuid.safeParse(idParam);
  if (!parsedId.success) {
    return NextResponse.json({ error: "ID tidak valid." }, { status: 400 });
  }

  const account = await prisma.connectedAccount.findFirst({
    where: { id: parsedId.data, userId: session.user.id },
  });
  if (!account) {
    return NextResponse.json({ error: "Akun tidak ditemukan." }, { status: 404 });
  }

  await prisma.$transaction([
    prisma.credentialVault.deleteMany({ where: { accountId: account.id } }),
    prisma.fileItem.deleteMany({ where: { accountId: account.id } }),
    prisma.connectedAccount.update({ where: { id: account.id }, data: { status: "revoked" } }),
  ]);

  return NextResponse.json({ ok: true });
}

function serialize(acc: {
  id: string;
  provider: string;
  accountEmail: string;
  accountName: string | null;
  status: string;
  totalSpaceBytes: bigint;
  usedSpaceBytes: bigint;
  lastSyncedAt: Date | null;
}) {
  return {
    id: acc.id,
    provider: acc.provider,
    accountEmail: acc.accountEmail,
    accountName: acc.accountName,
    status: acc.status,
    totalBytes: Number(acc.totalSpaceBytes),
    usedBytes: Number(acc.usedSpaceBytes),
    lastSyncedAt: acc.lastSyncedAt?.toISOString() ?? null,
  };
}

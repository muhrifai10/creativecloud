import { prisma } from "@nexusdrive/database";
import { auth } from "@/auth";
import { AccountsContent } from "./accounts-content";
import type { AccountDTO } from "./account-row";

export default async function AccountsPage() {
  const session = await auth();
  const accounts = session?.user?.id
    ? await prisma.connectedAccount.findMany({
        where: { userId: session.user.id, status: { not: "revoked" } },
        orderBy: { createdAt: "asc" },
      })
    : [];

  const dtos: AccountDTO[] = accounts.map((acc) => ({
    id: acc.id,
    provider: acc.provider,
    accountEmail: acc.accountEmail,
    accountName: acc.accountName,
    status: acc.status,
    totalBytes: Number(acc.totalSpaceBytes),
    usedBytes: Number(acc.usedSpaceBytes),
    lastSyncedAt: acc.lastSyncedAt?.toISOString() ?? null,
  }));

  return <AccountsContent accounts={dtos} />;
}

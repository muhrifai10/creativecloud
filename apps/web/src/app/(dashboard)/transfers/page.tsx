import { prisma } from "@nexusdrive/database";
import { auth } from "@/auth";
import { PROVIDER_META } from "@/lib/providers-meta";
import { TransfersContent } from "./transfers-content";

export default async function TransfersPage() {
  const session = await auth();
  const accounts = session?.user?.id
    ? await prisma.connectedAccount.findMany({
        where: { userId: session.user.id, status: { not: "revoked" } },
        select: { id: true, provider: true, accountName: true, accountEmail: true },
        orderBy: { provider: "asc" },
      })
    : [];
  const list = accounts.map((a) => ({
    id: a.id,
    provider: a.provider,
    label: a.accountName || PROVIDER_META[a.provider]?.label || a.accountEmail,
  }));

  return <TransfersContent accounts={list} />;
}

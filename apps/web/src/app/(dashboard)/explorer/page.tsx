import { Suspense } from "react";
import { prisma } from "@nexusdrive/database";
import { auth } from "@/auth";
import { Explorer } from "@/components/explorer";
import { PROVIDER_META } from "@/lib/providers-meta";

export default async function ExplorerPage() {
  const session = await auth();
  const accounts = session?.user?.id
    ? await prisma.connectedAccount.findMany({
        where: { userId: session.user.id, status: { not: "revoked" } },
        orderBy: { provider: "asc" },
        select: { id: true, provider: true, accountName: true, accountEmail: true },
      })
    : [];

  return (
    <Suspense>
      <Explorer
        accounts={accounts.map((a) => ({
          id: a.id,
          provider: a.provider,
          label: a.accountName || PROVIDER_META[a.provider]?.label || a.accountEmail,
        }))}
      />
    </Suspense>
  );
}

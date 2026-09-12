import { redirect } from "next/navigation";
import { prisma } from "@nexusdrive/database";
import { auth } from "@/auth";
import { DashboardView } from "@/components/dashboard-view";
import { DashboardPageHeader } from "@/components/dashboard-header";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const profile = await prisma.profile.findUnique({
    where: { id: session.user.id },
    select: { onboardingCompleted: true, fullName: true },
  });
  const connected = await prisma.connectedAccount.count({
    where: { userId: session.user.id, status: { not: "revoked" } },
  });
  if (!profile?.onboardingCompleted && connected === 0) {
    redirect("/onboarding");
  }

  const rawName = profile?.fullName || session.user.name || session.user.email?.split("@")[0] || "User";
  const displayName = rawName.charAt(0).toUpperCase() + rawName.slice(1);

  return (
    <div className="space-y-6">
      <DashboardPageHeader displayName={displayName} />
      <DashboardView userName={displayName} />
    </div>
  );
}

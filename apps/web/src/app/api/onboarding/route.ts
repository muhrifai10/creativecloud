import { NextResponse } from "next/server";
import { prisma } from "@nexusdrive/database";
import { auth } from "@/auth";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Sesi tidak ditemukan." }, { status: 401 });
  }
  const [profile, connected] = await Promise.all([
    prisma.profile.findUnique({
      where: { id: session.user.id },
      select: { onboardingCompleted: true },
    }),
    prisma.connectedAccount.count({ where: { userId: session.user.id, status: { not: "revoked" } } }),
  ]);
  return NextResponse.json({ completed: profile?.onboardingCompleted ?? false, connected });
}

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Sesi tidak ditemukan." }, { status: 401 });
  }
  await prisma.profile.upsert({
    where: { id: session.user.id },
    update: { onboardingCompleted: true },
    create: {
      id: session.user.id,
      email: session.user.email ?? "",
      onboardingCompleted: true,
    },
  });
  return NextResponse.json({ ok: true });
}

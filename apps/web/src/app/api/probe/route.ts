import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const out: Record<string, unknown> = { dbLen: (process.env.DATABASE_URL ?? "").length };
  try {
    const { prisma } = await import("@nexusdrive/database");
    out.users = await prisma.user.count();
  } catch (e) {
    out.err = e instanceof Error ? e.message.split("\n").slice(0, 3).join(" | ") : String(e);
  }
  return NextResponse.json(out);
}
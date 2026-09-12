import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@nexusdrive/database";
import { auth } from "@/auth";

const schema = z.object({ id: z.string().uuid() });

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Sesi tidak ditemukan." }, { status: 401 });
  }
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "ID tidak valid." }, { status: 400 });
  }

  const job = await prisma.transferJob.findFirst({
    where: { id: parsed.data.id, userId: session.user.id },
  });
  if (!job) {
    return NextResponse.json({ error: "Transfer tidak ditemukan." }, { status: 404 });
  }
  if (job.status === "completed" || job.status === "cancelled") {
    return NextResponse.json({ error: "Transfer sudah selesai.", status: job.status }, { status: 409 });
  }

  // worker mendeteksi status cancelled dari DB lalu menghentikan stream
  const updated = await prisma.transferJob.update({
    where: { id: job.id },
    data: { status: "cancelled", errorMessage: "Dibatalkan pengguna" },
  });
  return NextResponse.json({ ok: true, status: updated.status });
}

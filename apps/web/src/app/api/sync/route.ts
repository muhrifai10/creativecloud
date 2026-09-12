import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@nexusdrive/database";
import {
  syncQueue,
  SYNC_JOB_NAME,
  type SyncJobData,
} from "@nexusdrive/core/queues";
import { auth } from "@/auth";

const uuid = z.string().uuid();

const createSchema = z.object({
  sourceAccountId: uuid,
  sourceFolderId: z.string().min(1).max(256),
  targetAccountId: uuid,
  targetFolderId: z.string().min(1).max(256),
  syncDirection: z.enum(["one_way", "two_way", "mirror"]).default("one_way"),
  cron: z
    .string()
    .regex(/^[\d*\/,\-\s]+$/u, "Cron tidak valid")
    .refine((c) => c.trim().split(/\s+/).length === 5, "Cron harus 5 field"),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Sesi tidak ditemukan." }, { status: 401 });
  }
  const rows = await prisma.syncSchedule.findMany({
    where: { userId: session.user.id },
    include: {
      sourceAccount: { select: { provider: true, accountEmail: true } },
      targetAccount: { select: { provider: true, accountEmail: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({
    schedules: rows.map((s) => ({
      id: s.id,
      sourceFolderId: s.sourceFolderId,
      targetFolderId: s.targetFolderId,
      syncDirection: s.syncDirection,
      cron: s.cronExpression,
      isActive: s.isActive,
      lastRunAt: s.lastRunAt?.toISOString() ?? null,
      sourceProvider: s.sourceAccount.provider,
      targetProvider: s.targetAccount.provider,
    })),
  });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Sesi tidak ditemukan." }, { status: 401 });
  }
  const parsed = createSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Data tidak valid." }, { status: 400 });
  }
  const d = parsed.data;
  const owned = await prisma.connectedAccount.findMany({
    where: { id: { in: [d.sourceAccountId, d.targetAccountId] }, userId: session.user.id },
    select: { id: true },
  });
  if (owned.length !== 2) {
    return NextResponse.json({ error: "Akun tidak valid." }, { status: 403 });
  }

  const schedule = await prisma.syncSchedule.create({
    data: {
      userId: session.user.id,
      sourceAccountId: d.sourceAccountId,
      sourceFolderId: d.sourceFolderId,
      targetAccountId: d.targetAccountId,
      targetFolderId: d.targetFolderId,
      syncDirection: d.syncDirection,
      cronExpression: d.cron,
    },
  });

  // daftarkan repeatable job BullMQ berbasis cron
  const queue = syncQueue();
  await queue.add(
    SYNC_JOB_NAME,
    { scheduleId: schedule.id } satisfies SyncJobData,
    { repeat: { pattern: d.cron }, jobId: `sync-${schedule.id}` },
  );
  await queue.close();

  return NextResponse.json({ id: schedule.id });
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Sesi tidak ditemukan." }, { status: 401 });
  }
  const id = req.nextUrl.searchParams.get("id") ?? "";
  if (!uuid.safeParse(id).success) {
    return NextResponse.json({ error: "ID tidak valid." }, { status: 400 });
  }
  const row = await prisma.syncSchedule.findFirst({ where: { id, userId: session.user.id } });
  if (!row) {
    return NextResponse.json({ error: "Jadwal tidak ditemukan." }, { status: 404 });
  }
  const queue = syncQueue();
  const repeatables = await queue.getRepeatableJobs();
  for (const r of repeatables) {
    if (r.name === SYNC_JOB_NAME && r.key.includes(`sync-${row.id}`)) {
      await queue.removeRepeatableByKey(r.key);
    }
  }
  await queue.close();
  await prisma.syncSchedule.delete({ where: { id: row.id } });
  return NextResponse.json({ ok: true });
}
